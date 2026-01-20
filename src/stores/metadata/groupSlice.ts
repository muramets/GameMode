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
            console.debug('[GroupSlice] renameGroup called', { oldName, newName });

            guardAgainstViewerMode(context);
            const trimmedNewName = newName.trim();
            if (!trimmedNewName || trimmedNewName === oldName) return;

            // --- 1. Optimistic Update Start ---
            get().setHasPendingWrites(true);

            const state = get();

            // Prepare new state values
            const nextInnerfaces = state.innerfaces.map(i =>
                i.group === oldName ? { ...i, group: trimmedNewName } : i
            );

            const nextProtocols = state.protocols.map(p =>
                p.group === oldName ? { ...p, group: trimmedNewName } : p
            );

            const nextGroupsMetadata = { ...state.groupsMetadata };
            if (nextGroupsMetadata[oldName]) {
                nextGroupsMetadata[trimmedNewName] = nextGroupsMetadata[oldName];
                delete nextGroupsMetadata[oldName];
            }

            const nextGroupOrder = state.groupOrder.map(g => g === oldName ? trimmedNewName : g);
            const nextInnerfaceGroupOrder = state.innerfaceGroupOrder.map(g => g === oldName ? trimmedNewName : g);

            // Apply to local store IMMEDIATELY
            set({
                innerfaces: nextInnerfaces,
                protocols: nextProtocols,
                groupsMetadata: nextGroupsMetadata,
                groupOrder: nextGroupOrder,
                innerfaceGroupOrder: nextInnerfaceGroupOrder
            });

            // --- 2. Persistence (Batch Write) ---
            const batch = writeBatch(db);

            // Update Innerfaces
            let innerfacesUpdated = 0;
            state.innerfaces.forEach(i => {
                if (i.group === oldName) {
                    const docRef = doc(db, `${getPathRoot(context)}/innerfaces/${i.id}`);
                    batch.update(docRef, { group: trimmedNewName });
                    innerfacesUpdated++;
                }
            });

            // Update Protocols
            let protocolsUpdated = 0;
            state.protocols.forEach(p => {
                if (p.group === oldName) {
                    const docRef = doc(db, `${getPathRoot(context)}/protocols/${p.id}`);
                    batch.update(docRef, { group: trimmedNewName });
                    protocolsUpdated++;
                }
            });

            // Move Group Metadata
            if (state.groupsMetadata[oldName]) {
                const oldMetaRef = doc(db, `${getPathRoot(context)}/groups/${oldName}`);
                const newMetaRef = doc(db, `${getPathRoot(context)}/groups/${trimmedNewName}`);
                batch.set(newMetaRef, state.groupsMetadata[oldName]);
                batch.delete(oldMetaRef);
            }

            // Update Sort Orders
            if (state.groupOrder.includes(oldName)) {
                const orderRef = doc(db, `${getPathRoot(context)}/settings/groups`);
                batch.set(orderRef, { order: nextGroupOrder }, { merge: true });
            }

            if (state.innerfaceGroupOrder.includes(oldName)) {
                const orderRef = doc(db, `${getPathRoot(context)}/settings/app`);
                batch.set(orderRef, { innerfaceGroupOrder: nextInnerfaceGroupOrder }, { merge: true });
            }

            await batch.commit();
            console.debug(`[GroupSlice] renameGroup committed (Updated: ${innerfacesUpdated} innerfaces, ${protocolsUpdated} protocols)`);

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error("Failed to rename group:", err);
            showErrorToast(message);
            // Revert state logic could go here, but complex. Rely on next snapshot.
        } finally {
            // Release lock after small delay to allow server ack
            setTimeout(() => {
                get().setHasPendingWrites(false);
            }, 500);
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

    restoreGroup: async (backup: {
        name: string;
        metadata: { icon?: string; color?: string };
        innerfaceIds: string[];
        protocolIds: string[];
    }) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const batch = writeBatch(db);
            const pathRoot = getPathRoot(context);

            const { name, metadata, innerfaceIds, protocolIds } = backup;

            // 1. Restore Metadata
            if (metadata) {
                const docRef = doc(db, `${pathRoot}/groups/${name}`);
                batch.set(docRef, metadata);
            }

            // 2. Restore Innerfaces
            innerfaceIds.forEach(id => {
                const docRef = doc(db, `${pathRoot}/innerfaces/${id}`);
                batch.update(docRef, { group: name });
            });

            // 3. Restore Protocols
            protocolIds.forEach(id => {
                const docRef = doc(db, `${pathRoot}/protocols/${id}`);
                batch.update(docRef, { group: name });
            });

            // 4. Restore Sort Orders (Optimistic append)
            // We append to the end if not present, simple restore strategy

            // Protocol Group Order
            const currentGroupOrder = get().groupOrder;
            if (!currentGroupOrder.includes(name)) {
                const newOrder = [...currentGroupOrder, name];
                const orderRef = doc(db, `${pathRoot}/settings/groups`);
                batch.set(orderRef, { order: newOrder }, { merge: true });
                set({ groupOrder: newOrder });
            }

            // Innerface Group Order
            const currentInnerfaceGroupOrder = get().innerfaceGroupOrder;
            if (!currentInnerfaceGroupOrder.includes(name)) {
                const newOrder = [...currentInnerfaceGroupOrder, name];
                const orderRef = doc(db, `${pathRoot}/settings/app`);
                batch.set(orderRef, { innerfaceGroupOrder: newOrder }, { merge: true });
                set({ innerfaceGroupOrder: newOrder });
            }

            await batch.commit();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error("Failed to restore group:", err);
            showErrorToast(message);
        }
    }
});
