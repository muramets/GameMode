import { create } from 'zustand';
import { db } from '../../config/firebase';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    onSnapshot,
    writeBatch
} from 'firebase/firestore';
import type { Team, TeamMembershipsMap, TeamRole, RoleMember } from '../../types/team';

interface TeamState {
    // State
    teams: Team[];
    memberships: TeamMembershipsMap;
    roles: Record<string, TeamRole[]>; // Keep these for shared usage if needed, though primarily managed in roleStore
    roleMembers: Record<string, RoleMember[]>; // Keep for consistency if needed
    isLoading: boolean;
    error: string | null;

    // Actions
    setLoading: (loading: boolean) => void;
    loadTeams: (uid: string) => Promise<void>;
    createTeam: (uid: string, data: Omit<Team, 'id' | 'ownerId' | 'memberUids' | 'createdAt'>) => Promise<string>;
    updateTeam: (teamId: string, data: Partial<Team>) => Promise<void>;
    deleteTeam: (uid: string, teamId: string) => Promise<void>;
    subscribeToTeams: (uid: string) => () => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
    teams: [],
    memberships: {},
    roles: {},
    roleMembers: {},
    isLoading: true,
    error: null,

    setLoading: (loading) => set({ isLoading: loading }),

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

    subscribeToTeams: (uid) => {
        // Subscribe to owned teams
        const ownedQuery = query(collection(db, 'teams'), where('ownerId', '==', uid));
        const memberQuery = query(collection(db, 'teams'), where('memberUids', 'array-contains', uid));

        // Direct state update pattern - no cascade to loadTeams
        type TeamDoc = { id: string; data: () => Record<string, unknown> };
        let ownedDocs: TeamDoc[] = [];
        let memberDocs: TeamDoc[] = [];
        let memberInitialized = false;

        const updateTeams = () => {
            const teamsMap = new Map<string, Team>();
            ownedDocs.forEach(d => teamsMap.set(d.id, { ...d.data(), id: d.id } as Team));
            memberDocs.forEach(d => teamsMap.set(d.id, { ...d.data(), id: d.id } as Team));
            set({ teams: Array.from(teamsMap.values()), isLoading: false });
        };

        const unsubOwned = onSnapshot(ownedQuery, snap => {
            ownedDocs = snap.docs;
            // Only update after member query has initialized to avoid partial state
            if (memberInitialized) updateTeams();
        });

        const unsubMember = onSnapshot(memberQuery, snap => {
            memberDocs = snap.docs;
            updateTeams();
            memberInitialized = true;
        });

        // Also load memberships from user doc (one-time)
        getDoc(doc(db, 'users', uid)).then(userDoc => {
            if (userDoc.exists()) {
                const data = userDoc.data();
                set({ memberships: data.teamMemberships || {} });
            }
        });

        return () => {
            unsubOwned();
            unsubMember();
        };
    }
}));
