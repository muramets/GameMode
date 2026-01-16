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

// Keep helper for direct hex access if needed
export function getTierColor(level: number): string {
    const tier = TIER_COLORS.find(t => level <= t.maxLevel) || TIER_COLORS[TIER_COLORS.length - 1];
    return tier.hex;
}

