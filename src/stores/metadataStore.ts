import { create } from 'zustand';
import { db } from '../config/firebase';
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    setDoc,
    addDoc,
    deleteDoc,
    writeBatch
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

    // Context State
    context: PathContext | null;
    setContext: (context: PathContext | null) => void;

    // --- Actions ---

    // Innerfaces
    addInnerface: (innerface: Omit<Innerface, 'id'>) => Promise<void>;
    updateInnerface: (id: number | string, data: Partial<Innerface>) => Promise<void>;
    deleteInnerface: (id: number | string) => Promise<void>;

    // Protocols
    addProtocol: (protocol: Omit<Protocol, 'id'>) => Promise<void>;
    updateProtocol: (id: number | string, data: Partial<Protocol>) => Promise<void>;
    deleteProtocol: (id: number | string) => Promise<void>;

    // States
    addState: (state: Omit<StateData, 'id'>) => Promise<void>;
    updateState: (id: string, data: Partial<StateData>) => Promise<void>;
    deleteState: (id: string) => Promise<void>;

    // Group Actions
    updateGroupMetadata: (groupName: string, metadata: { icon?: string; color?: string }) => Promise<void>;
    renameGroup: (oldName: string, newName: string) => Promise<void>;

    // Quick Actions
    togglePinnedProtocol: (protocolId: string) => Promise<void>;
    reorderQuickActions: (orderedIds: string[]) => Promise<void>;

    // Protocol Ordering
    reorderProtocols: (orderedIds: string[]) => Promise<void>;
    reorderGroups: (orderedGroups: string[]) => Promise<void>;

    // State Ordering
    reorderStates: (orderedIds: string[]) => Promise<void>;

    // Innerface Ordering
    reorderInnerfaces: (orderedIds: string[]) => Promise<void>;
    reorderInnerfaceGroups: (orderedGroups: string[]) => Promise<void>;

    // --- Subscriptions ---
    subscribeToMetadata: (context: PathContext) => () => void;
}

export type PathContext =
    | { type: 'personality'; uid: string; pid: string }
    | { type: 'role'; teamId: string; roleId: string }
    | { type: 'viewer'; targetUid: string; personalityId: string };

const getPathRoot = (context: PathContext | null) => {
    if (!context) throw new Error('No active context for metadata operation');
    if (context.type === 'personality') {
        return `users/${context.uid}/personalities/${context.pid}`;
    }
    if (context.type === 'viewer') {
        // Read-only access to target user's personality
        return `users/${context.targetUid}/personalities/${context.personalityId}`;
    }
    return `teams/${context.teamId}/roles/${context.roleId}`;
};

/**
 * Check if current context is in viewer mode (read-only).
 * In viewer mode, all mutation actions should be blocked.
 */
const isViewerMode = (context: PathContext | null): boolean => {
    return context?.type === 'viewer';
};

/**
 * Guard function to prevent mutations in viewer mode.
 * Throws an error if in viewer mode to stop the action.
 */
