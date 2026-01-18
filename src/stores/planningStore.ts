import { create } from 'zustand';
import { db } from '../config/firebase';
import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    query,
    onSnapshot
} from 'firebase/firestore';
import type { PlanningGoal } from '../features/planning/types';

interface PlanningState {
    goals: Record<string, PlanningGoal>; // Keyed by innerfaceId
    isLoading: boolean;
    error: string | null;

    // Actions
    setGoal: (uid: string, pid: string, goal: Omit<PlanningGoal, 'createdAt' | 'updatedAt'>) => Promise<void>;
    deleteGoal: (uid: string, pid: string, innerfaceId: string | number) => Promise<void>;
    subscribeToGoals: (uid: string, pid: string) => () => void;
    clearGoals: () => void;
}

export const usePlanningStore = create<PlanningState>((set) => ({
    goals: {},
    isLoading: true,
    error: null,

    clearGoals: () => set({ goals: {}, isLoading: false, error: null }),

    setGoal: async (uid, pid, goalData) => {
        try {
            // goalData contains innerfaceId, targetScore, period, balance
            const goalId = String(goalData.innerfaceId);
            const docRef = doc(db, 'users', uid, 'personalities', pid, 'goals', goalId);

            const now = Date.now();
            const payload = {
                ...goalData,
                updatedAt: now,
                // We use merge: true, so if it didn't exist, we might want createdAt. 
                // But setDoc without merge overwrites. Ideally we read first or use set with merge.
                // Let's just include createdAt if we want, but since we are overwriting the specific goal for this innerface, 
                // we might as well just set it fresh or update. 
                // Let's treat it as an upsert.
            };

            // To preserve createdAt if it exists, we could use set with merge, but Typescript might be tricky.
            // Simpler: Just always write updatedAt. If we want true creation time, we'd need to check existence.
            // For now, let's just write both, and maybe creation time is effectively "when this goal plan was made"
            // If the user modifies the plan, it's basically a new plan version.

            await setDoc(docRef, {
                ...payload,
                createdAt: now // Simplification: any save is a "new" plan timestamp for now, or we can improve later.
            }, { merge: true });

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Error setting goal:', err);
            set({ error: message });
        }
    },

    deleteGoal: async (uid, pid, innerfaceId) => {
        try {
            const goalId = String(innerfaceId);
            const docRef = doc(db, 'users', uid, 'personalities', pid, 'goals', goalId);
            await deleteDoc(docRef);

            set(state => {
                const newGoals = { ...state.goals };
                delete newGoals[goalId];
                return { goals: newGoals };
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Error deleting goal:', err);
            set({ error: message });
        }
    },

    subscribeToGoals: (uid, pid) => {
        set({ isLoading: true });
        const goalsRef = collection(db, 'users', uid, 'personalities', pid, 'goals');

        const unsubscribe = onSnapshot(query(goalsRef), (snapshot) => {
            const goalsMap: Record<string, PlanningGoal> = {};
            snapshot.forEach((doc) => {
                // We assume doc.id is the innerfaceId
                goalsMap[doc.id] = doc.data() as PlanningGoal;
            });
            set({ goals: goalsMap, isLoading: false });
        }, (err) => {
            console.error('Firestore goals subscription error:', err);
            set({ error: err.message, isLoading: false });
        });

        return unsubscribe;
    }
}));
