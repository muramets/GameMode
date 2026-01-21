import type { SmartPlannerPace } from '../types';

export interface PaceConfig {
    label: string;
    description: string;
    checksPerWeek: number;
    color: string;
}

export const PACE_CONFIGS: Record<SmartPlannerPace, PaceConfig> = {
    slow: {
        label: 'Slow',
        description: 'Gentle pace',
        checksPerWeek: 2,
        color: 'var(--correct-color)' // Green
    },
    medium: {
        label: 'Medium',
        description: 'Every other day',
        checksPerWeek: 3,
        color: 'var(--main-color)' // Yellow
    },
    fast: {
        label: 'Fast',
        description: '5 days a week',
        checksPerWeek: 5,
        color: 'var(--warning-color, #d19a66)' // Orange
    }
};

/**
 * Generate a 7-day schedule (M-S) showing which days have check-ins
 * based on the pace and checks per week
 */
export function getWeeklySchedule(checksPerWeek: number): boolean[] {
    const schedule = [false, false, false, false, false, false, false];

    if (checksPerWeek === 0) return schedule;
    if (checksPerWeek >= 7) return schedule.map(() => true);

    // Distribute checks evenly across the week
    // For 2: Mon, Thu
    // For 3: Mon, Wed, Fri
    // For 4: Mon, Tue, Thu, Fri
    // For 5: Mon, Tue, Wed, Thu, Fri

    const patterns: Record<number, number[]> = {
        1: [0], // Monday
        2: [0, 3], // Mon, Thu
        3: [0, 2, 4], // Mon, Wed, Fri
        4: [0, 1, 3, 4], // Mon, Tue, Thu, Fri
        5: [0, 1, 2, 3, 4], // Mon-Fri
        6: [0, 1, 2, 3, 4, 5] // Mon-Sat
    };

    const pattern = patterns[checksPerWeek] || [];
    pattern.forEach(dayIndex => {
        schedule[dayIndex] = true;
    });

    return schedule;
}

/**
 * Calculate how many weeks are needed to reach the XP goal
 * given the weekly XP contribution from all protocols
 */
export function calculateWeeksToGoal(xpNeeded: number, weeklyXP: number): number {
    if (weeklyXP <= 0) return Infinity;
    return Math.ceil(xpNeeded / weeklyXP);
}

/**
 * Format weeks into human-readable string
 * Examples: "3 weeks", "1 month 2 weeks", "2 months"
 */
export function formatWeeksToGoal(weeks: number): string {
    if (!isFinite(weeks)) return '∞';
    if (weeks === 0) return 'Complete';
    if (weeks <= 4) return `${weeks} week${weeks > 1 ? 's' : ''}`;

    const months = Math.floor(weeks / 4);
    const remainingWeeks = weeks % 4;

    const monthStr = `${months} month${months > 1 ? 's' : ''}`;
    const weekStr = remainingWeeks > 0 ? ` ${remainingWeeks} week${remainingWeeks > 1 ? 's' : ''}` : '';

    return monthStr + weekStr;
}
