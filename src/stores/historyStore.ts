import { create } from 'zustand';
import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    query,
    onSnapshot,
    deleteDoc,
    doc,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import type { HistoryRecord } from '../types/history';

/**
 * History Store
 * 
 * Manages the immutable log of user actions ("Check-ins").
 * 
 * Logic:
 * - Each action (using a Protocol, completing a Quick Action) creates a record.
 * - Records are appended-only (log).
 * - Queries are ordered by timestamp (newest first).
 * - Real-time sync ensures that if a user checks in on mobile, the web dashboard updates instantly.
 */
interface HistoryState {
    history: HistoryRecord[];
    isLoading: boolean;
    error: string | null;

    // Actions
    addCheckin: (uid: string, record: Omit<HistoryRecord, 'id'>) => Promise<void>;
    deleteCheckin: (uid: string, id: string) => Promise<void>;
    subscribeToHistory: (uid: string) => () => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
    history: [],
    isLoading: true,
    error: null,

    addCheckin: async (uid, record) => {
        try {
            const historyRef = collection(db, 'users', uid, 'history');
            await addDoc(historyRef, {
                ...record,
                // Server timestamp is crucial for correct ordering across devices with different system clocks
                serverTimestamp: Timestamp.now()
            });
        } catch (err: any) {
            console.error('Error adding checkin:', err);
            set({ error: err.message });
        }
    },

    deleteCheckin: async (uid, id) => {
        try {
            const docRef = doc(db, 'users', uid, 'history', id);
            await deleteDoc(docRef);
        } catch (err: any) {
            console.error('Error deleting checkin:', err);
            set({ error: err.message });
        }
    },

    subscribeToHistory: (uid) => {
        set({ isLoading: true });
        const historyRef = collection(db, 'users', uid, 'history');
        const q = query(historyRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const records: HistoryRecord[] = [];
            snapshot.forEach((doc) => {
                records.push({ id: doc.id, ...doc.data() } as HistoryRecord);
            });
            set({ history: records, isLoading: false });
        }, (err) => {
            console.error('Firestore subscription error:', err);
            set({ error: err.message, isLoading: false });
        });

        return unsubscribe;
    }
}));
