export interface StateData {
    id: string;
    name: string;
    icon?: string;
    subtext?: string;
    description?: string;
    score?: number; // 0-10 or similar
    yesterdayScore?: number;
    color?: string;
    innerfaceIds?: (number | string)[];
    protocolIds?: (number | string)[];
    stateIds?: string[];
}

export interface LevelInfo {
    level: number;
    currentXP: number;
    maxXP: number;
    percentage: number;
    note?: string;
}

export interface UserStats {
    checkinsToday: number;
    xpToday: number;
    checkinsMonth: number;
    xpMonth: number;
}
export interface QuickAction {
    id: string;
    title: string;
    icon: string; // FontAwesome class
    details: string; // e.g. "Add protocols" or "Focus Mode"
    xp?: number; // e.g. 10, displayed as grey text
    color?: 'positive' | 'negative' | 'neutral'; // specific details color
    hover?: string; // tooltip text
}
