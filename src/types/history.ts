export interface HistoryRecord {
    id: string; // Firestore document ID
    type: 'protocol' | 'quick_action' | 'system';
    protocolId: string | number;
    protocolName: string;
    protocolIcon: string;
    timestamp: string; // ISO string
    action: '+' | '-';
    weight: number;
    xp?: number; // Integer XP value (e.g. 5, 10). If missing, derived from weight * 100.
    targets: (string | number)[];
    changes: Record<string | number, number>; // innerfaceId -> change value
    details?: Record<string, unknown>; // Flexible metadata (e.g. notes, quick action params)
}
