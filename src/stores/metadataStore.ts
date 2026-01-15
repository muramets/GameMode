import { create } from 'zustand';
import { db } from '../config/firebase';
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    setDoc,
    addDoc,
    deleteDoc
} from 'firebase/firestore';
import type { Innerface, Protocol } from '../pages/protocols/types';
import type { StateData } from '../pages/dashboard/components/types';

/**
 * Metadata Store
 * 
 * Manages the "static" game data configuration:
 * - Innerfaces: The core attributes/skills (e.g., Focus, Energy).
 * - Protocols: Activities that modify innerfaces (e.g., "Deep Work" adds +Focus).
 * - States: Game modes/Presets that aggregate protocols and innerfaces.
 * - Groups: UI organization validation.
 * 
 * Logic:
 * - Uses Firebase real-time listeners (onSnapshot) to keep the UI in sync across devices.
 * - Handles "Cascading Deletes": When a primitive (Innerface/Protocol) is deleted, 
 *   it automatically scans all States and removes the reference to avoid "Ghost IDs" 
 *   that would break score calculations.
 */
interface MetadataState {
    innerfaces: Innerface[];
    protocols: Protocol[];
    states: StateData[];
    pinnedProtocolIds: string[];
    groupsMetadata: Record<string, { icon: string; color?: string }>;
    isLoading: boolean;
    loadedCount: number;
    error: string | null;

    // --- Actions ---

    // Innerfaces
    addInnerface: (uid: string, innerface: Omit<Innerface, 'id'>) => Promise<void>;
    updateInnerface: (uid: string, id: number | string, data: Partial<Innerface>) => Promise<void>;
    /**
     * Deletes an innerface and removes its ID from all States that reference it.
     */
    deleteInnerface: (uid: string, id: number | string) => Promise<void>;

    // Protocols
    addProtocol: (uid: string, protocol: Omit<Protocol, 'id'>) => Promise<void>;
    updateProtocol: (uid: string, id: number | string, data: Partial<Protocol>) => Promise<void>;
    /**
     * Deletes a protocol and removes its ID from all States that reference it.
     */
    deleteProtocol: (uid: string, id: number | string) => Promise<void>;

    // States
    addState: (uid: string, state: Omit<StateData, 'id'>) => Promise<void>;
    updateState: (uid: string, id: string, data: Partial<StateData>) => Promise<void>;
    /**
     * Deletes a state and removes its ID from any other States that reference it (if nested states are supported).
     */
    deleteState: (uid: string, id: string) => Promise<void>;

    updateGroupMetadata: (uid: string, groupName: string, metadata: { icon?: string; color?: string }) => Promise<void>;

    // Quick Actions
    togglePinnedProtocol: (uid: string, protocolId: string) => Promise<void>;

    // --- Subscriptions ---
    subscribeToMetadata: (uid: string) => () => void;
}

