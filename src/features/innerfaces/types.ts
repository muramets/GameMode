export type PowerCategory = 'skill' | 'foundation' | null;

export interface Innerface {
    id: number | string;
    name: string; // e.g., "Focus. Attentional control"
    icon: string; // Emoji
    description?: string; // Derived from name or added separately
    hover?: string; // Tooltip text
    initialScore: number;
    currentScore?: number;
    color?: string; // Hex code
    versionTimestamp?: string; // ISO string for hard reset
    order?: number;
    group?: string;
    category?: PowerCategory; // NEW: Skills, Foundations, or uncategorized
    protocolIds?: (number | string)[];
}
