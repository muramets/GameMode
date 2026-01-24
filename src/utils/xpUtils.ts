export const XP_PER_LEVEL = 100;

export interface LevelInfo {
    level: number;
    currentLevelXP: number; // XP acquired in this level (0-99)
    progress: number; // Percentage (0-99)
    totalXP: number;
}


export const PRIORITY_WEIGHTS = {
    low: 1,      // Nice to have
    medium: 3,   // Standard
    high: 10     // Must have
};

/**
 * Calculates weighted user level based on innerface priorities.
 * 
 * Business Logic: "Weighted Mastery"
 * Instead of a simple average (where adding a Level 0 hobby drags down a Level 10 master),
 * we use a Weighted Average based on impact priority:
 * - High Priority (Must Have): Weight x10 (Forms the core of personality)
 * - Medium Priority (Standard): Weight x3
 * - Low Priority (Nice to have): Weight x1 (Bonus skills, minimal impact on drop)
 * 
 * Formula: (Sum of (Level * Weight)) / (Sum of Weights)
 */
export function calculateWeightedLevel(innerfaces: { currentScore?: number, priority?: 'low' | 'medium' | 'high', deletedAt?: string }[]): LevelInfo {
    const activeInnerfaces = innerfaces.filter(i => !i.deletedAt);

    if (activeInnerfaces.length === 0) {
        return { level: 0, currentLevelXP: 0, progress: 0, totalXP: 0 };
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;

    activeInnerfaces.forEach(iface => {
        const score = iface.currentScore || 0;
        const priority = iface.priority || 'medium'; // Default to medium
        const weight = PRIORITY_WEIGHTS[priority];

        totalWeightedScore += score * weight;
        totalWeight += weight;
    });

    const weightedAverageScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    // Convert this average score (e.g. 9.09) back to Total XP (909) and Level (9)
    const totalXP = scoreToXP(weightedAverageScore);

    // Reuse existing level calc logic which handles the "XP -> Level + Progress" breakdown
    return calculateLevel(totalXP);
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
