import { useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthProvider';
import { useHistoryStore } from '../../../stores/historyStore';
import { useMetadataStore } from '../../../stores/metadataStore';
import type { HistoryRecord } from '../../../types/history';

export type { HistoryRecord as Checkin };

export function useScores() {
    const { user } = useAuth();
    const { history, addCheckin, deleteCheckin, isLoading: isHistoryLoading } = useHistoryStore();
    const { innerfaces, protocols, states, isLoading: isMetadataLoading } = useMetadataStore();

    const isLoading = isHistoryLoading || isMetadataLoading;

    const applyProtocol = useCallback(async (protocolId: number | string, direction: '+' | '-' = '+') => {
        const protocol = protocols.find(p => p.id === protocolId);
        if (!protocol) return;

        if (!user) {
            console.warn('Cannot apply protocol: No user logged in');
            return;
        }

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
            changes,
            action: direction
        };

        await addCheckin(user.uid, newRecord);
    }, [user, protocols, addCheckin]);

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

        // Protocols
        if (state.protocolIds && state.protocolIds.length > 0) {
            // Protocols contribute directly to the score context.
            // However, a protocol itself doesn't have a "score" in the same way an innerface does.
            // It has a weight and execution history.
            // If the user wants the "average of all dependencies", and a protocol is a dependency,
            // we need to define what a protocol's "current score" is.
            // Usually, protocols *modify* innerfaces.
            // If a state is composed of protocols, maybe it implies "average completion" or "consistency"?
            // FOR NOW: Let's assume protocols don't contribute to the "Score" unless we define a metric.
            // BUT: The user asked to "count the average of all dependencies". 
            // If a protocol is just an action, maybe it contributes 10 if done today? Or 0?
            // Let's stick to Innerfaces for the score for now, as protocols drive innerfaces. 
            // UNLESS the user implies that the state score is purely innerface based.
            // Let's re-read: "considera average from all dependencies as current score".
            // If I include protocols, I need a 'score' for them.
            // Let's assume for now score is driven by innerfaces.
            // Wait, looking at Protocol type, it doesn't carry a score.
            // I will only sum Innerfaces and nested States for now.
        }

        if (state.innerfaceIds) {
            console.log(`[useScores] Calculating score for state ${state.name} (${state.id})`);
            console.log(`[useScores] Raw innerfaceIds:`, state.innerfaceIds);

            state.innerfaceIds.forEach(id => {
                const score = calculateInnerfaceScore(id);
                console.log(`[useScores] -> Innerface ${id}: score=${score}`);
                total += score;
                count++;
            });
            console.log(`[useScores] Total: ${total}, Count: ${count}, Avg: ${count > 0 ? total / count : 0}`);
        }

        if (state.stateIds) {
            state.stateIds.forEach(id => {
                total += calculateStateScore(id, visited);
                count++;
            });
        }

        return count > 0 ? total / count : 0;
    }, [states, calculateInnerfaceScore]);

    // Calculate score for a specific date (end of day)
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

            // Create a sanitized state object for calculation to avoid double-filtering
            const sanitizedState = {
                ...state,
                innerfaceIds: validInnerfaceIds,
                protocolIds: validProtocolIds
            };

            return {
                ...sanitizedState,
                // We must calculate score using the sanitized state, but calculateStateScore looks up via ID from 'states'.
                // Since 'states' in store still has ghosts, passing state.id to calculateStateScore will still hit the method that iterates raw state.innerfaceIds.
                // However, we updated calculateStateScore above to check existence! So it is safe.
                score: calculateStateScore(state.id),
                yesterdayScore: calculateStateScoreAtDate(state.id, yesterday)
            };
        });
    }, [states, innerfaces, protocols, calculateStateScore, calculateStateScoreAtDate]);

    const deleteEvent = useCallback(async (id: string) => {
        if (!user) return;
        await deleteCheckin(user.uid, id);
    }, [user, deleteCheckin]);

    return {
        history,
        applyProtocol,
        deleteEvent,
        innerfaces: innerfacesWithScores,
        protocols,
        states: statesWithScores,
        isLoading,
        resetHistory: () => console.log('Reset history not implemented yet for Firestore'),

    };
}
