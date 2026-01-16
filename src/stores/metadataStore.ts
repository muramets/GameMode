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
 * Manages the "static" game data configuration PER PERSONALITY:
 * - Innerfaces: The core attributes/skills (e.g., Focus, Energy).
 * - Protocols: Activities that modify innerfaces (e.g., "Deep Work" adds +Focus).
 * - States: Game modes/Presets that aggregate protocols and innerfaces.
 * - Groups: UI organization validation.
 * 
 * Logic:
 * - Uses Firestore subcollections under `users/{uid}/personalities/{pid}/...`
 */
interface MetadataState {
    innerfaces: Innerface[];
    protocols: Protocol[];
    states: StateData[];
    pinnedProtocolIds: string[];
    groupsMetadata: Record<string, { icon: string; color?: string }>;
    groupOrder: string[]; // List of protocol group names
    innerfaceGroupOrder: string[]; // List of innerface group names
    isLoading: boolean;
    loadedCount: number;
    error: string | null;

    // --- Actions ---

    // Innerfaces
    addInnerface: (uid: string, pid: string, innerface: Omit<Innerface, 'id'>) => Promise<void>;
    updateInnerface: (uid: string, pid: string, id: number | string, data: Partial<Innerface>) => Promise<void>;
    deleteInnerface: (uid: string, pid: string, id: number | string) => Promise<void>;

    // Protocols
    addProtocol: (uid: string, pid: string, protocol: Omit<Protocol, 'id'>) => Promise<void>;
    updateProtocol: (uid: string, pid: string, id: number | string, data: Partial<Protocol>) => Promise<void>;
    deleteProtocol: (uid: string, pid: string, id: number | string) => Promise<void>;

    // States
    addState: (uid: string, pid: string, state: Omit<StateData, 'id'>) => Promise<void>;
    updateState: (uid: string, pid: string, id: string, data: Partial<StateData>) => Promise<void>;
    deleteState: (uid: string, pid: string, id: string) => Promise<void>;

    updateGroupMetadata: (uid: string, pid: string, groupName: string, metadata: { icon?: string; color?: string }) => Promise<void>;
    renameGroup: (uid: string, pid: string, oldName: string, newName: string) => Promise<void>;

    // Quick Actions
    togglePinnedProtocol: (uid: string, pid: string, protocolId: string) => Promise<void>;
    reorderQuickActions: (uid: string, pid: string, orderedIds: string[]) => Promise<void>;

    // Protocol Ordering
    reorderProtocols: (uid: string, pid: string, orderedIds: string[]) => Promise<void>;
    reorderGroups: (uid: string, pid: string, orderedGroups: string[]) => Promise<void>;

    // State Ordering
    reorderStates: (uid: string, pid: string, orderedIds: string[]) => Promise<void>;

    // Innerface Ordering
    reorderInnerfaces: (uid: string, pid: string, orderedIds: string[]) => Promise<void>;
    reorderInnerfaceGroups: (uid: string, pid: string, orderedGroups: string[]) => Promise<void>;

    // --- Subscriptions ---
    subscribeToMetadata: (uid: string, pid: string) => () => void;
}

