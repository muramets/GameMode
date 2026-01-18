/**
 * Utility for interpolating colors based on a score (0-10).
 * Implements a specific ladder with smooth transitions.
 */

// ColorRGB interface removed as it is no longer used

const TIER_COLORS = [
    { maxLevel: 3, hex: '#CA4754' },    // Levels 1-3: Bronze/Red (Beginner)
    { maxLevel: 6, hex: '#E2B714' },    // Levels 4-6: Gold/Yellow (Intermediate)
    { maxLevel: 9, hex: '#98C379' },    // Levels 7-9: Green (Advanced)
    { maxLevel: 19, hex: '#C678DD' },   // Levels 10-19: Purple (Master)
    { maxLevel: Infinity, hex: '#61AFEF' } // Levels 20+: Blue/Cyan (Legend)
];

/**
 * Returns a hex color string based on the Level (derived from score).
 * Infinite scaling with tiers.
 */
export function getScoreColor(score: number): string {
    // 1. Calculate Level from Score
    // Score 7.45 -> 745 XP -> Level 8 (since 0-99 is L1. Wait. 
    // Let's stick to the xpUtils logic: 0-0.99 (0-99XP) is L1.
    // So Score 0 -> L1. Score 1 -> L2.
    // Formula: floor(score) + 1

    // Handle edge case where score might be negative
    const safeScore = Math.max(0, score);
    const level = Math.floor(safeScore) + 1;

    // 2. Find Tier
    const tier = TIER_COLORS.find(t => level <= t.maxLevel) || TIER_COLORS[TIER_COLORS.length - 1];

    return tier.hex;
}

// Helper to interpolate between two hex colors
function interpolateColor(color1: string, color2: string, factor: number) {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Returns a smoothly interpolated color based on fractional level.
 */
export function getInterpolatedColor(level: number): string {
    // Tier boundaries: 1-3 red, 4-6 gold, 7-9 green, 10-19 purple, 20+ blue
    // Use tier centers for smooth transitions
    const points = [
        { level: 1, color: '#CA4754' },   // Red start
        { level: 3.5, color: '#CA4754' }, // Red-Gold transition
        { level: 5, color: '#E2B714' },   // Gold center
        { level: 6.5, color: '#E2B714' }, // Gold-Green transition
        { level: 8, color: '#98C379' },   // Green center
        { level: 9.5, color: '#98C379' }, // Green-Purple transition
        { level: 14, color: '#C678DD' },  // Purple center
        { level: 19.5, color: '#C678DD' }, // Purple-Blue transition
        { level: 30, color: '#61AFEF' }   // Blue
    ];

    if (level <= points[0].level) return points[0].color;
    if (level >= points[points.length - 1].level) return points[points.length - 1].color;

    for (let i = 0; i < points.length - 1; i++) {
        const start = points[i];
        const end = points[i + 1];
        if (level >= start.level && level <= end.level) {
            const factor = (level - start.level) / (end.level - start.level);
            return interpolateColor(start.color, end.color, factor);
        }
    }

    return points[0].color;
}

/**
 * Generates a CSS gradient string for a range of levels.
 */
export function getLevelGradient(startLevel: number, endLevel: number): string {
    // If range is small, just return a simple two-color gradient
    if (Math.abs(endLevel - startLevel) < 0.5) {
        return `linear-gradient(to right, ${getInterpolatedColor(startLevel)}, ${getInterpolatedColor(endLevel)})`;
    }

    // Add intermediate steps for smoothness across tiers
    const stops = [];
    const steps = 5; // Divide the journey into steps
    for (let i = 0; i <= steps; i++) {
        const level = startLevel + (endLevel - startLevel) * (i / steps);
        stops.push(`${getInterpolatedColor(level)} ${(i / steps) * 100}%`);
    }

    return `linear-gradient(to right, ${stops.join(', ')})`;
}

// Keep helper for direct hex access if needed
export function getTierColor(level: number): string {
    const tier = TIER_COLORS.find(t => level <= t.maxLevel) || TIER_COLORS[TIER_COLORS.length - 1];
    return tier.hex;
}

