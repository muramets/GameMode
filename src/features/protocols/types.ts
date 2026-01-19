
export interface Protocol {
    id: number | string;
    title: string; // "Warm Up"
    description: string; // "Turn the body on"
    icon: string; // Emoji or Icon class
    color?: string; // Hex code for tinting
    group?: string;
    deletedAt?: string; // e.g. "Physical", "Mental", "Core" - inferred or explicit
    weight: number; // Fundamental score delta (e.g. 0.05, 0.1 etc). XP is derived as weight * 100.
    targets: (number | string)[]; // IDs of Innerfaces affected
    hover?: string; // Tooltip text
    order?: number; // For manual sorting
}
