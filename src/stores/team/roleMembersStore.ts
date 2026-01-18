import { create } from 'zustand';
import { db } from '../../config/firebase';
import {
    collection,
    getDocs,
    onSnapshot
} from 'firebase/firestore';
import type { RoleMember } from '../../types/team';

interface RoleMembersState {
    roleMembers: Record<string, RoleMember[]>;
    error: string | null;

    loadRoleMembers: (teamId: string, roleId: string) => Promise<void>;
    subscribeToRoleMembers: (teamId: string, roleId: string) => () => void;
}

export const useRoleMembersStore = create<RoleMembersState>((set) => ({
    roleMembers: {},
    error: null,

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
