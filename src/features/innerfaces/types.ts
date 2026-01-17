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
    protocolIds?: (number | string)[];
}
