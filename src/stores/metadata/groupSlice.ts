import { db } from '../../config/firebase';
import { doc, writeBatch, setDoc } from 'firebase/firestore';
import { useUIStore } from '../uiStore';
import type { MetadataState, PathContext } from './types';

// Helpers
const showErrorToast = (message: string) => useUIStore.getState().showToast(message, 'error');

const getPathRoot = (context: PathContext | null) => {
    if (!context) throw new Error('No active context for metadata operation');
    if (context.type === 'personality') return `users/${context.uid}/personalities/${context.pid}`;
    if (context.type === 'viewer') return `users/${context.targetUid}/personalities/${context.personalityId}`;
    return `teams/${context.teamId}/roles/${context.roleId}`;
};

const isViewerMode = (context: PathContext | null) => context?.type === 'viewer';

const guardAgainstViewerMode = (context: PathContext | null, allowInCoachMode = false) => {
    if (isViewerMode(context) && !allowInCoachMode) {
        console.warn('[MetadataStore] Blocked mutation in viewer/coach mode');
        throw new Error('Cannot modify data in coach/viewer mode');
    }
};

export const createGroupSlice = (
    set: (partial: Partial<MetadataState> | ((state: MetadataState) => Partial<MetadataState>)) => void,
    get: () => MetadataState
) => ({
    updateGroupMetadata: async (groupName: string, metadata: { icon?: string; color?: string }) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const docRef = doc(db, `${getPathRoot(context)}/groups/${groupName}`);
            await setDoc(docRef, metadata, { merge: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    renameGroup: async (oldName: string, newName: string) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const trimmedNewName = newName.trim();
            if (!trimmedNewName || trimmedNewName === oldName) return;

            const batch = writeBatch(db);

            // 1. Update Innerfaces
            const innerfaces = get().innerfaces;
            innerfaces.forEach(i => {
                if (i.group === oldName) {
                    const docRef = doc(db, `${getPathRoot(context)}/innerfaces/${i.id}`);
                    batch.update(docRef, { group: trimmedNewName });
                }
            });

            // 2. Update Protocols
            const protocols = get().protocols;
            protocols.forEach(p => {
                if (p.group === oldName) {
                    const docRef = doc(db, `${getPathRoot(context)}/protocols/${p.id}`);
                    batch.update(docRef, { group: trimmedNewName });
                }
            });

            // 3. Move Group Metadata (if exists)
            const groupsMetadata = get().groupsMetadata;
            if (groupsMetadata[oldName]) {
                const oldMetaRef = doc(db, `${getPathRoot(context)}/groups/${oldName}`);
                const newMetaRef = doc(db, `${getPathRoot(context)}/groups/${trimmedNewName}`);

                batch.set(newMetaRef, groupsMetadata[oldName]);
                batch.delete(oldMetaRef);
            }

            // 4. Update Sort Orders
            // Protocol Group Order
            const groupOrder = get().groupOrder;
            if (groupOrder.includes(oldName)) {
                const newOrder = groupOrder.map(g => g === oldName ? trimmedNewName : g);
                const orderRef = doc(db, `${getPathRoot(context)}/settings/groups`);
                batch.set(orderRef, { order: newOrder }, { merge: true });
                set({ groupOrder: newOrder }); // Optimistic
            }

            // Innerface Group Order
            const innerfaceGroupOrder = get().innerfaceGroupOrder;
            if (innerfaceGroupOrder.includes(oldName)) {
                const newOrder = innerfaceGroupOrder.map(g => g === oldName ? trimmedNewName : g);
                const orderRef = doc(db, `${getPathRoot(context)}/settings/app`);
                batch.set(orderRef, { innerfaceGroupOrder: newOrder }, { merge: true });
                set({ innerfaceGroupOrder: newOrder }); // Optimistic
            }

            await batch.commit();

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error("Failed to rename group:", err);
            showErrorToast(message);
        }
    },

    deleteGroup: async (groupName: string) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const batch = writeBatch(db);
            const pathRoot = getPathRoot(context);

            // 1. Update Innerfaces
            const innerfaces = get().innerfaces;
            innerfaces.forEach(i => {
                if (i.group === groupName) {
                    const docRef = doc(db, `${pathRoot}/innerfaces/${i.id}`);
                    batch.update(docRef, { group: '' });
                }
            });

            // 2. Update Protocols
            const protocols = get().protocols;
            protocols.forEach(p => {
                if (p.group === groupName) {
                    const docRef = doc(db, `${pathRoot}/protocols/${p.id}`);
                    batch.update(docRef, { group: '' });
                }
            });

            // 3. Delete Group Metadata
            const groupMetaRef = doc(db, `${pathRoot}/groups/${groupName}`);
            batch.delete(groupMetaRef);

            // 4. Update Sort Orders
            const groupOrder = get().groupOrder;
            if (groupOrder.includes(groupName)) {
                const newOrder = groupOrder.filter(g => g !== groupName);
                const orderRef = doc(db, `${pathRoot}/settings/groups`);
                batch.set(orderRef, { order: newOrder }, { merge: true });
                set({ groupOrder: newOrder });
            }

            const innerfaceGroupOrder = get().innerfaceGroupOrder;
            if (innerfaceGroupOrder.includes(groupName)) {
                const newOrder = innerfaceGroupOrder.filter(g => g !== groupName);
                const orderRef = doc(db, `${pathRoot}/settings/app`);
                batch.set(orderRef, { innerfaceGroupOrder: newOrder }, { merge: true });
                set({ innerfaceGroupOrder: newOrder });
            }

            await batch.commit();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error("Failed to delete group:", err);
            showErrorToast(message);
        }
    },
});