export const useMetadataStore = create<MetadataState>((set, get) => ({
    innerfaces: [],
    protocols: [],
    states: [],
    pinnedProtocolIds: [],
    groupsMetadata: {},
    isLoading: true,
    loadedCount: 0,
    error: null,

    addInnerface: async (uid, data) => {
        try {
            const colRef = collection(db, 'users', uid, 'innerfaces');
            await addDoc(colRef, data);
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    updateInnerface: async (uid, id, data) => {
        try {
            const docRef = doc(db, 'users', uid, 'innerfaces', id.toString());
            await updateDoc(docRef, data);
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    deleteInnerface: async (uid, id) => {
        try {
            // 1. Delete the primitive
            const docRef = doc(db, 'users', uid, 'innerfaces', id.toString());
            await deleteDoc(docRef);

            // 2. Scan all states for references to this ID to prevent "Ghost IDs"
            const states = get().states;
            const updates = states
                // Find states that contain this innerface ID
                .filter(s => Array.isArray(s.innerfaceIds) && s.innerfaceIds.some(iId => iId.toString() === id.toString()))
                .map(s => {
                    // Remove the ID from the array
                    const newIds = (s.innerfaceIds || []).filter(iId => iId.toString() !== id.toString());
                    // Update the state document
                    return updateDoc(doc(db, 'users', uid, 'states', s.id), { innerfaceIds: newIds });
                });

            await Promise.all(updates);
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    addProtocol: async (uid, data) => {
        try {
            const colRef = collection(db, 'users', uid, 'protocols');
            await addDoc(colRef, data);
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    updateProtocol: async (uid, id, data) => {
        try {
            const docRef = doc(db, 'users', uid, 'protocols', id.toString());
            await updateDoc(docRef, data);
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    deleteProtocol: async (uid, id) => {
        try {
            // 1. Delete the primitive
            const docRef = doc(db, 'users', uid, 'protocols', id.toString());
            await deleteDoc(docRef);

            // 2. Scan all states for references to this ID
            const states = get().states;
            const updates = states
                .filter(s => Array.isArray(s.protocolIds) && s.protocolIds.some(pId => pId.toString() === id.toString()))
                .map(s => {
                    const newIds = (s.protocolIds || []).filter(pId => pId.toString() !== id.toString());
                    return updateDoc(doc(db, 'users', uid, 'states', s.id), { protocolIds: newIds });
                });

            await Promise.all(updates);
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    updateGroupMetadata: async (uid, groupName, metadata) => {
        try {
            const docRef = doc(db, 'users', uid, 'groups', groupName);
            await setDoc(docRef, metadata, { merge: true });
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    addState: async (uid: string, data: Omit<StateData, 'id'>) => {
        try {
            const colRef = collection(db, 'users', uid, 'states');
            await addDoc(colRef, data);
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    updateState: async (uid: string, id: string, data: Partial<StateData>) => {
        try {
            const docRef = doc(db, 'users', uid, 'states', id);
            await updateDoc(docRef, data);
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    deleteState: async (uid: string, id: string) => {
        try {
            const docRef = doc(db, 'users', uid, 'states', id);
            await deleteDoc(docRef);

            const states = get().states;
            const updates = states
                .filter(s => Array.isArray(s.stateIds) && s.stateIds.includes(id))
                .map(s => {
                    const newIds = (s.stateIds || []).filter(sId => sId !== id);
                    return updateDoc(doc(db, 'users', uid, 'states', s.id), { stateIds: newIds });
                });

            await Promise.all(updates);
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    togglePinnedProtocol: async (uid, protocolId) => {
        try {
            const ids = get().pinnedProtocolIds;
            const isPinned = ids.includes(protocolId);
            const newIds = isPinned
                ? ids.filter(id => id !== protocolId)
                : [...ids, protocolId];

            const docRef = doc(db, 'users', uid, 'settings', 'quickActions');
            await setDoc(docRef, { ids: newIds }, { merge: true });
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    subscribeToMetadata: (uid) => {
        set({ isLoading: true, loadedCount: 0 });

        // Helper to check if all initial data is loaded
        let localLoadedCount = 0;
        const totalSources = 5; // Added Quick Actions
        const checkDone = (snap: any) => {
            // We count a source as loaded when it fires first time, regardless of cache
            // to ensure the UI progresses.
            // (We use a local counter per closure to avoid race conditions with global state updates if we used get().loadedCount)
            // However, to update the UI, we must set it.
            // Note: onSnapshot fires immediately with cache or empty, then updates.
            // We just want to know "did we get *something*".

            // Simple logic: we have 5 subscriptions. Each time one fires for the FIRST time, we increment.
            // But onSnapshot fires on every update. We need to track which *type* finished.
            // Actually, the previous logic was: count fires.

            // Better logic: use a set of loaded sources.
        };

        const loadedSources = new Set<string>();
        const markLoaded = (source: string) => {
            if (!loadedSources.has(source)) {
                loadedSources.add(source);
                set({ loadedCount: loadedSources.size });
                if (loadedSources.size >= totalSources) {
                    set({ isLoading: false });
                }
            }
        };

        const unsubIfaces = onSnapshot(collection(db, 'users', uid, 'innerfaces'), (snap) => {
            const innerfaces = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Innerface));
            set({ innerfaces });
            markLoaded('innerfaces');
        });

        const unsubProtocols = onSnapshot(collection(db, 'users', uid, 'protocols'), (snap) => {
            const protocols = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Protocol));
            set({ protocols });
            markLoaded('protocols');
        });

        const unsubStates = onSnapshot(collection(db, 'users', uid, 'states'), (snap) => {
            const states = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as StateData));
            set({ states });
            markLoaded('states');
        });

        const unsubGroups = onSnapshot(collection(db, 'users', uid, 'groups'), (snap) => {
            const groupsMetadata: Record<string, { icon: string; color?: string }> = {};
            snap.docs.forEach(doc => {
                groupsMetadata[doc.id] = doc.data() as { icon: string; color?: string };
            });
            set({ groupsMetadata });
            markLoaded('groups');
        });

        const unsubQuickActions = onSnapshot(doc(db, 'users', uid, 'settings', 'quickActions'), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                set({ pinnedProtocolIds: data.ids || [] });
            } else {
                set({ pinnedProtocolIds: [] });
            }
            markLoaded('quickActions');
        });

        return () => {
            unsubIfaces();
            unsubProtocols();
            unsubStates();
            unsubGroups();
            unsubQuickActions();
        };
    }
}));
