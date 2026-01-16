/**
 * Team Store
 * 
 * Manages team-related state and operations:
 * - Teams the user owns or is a member of
 * - Roles within teams
 * - Invite link generation and joining
 * - Copying role templates to user personalities
 * 
 * Firestore structure:
 * - teams/{teamId} - team documents
 * - teams/{teamId}/roles/{roleId} - role templates
 * - team_invites/{inviteCode} - invite links
 * - role_shares/{shareId} - personality sharing
 */

import { create } from 'zustand';
import { db } from '../config/firebase';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    query,
    where,
    onSnapshot,
    writeBatch
} from 'firebase/firestore';
import type { Team, TeamRole, TeamInvite, TeamMembership, TeamMembershipsMap } from '../types/team';
import type { Personality } from '../types/personality';

// ============================================================================
// HELPER: Generate short invite code
// ============================================================================
function generateInviteCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// ============================================================================
// STORE INTERFACE
// ============================================================================
interface TeamState {
    // State
    teams: Team[];
    roles: Record<string, TeamRole[]>;  // teamId -> roles
    memberships: TeamMembershipsMap;
    isLoading: boolean;
    error: string | null;

    // --- Team Actions ---
    loadTeams: (uid: string) => Promise<void>;
    createTeam: (uid: string, data: Omit<Team, 'id' | 'ownerId' | 'memberUids' | 'createdAt'>) => Promise<string>;
    updateTeam: (teamId: string, data: Partial<Team>) => Promise<void>;
    deleteTeam: (uid: string, teamId: string) => Promise<void>;

    // --- Role Actions ---
    loadRoles: (teamId: string) => Promise<void>;
    createRole: (teamId: string, data: Omit<TeamRole, 'id' | 'teamId' | 'createdAt'>) => Promise<string>;
    updateRole: (teamId: string, roleId: string, data: Partial<TeamRole>) => Promise<void>;
    deleteRole: (teamId: string, roleId: string) => Promise<void>;

    // --- Invite Actions ---
    generateInviteLink: (teamId: string, roleId: string, uid: string, options?: { singleUse?: boolean; expiresInDays?: number }) => Promise<string>;
    getInviteInfo: (inviteCode: string) => Promise<{ team: Team; role: TeamRole } | null>;
    joinTeam: (uid: string, inviteCode: string) => Promise<string>;  // returns personalityId

    // --- Subscriptions ---
    subscribeToTeams: (uid: string) => () => void;
    subscribeToRoles: (teamId: string) => () => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
    teams: [],
    roles: {},
    memberships: {},
    isLoading: true,
    error: null,

    // ========================================================================
    // TEAM ACTIONS
    // ========================================================================

