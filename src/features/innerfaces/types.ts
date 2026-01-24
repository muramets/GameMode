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
    deletedAt?: string;
    category?: PowerCategory; // NEW: Skills, Foundations, or uncategorized
    lastCheckInDate?: string; // ISO Date of last activity
    decaySettings?: {
        enabled: boolean;
        amount: number;
        frequency: 'day' | 'week' | 'month';
        interval?: number; // NEW: multiplier for frequency (defaults to 1)
        lastDecayDate?: string; // ISO Date of last applied decay
    };
    priority?: 'low' | 'medium' | 'high'; // NEW: Impact on overall level (Nice to have | Standard | Must Have)
}
