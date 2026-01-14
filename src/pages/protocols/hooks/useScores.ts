import { useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthProvider';
import { useHistoryStore } from '../../../stores/historyStore';
import { useMetadataStore } from '../../../stores/metadataStore';
import type { HistoryRecord } from '../../../types/history';

export type { HistoryRecord as Checkin };

export function useScores() {
    const { user } = useAuth();
    const { history, addCheckin, deleteCheckin } = useHistoryStore();
    const { innerfaces, protocols, states } = useMetadataStore();

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
        const innerface = innerfaces.find(i => i.id === innerfaceId);
        if (!innerface) return 0;

        const totalChange = history.reduce((sum, record) => {
            if (record.changes && record.changes[innerfaceId] !== undefined) {
                return sum + record.changes[innerfaceId];
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

    const statesWithScores = useMemo(() => {
        return states.map(state => ({
            ...state,
            score: calculateStateScore(state.id)
        }));
    }, [states, calculateStateScore]);

    const deleteEvent = useCallback(async (id: string) => {
        if (!user) return;
        await deleteCheckin(user.uid, id);
    }, [user, deleteCheckin]);

    return {
        history,
        applyProtocol,
        deleteEvent,
        innerfaces: innerfacesWithScores,
        states: statesWithScores,
        resetHistory: () => console.log('Reset history not implemented yet for Firestore')
    };
}
