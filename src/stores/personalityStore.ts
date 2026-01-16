import { create } from 'zustand';
import { db } from '../config/firebase';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    query,
    orderBy,
    writeBatch
} from 'firebase/firestore';
import type { Personality } from '../types/personality';

export type ActiveContext =
    | { type: 'personality'; uid: string; pid: string }
    | { type: 'role'; teamId: string; roleId: string };

interface PersonalityState {
    personalities: Personality[];
    activePersonalityId: string | null; // Kept for legacy compatibility - ID of the active ITEM (pid or roleId)
    activeContext: ActiveContext | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    loadPersonalities: (uid: string) => Promise<void>;
    addPersonality: (uid: string, name: string, data?: Partial<Personality>) => Promise<string>;
    updatePersonality: (uid: string, personalityId: string, data: Partial<Personality>) => Promise<void>;
    switchPersonality: (uid: string, personalityId: string) => Promise<void>;
    switchToRole: (teamId: string, roleId: string) => void;
    deletePersonality: (uid: string, personalityId: string) => Promise<void>;

    // Migration helper
    ensureDefaultPersonality: (uid: string) => Promise<string>; // Returns ID of active personality
}

export const usePersonalityStore = create<PersonalityState>((set, get) => ({
    personalities: [],
    activePersonalityId: localStorage.getItem('active_personality_id'),
    activeContext: localStorage.getItem('active_context')
        ? JSON.parse(localStorage.getItem('active_context')!)
        : (localStorage.getItem('active_personality_id') ? { // Fallback for migration
            type: 'personality',
            pid: localStorage.getItem('active_personality_id')!,
            // We don't have UID here easily without auth context passed or stored. 
            // We'll rely on switchPersonality to fix this if it's broken.
            uid: ''
        } as any : null),
    isLoading: true,
    error: null,

    loadPersonalities: async (uid) => {
        try {
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

    updatePersonality: async (uid, personalityId, data) => {
        try {
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

            await setDoc(doc(db, 'users', uid, 'personalities', id), newPersonality);

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
        const context: ActiveContext = { type: 'role', teamId, roleId };
        localStorage.setItem('active_personality_id', roleId); // Reuse this for simple ID tracking
        localStorage.setItem('active_context', JSON.stringify(context));
        set({
            activePersonalityId: roleId,
            activeContext: context
        });
    },

    deletePersonality: async (uid, id) => {
        try {
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

    ensureDefaultPersonality: async (uid) => {
        const { personalities, loadPersonalities, switchPersonality } = get();

        // If not loaded yet, try loading
        if (personalities.length === 0) {
            await loadPersonalities(uid);
        }

        // Re-check after load
        const currentList = get().personalities;
        if (currentList.length === 0) {
            // Create default
            console.log('Creating Default Personality and migrating data...');
            const defaultId = 'main-personality';

            // We do existing data migration here implicitly or explicitly?
            // The plan said: "If no personalities exist, create a 'Default' one and trigger data migration"
            // For safety, let's create the document first.

            await setDoc(doc(db, 'users', uid, 'personalities', defaultId), {
                id: defaultId,
                name: 'Main',
                description: 'My primary self',
                themeColor: '#e2b714', // Serika gold/yellow
                createdAt: Date.now(),
                lastActiveAt: Date.now()
            });

            // MIGRATION LOGIC: Move root collections to sub-collections
            // existing: users/uid/innerfaces -> users/uid/personalities/defaultId/innerfaces
            const batch = writeBatch(db);
            const collectionsToMove = ['innerfaces', 'protocols', 'states', 'history'];

            for (const colName of collectionsToMove) {
                const oldColRef = collection(db, 'users', uid, colName);
                const oldSnap = await getDocs(oldColRef);

                for (const oldDoc of oldSnap.docs) {
                    const newDocRef = doc(db, 'users', uid, 'personalities', defaultId, colName, oldDoc.id);
                    batch.set(newDocRef, oldDoc.data());
                    batch.delete(doc(db, 'users', uid, colName, oldDoc.id));
                }
            }

            // Groups is a special case, it might be in 'groups' collection
            const oldGroupsRef = collection(db, 'users', uid, 'groups');
            const oldGroupsSnap = await getDocs(oldGroupsRef);
            for (const gDoc of oldGroupsSnap.docs) {
                const newGDocRef = doc(db, 'users', uid, 'personalities', defaultId, 'groups', gDoc.id);
                batch.set(newGDocRef, gDoc.data());
                batch.delete(doc(db, 'users', uid, 'groups', gDoc.id));
            }

            // Quick Actions settings
            const qaRef = doc(db, 'users', uid, 'settings', 'quickActions');
            const qaSnap = await getDoc(qaRef);
            if (qaSnap.exists()) {
                const newQaRef = doc(db, 'users', uid, 'personalities', defaultId, 'settings', 'quickActions');
                batch.set(newQaRef, qaSnap.data());
                batch.delete(qaRef);
            }

            await batch.commit();

            // Reload to get the new state
            await loadPersonalities(uid);
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
    }
}));
