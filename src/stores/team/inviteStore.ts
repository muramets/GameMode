import { create } from 'zustand';
import { db } from '../../config/firebase';
import {
    doc,
    getDoc,
    getDocs,
    collection,
    writeBatch,
    arrayUnion
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Team, TeamRole, TeamInvite, TeamMembership, RoleMember } from '../../types/team';
import type { Personality } from '../../types/personality';
import { generateInviteCode } from './types';


interface InviteState {
    isLoading: boolean;
    error: string | null;

    generateInviteLink: (teamId: string, roleId: string, uid: string, options?: { singleUse?: boolean; expiresInDays?: number }) => Promise<string>;
    getInviteInfo: (inviteCode: string) => Promise<{ team: Team; role: TeamRole } | null>;
    joinTeam: (uid: string, inviteCode: string) => Promise<string>;
}

export const useInviteStore = create<InviteState>((set) => ({
    isLoading: false,
    error: null,

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
            // ========================================================================

            const stateIdMap = new Map<string, string>();
            roleStates.docs.forEach((d, idx) => stateIdMap.set(d.id, `st-${Date.now()}-${idx}`));

            const innerfaceIdMap = new Map<string, string>();
            roleIfaces.docs.forEach((d, idx) => innerfaceIdMap.set(d.id, `if-${Date.now()}-${idx}`));

            const protocolIdMap = new Map<string, string>();
            roleProtos.docs.forEach((d, idx) => protocolIdMap.set(d.id, `pr-${Date.now()}-${idx}`));

            // --- Copy States ---
            roleStates.docs.forEach((d) => {
                const data = d.data();
                const newId = stateIdMap.get(d.id)!;

                const newProtocolIds = (data.protocolIds || []).map((id: string | number) => protocolIdMap.get(id.toString()) || id);
                const newInnerfaceIds = (data.innerfaceIds || []).map((id: string | number) => innerfaceIdMap.get(id.toString()) || id);
                const newStateIds = (data.stateIds || []).map((id: string) => stateIdMap.get(id) || id);

                batch.set(doc(db, 'users', uid, 'personalities', personalityId, 'states', newId), {
                    ...data,
                    id: newId,
                    score: 0,
                    yesterdayScore: 0,
                    protocolIds: newProtocolIds,
                    innerfaceIds: newInnerfaceIds,
                    stateIds: newStateIds
                });
            });

            // --- Copy Innerfaces ---
            roleIfaces.docs.forEach((d) => {
                const data = d.data();
                const newId = innerfaceIdMap.get(d.id)!;

                const newProtocolIds = (data.protocolIds || []).map((id: string | number) => protocolIdMap.get(id.toString()) || id);

                batch.set(doc(db, 'users', uid, 'personalities', personalityId, 'innerfaces', newId), {
                    ...data,
                    id: newId,
                    initialScore: 0,
                    currentScore: 0,
                    versionTimestamp: new Date().toISOString(),
                    protocolIds: newProtocolIds
                });
            });

            // --- Copy Protocols ---
            roleProtos.docs.forEach((d) => {
                const data = d.data();
                const newId = protocolIdMap.get(d.id)!;

                const newTargets = (data.targets || []).map((id: string | number) => innerfaceIdMap.get(id.toString()) || id);

                batch.set(doc(db, 'users', uid, 'personalities', personalityId, 'protocols', newId), {
                    ...data,
                    id: newId,
                    targets: newTargets
                });
            });

            // --- Copy Groups ---
            roleGroups.docs.forEach(d => {
                batch.set(doc(db, 'users', uid, 'personalities', personalityId, 'groups', d.id), d.data());
            });

            // --- Copy Settings ---
            if (roleGroupSettings.exists()) {
                batch.set(doc(db, 'users', uid, 'personalities', personalityId, 'settings', 'groups'), roleGroupSettings.data());
            }

            if (roleQuickActions.exists()) {
                const qaData = roleQuickActions.data();
                if (qaData.ids && Array.isArray(qaData.ids)) {
                    const newIds = qaData.ids.map((id: string) => protocolIdMap.get(id) || id);
                    batch.set(doc(db, 'users', uid, 'personalities', personalityId, 'settings', 'quickActions'), { ...qaData, ids: newIds });
                } else {
                    batch.set(doc(db, 'users', uid, 'personalities', personalityId, 'settings', 'quickActions'), qaData);
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

            batch.set(doc(db, 'users', uid), {
                teamMemberships: {
                    [invite.teamId]: membership
                }
            }, { merge: true });

            // 5. Add user to team's memberUids using arrayUnion
            batch.update(doc(db, 'teams', invite.teamId), {
                memberUids: arrayUnion(uid)
            });

            // 6. Create RoleMember document
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

            // Note: Subscription in teamStore will update memberships automatically,
            // but we can't easily update local teamStore state from here without direct access.
            // Since we use firestore subscription in `useTeamStore`, the user doc update will likely trigger a refresh there.

            // To be safe, we might want to manually trigger a fetch or update if needed, but since we updated Firestore,
            // the listener in useTeamStore should catch it.

            set({ isLoading: false });

            return personalityId;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Failed to join team:', err);
            set({ error: message, isLoading: false });
            throw err;
        }
    }
}));
