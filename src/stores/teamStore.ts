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
import type { Team, TeamRole, TeamInvite, TeamMembership, TeamMembershipsMap, RoleMember } from '../types/team';
import type { Personality } from '../types/personality';
import { getAuth } from 'firebase/auth';

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
    roleMembers: Record<string, RoleMember[]>;  // `${teamId}/${roleId}` -> members
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

    // --- Role Members Actions (for admin viewer) ---
    loadRoleMembers: (teamId: string, roleId: string) => Promise<void>;
    subscribeToRoleMembers: (teamId: string, roleId: string) => () => void;

    // --- Loading State Action ---
    setLoading: (loading: boolean) => void;

    // --- Subscriptions ---
    subscribeToTeams: (uid: string) => () => void;
    subscribeToRoles: (teamId: string) => () => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
    teams: [],
    roles: {},
    roleMembers: {},
    memberships: {},
    isLoading: true,
    error: null,

    setLoading: (loading) => set({ isLoading: loading }),

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
            const { templateData, ...roleMeta } = data; // Extract template data

            const role: TeamRole = {
                id: roleRef.id,
                teamId,
                ...roleMeta,
                createdAt: Date.now()
            } as TeamRole;

            const batch = writeBatch(db);
            batch.set(roleRef, role);

            // Write template data to subcollections
            if (templateData) {
                // Innerfaces
                templateData.innerfaces?.forEach(i => {
                    batch.set(doc(roleRef, 'innerfaces', i.id.toString()), i);
                });

                // Protocols
                templateData.protocols?.forEach(p => {
                    batch.set(doc(roleRef, 'protocols', p.id.toString()), p);
                });

                // States
                templateData.states?.forEach(s => {
                    batch.set(doc(roleRef, 'states', s.id), s);
                });

                // Groups
                Object.entries(templateData.groups || {}).forEach(([name, meta]) => {
                    batch.set(doc(roleRef, 'groups', name), meta);
                });

                // Settings
                if (templateData.groupOrder?.length) {
                    batch.set(doc(roleRef, 'settings', 'groups'), { order: templateData.groupOrder });
                }
                if (templateData.innerfaceGroupOrder?.length) {
                    batch.set(doc(roleRef, 'settings', 'innerface_groups'), { order: templateData.innerfaceGroupOrder });
                }
                if (templateData.pinnedProtocolIds?.length) {
                    batch.set(doc(roleRef, 'settings', 'quickActions'), { ids: templateData.pinnedProtocolIds });
                }
            }

            await batch.commit();

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
            const { templateData, ...roleMeta } = data;

            // If template data is provided, we need to rewrite subcollections
            // For now, simpler to just write what we have. In a real app, might want to diff.
            // But since this is usually "Copy All" from a personality, overwrite is expected.

            const batch = writeBatch(db);

            // Update metadata
            if (Object.keys(roleMeta).length > 0) {
                batch.update(roleRef, roleMeta);
            }

            if (templateData) {
                // Determine what to delete? Ideally delete everything first is safest to avoid ghosts.
                // Fetch existing subcollections to delete
                const [ifaceSnap, protoSnap, stateSnap, groupSnap] = await Promise.all([
                    getDocs(collection(roleRef, 'innerfaces')),
                    getDocs(collection(roleRef, 'protocols')),
                    getDocs(collection(roleRef, 'states')),
                    getDocs(collection(roleRef, 'groups'))
                ]);

                ifaceSnap.docs.forEach(d => batch.delete(d.ref));
                protoSnap.docs.forEach(d => batch.delete(d.ref));
                stateSnap.docs.forEach(d => batch.delete(d.ref));
                groupSnap.docs.forEach(d => batch.delete(d.ref));

                // Add new data
                templateData.innerfaces?.forEach(i => {
                    batch.set(doc(roleRef, 'innerfaces', i.id.toString()), i);
                });
                templateData.protocols?.forEach(p => {
                    batch.set(doc(roleRef, 'protocols', p.id.toString()), p);
                });
                templateData.states?.forEach(s => {
                    batch.set(doc(roleRef, 'states', s.id), s);
                });
                Object.entries(templateData.groups || {}).forEach(([name, meta]) => {
                    batch.set(doc(roleRef, 'groups', name), meta);
                });

                // Settings
                batch.set(doc(roleRef, 'settings', 'groups'), { order: templateData.groupOrder || [] });
                batch.set(doc(roleRef, 'settings', 'innerface_groups'), { order: templateData.innerfaceGroupOrder || [] });
                batch.set(doc(roleRef, 'settings', 'quickActions'), { ids: templateData.pinnedProtocolIds || [] });
            }

            await batch.commit();

            set(state => ({
                roles: {
                    ...state.roles,
                    [teamId]: (state.roles[teamId] || []).map(r =>
                        r.id === roleId ? { ...r, ...roleMeta } : r
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
            // 1. Check if role already has an active invite code
            const roleRef = doc(db, 'teams', teamId, 'roles', roleId);
            const roleDoc = await getDoc(roleRef);

            if (roleDoc.exists()) {
                const roleData = roleDoc.data() as TeamRole;

                // If persistent invite exists, check validity
                if (roleData.activeInviteCode) {
                    const inviteDoc = await getDoc(doc(db, 'team_invites', roleData.activeInviteCode));
                    if (inviteDoc.exists()) {
                        const invite = inviteDoc.data() as TeamInvite;
                        // Check expiry
                        const isExpired = invite.expiresAt && Date.now() > invite.expiresAt;
                        // If not single use (persistent) and not expired, return it
                        if (!invite.singleUse && !isExpired) {
                            const baseUrl = window.location.origin;
                            return `${baseUrl}/invite/${roleData.activeInviteCode}`;
                        }
                    }
                }
            }

            // 2. Generate new if none exists or invalid
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

            const batch = writeBatch(db);
            // Save invite
            batch.set(doc(db, 'team_invites', code), invite);
            // Update role with active code (only if it's a persistent link)
            if (!options.singleUse) {
                batch.update(roleRef, { activeInviteCode: code });

                // Update local state immediately
                set(state => ({
                    roles: {
                        ...state.roles,
                        [teamId]: (state.roles[teamId] || []).map(r =>
                            r.id === roleId ? { ...r, activeInviteCode: code } : r
                        )
                    }
                }));
            }

            await batch.commit();

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
            set({ isLoading: true });
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

            // 3. Create a new personality from the template
            // Fetch template data from Role subcollections
            const [
                roleIfaces,
                roleProtos,
                roleStates,
                roleGroups,
                roleGroupSettings,
                roleQuickActions
            ] = await Promise.all([
                getDocs(collection(db, 'teams', invite.teamId, 'roles', invite.roleId, 'innerfaces')),
                getDocs(collection(db, 'teams', invite.teamId, 'roles', invite.roleId, 'protocols')),
                getDocs(collection(db, 'teams', invite.teamId, 'roles', invite.roleId, 'states')),
                getDocs(collection(db, 'teams', invite.teamId, 'roles', invite.roleId, 'groups')),
                getDoc(doc(db, 'teams', invite.teamId, 'roles', invite.roleId, 'settings', 'groups')),
                getDoc(doc(db, 'teams', invite.teamId, 'roles', invite.roleId, 'settings', 'quickActions'))
            ]);

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

            // ========================================================================
            // ID MAPPING STRATEGY
            // 
            // When copying a role template to a new user personality, we must:
            // 1. Generate new unique IDs for all copied entities (states, protocols, innerfaces)
            // 2. Update all cross-references to use the NEW IDs instead of template IDs
            // 
            // Without this remapping, copied entities would reference non-existent template IDs,
            // breaking the relationship graph (e.g., State -> Protocols, Protocol -> Innerfaces)
            // ========================================================================

            const stateIdMap = new Map<string, string>();
            roleStates.docs.forEach((d, idx) => stateIdMap.set(d.id, `st-${Date.now()}-${idx}`));

            const innerfaceIdMap = new Map<string, string>();
            roleIfaces.docs.forEach((d, idx) => innerfaceIdMap.set(d.id, `if-${Date.now()}-${idx}`));

            const protocolIdMap = new Map<string, string>();
            roleProtos.docs.forEach((d, idx) => protocolIdMap.set(d.id, `pr-${Date.now()}-${idx}`));

            // --- Copy States (and update Protocol/Innerface/State references) ---
            roleStates.docs.forEach((d) => {
                const data = d.data();
                const newId = stateIdMap.get(d.id)!;

                // Remap all ID references to point to newly created entities
                const newProtocolIds = (data.protocolIds || []).map((id: string | number) => protocolIdMap.get(id.toString()) || id);
                const newInnerfaceIds = (data.innerfaceIds || []).map((id: string | number) => innerfaceIdMap.get(id.toString()) || id);
                const newStateIds = (data.stateIds || []).map((id: string) => stateIdMap.get(id) || id);

                batch.set(doc(db, 'users', uid, 'personalities', personalityId, 'states', newId), {
                    ...data,
                    id: newId,
                    score: 0, // RESET SCORE
                    yesterdayScore: 0, // RESET HISTORY COPY
                    protocolIds: newProtocolIds,
                    innerfaceIds: newInnerfaceIds,
                    stateIds: newStateIds
                });
            });

            // --- Copy Innerfaces (and update Protocol references) ---
            roleIfaces.docs.forEach((d) => {
                const data = d.data();
                const newId = innerfaceIdMap.get(d.id)!;

                // Remap protocol references
                const newProtocolIds = (data.protocolIds || []).map((id: string | number) => protocolIdMap.get(id.toString()) || id);

                batch.set(doc(db, 'users', uid, 'personalities', personalityId, 'innerfaces', newId), {
                    ...data,
                    id: newId,
                    initialScore: 0, // RESET BASE LEVEL
                    currentScore: 0, // RESET CALCULATED SCORE
                    versionTimestamp: new Date().toISOString(), // SET NEW VERSION TIMESTAMP
                    protocolIds: newProtocolIds
                });
            });

            // --- Copy Protocols (and update Innerface references) ---
            roleProtos.docs.forEach((d) => {
                const data = d.data();
                const newId = protocolIdMap.get(d.id)!;

                // Remap innerface targets
                const newTargets = (data.targets || []).map((id: string | number) => innerfaceIdMap.get(id.toString()) || id);

                batch.set(doc(db, 'users', uid, 'personalities', personalityId, 'protocols', newId), {
                    ...data,
                    id: newId,
                    targets: newTargets
                });
            });

            // --- Copy Groups (Simple copy) ---
            roleGroups.docs.forEach(d => {
                batch.set(doc(db, 'users', uid, 'personalities', personalityId, 'groups', d.id), d.data());
            });

            // --- Copy Settings (Fix Pinned Quick Actions) ---
            if (roleGroupSettings.exists()) {
                batch.set(doc(db, 'users', uid, 'personalities', personalityId, 'settings', 'groups'), roleGroupSettings.data());
            }

            if (roleQuickActions.exists()) {
                const qaData = roleQuickActions.data();
                // Remap Pinned Protocol IDs if they exist
                if (qaData.ids && Array.isArray(qaData.ids)) {
                    const newIds = qaData.ids.map((id: string) => protocolIdMap.get(id) || id);
                    batch.set(doc(db, 'users', uid, 'personalities', personalityId, 'settings', 'quickActions'), { ...qaData, ids: newIds });
                } else {
                    batch.set(doc(db, 'users', uid, 'personalities', personalityId, 'settings', 'quickActions'), qaData);
                }
            }

            // 4. Add membership to user document (using set with merge to create doc if missing)
            const membership: TeamMembership = {
                teamId: invite.teamId,
                roleId: invite.roleId,
                personalityId,
                joinedAt: Date.now(),
                invitedBy: invite.createdBy
            };

            batch.set(doc(db, 'users', uid), {
                teamMemberships: {
                    [invite.teamId]: membership
                }
            }, { merge: true });

            // 5. Add user to team's memberUids
            batch.update(doc(db, 'teams', invite.teamId), {
                memberUids: [...(get().teams.find(t => t.id === invite.teamId)?.memberUids || []), uid]
            });

            // 6. Create RoleMember document for admin viewer feature
            const auth = getAuth();
            const currentUser = auth.currentUser;
            const roleMember: RoleMember = {
                uid,
                displayName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Unknown',
                icon: personality.icon,
                personalityId,
                joinedAt: Date.now()
            };
            batch.set(
                doc(db, 'teams', invite.teamId, 'roles', invite.roleId, 'members', uid),
                roleMember
            );

            // 7. Mark invite as used if single-use
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
            set({ error: message, isLoading: false });
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
    },

    // ========================================================================
    // ROLE MEMBERS (for admin viewer feature)
    // ========================================================================

    loadRoleMembers: async (teamId, roleId) => {
        try {
            const membersSnap = await getDocs(
                collection(db, 'teams', teamId, 'roles', roleId, 'members')
            );
            const members = membersSnap.docs.map(d => ({
                ...d.data(),
                uid: d.id
            } as RoleMember));

            const key = `${teamId}/${roleId}`;
            set(state => ({
                roleMembers: { ...state.roleMembers, [key]: members }
            }));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Failed to load role members:', err);
            set({ error: message });
        }
    },

    subscribeToRoleMembers: (teamId, roleId) => {
        const key = `${teamId}/${roleId}`;
        const unsubscribe = onSnapshot(
            collection(db, 'teams', teamId, 'roles', roleId, 'members'),
            (snap) => {
                const members = snap.docs.map(d => ({
                    ...d.data(),
                    uid: d.id
                } as RoleMember));
                set(state => ({
                    roleMembers: { ...state.roleMembers, [key]: members }
                }));
            }
        );

        return unsubscribe;
    }
}));
