export interface HistoryRecord {
    id: string; // Firestore document ID
    type: 'protocol' | 'quick_action';
    protocolId: string | number;
    protocolName: string;
    protocolIcon: string;
    timestamp: string; // ISO string
    action: '+' | '-';
    weight: number;
    targets: (string | number)[];
    changes: Record<string | number, number>; // innerfaceId -> change value
}