export const useMetadataStore = create<MetadataState>((set, get) => ({
    innerfaces: [],
    protocols: [],
    states: [],
    pinnedProtocolIds: [],
    groupsMetadata: {},
    groupOrder: [],
    innerfaceGroupOrder: [],
    isLoading: true,
    loadedCount: 0,
    error: null,

    addInnerface: async (uid, pid, data) => {
        try {
            const colRef = collection(db, 'users', uid, 'personalities', pid, 'innerfaces');
            await addDoc(colRef, data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    updateInnerface: async (uid, pid, id, data) => {
        try {
            const docRef = doc(db, 'users', uid, 'personalities', pid, 'innerfaces', id.toString());
            await updateDoc(docRef, data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    deleteInnerface: async (uid, pid, id) => {
        try {
            // 1. Delete the primitive
            const docRef = doc(db, 'users', uid, 'personalities', pid, 'innerfaces', id.toString());
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
                    return updateDoc(doc(db, 'users', uid, 'personalities', pid, 'states', s.id), { innerfaceIds: newIds });
                });

            await Promise.all(updates);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    addProtocol: async (uid, pid, data) => {
        try {
            const colRef = collection(db, 'users', uid, 'personalities', pid, 'protocols');
            await addDoc(colRef, data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    updateProtocol: async (uid, pid, id, data) => {
        try {
            const docRef = doc(db, 'users', uid, 'personalities', pid, 'protocols', id.toString());
            await updateDoc(docRef, data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    deleteProtocol: async (uid, pid, id) => {
        try {
            // 1. Delete the primitive
            const docRef = doc(db, 'users', uid, 'personalities', pid, 'protocols', id.toString());
            await deleteDoc(docRef);

            // 2. Scan all states for references to this ID
            const states = get().states;
            const updates = states
                .filter(s => Array.isArray(s.protocolIds) && s.protocolIds.some(pId => pId.toString() === id.toString()))
                .map(s => {
                    const newIds = (s.protocolIds || []).filter(pId => pId.toString() !== id.toString());
                    return updateDoc(doc(db, 'users', uid, 'personalities', pid, 'states', s.id), { protocolIds: newIds });
                });

            await Promise.all(updates);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    updateGroupMetadata: async (uid, pid, groupName, metadata) => {
        try {
            const docRef = doc(db, 'users', uid, 'personalities', pid, 'groups', groupName);
            await setDoc(docRef, metadata, { merge: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    renameGroup: async (uid, pid, oldName, newName) => {
        try {
            const trimmedNewName = newName.trim();
            if (!trimmedNewName || trimmedNewName === oldName) return;

            const { writeBatch } = await import('firebase/firestore');
            const batch = writeBatch(db);

            // 1. Update Innerfaces
            const innerfaces = get().innerfaces;
            innerfaces.forEach(i => {
                if (i.group === oldName) {
                    const docRef = doc(db, 'users', uid, 'personalities', pid, 'innerfaces', i.id.toString());
                    batch.update(docRef, { group: trimmedNewName });
                }
            });

            // 2. Update Protocols
            const protocols = get().protocols;
            protocols.forEach(p => {
                if (p.group === oldName) {
                    const docRef = doc(db, 'users', uid, 'personalities', pid, 'protocols', p.id.toString());
                    batch.update(docRef, { group: trimmedNewName });
                }
            });

            // 3. Move Group Metadata (if exists)
            const groupsMetadata = get().groupsMetadata;
            if (groupsMetadata[oldName]) {
                const oldMetaRef = doc(db, 'users', uid, 'personalities', pid, 'groups', oldName);
                const newMetaRef = doc(db, 'users', uid, 'personalities', pid, 'groups', trimmedNewName);

                batch.set(newMetaRef, groupsMetadata[oldName]);
                batch.delete(oldMetaRef);
            }

            // 4. Update Sort Orders
            // Protocol Group Order
            const groupOrder = get().groupOrder;
            if (groupOrder.includes(oldName)) {
                const newOrder = groupOrder.map(g => g === oldName ? trimmedNewName : g);
                const orderRef = doc(db, 'users', uid, 'personalities', pid, 'settings', 'groups');
                batch.set(orderRef, { order: newOrder }, { merge: true });
                set({ groupOrder: newOrder }); // Optimistic
            }

            // Innerface Group Order
            const innerfaceGroupOrder = get().innerfaceGroupOrder;
            if (innerfaceGroupOrder.includes(oldName)) {
                const newOrder = innerfaceGroupOrder.map(g => g === oldName ? trimmedNewName : g);
                const orderRef = doc(db, 'users', uid, 'personalities', pid, 'settings', 'innerface_groups');
                batch.set(orderRef, { order: newOrder }, { merge: true });
                set({ innerfaceGroupOrder: newOrder }); // Optimistic
            }

            await batch.commit();

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error("Failed to rename group:", err);
            set({ error: message });
        }
    },

    addState: async (uid, pid, data) => {
        try {
            const colRef = collection(db, 'users', uid, 'personalities', pid, 'states');
            await addDoc(colRef, data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    updateState: async (uid, pid, id, data) => {
        try {
            const docRef = doc(db, 'users', uid, 'personalities', pid, 'states', id);
            await updateDoc(docRef, data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    deleteState: async (uid, pid, id) => {
        try {
            const docRef = doc(db, 'users', uid, 'personalities', pid, 'states', id);
            await deleteDoc(docRef);

            const states = get().states;
            const updates = states
                .filter(s => Array.isArray(s.stateIds) && s.stateIds.includes(id))
                .map(s => {
                    const newIds = (s.stateIds || []).filter(sId => sId !== id);
                    return updateDoc(doc(db, 'users', uid, 'personalities', pid, 'states', s.id), { stateIds: newIds });
                });

            await Promise.all(updates);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    togglePinnedProtocol: async (uid, pid, protocolId) => {
        try {
            const ids = get().pinnedProtocolIds;
            const isPinned = ids.includes(protocolId);
            const newIds = isPinned
                ? ids.filter(id => id !== protocolId)
                : [...ids, protocolId];

            const docRef = doc(db, 'users', uid, 'personalities', pid, 'settings', 'quickActions');
            await setDoc(docRef, { ids: newIds }, { merge: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    reorderStates: async (uid, pid, orderedIds) => {
        try {
            // Optimistically update local state immediately
            const currentStates = get().states;
            const stateMap = new Map(currentStates.map(s => [s.id, s]));

            const reorderedStates = orderedIds
                .map((id, index) => {
                    const state = stateMap.get(id);
                    return state ? { ...state, order: index } : null;
                })
                .filter(Boolean) as StateData[];

            // Add any states that might have been missing from orderedIds (edge case safely)
            const missingStates = currentStates
                .filter(s => !orderedIds.includes(s.id))
                .map((s, i) => ({ ...s, order: orderedIds.length + i }));

            set({ states: [...reorderedStates, ...missingStates] });

            // Batch update Firestore
            // We use a WriteBatch to ensure atomicity
            const { writeBatch } = await import('firebase/firestore');
            const batch = writeBatch(db);

            orderedIds.forEach((id, index) => {
                const docRef = doc(db, 'users', uid, 'personalities', pid, 'states', id);
                batch.update(docRef, { order: index });
            });

            // Also update any missing ones to logical ends
            missingStates.forEach(s => {
                const docRef = doc(db, 'users', uid, 'personalities', pid, 'states', s.id);
                batch.update(docRef, { order: s.order });
            });

            await batch.commit();

        } catch (err: unknown) {
            console.error("Failed to reorder states:", err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
            // Revert checks would happen on next snapshot update naturally
        }
    },

    reorderInnerfaces: async (uid, pid, orderedIds) => {
        try {
            // Optimistically update local state immediately
            const currentInnerfaces = get().innerfaces;
            const ifaceMap = new Map(currentInnerfaces.map(i => [i.id.toString(), i]));

            const reorderedInnerfaces = orderedIds
                .map((id, index) => {
                    const iface = ifaceMap.get(id);
                    return iface ? { ...iface, order: index } : null;
                })
                .filter(Boolean) as Innerface[];

            // Add any missing ones
            const missingInnerfaces = currentInnerfaces
                .filter(i => !orderedIds.includes(i.id.toString()))
                .map((i, idx) => ({ ...i, order: orderedIds.length + idx }));

            set({ innerfaces: [...reorderedInnerfaces, ...missingInnerfaces] });

            // Batch update Firestore
            const { writeBatch } = await import('firebase/firestore');
            const batch = writeBatch(db);

            orderedIds.forEach((id, index) => {
                const docRef = doc(db, 'users', uid, 'personalities', pid, 'innerfaces', id);
                batch.update(docRef, { order: index });
            });

            // Also update any missing ones to logical ends
            missingInnerfaces.forEach(i => {
                const docRef = doc(db, 'users', uid, 'personalities', pid, 'innerfaces', i.id.toString());
                batch.update(docRef, { order: i.order });
            });

            await batch.commit();
        } catch (err: unknown) {
            console.error("Failed to reorder innerfaces:", err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    reorderQuickActions: async (uid, pid, orderedIds) => {
        try {
            // Optimistic update
            set({ pinnedProtocolIds: orderedIds });

            const docRef = doc(db, 'users', uid, 'personalities', pid, 'settings', 'quickActions');
            await setDoc(docRef, { ids: orderedIds }, { merge: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    reorderProtocols: async (uid, pid, orderedIds) => {
        try {
            // Optimistic update
            const currentProtocols = get().protocols;
            const protocolsMap = new Map(currentProtocols.map(p => [p.id, p]));

            const reorderedProtocols = orderedIds
                .map((id, index) => {
                    const p = protocolsMap.get(id);
                    return p ? { ...p, order: index } : null;
                })
                .filter(Boolean) as Protocol[];

            // Keep protocols not involved in this reorder (e.g. other groups)
            const otherProtocols = currentProtocols.filter(p => !orderedIds.includes(p.id.toString()));

            set({ protocols: [...otherProtocols, ...reorderedProtocols] });

            // Batch update
            const { writeBatch } = await import('firebase/firestore');
            const batch = writeBatch(db);

            orderedIds.forEach((id, index) => {
                const docRef = doc(db, 'users', uid, 'personalities', pid, 'protocols', id.toString());
                batch.update(docRef, { order: index });
            });

            await batch.commit();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    reorderGroups: async (uid, pid, orderedGroups) => {
        try {
            // Optimistic update
            set({ groupOrder: orderedGroups });

            const docRef = doc(db, 'users', uid, 'personalities', pid, 'settings', 'groups');
            await setDoc(docRef, { order: orderedGroups }, { merge: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    reorderInnerfaceGroups: async (uid, pid, orderedGroups) => {
        try {
            // Optimistic update
            set({ innerfaceGroupOrder: orderedGroups });

            const docRef = doc(db, 'users', uid, 'personalities', pid, 'settings', 'innerface_groups');
            await setDoc(docRef, { order: orderedGroups }, { merge: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    subscribeToMetadata: (uid, pid) => {
        set({ isLoading: true, loadedCount: 0 });

        const totalSources = 7; // Increased source count
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

        const unsubIfaces = onSnapshot(collection(db, 'users', uid, 'personalities', pid, 'innerfaces'), (snap) => {
            const innerfaces = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Innerface));
            set({ innerfaces });
            markLoaded('innerfaces');
        });

        const unsubProtocols = onSnapshot(collection(db, 'users', uid, 'personalities', pid, 'protocols'), (snap) => {
            const protocols = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Protocol));
            set({ protocols });
            markLoaded('protocols');
        });

        const unsubStates = onSnapshot(collection(db, 'users', uid, 'personalities', pid, 'states'), (snap) => {
            const states = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as StateData));
            // Sort by order field
            states.sort((a, b) => {
                const orderA = a.order ?? 9999;
                const orderB = b.order ?? 9999;
                return orderA - orderB;
            });
            set({ states });
            markLoaded('states');
        });

        const unsubGroups = onSnapshot(collection(db, 'users', uid, 'personalities', pid, 'groups'), (snap) => {
            const groupsMetadata: Record<string, { icon: string; color?: string }> = {};
            snap.docs.forEach(doc => {
                groupsMetadata[doc.id] = doc.data() as { icon: string; color?: string };
            });
            set({ groupsMetadata });
            markLoaded('groups');
        });

        const unsubGroupSettings = onSnapshot(doc(db, 'users', uid, 'personalities', pid, 'settings', 'groups'), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                set({ groupOrder: data.order || [] });
            } else {
                set({ groupOrder: [] });
            }
            markLoaded('groupSettings');
        });

        const unsubInnerfaceGroupSettings = onSnapshot(doc(db, 'users', uid, 'personalities', pid, 'settings', 'innerface_groups'), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                set({ innerfaceGroupOrder: data.order || [] });
            } else {
                set({ innerfaceGroupOrder: [] });
            }
            markLoaded('innerfaceGroupSettings');
        });

        const unsubQuickActions = onSnapshot(doc(db, 'users', uid, 'personalities', pid, 'settings', 'quickActions'), (snap) => {
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
            unsubGroupSettings();
            unsubInnerfaceGroupSettings();
        };
    }
}));
