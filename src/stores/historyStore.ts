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
                serverTimestamp: Timestamp.now() // For sorting even if local clock is off
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
