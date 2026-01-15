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
}

export interface Protocol {
    id: number | string;
    title: string; // "Warm Up"
    description: string; // "Turn the body on"
    icon: string; // Emoji or Icon class
    color?: string; // Hex code for tinting
    group?: string; // e.g. "Physical", "Mental", "Core" - inferred or explicit
    weight: number; // 0.05, 0.1 etc
    targets: (number | string)[]; // IDs of Innerfaces affected
    hover?: string; // Tooltip text
    action?: '+' | '-'; // Default direction
    order?: number; // For manual sorting
}
