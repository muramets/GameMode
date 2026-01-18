
export interface Personality {
    id: string;
    name: string;
    description?: string;
    avatar?: string; // Emoji or URL
    icon?: string; // FontAwesome icon code (e.g. 'fa-user', 'user')
    themeColor?: string; // Hex code for accent
    createdAt: number;
    stats?: PersonalityStats;
    lastActiveAt: number;
}

export interface PersonalityStats {
    totalCheckins: number;
    totalXp: number;

    // Daily Stats
    lastDailyUpdate: string; // "YYYY-MM-DD"
    dailyCheckins: number;
    dailyXp: number;

    // Monthly Stats
    lastMonthlyUpdate: string; // "YYYY-MM"
    monthlyCheckins: number;
    monthlyXp: number;
}
