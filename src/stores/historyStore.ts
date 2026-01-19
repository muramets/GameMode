import { create } from 'zustand';
import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    query,
    onSnapshot,
    doc,
    orderBy,
    Timestamp,
    runTransaction,
    where
} from 'firebase/firestore';
import { format } from 'date-fns';
import type { HistoryRecord } from '../types/history';
import type { Personality } from '../types/personality';

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
            console.log("Adding check-in", { uid, pid, protocol: record.protocolName });
            await runTransaction(db, async (transaction) => {
                // 1. Create History Reference
                const historyRef = doc(collection(db, 'users', uid, 'personalities', pid, 'history'));

                // 2. Write History Record
                transaction.set(historyRef, {
                    ...record,
                    serverTimestamp: Timestamp.now()
                });

                console.debug("Transaction: Record created", { protocol: record.protocolName });

                // 3. Update Innerface Scores using 'changes' map
                if (record.changes) {
                    for (const [innerfaceId, weight] of Object.entries(record.changes)) {
                        const innerfaceRef = doc(db, 'users', uid, 'personalities', pid, 'innerfaces', innerfaceId);
                        const innerfaceDoc = await transaction.get(innerfaceRef);

                        if (innerfaceDoc.exists()) {
                            const currentScore = innerfaceDoc.data().currentScore || innerfaceDoc.data().initialScore || 0;
                            const newScore = Math.max(0, currentScore + Number(weight));
                            transaction.update(innerfaceRef, { currentScore: newScore });
                        }
                    }
                }

                // 4. Update Personality Stats (Efficient Counting)
                const personalityRef = doc(db, 'users', uid, 'personalities', pid);
                const personalityDoc = await transaction.get(personalityRef);

                if (personalityDoc.exists()) {
                    const pData = personalityDoc.data() as Personality;
                    const todayStr = format(new Date(), 'yyyy-MM-dd');
                    const monthStr = format(new Date(), 'yyyy-MM');

                    // Initialize or Get existing stats
                    const stats = pData.stats || {
                        totalCheckins: 0,
                        totalXp: 0,
                        lastDailyUpdate: todayStr,
                        dailyCheckins: 0,
                        dailyXp: 0,
                        lastMonthlyUpdate: monthStr,
                        monthlyCheckins: 0,
                        monthlyXp: 0
                    };

                    // Calculate XP
                    // Use XP if available, else derive from weight * 100 as fallback (consistent with UserProfile logic)
                    const recordXp = record.xp ?? Math.round((record.weight || 0) * 100);

                    // Daily Reset Logic
                    if (stats.lastDailyUpdate !== todayStr) {
                        stats.dailyCheckins = 0;
                        stats.dailyXp = 0;
                        stats.lastDailyUpdate = todayStr;
                    }

                    // Monthly Reset Logic
                    if (stats.lastMonthlyUpdate !== monthStr) {
                        stats.monthlyCheckins = 0;
                        stats.monthlyXp = 0;
                        stats.lastMonthlyUpdate = monthStr;
                    }

                    // Increment
                    stats.totalCheckins += 1;
                    stats.totalXp += recordXp;
                    stats.dailyCheckins += 1;
                    stats.dailyXp += recordXp;
                    stats.monthlyCheckins += 1;
                    stats.monthlyXp += recordXp;

                    transaction.update(personalityRef, { stats });
                }
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Error adding checkin (Transaction):', err);
            set({ error: message });
        }
    },

    addSystemEvent: async (uid, pid, message, details = {}) => {
        try {
            console.log("Adding system event", { uid, pid, message });
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
            console.log("Deleting check-in", { uid, pid, id });
            await runTransaction(db, async (transaction) => {
                const historyRef = doc(db, 'users', uid, 'personalities', pid, 'history', id);
                const historyDoc = await transaction.get(historyRef);

                if (!historyDoc.exists()) {
                    throw new Error("Document does not exist!");
                }

                const record = historyDoc.data() as HistoryRecord;

                // 1. Revert Innerface Scores
                if (record.changes) {
                    for (const [innerfaceId, weight] of Object.entries(record.changes)) {
                        const innerfaceRef = doc(db, 'users', uid, 'personalities', pid, 'innerfaces', innerfaceId);
                        const innerfaceDoc = await transaction.get(innerfaceRef);

                        if (innerfaceDoc.exists()) {
                            const currentScore = innerfaceDoc.data().currentScore || innerfaceDoc.data().initialScore || 0;
                            // Subtract the weight to revert
                            const newScore = Math.max(0, currentScore - Number(weight));

                            transaction.update(innerfaceRef, {
                                currentScore: newScore
                            });
                        }
                    }
                }

                // 2. Update Personality Stats (Efficient Revert)
                const personalityRef = doc(db, 'users', uid, 'personalities', pid);
                const personalityDoc = await transaction.get(personalityRef);

                if (personalityDoc.exists()) {
                    const pData = personalityDoc.data() as Personality;
                    if (pData.stats) {
                        const stats = { ...pData.stats };
                        const recordDate = new Date(record.timestamp);
                        const recordDateStr = format(recordDate, 'yyyy-MM-dd');
                        const recordMonthStr = format(recordDate, 'yyyy-MM');
                        const recordXp = record.xp ?? Math.round((record.weight || 0) * 100);

                        stats.totalCheckins = Math.max(0, stats.totalCheckins - 1);
                        stats.totalXp = Math.max(0, stats.totalXp - recordXp);

                        // Only decrement daily/monthly if the deleted event belongs to the current active period
                        if (stats.lastDailyUpdate === recordDateStr) {
                            stats.dailyCheckins = Math.max(0, stats.dailyCheckins - 1);
                            stats.dailyXp = Math.max(0, stats.dailyXp - recordXp);
                        }

                        if (stats.lastMonthlyUpdate === recordMonthStr) {
                            stats.monthlyCheckins = Math.max(0, stats.monthlyCheckins - 1);
                            stats.monthlyXp = Math.max(0, stats.monthlyXp - recordXp);
                        }

                        transaction.update(personalityRef, { stats });
                    }
                }

                // 3. Delete History Record
                transaction.delete(historyRef);
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Error deleting checkin (Transaction):', err);
            set({ error: message });
        }
    },

    subscribeToHistory: (uid, pid) => {
        set({ isLoading: true });
        const historyRef = collection(db, 'users', uid, 'personalities', pid, 'history');

        // Optimization: Fetch only THIS WEEK's history for the Dashboard widgets (Weekly Focus).
        // This is much more efficient than "Last 100" if activity is low, and matches the UI need.
        // UserProfile now uses atomic counters on the Personality doc, so it doesn't need this full history.
        const startOfCurrentWeek = new Date();
        startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() - 7); // Rough "last 7 days" or "start of week"
        startOfCurrentWeek.setHours(0, 0, 0, 0);

        const q = query(
            historyRef,
            where('timestamp', '>=', startOfCurrentWeek.toISOString()),
            orderBy('timestamp', 'desc')
        );

        console.debug("Subscribing to history (last 7 days)", { uid, pid });

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.debug("History snapshot received", { count: snapshot.size, source: snapshot.metadata.fromCache ? 'cache' : 'server' });
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
