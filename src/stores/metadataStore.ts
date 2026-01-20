import { create } from 'zustand';
import { db } from '../config/firebase';
import {
    collection,
    onSnapshot,
    doc,
} from 'firebase/firestore';
import type { Protocol } from '../features/protocols/types';
import type { Innerface } from '../features/innerfaces/types';
import type { StateData } from '../features/dashboard/types';

import { createInnerfaceSlice } from './metadata/innerfaceSlice';
import { createProtocolSlice } from './metadata/protocolSlice';
import { createStateSlice } from './metadata/stateSlice';
import { createGroupSlice } from './metadata/groupSlice';
import type { MetadataState, PathContext } from './metadata/types';

const getPathRoot = (context: PathContext | null) => {
    if (!context) throw new Error('No active context for metadata operation');
    if (context.type === 'personality') {
        return `users/${context.uid}/personalities/${context.pid}`;
    }
    if (context.type === 'viewer') {
        return `users/${context.targetUid}/personalities/${context.personalityId}`;
    }
    return `teams/${context.teamId}/roles/${context.roleId}`;
};

export const useMetadataStore = create<MetadataState>((set, get) => ({
    // --- Initial State ---
    innerfaces: [],
    protocols: [],
    states: [],
    pinnedProtocolIds: [],
    groupsMetadata: {},
    groupOrder: [],
    innerfaceGroupOrder: [],
    categoryOrder: [],
    isLoading: true,
    loadedCount: 0,
    error: null,
    hasPendingWrites: false, // Initial state
    setHasPendingWrites: (hasPending) => set({ hasPendingWrites: hasPending }),
    context: null,
    setContext: (context) => set({ context }),

    // --- Compose Slices ---
    ...createInnerfaceSlice(set, get),
    ...createProtocolSlice(set, get),
    ...createStateSlice(set, get),
    ...createGroupSlice(set, get),

    // --- Shared Subscription Logic ---
    subscribeToMetadata: (context: PathContext) => {
        const pathRoot = getPathRoot(context);

        set({
            innerfaces: [],
            protocols: [],
            states: [],
            groupsMetadata: {},
            groupOrder: [],
            innerfaceGroupOrder: [],
            categoryOrder: [],
            pinnedProtocolIds: [],
            isLoading: true,
            loadedCount: 0
        });

        let loadedSections = 0;
        const markLoaded = () => {
            loadedSections++;
            set(state => ({ loadedCount: state.loadedCount + 1 }));
            if (loadedSections >= 8) {
                set({ isLoading: false });
            }
        };

        const handleSnapshotError = (err: Error, source: string) => {
            console.error(`[MetadataStore] Error loading ${source}:`, err);
            set({ error: err.message });
            markLoaded();
        };

        const unsubIfaces = onSnapshot(
            collection(db, `${pathRoot}/innerfaces`),
            (snap) => {
                if (get().hasPendingWrites) {
                    console.debug('[MetadataStore] Skipping innerfaces snapshot due to pending writes');
                    return;
                }
                const innerfaces = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Innerface));
                innerfaces.sort((a, b) => (a.order || 0) - (b.order || 0));
                set({ innerfaces });
                markLoaded();
            },
            (err) => handleSnapshotError(err, 'innerfaces')
        );

        const unsubProtocols = onSnapshot(
            collection(db, `${pathRoot}/protocols`),
            (snap) => {
                if (get().hasPendingWrites) {
                    console.debug('[MetadataStore] Skipping protocols snapshot due to pending writes');
                    return;
                }
                const protocols = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Protocol));
                set({ protocols });
                markLoaded();
            },
            (err) => handleSnapshotError(err, 'protocols')
        );

        const unsubStates = onSnapshot(
            collection(db, `${pathRoot}/states`),
            (snap) => {
                if (get().hasPendingWrites) {
                    console.debug('[MetadataStore] Skipping states snapshot due to pending writes');
                    return;
                }
                const states = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StateData));
                states.sort((a, b) => {
                    const orderA = a.order ?? 9999;
                    const orderB = b.order ?? 9999;
                    return orderA - orderB;
                });
                set({ states });
                markLoaded();
            },
            (err) => handleSnapshotError(err, 'states')
        );

        const unsubGroups = onSnapshot(
            collection(db, `${pathRoot}/groups`),
            (snap) => {
                if (get().hasPendingWrites) {
                    console.debug('[MetadataStore] Skipping groups snapshot due to pending writes');
                    return;
                }
                const groupsMetadata: Record<string, { icon: string; color?: string }> = {};
                snap.docs.forEach(doc => {
                    groupsMetadata[doc.id] = doc.data() as { icon: string; color?: string };
                });
                set({ groupsMetadata });
                markLoaded();
            },
            (err) => handleSnapshotError(err, 'groups')
        );

        const unsubGroupSettings = onSnapshot(
            doc(db, `${pathRoot}/settings/groups`),
            (snap) => {
                if (get().hasPendingWrites) {
                    console.debug('[MetadataStore] Skipping group settings snapshot due to pending writes');
                    return;
                }
                if (snap.exists()) {
                    const data = snap.data();
                    set({ groupOrder: data.order || [] });
                } else {
                    set({ groupOrder: [] });
                }
                markLoaded();
            },
            (err) => handleSnapshotError(err, 'settings/groups')
        );

        const unsubAppSettings = onSnapshot(
            doc(db, `${pathRoot}/settings/app`),
            (snap) => {
                if (get().hasPendingWrites) {
                    console.debug('[MetadataStore] Skipping app settings snapshot due to pending writes');
                    return;
                }
                if (snap.exists()) {
                    const data = snap.data();
                    set({
                        innerfaceGroupOrder: data.innerfaceGroupOrder || [],
                        categoryOrder: data.categoryOrder || [],
                        pinnedProtocolIds: data.pinnedProtocolIds || []
                    });
                } else {
                    set({
                        innerfaceGroupOrder: [],
                        categoryOrder: [],
                        pinnedProtocolIds: []
                    });
                }
                markLoaded();
                markLoaded();
                markLoaded();
            },
            (err) => handleSnapshotError(err, 'settings/app')
        );

        return () => {
            unsubIfaces();
            unsubProtocols();
            unsubStates();
            unsubGroups();
            unsubGroupSettings();
            unsubAppSettings();
        };
    }
}));
