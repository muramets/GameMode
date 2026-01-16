export const XP_PER_LEVEL = 100;

export interface LevelInfo {
    level: number;
    currentLevelXP: number; // XP acquired in this level (0-99)
    progress: number; // Percentage (0-99)
    totalXP: number;
}

/**
 * Calculates level from total XP (Infinite Levels, 100 XP per level).
 * @param totalXP Total accumulated XP
 */
export function calculateLevel(totalXP: number): LevelInfo {
    // Ensure positive XP for calculation (though negative implies level drop, we treat raw XP as potential)
    // actually, if totalXP is negative? 
    // "Level 1" is default (0 XP).
    // If totalXP < 0, we are still Level 1 but with negative progress? Or just Level 1, 0 progress.
    const safeXP = Math.max(0, totalXP);

    // Level starts at 0.
    // 0-99 XP = Level 0
    // 100-199 XP = Level 1
    // ...
    // 500-599 XP = Level 5
    const level = Math.floor(safeXP / XP_PER_LEVEL);
    const currentLevelXP = Math.round(safeXP % XP_PER_LEVEL); // Round to avoid float issues

    return {
        level,
        currentLevelXP,
        progress: currentLevelXP, // Since 100 XP = 100%, value is same
        totalXP: safeXP
    };
}

/**
 * Converts internal fractional score (e.g. 5.45) to total XP (545).
 */
export function scoreToXP(score: number): number {
    return Math.round(score * 100);
}

/**
 * Converts XP (e.g. 545) to internal fractional score (5.45).
 */
export function xpToScore(xp: number): number {
    return xp / 100;
}
