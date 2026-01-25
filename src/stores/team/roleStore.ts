import { create } from 'zustand';
import { db } from '../../config/firebase';
import {
    collection,
    doc,
    getDocs,
    deleteDoc,
    onSnapshot,
    writeBatch
} from 'firebase/firestore';
import type { TeamRole } from '../../types/team';

interface RoleState {
    roles: Record<string, TeamRole[]>;
    error: string | null;

    loadRoles: (teamId: string) => Promise<void>;
    createRole: (teamId: string, data: Omit<TeamRole, 'id' | 'teamId' | 'createdAt'>) => Promise<string>;
    updateRole: (teamId: string, roleId: string, data: Partial<TeamRole>) => Promise<void>;
    deleteRole: (teamId: string, roleId: string) => Promise<void>;
    subscribeToRoles: (teamId: string) => () => void;
}

export const useRoleStore = create<RoleState>((set) => ({
    roles: {},
    error: null,

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

                // Groups, Settings -> settings/app
                // Consolidate all metadata into settings/app
                const settingsAppData = {
                    groupsMetadata: templateData.groups || {},
                    protocolGroupOrder: templateData.protocolGroupOrder || [],
                    innerfaceGroupOrder: templateData.innerfaceGroupOrder || {},
                    pinnedProtocolIds: templateData.pinnedProtocolIds || [],
                    categoryOrder: [], // meaningful default if needed
                    isDimensionsCollapsed: false
                };

                batch.set(doc(roleRef, 'settings', 'app'), settingsAppData);
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
                groupSnap.docs.forEach(d => batch.delete(d.ref)); // Clean legacy groups

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

                // Groups & Settings -> settings/app
                const settingsAppData = {
                    groupsMetadata: templateData.groups || {},
                    protocolGroupOrder: templateData.protocolGroupOrder || [],
                    innerfaceGroupOrder: templateData.innerfaceGroupOrder || {},
                    pinnedProtocolIds: templateData.pinnedProtocolIds || [],
                    categoryOrder: [],
                    isDimensionsCollapsed: false
                };

                batch.set(doc(roleRef, 'settings', 'app'), settingsAppData);
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
