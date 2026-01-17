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
 * - Scoped by PERSONALITY ({uid}/personalities/{pid}/history).
 */
interface HistoryState {
    history: HistoryRecord[];
    isLoading: boolean;
    error: string | null;

    // Actions
    addCheckin: (uid: string, pid: string, record: Omit<HistoryRecord, 'id'>) => Promise<void>;
    addSystemEvent: (uid: string, pid: string, message: string, details?: Record<string, unknown>) => Promise<void>;
    deleteCheckin: (uid: string, pid: string, id: string) => Promise<void>;
    subscribeToHistory: (uid: string, pid: string) => () => void;
    clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
    history: [],
    isLoading: true,
    error: null,

    clearHistory: () => set({ history: [], isLoading: false, error: null }),

    addCheckin: async (uid, pid, record) => {
        try {
            const historyRef = collection(db, 'users', uid, 'personalities', pid, 'history');
            await addDoc(historyRef, {
                ...record,
                // Server timestamp is crucial for correct ordering across devices with different system clocks
                serverTimestamp: Timestamp.now()
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Error adding checkin:', err);
            set({ error: message });
        }
    },

    addSystemEvent: async (uid, pid, message, details = {}) => {
        try {
            const historyRef = collection(db, 'users', uid, 'personalities', pid, 'history');
            await addDoc(historyRef, {
                type: 'system',
                protocolId: 'SYSTEM',
                protocolName: message,
                protocolIcon: 'gear',
                timestamp: new Date().toISOString(),
                action: '0',
                weight: 0,
                targets: [],
                changes: {},
                details, // New field for metadata
                serverTimestamp: Timestamp.now()
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Error adding system event:', err);
            set({ error: message });
        }
    },

    deleteCheckin: async (uid, pid, id) => {
        try {
            const docRef = doc(db, 'users', uid, 'personalities', pid, 'history', id);
            await deleteDoc(docRef);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Error deleting checkin:', err);
            set({ error: message });
        }
    },

    subscribeToHistory: (uid, pid) => {
        set({ isLoading: true });
        const historyRef = collection(db, 'users', uid, 'personalities', pid, 'history');
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
