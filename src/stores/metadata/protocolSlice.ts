import type { Protocol } from '../../features/protocols/types';
import { db } from '../../config/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, writeBatch, setDoc } from 'firebase/firestore';
import { useUIStore } from '../uiStore';
import type { MetadataState, PathContext } from './types';

// Helpers (duplicated for now to keep slices independent/portable)
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

export const createProtocolSlice = (
    set: (partial: Partial<MetadataState> | ((state: MetadataState) => Partial<MetadataState>)) => void,
    get: () => MetadataState
) => ({
    addProtocol: async (protocol: Omit<Protocol, 'id'>) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const colRef = collection(db, `${getPathRoot(context)}/protocols`);
            await addDoc(colRef, protocol);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    updateProtocol: async (id: number | string, data: Partial<Protocol>) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context, true);
            const docRef = doc(db, `${getPathRoot(context)}/protocols/${id}`);
            await updateDoc(docRef, data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    deleteProtocol: async (id: number | string) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const docRef = doc(db, `${getPathRoot(context)}/protocols/${id}`);
            await deleteDoc(docRef);

            const states = get().states;
            const updates = states
                .filter(s => Array.isArray(s.protocolIds) && s.protocolIds.some(pId => pId.toString() === id.toString()))
                .map(s => {
                    const newIds = (s.protocolIds || []).filter(pId => pId.toString() !== id.toString());
                    return updateDoc(doc(db, `${getPathRoot(context)}/states/${s.id}`), { protocolIds: newIds });
                });

            await Promise.all(updates);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    togglePinnedProtocol: async (protocolId: string) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const ids = get().pinnedProtocolIds;
            const isPinned = ids.includes(protocolId);
            const newIds = isPinned
                ? ids.filter(id => id !== protocolId)
                : [...ids, protocolId];

            const docRef = doc(db, `${getPathRoot(context)}/settings/app`);
            await setDoc(docRef, { pinnedProtocolIds: newIds }, { merge: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    reorderQuickActions: async (orderedIds: string[]) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            set({ pinnedProtocolIds: orderedIds });
            const docRef = doc(db, `${getPathRoot(context)}/settings/app`);
            await setDoc(docRef, { pinnedProtocolIds: orderedIds }, { merge: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    reorderProtocols: async (orderedIds: string[]) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const currentProtocols = get().protocols;
            const protocolsMap = new Map(currentProtocols.map(p => [p.id, p]));

            const reorderedProtocols = orderedIds
                .map((id, index) => {
                    const p = protocolsMap.get(id);
                    return p ? { ...p, order: index } : null;
                })
                .filter(Boolean) as Protocol[];

            const otherProtocols = currentProtocols.filter(p => !orderedIds.includes(p.id.toString()));

            set({ protocols: [...otherProtocols, ...reorderedProtocols] });

            const batch = writeBatch(db);
            orderedIds.forEach((id, index) => {
                const docRef = doc(db, `${getPathRoot(context)}/protocols/${id}`);
                batch.update(docRef, { order: index });
            });

            await batch.commit();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },

    reorderGroups: async (orderedGroups: string[]) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            set({ groupOrder: orderedGroups });
            const docRef = doc(db, `${getPathRoot(context)}/settings/groups`);
            await setDoc(docRef, { order: orderedGroups }, { merge: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            showErrorToast(message);
        }
    },
});
