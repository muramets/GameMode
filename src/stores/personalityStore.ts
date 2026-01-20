import { create } from 'zustand';
import { db } from '../config/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    query,
    orderBy,
    onSnapshot,
} from 'firebase/firestore';
import type { Personality } from '../types/personality';
import { GROUP_CONFIG, DEFAULT_GROUPS_ORDER } from '../constants/common';
import { writeBatch } from 'firebase/firestore';

export type ActiveContext =
    | { type: 'personality'; uid: string; pid: string }
    | { type: 'role'; teamId: string; roleId: string }
    | { type: 'viewer'; targetUid: string; personalityId: string; teamId: string; roleId: string; displayName: string };

interface PersonalityState {
    personalities: Personality[];
    activePersonalityId: string | null; // Kept for legacy compatibility - ID of the active ITEM (pid or roleId)
    activeContext: ActiveContext | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    subscribeToPersonalities: (uid: string) => () => void;
    loadPersonalities: (uid: string) => Promise<void>;
    addPersonality: (uid: string, name: string, data?: Partial<Personality>) => Promise<string>;
    updatePersonality: (uid: string, personalityId: string, data: Partial<Personality>) => Promise<void>;
    switchPersonality: (uid: string, personalityId: string) => Promise<void>;
    switchToRole: (teamId: string, roleId: string) => void;
    deletePersonality: (uid: string, personalityId: string) => Promise<void>;

    // Viewer Mode (for admin viewing participant progress)
    switchToViewer: (targetUid: string, personalityId: string, teamId: string, roleId: string, displayName: string) => void;
    exitViewerMode: () => void;
    isViewerMode: () => boolean;

    // Migration helper
    ensureDefaultPersonality: (uid: string, forceReset?: boolean) => Promise<string>; // Returns ID of active personality
    reset: () => void;
}

