
export interface Protocol {
    id: number | string;
    title: string; // "Warm Up"
    description: string; // "Turn the body on"
    icon: string; // Emoji or Icon class
    color?: string; // Hex code for tinting
    group?: string; // e.g. "Physical", "Mental", "Core" - inferred or explicit
    xp?: number; // Integer XP (e.g. 5, 10, 100). If missing, derived from weight * 100.
    weight: number; // DEPRECATED for display, but used for internal score calc (0.05, 0.1 etc)
    targets: (number | string)[]; // IDs of Innerfaces affected
    hover?: string; // Tooltip text
    action?: '+' | '-'; // Default direction
    order?: number; // For manual sorting
}
