import type { StateData } from '../../features/dashboard/types';
import { db } from '../../config/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, writeBatch, setDoc } from 'firebase/firestore';
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

export const createStateSlice = (
    set: (partial: Partial<MetadataState> | ((state: MetadataState) => Partial<MetadataState>)) => void,
    get: () => MetadataState
) => ({
    addState: async (data: Omit<StateData, 'id'>) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const colRef = collection(db, `${getPathRoot(context)}/states`);
            await addDoc(colRef, data);
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
            const docRef = doc(db, `${getPathRoot(context)}/states/${id}`);
            await deleteDoc(docRef);

            const states = get().states;
            const updates = states
                .filter(s => Array.isArray(s.stateIds) && s.stateIds.includes(id))
                .map(s => {
                    const newIds = (s.stateIds || []).filter(sId => sId !== id);
                    return updateDoc(doc(db, `${getPathRoot(context)}/states/${s.id}`), { stateIds: newIds });
                });

            await Promise.all(updates);
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
            await setDoc(docRef, state);
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
});
