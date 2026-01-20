export interface HistoryRecord {
    id: string; // Firestore document ID
    type: 'protocol' | 'manual_adjustment' | 'system';
    protocolId: string | number;
    protocolName: string;
    protocolIcon: string;
    timestamp: string; // ISO string
    weight: number;
    targets: (string | number)[];
    changes: Record<string | number, number>; // innerfaceId -> change value
    details?: {
        from?: number;
        to?: number;
        [key: string]: unknown;
    };
    deletedAt?: string; // ISO string - marks check-in as deleted when protocol is deleted
}
