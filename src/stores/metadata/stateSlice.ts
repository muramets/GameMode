import type { StateData } from '../../features/dashboard/types';
import { db } from '../../config/firebase';
import { collection, doc, addDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { useUIStore } from '../uiStore';
import type { MetadataState, PathContext } from './types';
import { useHistoryStore } from '../historyStore';

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

export const createStateSlice = (
    set: (partial: Partial<MetadataState> | ((state: MetadataState) => Partial<MetadataState>)) => void,
    get: () => MetadataState
) => ({
    addState: async (data: Omit<StateData, 'id'>) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const colRef = collection(db, `${getPathRoot(context)}/states`);
            const docRef = await addDoc(colRef, data);

            // Log System Events for initial Innerfaces
            if (data.innerfaceIds && data.innerfaceIds.length > 0 && context && context.type === 'personality') {
                data.innerfaceIds.forEach(ifaceId => {
                    const ifaceIdStr = ifaceId.toString();
                    const iface = get().innerfaces.find(i => i.id.toString() === ifaceIdStr);
                    const name = iface ? iface.name : 'Unknown Power';
                    const { uid, pid } = context;
                    useHistoryStore.getState().addSystemEvent(uid, pid, `Added Power "${name}" to Dimension "${data.name}"`, { stateId: docRef.id, innerfaceId: ifaceIdStr, type: 'linkState' });
                });
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    updateState: async (id: string, data: Partial<StateData>) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const docRef = doc(db, `${getPathRoot(context)}/states/${id}`);

            // Detect changes for History logging (System Events)
            const currentState = get().states.find(s => s.id === id);
            if (currentState && data.innerfaceIds && context && context.type === 'personality') {
                const oldIds = new Set(currentState.innerfaceIds || []);
                const newIds = new Set(data.innerfaceIds);

                // Find added
                data.innerfaceIds.forEach(ifaceId => {
                    const ifaceIdStr = ifaceId.toString();
                    if (!oldIds.has(ifaceIdStr) && !oldIds.has(Number(ifaceIdStr))) { // Handle mixed string/number types
                        const iface = get().innerfaces.find(i => i.id.toString() === ifaceIdStr);
                        const name = iface ? iface.name : 'Unknown Power';
                        const { uid, pid } = context;
                        useHistoryStore.getState().addSystemEvent(uid, pid, `Added Power "${name}" to Dimension "${currentState.name}"`, { stateId: id, innerfaceId: ifaceIdStr, type: 'linkState' });
                    }
                });

                // Find removed
                if (currentState.innerfaceIds) {
                    currentState.innerfaceIds.forEach(ifaceId => {
                        const ifaceIdStr = ifaceId.toString();
                        if (!newIds.has(ifaceIdStr) && !newIds.has(Number(ifaceIdStr))) {
                            const iface = get().innerfaces.find(i => i.id.toString() === ifaceIdStr);
                            const name = iface ? iface.name : 'Unknown Power';
                            const { uid, pid } = context;
                            useHistoryStore.getState().addSystemEvent(uid, pid, `Removed Power "${name}" from Dimension "${currentState.name}"`, { stateId: id, innerfaceId: ifaceIdStr, type: 'unlinkState' });
                        }
                    });
                }
            }

            await updateDoc(docRef, data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    deleteState: async (id: string) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            // Soft Delete: Set deletedAt
            const docRef = doc(db, `${getPathRoot(context)}/states/${id}`);
            await updateDoc(docRef, { deletedAt: new Date().toISOString() });

            // Note: We used to remove ID references from other States here.
            // With Soft Deletes, we keep the references so hierarchy remains valid.
            // The UI will filter out deleted states from the active State editing view.
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    restoreState: async (state: StateData) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const docRef = doc(db, `${getPathRoot(context)}/states/${state.id}`);
            // Restore by clearing deletedAt
            await updateDoc(docRef, { deletedAt: null });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    reorderStates: async (orderedIds: string[]) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const currentStates = get().states;
            const stateMap = new Map(currentStates.map(s => [s.id, s]));

            const reorderedStates = orderedIds
                .map((id, index) => {
                    const state = stateMap.get(id);
                    return state ? { ...state, order: index } : null;
                })
                .filter(Boolean) as StateData[];

            const missingStates = currentStates
                .filter(s => !orderedIds.includes(s.id))
                .map((s, i) => ({ ...s, order: orderedIds.length + i }));

            set({ states: [...reorderedStates, ...missingStates] });

            const batch = writeBatch(db);
            orderedIds.forEach((id, index) => {
                const docRef = doc(db, `${getPathRoot(context)}/states/${id}`);
                batch.update(docRef, { order: index });
            });
            missingStates.forEach(s => {
                const docRef = doc(db, `${getPathRoot(context)}/states/${s.id}`);
                batch.update(docRef, { order: s.order });
            });

            await batch.commit();
        } catch (err: unknown) {
            console.error("Failed to reorder states:", err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    setDimensionsCollapsed: async (collapsed: boolean) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const docRef = doc(db, `${getPathRoot(context)}/settings/app`);
            await updateDoc(docRef, { isDimensionsCollapsed: collapsed });
        } catch (err: unknown) {
            console.error("Failed to update dimensions collapse state:", err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },
});
