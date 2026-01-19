import type { Innerface } from '../../features/innerfaces/types';
import { db } from '../../config/firebase';
import { collection, doc, addDoc, updateDoc, writeBatch, setDoc } from 'firebase/firestore';
import { useUIStore } from '../uiStore';
import type { MetadataState, PathContext } from './types';

// Helpers (re-implemented here or imported if we extracted them)
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

export const createInnerfaceSlice = (
    set: (partial: Partial<MetadataState> | ((state: MetadataState) => Partial<MetadataState>)) => void,
    get: () => MetadataState
) => ({
    // Actions
    addInnerface: async (innerface: Omit<Innerface, 'id'>) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const colRef = collection(db, `${getPathRoot(context)}/innerfaces`);
            const docRef = await addDoc(colRef, innerface);
            return docRef.id;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
            throw err; // Re-throw to prevent caller from proceeding with undefined ID
        }
    },

    updateInnerface: async (id: number | string, data: Partial<Innerface>) => {
        try {
            const context = get().context;
            // Optimistic update
            const currentInnerfaces = get().innerfaces;
            set({
                innerfaces: currentInnerfaces.map(i =>
                    i.id.toString() === id.toString() ? { ...i, ...data } : i
                )
            });
            // ALLOW UPDATES IN COACH MODE
            guardAgainstViewerMode(context, true);
            const docRef = doc(db, `${getPathRoot(context)}/innerfaces/${id}`);
            await updateDoc(docRef, data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('[MetadataStore] updateInnerface failed:', err);
            showErrorToast(message);
        }
    },

    deleteInnerface: async (id: number | string) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            // 1. Soft Delete: Set deletedAt
            const docRef = doc(db, `${getPathRoot(context)}/innerfaces/${id}`);
            await updateDoc(docRef, { deletedAt: new Date().toISOString() });

            // Note: We used to remove ID references from States here.
            // With Soft Deletes, we keep the references so history remains valid.
            // The UI will filter out deleted innerfaces from the active State editing view.

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    restoreInnerface: async (innerface: Innerface) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const docRef = doc(db, `${getPathRoot(context)}/innerfaces/${innerface.id}`);

            // Restore by clearing deletedAt
            // Note: We use update instead of set to preserve any other changes if consistent with soft delete model
            // But since restoreInnerface in types.ts took the whole object, existing logic might re-set the whole object.
            // For soft delete restore, we just need to clear the flag.
            await updateDoc(docRef, { deletedAt: null });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    moveInnerface: async (id: string, newGroup: string, orderedIds: string[]) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);

            // Optimistic update
            const currentInnerfaces = get().innerfaces;
            const ifaceMap = new Map(currentInnerfaces.map(i => [i.id.toString(), i]));

            const targetItem = ifaceMap.get(id);
            if (targetItem) {
                targetItem.group = newGroup;
            }

            const reorderedInnerfaces = orderedIds
                .map((oid, index) => {
                    const iface = ifaceMap.get(oid);
                    return iface ? { ...iface, order: index } : null;
                })
                .filter(Boolean) as Innerface[];

            const missingInnerfaces = currentInnerfaces
                .filter(i => !orderedIds.includes(i.id.toString()))
                .map((i, idx) => ({ ...i, order: orderedIds.length + idx }));

            set({ innerfaces: [...reorderedInnerfaces, ...missingInnerfaces] });

            const batch = writeBatch(db);
            orderedIds.forEach((oid, index) => {
                const docRef = doc(db, `${getPathRoot(context)}/innerfaces/${oid}`);
                if (oid === id) {
                    batch.update(docRef, { order: index, group: newGroup });
                } else {
                    batch.update(docRef, { order: index });
                }
            });

            await batch.commit();
        } catch (err: unknown) {
            console.error("Failed to move innerface:", err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    reorderInnerfaces: async (orderedIds: string[]) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const currentInnerfaces = get().innerfaces;
            const ifaceMap = new Map(currentInnerfaces.map(i => [i.id.toString(), i]));

            const reorderedInnerfaces = orderedIds
                .map((id, index) => {
                    const iface = ifaceMap.get(id);
                    return iface ? { ...iface, order: index } : null;
                })
                .filter(Boolean) as Innerface[];

            const missingInnerfaces = currentInnerfaces
                .filter(i => !orderedIds.includes(i.id.toString()))
                .map((i, idx) => ({ ...i, order: orderedIds.length + idx }));

            set({ innerfaces: [...reorderedInnerfaces, ...missingInnerfaces] });

            const batch = writeBatch(db);
            orderedIds.forEach((id, index) => {
                const docRef = doc(db, `${getPathRoot(context)}/innerfaces/${id}`);
                batch.update(docRef, { order: index });
            });
            missingInnerfaces.forEach(i => {
                const docRef = doc(db, `${getPathRoot(context)}/innerfaces/${i.id.toString()}`);
                batch.update(docRef, { order: i.order });
            });

            await batch.commit();
        } catch (err: unknown) {
            console.error("Failed to reorder innerfaces:", err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    reorderInnerfaceGroups: async (orderedGroups: string[]) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            set({ innerfaceGroupOrder: orderedGroups });
            const docRef = doc(db, `${getPathRoot(context)}/settings/app`);
            await setDoc(docRef, { innerfaceGroupOrder: orderedGroups }, { merge: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    reorderCategories: async (orderedCategories: string[]) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            set({ categoryOrder: orderedCategories });
            const docRef = doc(db, `${getPathRoot(context)}/settings/app`);
            await setDoc(docRef, { categoryOrder: orderedCategories }, { merge: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },
});
