
export interface Personality {
    id: string;
    name: string;
    description?: string;
    avatar?: string; // Emoji or URL
    icon?: string; // FontAwesome icon code (e.g. 'fa-user', 'user')
    iconColor?: string; // Hex code for accent
    currentTheme?: string; // Name of the active theme (e.g. 'serika_dark')
    favThemes?: string[]; // List of favorite theme names
    createdAt: number;
    stats?: PersonalityStats;
    lastActiveAt: number;

    // Origin Metadata (if copied from a team role)
    sourceTeamId?: string;
    sourceRoleId?: string;
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
