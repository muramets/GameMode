export type PlanningPeriod = 'week' | 'month' | 'quarter' | 'year';

export interface PlanningGoal {
    innerfaceId: string | number;
    targetScore: number;
    period: PlanningPeriod;
    // Map of protocolId -> weight multiplier (default 1.0)
    // Example: { 'run-protocol-id': 2.0, 'meditate-id': 0.5 }
    balance: Record<string, number>;
    // Map of protocolId -> planned action count per week
    // Example: { 'run-protocol-id': 3, 'meditate-id': 5 }
    actionCounts?: Record<string, number>;
    createdAt: number;
    updatedAt: number;
}
