import { useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthProvider';
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

        // 1. Determine XP
        // If protocol has explicit XP, use it. Otherwise derive from weight (Legacy support).
        const rawXP = protocol.xp ?? Math.round(protocol.weight * 100);
        const xp = direction === '+' ? rawXP : -rawXP;

        // 2. Calculate Weight for Internal Score (0-10 scale) retention
        // 1 XP = 0.01 Score
        const weight = xp / 100;

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
            xp,
            targets: protocol.targets,
            changes,
            action: direction
        };

        await addCheckin(user.uid, activePersonalityId, newRecord);
    }, [user, activePersonalityId, protocols, addCheckin]);

    const calculateInnerfaceScore = useCallback((innerfaceId: number | string) => {
        // Use loose equality or string conversion to match mixed types (string vs number)
        const innerface = innerfaces.find(i => i.id.toString() === innerfaceId.toString());
        if (!innerface) return 0;

        const totalChange = history.reduce((sum, record) => {
            // Only count if record has changes for this innerface 
            // AND if record is newer than the innerface's versionTimestamp (Hard Reset)
            if (record.changes && record.changes[innerfaceId] !== undefined) {
                if (!innerface.versionTimestamp || record.timestamp > innerface.versionTimestamp) {
                    return sum + record.changes[innerfaceId];
                }
            }
            return sum;
        }, 0);

        return Math.max(0, innerface.initialScore + totalChange);
    }, [history, innerfaces]);

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

    const calculateInnerfaceScoreAtDate = useCallback((innerfaceId: number | string, date: Date) => {
        const innerface = innerfaces.find(i => i.id.toString() === innerfaceId.toString());
        if (!innerface) return 0;

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const totalChange = history.reduce((sum, record) => {
            const recordDate = new Date(record.timestamp);
            if (recordDate > endOfDay) return sum;

            if (record.changes && record.changes[innerfaceId] !== undefined) {
                if (!innerface.versionTimestamp || record.timestamp > innerface.versionTimestamp) {
                    return sum + record.changes[innerfaceId];
                }
            }
            return sum;
        }, 0);

        return Math.max(0, innerface.initialScore + totalChange);
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
            // Filter out ghosts
            const validInnerfaceIds = (state.innerfaceIds || []).filter(id =>
                innerfaces.some(i => i.id.toString() === id.toString())
            );
            const validProtocolIds = (state.protocolIds || []).filter(id =>
                protocols.some(p => p.id.toString() === id.toString())
            );

            const sanitizedState = {
                ...state,
                innerfaceIds: validInnerfaceIds,
                protocolIds: validProtocolIds
            };

            return {
                ...sanitizedState,
                score: calculateStateScore(state.id),
                yesterdayScore: calculateStateScoreAtDate(state.id, yesterday)
            };
        });
    }, [states, innerfaces, protocols, calculateStateScore, calculateStateScoreAtDate]);

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
        resetHistory: () => console.log('Reset history not implemented yet for Firestore'),
    }), [history, applyProtocol, deleteEvent, innerfacesWithScores, protocols, statesWithScores, isLoading, loadingProgress]);
}
