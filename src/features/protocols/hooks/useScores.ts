import { useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useHistoryStore } from '../../../stores/historyStore';
import { useMetadataStore } from '../../../stores/metadataStore';
import { usePersonalityStore } from '../../../stores/personalityStore';
import type { HistoryRecord } from '../../../types/history';

export type { HistoryRecord as Checkin };

export function useScores() {
    const { user } = useAuth();
    const { history, addCheckin, deleteCheckin, isLoading: isHistoryLoading } = useHistoryStore();
    const { innerfaces, protocols, states, isLoading: isMetadataLoading, loadedCount: metadataLoadedCount } = useMetadataStore();
    const { activePersonalityId } = usePersonalityStore();

    const isLoading = isHistoryLoading || isMetadataLoading;

    // Calculate Progress
    const historyProgress = isHistoryLoading ? 0 : 20;
    const metadataProgress = (metadataLoadedCount || 0) * 20;
    const loadingProgress = historyProgress + metadataProgress;

    const applyProtocol = useCallback(async (protocolId: number | string, direction: '+' | '-' = '+') => {
        const protocol = protocols.find(p => p.id === protocolId);
        if (!protocol) return;

        if (!user || !activePersonalityId) {
            console.warn('Cannot apply protocol: No user logged in or no active personality');
            return;
        }

        // 1. Determine Weight for Internal Score (0-10 scale)
        // If protocol has weight 0.1, and direction is '-', resulting weight is -0.1
        const weight = direction === '+' ? protocol.weight : -protocol.weight;

        const changes: Record<string | number, number> = {};
        protocol.targets.forEach(targetId => {
            changes[targetId] = weight;
        });

        const newRecord: Omit<HistoryRecord, 'id'> = {
            type: 'protocol',
            protocolId: protocol.id,
            protocolName: protocol.title,
            protocolIcon: protocol.icon,
            timestamp: new Date().toISOString(),
            weight,
            targets: protocol.targets,
            changes
        };

        await addCheckin(user.uid, activePersonalityId, newRecord);
    }, [user, activePersonalityId, protocols, addCheckin]);

    const calculateInnerfaceScore = useCallback((innerfaceId: number | string) => {
        const innerface = innerfaces.find(i => i.id.toString() === innerfaceId.toString());
        if (!innerface) return 0;
        // Optimization: Use persistent score if available
        if (innerface.currentScore !== undefined) {
            return innerface.currentScore;
        }

        // Fallback for pre-migration or missing score
        return Math.max(0, innerface.initialScore);
    }, [innerfaces]);

    const innerfacesWithScores = useMemo(() => {
        return innerfaces.map(innerface => ({
            ...innerface,
            currentScore: calculateInnerfaceScore(innerface.id)
        }));
    }, [innerfaces, calculateInnerfaceScore]);

    const calculateStateScore = useCallback((stateId: string, visited = new Set<string>()): number => {
        if (visited.has(stateId)) return 0;
        visited.add(stateId);

        const state = states.find(s => s.id === stateId);
        if (!state) return 0;

        let total = 0;
        let count = 0;

        if (state.innerfaceIds) {
            state.innerfaceIds.forEach(id => {
                const score = calculateInnerfaceScore(id);
                total += score;
                count++;
            });
        }

        if (state.stateIds) {
            state.stateIds.forEach(id => {
                total += calculateStateScore(id, visited);
                count++;
            });
        }

        return count > 0 ? total / count : 0;
    }, [states, calculateInnerfaceScore]);

    // Used for "Yesterday's Score" to calculate daily progress (+5 etc)
    const calculateInnerfaceScoreAtDate = useCallback((innerfaceId: number | string, date: Date) => {
        const innerface = innerfaces.find(i => i.id.toString() === innerfaceId.toString());
        if (!innerface) return 0;

        // Start with CURRENT score
        let simulatedScore = innerface.currentScore ?? innerface.initialScore;

        // If we want score at END of 'date', we must REVERSE changes that happened AFTER 'date'
        const targetEndTime = new Date(date);
        targetEndTime.setHours(23, 59, 59, 999);

        // Iterate history (newest first) and un-apply changes until we reach target time
        for (const record of history) {
            const recordDate = new Date(record.timestamp);
            if (recordDate <= targetEndTime) {
                // We reached the target time, stop reversing
                break;
            }

            // Reverse this record's effect
            if (record.changes && record.changes[innerfaceId] !== undefined) {
                simulatedScore -= record.changes[innerfaceId];
            }
        }

        return Math.max(0, simulatedScore);
    }, [history, innerfaces]);

    const calculateStateScoreAtDate = useCallback((stateId: string, date: Date, visited = new Set<string>()): number => {
        if (visited.has(stateId)) return 0;
        visited.add(stateId);

        const state = states.find(s => s.id === stateId);
        if (!state) return 0;

        let total = 0;
        let count = 0;

        if (state.innerfaceIds) {
            state.innerfaceIds.forEach(id => {
                const score = calculateInnerfaceScoreAtDate(id, date);
                total += score;
                count++;
            });
        }

        if (state.stateIds) {
            state.stateIds.forEach(id => {
                total += calculateStateScoreAtDate(id, date, visited);
                count++;
            });
        }

        return count > 0 ? total / count : 0;
    }, [states, calculateInnerfaceScoreAtDate]);

    const statesWithScores = useMemo(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        return states.map(state => {
            // Filter out invalid child references to maintain data integrity
            const validInnerfaceIds = (state.innerfaceIds || []).filter(id =>
                innerfaces.some(i => i.id.toString() === id.toString())
            );

            const sanitizedState = {
                ...state,
                innerfaceIds: validInnerfaceIds
            };

            return {
                ...sanitizedState,
                score: calculateStateScore(state.id),
                yesterdayScore: calculateStateScoreAtDate(state.id, yesterday)
            };
        });
    }, [states, innerfaces, calculateStateScore, calculateStateScoreAtDate]);

    const deleteEvent = useCallback(async (id: string) => {
        if (!user || !activePersonalityId) return;
        await deleteCheckin(user.uid, activePersonalityId, id);
    }, [user, activePersonalityId, deleteCheckin]);

    return useMemo(() => ({
        history,
        applyProtocol,
        deleteEvent,
        innerfaces: innerfacesWithScores,
        protocols,
        states: statesWithScores,
        isLoading,
        loadingProgress,
        resetHistory: () => console.warn('Reset history not implemented yet for Firestore'),
    }), [history, applyProtocol, deleteEvent, innerfacesWithScores, protocols, statesWithScores, isLoading, loadingProgress]);
}