    loadTeams: async (uid) => {
        try {
            set({ isLoading: true });

            // Query teams where user is owner OR member
            const ownedQuery = query(collection(db, 'teams'), where('ownerId', '==', uid));
            const memberQuery = query(collection(db, 'teams'), where('memberUids', 'array-contains', uid));

            const [ownedSnap, memberSnap] = await Promise.all([
                getDocs(ownedQuery),
                getDocs(memberQuery)
            ]);

            // Combine and dedupe
            const teamsMap = new Map<string, Team>();
            ownedSnap.docs.forEach(d => teamsMap.set(d.id, { ...d.data(), id: d.id } as Team));
            memberSnap.docs.forEach(d => teamsMap.set(d.id, { ...d.data(), id: d.id } as Team));

            const teams = Array.from(teamsMap.values());
            set({ teams, isLoading: false });

            // Also load memberships from user doc
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                set({ memberships: data.teamMemberships || {} });
            }

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Failed to load teams:', err);
            set({ error: message, isLoading: false });
        }
    },

    createTeam: async (uid, data) => {
        try {
            const teamRef = doc(collection(db, 'teams'));
            const team: Team = {
                id: teamRef.id,
                ...data,
                ownerId: uid,
                memberUids: [],
                createdAt: Date.now()
            };

            await setDoc(teamRef, team);

            // Teams subscription will handle the state update automatically
            // set(state => ({
            //     teams: [...state.teams, team]
            // }));

            return teamRef.id;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Failed to create team:', err);
            set({ error: message });
            throw err;
        }
    },

    updateTeam: async (teamId, data) => {
        try {
            const teamRef = doc(db, 'teams', teamId);
            await updateDoc(teamRef, data);

            set(state => ({
                teams: state.teams.map(t =>
                    t.id === teamId ? { ...t, ...data } : t
                )
            }));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Failed to update team:', err);
            set({ error: message });
        }
    },

    deleteTeam: async (uid, teamId) => {
        try {
            const team = get().teams.find(t => t.id === teamId);
            if (!team || team.ownerId !== uid) {
                throw new Error('Only team owner can delete the team');
            }

            // Delete all roles first
            const rolesSnap = await getDocs(collection(db, 'teams', teamId, 'roles'));
            const batch = writeBatch(db);
            rolesSnap.docs.forEach(d => batch.delete(d.ref));
            batch.delete(doc(db, 'teams', teamId));
            await batch.commit();

            set(state => ({
                teams: state.teams.filter(t => t.id !== teamId),
                roles: Object.fromEntries(
                    Object.entries(state.roles).filter(([key]) => key !== teamId)
                )
            }));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Failed to delete team:', err);
            set({ error: message });
        }
    },

    // ========================================================================
    // ROLE ACTIONS
    // ========================================================================

    loadRoles: async (teamId) => {
        try {
            const rolesSnap = await getDocs(collection(db, 'teams', teamId, 'roles'));
            const roles = rolesSnap.docs.map(d => ({ ...d.data(), id: d.id } as TeamRole));

            set(state => ({
                roles: { ...state.roles, [teamId]: roles }
            }));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Failed to load roles:', err);
            set({ error: message });
        }
    },

    createRole: async (teamId, data) => {
        try {
            const roleRef = doc(collection(db, 'teams', teamId, 'roles'));
            const role: TeamRole = {
                id: roleRef.id,
                teamId,
                ...data,
                createdAt: Date.now()
            };

            await setDoc(roleRef, role);

            set(state => ({
                roles: {
                    ...state.roles,
                    [teamId]: [...(state.roles[teamId] || []), role]
                }
            }));

            return roleRef.id;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Failed to create role:', err);
            set({ error: message });
            throw err;
        }
    },

    updateRole: async (teamId, roleId, data) => {
        try {
            const roleRef = doc(db, 'teams', teamId, 'roles', roleId);
            await updateDoc(roleRef, data);

            set(state => ({
                roles: {
                    ...state.roles,
                    [teamId]: (state.roles[teamId] || []).map(r =>
                        r.id === roleId ? { ...r, ...data } : r
                    )
                }
            }));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Failed to update role:', err);
            set({ error: message });
        }
    },

    deleteRole: async (teamId, roleId) => {
        try {
            await deleteDoc(doc(db, 'teams', teamId, 'roles', roleId));

            set(state => ({
                roles: {
                    ...state.roles,
                    [teamId]: (state.roles[teamId] || []).filter(r => r.id !== roleId)
                }
            }));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Failed to delete role:', err);
            set({ error: message });
        }
    },

    // ========================================================================
    // INVITE ACTIONS
    // ========================================================================

    generateInviteLink: async (teamId, roleId, uid, options = {}) => {
        try {
            const code = generateInviteCode();
            const invite: TeamInvite = {
                code,
                teamId,
                roleId,
                createdBy: uid,
                createdAt: Date.now(),
                singleUse: options.singleUse || false,
                ...(options.expiresInDays && {
                    expiresAt: Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000
                })
            };

            await setDoc(doc(db, 'team_invites', code), invite);

            // Return full URL
            const baseUrl = window.location.origin;
            return `${baseUrl}/invite/${code}`;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Failed to generate invite:', err);
            set({ error: message });
            throw err;
        }
    },

    getInviteInfo: async (inviteCode) => {
        try {
            const inviteDoc = await getDoc(doc(db, 'team_invites', inviteCode));
            if (!inviteDoc.exists()) return null;

            const invite = inviteDoc.data() as TeamInvite;

            // Check expiration
            if (invite.expiresAt && Date.now() > invite.expiresAt) return null;

            // Check if single-use and already used
            if (invite.singleUse && invite.used) return null;

            // Load team and role info
            const [teamDoc, roleDoc] = await Promise.all([
                getDoc(doc(db, 'teams', invite.teamId)),
                getDoc(doc(db, 'teams', invite.teamId, 'roles', invite.roleId))
            ]);

            if (!teamDoc.exists() || !roleDoc.exists()) return null;

            return {
                team: { ...teamDoc.data(), id: teamDoc.id } as Team,
                role: { ...roleDoc.data(), id: roleDoc.id } as TeamRole
            };
        } catch (err: unknown) {
            console.error('Failed to get invite info:', err);
            return null;
        }
    },

    joinTeam: async (uid, inviteCode) => {
        try {
            // 1. Validate invite
            const inviteDoc = await getDoc(doc(db, 'team_invites', inviteCode));
            if (!inviteDoc.exists()) throw new Error('Invalid invite code');

            const invite = inviteDoc.data() as TeamInvite;

            // Check expiration
            if (invite.expiresAt && Date.now() > invite.expiresAt) {
                throw new Error('Invite has expired');
            }

            // Check if single-use and already used
            if (invite.singleUse && invite.used) {
                throw new Error('Invite has already been used');
            }

            // 2. Load the role template
            const roleDoc = await getDoc(doc(db, 'teams', invite.teamId, 'roles', invite.roleId));
            if (!roleDoc.exists()) throw new Error('Role no longer exists');

            const role = roleDoc.data() as TeamRole;
            const template = role.templateData;

            // 3. Create a new personality from the template
            const personalityId = `${role.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
            const personality: Personality = {
                id: personalityId,
                name: role.name,
                description: role.description,
                icon: role.icon,
                themeColor: role.themeColor,
                createdAt: Date.now(),
                lastActiveAt: Date.now()
            };

            const batch = writeBatch(db);

            // Create personality document
            batch.set(doc(db, 'users', uid, 'personalities', personalityId), personality);

            // Copy template data to personality subcollections
            if (template) {
                // Innerfaces
                template.innerfaces?.forEach((innerface, idx) => {
                    const innerfaceId = `if-${Date.now()}-${idx}`;
                    batch.set(
                        doc(db, 'users', uid, 'personalities', personalityId, 'innerfaces', innerfaceId),
                        { ...innerface, id: innerfaceId }
                    );
                });

                // Protocols
                template.protocols?.forEach((protocol, idx) => {
                    const protocolId = `pr-${Date.now()}-${idx}`;
                    batch.set(
                        doc(db, 'users', uid, 'personalities', personalityId, 'protocols', protocolId),
                        { ...protocol, id: protocolId }
                    );
                });

                // States
                template.states?.forEach((state, idx) => {
                    const stateId = `st-${Date.now()}-${idx}`;
                    batch.set(
                        doc(db, 'users', uid, 'personalities', personalityId, 'states', stateId),
                        { ...state, id: stateId }
                    );
                });

                // Groups metadata
                Object.entries(template.groups || {}).forEach(([groupName, metadata]) => {
                    batch.set(
                        doc(db, 'users', uid, 'personalities', personalityId, 'groups', groupName),
                        metadata
                    );
                });

                // Settings
                if (template.groupOrder?.length || template.pinnedProtocolIds?.length) {
                    batch.set(
                        doc(db, 'users', uid, 'personalities', personalityId, 'settings', 'groups'),
                        { order: template.groupOrder || [] }
                    );
                    batch.set(
                        doc(db, 'users', uid, 'personalities', personalityId, 'settings', 'quickActions'),
                        { ids: template.pinnedProtocolIds || [] }
                    );
                }
            }

            // 4. Add membership to user document
            const membership: TeamMembership = {
                teamId: invite.teamId,
                roleId: invite.roleId,
                personalityId,
                joinedAt: Date.now(),
                invitedBy: invite.createdBy
            };

            batch.update(doc(db, 'users', uid), {
                [`teamMemberships.${invite.teamId}`]: membership
            });

            // 5. Add user to team's memberUids
            batch.update(doc(db, 'teams', invite.teamId), {
                memberUids: [...(get().teams.find(t => t.id === invite.teamId)?.memberUids || []), uid]
            });

            // 6. Mark invite as used if single-use
            if (invite.singleUse) {
                batch.update(doc(db, 'team_invites', inviteCode), { used: true });
            }

            await batch.commit();

            // Update local state
            set(state => ({
                memberships: {
                    ...state.memberships,
                    [invite.teamId]: membership
                }
            }));

            return personalityId;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Failed to join team:', err);
            set({ error: message });
            throw err;
        }
    },

    // ========================================================================
    // SUBSCRIPTIONS
    // ========================================================================

    subscribeToTeams: (uid) => {
        // Subscribe to owned teams
        const ownedQuery = query(collection(db, 'teams'), where('ownerId', '==', uid));
        const memberQuery = query(collection(db, 'teams'), where('memberUids', 'array-contains', uid));

        const handleSnapshot = () => {
            // Reload teams when either query changes
            get().loadTeams(uid);
        };

        const unsubOwned = onSnapshot(ownedQuery, handleSnapshot);
        const unsubMember = onSnapshot(memberQuery, handleSnapshot);

        // Initial load
        get().loadTeams(uid);

        return () => {
            unsubOwned();
            unsubMember();
        };
    },

    subscribeToRoles: (teamId) => {
        const unsubscribe = onSnapshot(collection(db, 'teams', teamId, 'roles'), (snap) => {
            const roles = snap.docs.map(d => ({ ...d.data(), id: d.id } as TeamRole));
            set(state => ({
                roles: { ...state.roles, [teamId]: roles }
            }));
        });

        return unsubscribe;
    }
}));
