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
    where,
    DocumentReference,
    increment
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
    addCheckin: (uid: string, pid: string, record: Omit<HistoryRecord, 'id'>, applyToScore?: boolean) => Promise<void>;
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

    addCheckin: async (uid, pid, record, applyToScore = true) => {
        try {
            console.log("Adding check-in", { uid, pid, protocol: record.protocolName, applyToScore });
            await runTransaction(db, async (transaction) => {
                // 1. Prepare Reads (Refs & Data)
                const historyRef = doc(collection(db, 'users', uid, 'personalities', pid, 'history'));
                const personalityRef = doc(db, 'users', uid, 'personalities', pid);

                // READ: Personality
                // We only need personality doc if updating stats
                let personalityDoc;
                if (applyToScore) {
                    personalityDoc = await transaction.get(personalityRef);
                }

                // READ: Innerfaces
                // We must read the doc to correctly initialize currentScore from initialScore if it's missing.
                // Blind atomic increments caused a bug where the first check-in would start from 0, ignoring the base level.
                const innerfaceUpdates: { ref: DocumentReference, newScore: number }[] = [];
                if (record.changes) {
                    for (const [innerfaceId, weight] of Object.entries(record.changes)) {
                        const innerfaceRef = doc(db, 'users', uid, 'personalities', pid, 'innerfaces', innerfaceId);
                        const innerfaceDoc = await transaction.get(innerfaceRef);

                        if (innerfaceDoc.exists()) {
                            const data = innerfaceDoc.data();
                            // Calculate new total: (Current OR Initial OR 0) + Weight
                            // Use || to treat 0 as "fallback to initial", matching UI component behavior
                            // This ensures that if a score was accidentally reset to 0, it recovers to initialScore.
                            const currentTotal = data.currentScore || data.initialScore || 0;
                            const newScore = Math.max(0, Number((currentTotal + Number(weight)).toFixed(4)));

                            innerfaceUpdates.push({ ref: innerfaceRef, newScore });
                        }
                    }
                }

                // 2. Writes (Must happen AFTER all reads)

                // WRITE: History Record
                transaction.set(historyRef, {
                    ...record,
                    serverTimestamp: Timestamp.now()
                });

                console.debug("Transaction: Record created", { protocol: record.protocolName });

                if (applyToScore) {
                    // WRITE: Innerface Updates
                    for (const update of innerfaceUpdates) {
                        transaction.update(update.ref, {
                            currentScore: update.newScore
                        });
                    }

                    // WRITE: Personality Stats
                    if (personalityDoc && personalityDoc.exists()) {
                        const pData = personalityDoc.data() as Personality;
                        const todayStr = format(new Date(), 'yyyy-MM-dd');
                        const monthStr = format(new Date(), 'yyyy-MM');

                        // Initialize defaults for safety
                        const defaults = {
                            totalCheckins: 0,
                            totalXp: 0,
                            lastDailyUpdate: todayStr,
                            dailyCheckins: 0,
                            dailyXp: 0,
                            lastMonthlyUpdate: monthStr,
                            monthlyCheckins: 0,
                            monthlyXp: 0
                        };
                        const currentStats = { ...defaults, ...(pData.stats || {}) };
                        const recordXp = Math.round((record.weight || 0) * 100);

                        if (!pData.stats) {
                            // If stats are missing, we MUST write the full object to create the map
                            // We cannot use dot notation or increment on non-existent parent fields safely in all cases
                            const initialStats = {
                                ...defaults,
                                totalCheckins: 1,
                                totalXp: recordXp,
                                dailyCheckins: 1,
                                dailyXp: recordXp,
                                monthlyCheckins: 1,
                                monthlyXp: recordXp
                            };
                            transaction.update(personalityRef, { stats: initialStats });
                        } else {
                            // Stats exist: Use Atomic Increments for thread safety
                            // This allows rapid clicking without lost updates
                            const statsUpdate: Record<string, unknown> = {
                                'stats.totalCheckins': increment(1),
                                'stats.totalXp': increment(recordXp)
                            };

                            // Daily Logic
                            if (currentStats.lastDailyUpdate === todayStr) {
                                statsUpdate['stats.dailyCheckins'] = increment(1);
                                statsUpdate['stats.dailyXp'] = increment(recordXp);
                            } else {
                                statsUpdate['stats.lastDailyUpdate'] = todayStr;
                                statsUpdate['stats.dailyCheckins'] = 1;
                                statsUpdate['stats.dailyXp'] = recordXp;
                            }

                            // Monthly Logic
                            if (currentStats.lastMonthlyUpdate === monthStr) {
                                statsUpdate['stats.monthlyCheckins'] = increment(1);
                                statsUpdate['stats.monthlyXp'] = increment(recordXp);
                            } else {
                                statsUpdate['stats.lastMonthlyUpdate'] = monthStr;
                                statsUpdate['stats.monthlyCheckins'] = 1;
                                statsUpdate['stats.monthlyXp'] = recordXp;
                            }

                            transaction.update(personalityRef, statsUpdate);
                        }
                    }
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
                // 1. ALL READS FIRST
                const historyRef = doc(db, 'users', uid, 'personalities', pid, 'history', id);
                const historyDoc = await transaction.get(historyRef);

                if (!historyDoc.exists()) {
                    throw new Error("Document does not exist!");
                }

                const record = historyDoc.data() as HistoryRecord;

                // Read Innerfaces to revert
                const innerfaceReads: { ref: DocumentReference, currentScore: number }[] = [];
                if (record.changes) {
                    for (const innerfaceId of Object.keys(record.changes)) {
                        const innerfaceRef = doc(db, 'users', uid, 'personalities', pid, 'innerfaces', innerfaceId);
                        const innerfaceDoc = await transaction.get(innerfaceRef);
                        if (innerfaceDoc.exists()) {
                            const data = innerfaceDoc.data();
                            innerfaceReads.push({
                                ref: innerfaceRef,
                                currentScore: data.currentScore ?? data.initialScore ?? 0
                            });
                        }
                    }
                }

                // Read Personality for Stats
                const personalityRef = doc(db, 'users', uid, 'personalities', pid);
                const personalityDoc = await transaction.get(personalityRef);

                // 2. ALL WRITES AFTER

                // Revert Innerface Scores
                if (record.changes) {
                    // Optimization: Map for O(1) lookup
                    const scoreMap = new Map<string, number>();
                    innerfaceReads.forEach(r => scoreMap.set(r.ref.id, r.currentScore));

                    for (const [innerfaceId, weight] of Object.entries(record.changes)) {
                        const innerfaceRef = doc(db, 'users', uid, 'personalities', pid, 'innerfaces', innerfaceId); // Re-create ref to match key
                        const currentScore = scoreMap.get(innerfaceId);

                        if (currentScore !== undefined) {
                            const rawNewScore = currentScore - Number(weight);
                            const newScore = Math.max(0, Number(rawNewScore.toFixed(4)));
                            transaction.update(innerfaceRef, { currentScore: newScore });
                        }
                    }
                }

                // Update Personality Stats (SKIP for System Events)
                if (record.type !== 'system' && personalityDoc.exists()) {
                    const pData = personalityDoc.data() as Personality;
                    if (pData.stats) {
                        const recordDate = new Date(record.timestamp);
                        const recordDateStr = format(recordDate, 'yyyy-MM-dd');
                        const recordMonthStr = format(recordDate, 'yyyy-MM');
                        const recordXp = Math.round((record.weight || 0) * 100);

                        const statsUpdate: Record<string, unknown> = {
                            'stats.totalCheckins': increment(-1),
                            'stats.totalXp': increment(-recordXp)
                        };

                        // Only decrement daily stats if the deleted record belongs to the current "active" day in stats
                        if (pData.stats.lastDailyUpdate === recordDateStr) {
                            statsUpdate['stats.dailyCheckins'] = increment(-1);
                            statsUpdate['stats.dailyXp'] = increment(-recordXp);
                        }

                        // Only decrement monthly stats if the deleted record belongs to the current "active" month in stats
                        if (pData.stats.lastMonthlyUpdate === recordMonthStr) {
                            statsUpdate['stats.monthlyCheckins'] = increment(-1);
                            statsUpdate['stats.monthlyXp'] = increment(-recordXp);
                        }

                        transaction.update(personalityRef, statsUpdate);
                    }
                }

                // Delete History Record
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