const guardAgainstViewerMode = (context: PathContext | null): void => {
    if (isViewerMode(context)) {
        console.warn('[MetadataStore] Blocked mutation in viewer mode');
        throw new Error('Cannot modify data in viewer mode');
    }
};

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

    context: null,
    setContext: (context) => set({ context }),

    // ========================================================================
    // INNERFACE ACTIONS
    // ========================================================================

    addInnerface: async (innerface: Omit<Innerface, 'id'>) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const colRef = collection(db, `${getPathRoot(context)}/innerfaces`);
            await addDoc(colRef, innerface);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    updateInnerface: async (id: number | string, data: Partial<Innerface>) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const docRef = doc(db, `${getPathRoot(context)}/innerfaces/${id}`);
            await updateDoc(docRef, data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    deleteInnerface: async (id: number | string) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            // 1. Delete the primitive
            const docRef = doc(db, `${getPathRoot(context)}/innerfaces/${id}`);
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
                    return updateDoc(doc(db, `${getPathRoot(context)}/states/${s.id}`), { innerfaceIds: newIds });
                });

            await Promise.all(updates);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    addProtocol: async (protocol: Omit<Protocol, 'id'>) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const colRef = collection(db, `${getPathRoot(context)}/protocols`);
            await addDoc(colRef, protocol);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    updateProtocol: async (id: number | string, data: Partial<Protocol>) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const docRef = doc(db, `${getPathRoot(context)}/protocols/${id}`);
            await updateDoc(docRef, data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    deleteProtocol: async (id: number | string) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            // 1. Delete the primitive
            const docRef = doc(db, `${getPathRoot(context)}/protocols/${id}`);
            await deleteDoc(docRef);

            // 2. Scan all states for references to this ID
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
            set({ error: message });
        }
    },

    updateGroupMetadata: async (groupName: string, metadata: { icon?: string; color?: string }) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const docRef = doc(db, `${getPathRoot(context)}/groups/${groupName}`);
            await setDoc(docRef, metadata, { merge: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
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
                const orderRef = doc(db, `${getPathRoot(context)}/settings/innerface_groups`);
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

    addState: async (data: Omit<StateData, 'id'>) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            const colRef = collection(db, `${getPathRoot(context)}/states`);
            await addDoc(colRef, data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
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
            set({ error: message });
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
            set({ error: message });
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

            const docRef = doc(db, `${getPathRoot(context)}/settings/quickActions`);
            await setDoc(docRef, { ids: newIds }, { merge: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    reorderStates: async (orderedIds: string[]) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
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
            const batch = writeBatch(db);

            orderedIds.forEach((id, index) => {
                const docRef = doc(db, `${getPathRoot(context)}/states/${id}`);
                batch.update(docRef, { order: index });
            });

            // Also update any missing ones to logical ends
            missingStates.forEach(s => {
                const docRef = doc(db, `${getPathRoot(context)}/states/${s.id}`);
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

    reorderInnerfaces: async (orderedIds: string[]) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
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
            const batch = writeBatch(db);

            orderedIds.forEach((id, index) => {
                const docRef = doc(db, `${getPathRoot(context)}/innerfaces/${id}`);
                batch.update(docRef, { order: index });
            });

            // Also update any missing ones to logical ends
            missingInnerfaces.forEach(i => {
                const docRef = doc(db, `${getPathRoot(context)}/innerfaces/${i.id.toString()}`);
                batch.update(docRef, { order: i.order });
            });

            await batch.commit();
        } catch (err: unknown) {
            console.error("Failed to reorder innerfaces:", err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    reorderQuickActions: async (orderedIds: string[]) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            // Optimistic update
            set({ pinnedProtocolIds: orderedIds });

            const docRef = doc(db, `${getPathRoot(context)}/settings/quickActions`);
            await setDoc(docRef, { ids: orderedIds }, { merge: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    reorderProtocols: async (orderedIds: string[]) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
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
            const batch = writeBatch(db);

            orderedIds.forEach((id, index) => {
                const docRef = doc(db, `${getPathRoot(context)}/protocols/${id}`);
                batch.update(docRef, { order: index });
            });

            await batch.commit();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    reorderGroups: async (orderedGroups: string[]) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            // Optimistic update
            set({ groupOrder: orderedGroups });

            const docRef = doc(db, `${getPathRoot(context)}/settings/groups`);
            await setDoc(docRef, { order: orderedGroups }, { merge: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    reorderInnerfaceGroups: async (orderedGroups: string[]) => {
        try {
            const context = get().context;
            guardAgainstViewerMode(context);
            // Optimistic update
            set({ innerfaceGroupOrder: orderedGroups });

            const docRef = doc(db, `${getPathRoot(context)}/settings/innerface_groups`);
            await setDoc(docRef, { order: orderedGroups }, { merge: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    subscribeToMetadata: (context: PathContext) => {
        const pathRoot = getPathRoot(context);
        console.log(`[MetadataStore] Subscribing to: ${pathRoot}`);

        set({
            innerfaces: [],
            protocols: [],
            states: [],
            groupsMetadata: {},
            groupOrder: [],
            innerfaceGroupOrder: [],
            pinnedProtocolIds: [],
            isLoading: true,
            loadedCount: 0
        });

        let loadedSections = 0;
        const markLoaded = (source: string) => {
            loadedSections++;
            console.log(`[MetadataStore] Loaded ${source} (${loadedSections}/7)`);
            set(state => ({ loadedCount: state.loadedCount + 1 }));
            if (loadedSections >= 7) {
                console.log(`[MetadataStore] All 7 sections loaded. isLoading -> false`);
                set({ isLoading: false });
            }
        };

        const handleSnapshotError = (err: Error, source: string) => {
            console.error(`[MetadataStore] Error loading ${source}:`, err);
            set({ error: err.message });
            markLoaded(source);
        };

        const unsubIfaces = onSnapshot(
            collection(db, `${pathRoot}/innerfaces`),
            (snap) => {
                const innerfaces = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Innerface));
                set({ innerfaces });
                markLoaded('innerfaces');
            },
            (err) => handleSnapshotError(err, 'innerfaces')
        );

        const unsubProtocols = onSnapshot(
            collection(db, `${pathRoot}/protocols`),
            (snap) => {
                const protocols = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Protocol));
                set({ protocols });
                markLoaded('protocols');
            },
            (err) => handleSnapshotError(err, 'protocols')
        );

        const unsubStates = onSnapshot(
            collection(db, `${pathRoot}/states`),
            (snap) => {
                const states = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StateData));
                states.sort((a, b) => {
                    const orderA = a.order ?? 9999;
                    const orderB = b.order ?? 9999;
                    return orderA - orderB;
                });
                set({ states });
                markLoaded('states');
            },
            (err) => handleSnapshotError(err, 'states')
        );

        const unsubGroups = onSnapshot(
            collection(db, `${pathRoot}/groups`),
            (snap) => {
                const groupsMetadata: Record<string, { icon: string; color?: string }> = {};
                snap.docs.forEach(doc => {
                    groupsMetadata[doc.id] = doc.data() as { icon: string; color?: string };
                });
                set({ groupsMetadata });
                markLoaded('groups');
            },
            (err) => handleSnapshotError(err, 'groups')
        );

        const unsubGroupSettings = onSnapshot(
            doc(db, `${pathRoot}/settings/groups`),
            (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    set({ groupOrder: data.order || [] });
                } else {
                    set({ groupOrder: [] });
                }
                markLoaded('settings/groups');
            },
            (err) => handleSnapshotError(err, 'settings/groups')
        );

        const unsubInnerfaceGroupSettings = onSnapshot(
            doc(db, `${pathRoot}/settings/innerface_groups`),
            (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    set({ innerfaceGroupOrder: data.order || [] });
                } else {
                    set({ innerfaceGroupOrder: [] });
                }
                markLoaded('settings/innerface_groups');
            },
            (err) => handleSnapshotError(err, 'settings/innerface_groups')
        );

        const unsubQuickActions = onSnapshot(
            doc(db, `${pathRoot}/settings/quickActions`),
            (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    set({ pinnedProtocolIds: data.ids || [] });
                } else {
                    set({ pinnedProtocolIds: [] });
                }
                markLoaded('settings/quickActions');
            },
            (err) => handleSnapshotError(err, 'settings/quickActions')
        );

        return () => {
            console.log(`[MetadataStore] Unsubscribing from ${pathRoot}`);
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
