
export interface Personality {
    id: string;
    name: string;
    description?: string;
    avatar?: string; // Emoji or URL
    icon?: string; // FontAwesome icon code (e.g. 'fa-user', 'user')
    themeColor?: string; // Hex code for accent
    createdAt: number;
    lastActiveAt: number;
}