export const usePersonalityStore = create<PersonalityState>((set, get) => ({
    personalities: [],
    activePersonalityId: localStorage.getItem('active_personality_id'),
    activeContext: (() => {
        const stored = localStorage.getItem('active_context');
        if (stored) {
            try {
                return JSON.parse(stored) as ActiveContext;
            } catch {
                return null;
            }
        }
        // Migration fallback for old localStorage format
        const oldPid = localStorage.getItem('active_personality_id');
        if (oldPid) {
            // Note: uid will be fixed on next switchPersonality call
            return { type: 'personality' as const, uid: '', pid: oldPid };
        }
        return null;
    })(),
    isLoading: true,
    error: null,

    loadPersonalities: async (uid) => {
        try {
            console.debug("Loading personalities started", { uid });
            set({ isLoading: true });
            const colRef = collection(db, 'users', uid, 'personalities');
            const q = query(colRef, orderBy('lastActiveAt', 'desc'));
            const snap = await getDocs(q);

            const personalities = snap.docs.map(d => ({ ...d.data(), id: d.id } as Personality));
            set({ personalities, isLoading: false });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message, isLoading: false });
        }
    },

    subscribeToPersonalities: (uid) => {
        console.debug("Subscribing to personalities", { uid });
        set({ isLoading: true });
        const colRef = collection(db, 'users', uid, 'personalities');
        const q = query(colRef, orderBy('lastActiveAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snap) => {
            const personalities = snap.docs.map(d => ({ ...d.data(), id: d.id } as Personality));

            // If the currently active personality was deleted, handle it
            const currentActiveId = get().activePersonalityId;
            const currentContext = get().activeContext;

            // Only switch if we are in a personality context and that personality is gone
            if (
                currentContext?.type === 'personality' &&
                currentActiveId &&
                personalities.length > 0 &&
                !personalities.some(p => p.id === currentActiveId)
            ) {
                // Switch to the first available one
                console.warn("Active personality removed remotely, switching to fallback", personalities[0].id);
                get().switchPersonality(uid, personalities[0].id);
            }

            set({ personalities, isLoading: false });
        }, (err) => {
            console.error("Personalities subscription error", err);
            set({ error: err.message, isLoading: false });
        });

        return unsubscribe;
    },

    updatePersonality: async (uid, personalityId, data) => {
        try {
            console.log("Updating personality", { uid, personalityId, changes: Object.keys(data) });
            const docRef = doc(db, 'users', uid, 'personalities', personalityId);
            await updateDoc(docRef, data);

            set(state => ({
                personalities: state.personalities.map(p =>
                    p.id === personalityId ? { ...p, ...data } : p
                )
            }));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    addPersonality: async (uid, name, extraData) => {
        try {
            const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
            const newPersonality: Personality = {
                id,
                name,
                createdAt: Date.now(),
                lastActiveAt: Date.now(),
                ...extraData
            };

            const batch = writeBatch(db);

            // 1. Create Personality Doc
            const personalityRef = doc(db, 'users', uid, 'personalities', id);
            batch.set(personalityRef, newPersonality);

            // 2. Seed Default Groups
            DEFAULT_GROUPS_ORDER.forEach(groupName => {
                const config = GROUP_CONFIG[groupName];
                if (config) {
                    const groupRef = doc(db, 'users', uid, 'personalities', id, 'groups', groupName);
                    batch.set(groupRef, config);
                }
            });

            // 3. Seed Group Order Settings
            const groupSettingsRef = doc(db, 'users', uid, 'personalities', id, 'settings', 'groups');
            batch.set(groupSettingsRef, { order: DEFAULT_GROUPS_ORDER });

            await batch.commit();

            console.log("Created new personality with default groups", { uid, name, id });

            set(state => ({
                personalities: [newPersonality, ...state.personalities]
            }));

            return id;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
            throw err;
        }
    },

    switchPersonality: async (uid, personalityId) => {
        try {
            // Update lastActiveAt in Firestore
            await updateDoc(doc(db, 'users', uid, 'personalities', personalityId), {
                lastActiveAt: Date.now()
            });

            const context: ActiveContext = { type: 'personality', uid, pid: personalityId };
            console.log("Switching context to Personality", { uid, pid: personalityId });
            localStorage.setItem('active_personality_id', personalityId);
            localStorage.setItem('active_context', JSON.stringify(context));

            set({
                activePersonalityId: personalityId,
                activeContext: context
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    switchToRole: (teamId, roleId) => {
        console.log("Switching context to Role", { teamId, roleId });
        const context: ActiveContext = { type: 'role', teamId, roleId };
        localStorage.setItem('active_personality_id', roleId); // Reuse this for simple ID tracking
        localStorage.setItem('active_context', JSON.stringify(context));
        set({
            activePersonalityId: roleId,
            activeContext: context
        });
    },

    // ========================================================================
    // VIEWER MODE (admin viewing participant progress)
    // ========================================================================

    switchToViewer: (targetUid, personalityId, teamId, roleId, displayName) => {
        // Store the previous context for returning later
        const currentContext = get().activeContext;
        if (currentContext && currentContext.type !== 'viewer') {
            localStorage.setItem('pre_viewer_context', JSON.stringify(currentContext));
        }

        const context: ActiveContext = {
            type: 'viewer',
            targetUid,
            personalityId,
            teamId,
            roleId,
            displayName
        };
        localStorage.setItem('active_context', JSON.stringify(context));
        set({
            activePersonalityId: personalityId,
            activeContext: context
        });
    },

    exitViewerMode: () => {
        // Restore previous context
        const preViewerContext = localStorage.getItem('pre_viewer_context');
        if (preViewerContext) {
            const context = JSON.parse(preViewerContext) as ActiveContext;
            localStorage.setItem('active_context', JSON.stringify(context));
            localStorage.removeItem('pre_viewer_context');
            set({
                activePersonalityId: context.type === 'personality' ? context.pid :
                    context.type === 'role' ? context.roleId : null,
                activeContext: context
            });
        } else {
            // Fallback: just clear viewer mode
            set({ activeContext: null, activePersonalityId: null });
        }
    },

    isViewerMode: () => {
        return get().activeContext?.type === 'viewer';
    },

    deletePersonality: async (uid, id) => {
        try {
            console.log("Deleting personality", { uid, id });
            await deleteDoc(doc(db, 'users', uid, 'personalities', id));
            set(state => ({
                personalities: state.personalities.filter(p => p.id !== id),
                activePersonalityId: state.activePersonalityId === id ? null : state.activePersonalityId
            }));

            if (get().activePersonalityId === null && get().personalities.length > 0) {
                const first = get().personalities[0];
                get().switchPersonality(uid, first.id);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            set({ error: message });
        }
    },

    reset: () => {
        set({
            personalities: [],
            activePersonalityId: null,
            activeContext: null,
            error: null,
            isLoading: false
        });
    },

    ensureDefaultPersonality: async (uid, forceReset = false) => {
        console.debug("Ensuring default personality", { uid, forceReset });
        const { switchPersonality } = get();

        // Always load fresh data to ensure we aren't working with stale state
        // This is critical for the "delete DB -> relogin" flow
        await get().loadPersonalities(uid);

        // Check activeContext AFTER ensuring data is loaded
        const { activeContext: recheckedContext } = get();
        // If we are in a Role/Viewer and NOT forcing a reset, stay there.
        if (!forceReset && recheckedContext && (recheckedContext.type === 'role' || recheckedContext.type === 'viewer')) {
            return recheckedContext.type === 'role' ? recheckedContext.roleId : recheckedContext.personalityId;
        }

        // Re-check after load
        const currentList = get().personalities;
        if (currentList.length === 0) {
            // Check for teamMemberships one last time as safety
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.teamMemberships && Object.keys(data.teamMemberships).length > 0) {
                    // Start fresh load to catch the new personality
                    await get().loadPersonalities(uid);
                    const freshList = get().personalities;
                    if (freshList.length > 0) {
                        await switchPersonality(uid, freshList[0].id);
                        return freshList[0].id;
                    }
                }
            }

            // Create default
            const defaultId = 'main-personality';
            const batch = writeBatch(db);

            // 1. Create Personality Doc
            const personalityRef = doc(db, 'users', uid, 'personalities', defaultId);
            batch.set(personalityRef, {
                id: defaultId,
                name: 'Main',
                description: 'My primary self',
                iconColor: '#e2b714', // Serika gold/yellow
                createdAt: Date.now(),
                lastActiveAt: Date.now()
            });

            // 2. Seed Default Groups
            DEFAULT_GROUPS_ORDER.forEach(groupName => {
                const config = GROUP_CONFIG[groupName];
                if (config) {
                    const groupRef = doc(db, 'users', uid, 'personalities', defaultId, 'groups', groupName);
                    batch.set(groupRef, config);
                }
            });

            // 3. Seed Group Order Settings
            const groupSettingsRef = doc(db, 'users', uid, 'personalities', defaultId, 'settings', 'groups');
            batch.set(groupSettingsRef, { order: DEFAULT_GROUPS_ORDER });

            await batch.commit();

            // reload to get the new state
            await get().loadPersonalities(uid);
            await switchPersonality(uid, defaultId);
            return defaultId;
        }


        // If we have personalities but no active ID selected (fresh login on new device)
        const storedId = localStorage.getItem('active_personality_id');
        if (storedId && currentList.some(p => p.id === storedId)) {
            // Use switchPersonality to ensure activeContext is fully hydrated with UID
            await switchPersonality(uid, storedId);
            return storedId;
        } else {
            // Default to most recently active (first in list due to sort)
            const mostRecent = currentList[0];
            await switchPersonality(uid, mostRecent.id);
            return mostRecent.id;
        }
    },
}));
