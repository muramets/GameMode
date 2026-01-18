import {
    startOfWeek, endOfWeek,
    startOfMonth, endOfMonth,
    startOfQuarter, endOfQuarter,
    startOfYear, endOfYear,
    isWithinInterval, parseISO
} from 'date-fns';
import type { Interval } from 'date-fns';
import type { PlanningGoal } from '../features/planning/types';
import type { Protocol } from '../features/protocols/types';

export interface WeeklyActionProgress {
    protocolId: string;
    protocol: Protocol;
    planned: number;    // Display target
    completed: number;  // Display completed count
    bonus: number;      // Surplus
    // Metadata for UI
    isLowFrequency: boolean; // True if goal is < 1 per week (e.g. monthly)
    periodLabel?: string;    // "Month", "Quarter" etc.
    isCapped: boolean;       // True if we limited the view to 7/7 but user plans more
    realTarget: number;      // The actual math.ceil target if we didn't cap
}

interface HistoryRecord {
    type: string;
    protocolId?: string | number;
    timestamp: string;
    delta?: number;
    details?: Record<string, unknown>;
}

/**
 * Calculate progress for actions.
 * - High Frequency (>1/week): Shows Weekly Progress (capped at 7).
 * - Low Frequency (<1/week): Shows Period Progress (e.g. 1/month).
 */
export function getWeeklyProgress(
    goals: Record<string, PlanningGoal>,
    history: HistoryRecord[],
    protocols: Protocol[]
): WeeklyActionProgress[] {
    const now = new Date();

    // Define windows
    const weekRange = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    const monthRange = { start: startOfMonth(now), end: endOfMonth(now) };
    const quarterRange = { start: startOfQuarter(now), end: endOfQuarter(now) };
    const yearRange = { start: startOfYear(now), end: endOfYear(now) };

    const ranges: Record<string, Interval> = { week: weekRange, month: monthRange, quarter: quarterRange, year: yearRange };
    const weeksMap: Record<string, number> = { week: 1, month: 4, quarter: 13, year: 52 };

    // 1. Map protocols to their aggregated goals
    // We need to know if a protocol is "Low Frequency" or "High Frequency".
    // If a protocol is used in multiple goals, we sum their weekly integrity.
    // If sum >= 1/week, it becomes a Weekly Goal.

    interface ProtocolPlan {
        totalWeeklyRate: number; // Sum of items/week
        items: { count: number, period: string, range: Interval }[];
    }

    const planMap: Record<string, ProtocolPlan> = {};

    Object.values(goals).forEach(goal => {
        if (!goal.actionCounts) return;

        const periodWeeks = weeksMap[goal.period];
        const range = ranges[goal.period];

        Object.entries(goal.actionCounts).forEach(([pid, totalCount]) => {
            if (!planMap[pid]) planMap[pid] = { totalWeeklyRate: 0, items: [] };

            const weeklyRate = totalCount / periodWeeks;
            planMap[pid].totalWeeklyRate += weeklyRate;
            planMap[pid].items.push({
                count: totalCount,
                period: goal.period,
                range: range
            });
        });
    });

    // 2. Build Progress Objects
    const progress: WeeklyActionProgress[] = [];

    Object.entries(planMap).forEach(([protocolId, plan]) => {
        const protocol = protocols.find(p => String(p.id) === protocolId);
        if (!protocol) return;

        // Decision: Is this High or Low frequency?
        // Cutoff: If rate is < 0.9 (allow some float wiggling), treat as Low Frequency
        // Note: If multiple goals exist, we default to Weekly if ANY combination pushes it over 1/week.
        const isHighFreq = plan.totalWeeklyRate >= 0.8;

        if (isHighFreq) {
            // --- WEEKLY MODE ---
            // Sum up all weekly contributions
            let totalWeeklyTarget = 0;
            plan.items.forEach(item => {
                const periodWeeks = weeksMap[item.period] || 1;
                totalWeeklyTarget += item.count / periodWeeks;
            });

            const rawTarget = Math.ceil(totalWeeklyTarget);

            // Apply Soft Cap (Premium Logic)
            const isCapped = rawTarget > 7;
            const displayTarget = isCapped ? 7 : rawTarget;

            // Count completions in CURRENT WEEK
            let completed = 0;
            history.forEach(r => {
                if ((r.type === 'protocol' || r.type === 'quick_action') && String(r.protocolId) === protocolId) {
                    try {
                        if (isWithinInterval(parseISO(r.timestamp), weekRange)) {
                            completed++;
                        }
                    } catch { }
                }
            });

            progress.push({
                protocolId,
                protocol,
                planned: displayTarget,
                completed,
                bonus: Math.max(0, completed - displayTarget),
                isLowFrequency: false,
                isCapped,
                realTarget: rawTarget
            });

        } else {
            // --- LOW FREQUENCY MODE ---
            // It's less than once a week. Likely 1/Month or 1/Year.
            // We use the aggregation of the periods.
            // Assumption: Usually single goal per protocol for low freq.
            // If mixed (e.g. 1/Month + 1/Year), we just take the "dominant" one or sum them? 
            // Simpler: Just count total planned actions in the dominant period window.

            // Find dominant item (highest count)
            const mainItem = plan.items.sort((a, b) => b.count - a.count)[0];
            const displayTarget = mainItem.count;

            // Count completions in THE PERIOD WINDOW
            let completed = 0;
            history.forEach(r => {
                if ((r.type === 'protocol' || r.type === 'quick_action') && String(r.protocolId) === protocolId) {
                    try {
                        if (isWithinInterval(parseISO(r.timestamp), mainItem.range)) {
                            completed++;
                        }
                    } catch { }
                }
            });

            progress.push({
                protocolId,
                protocol,
                planned: displayTarget,
                completed,
                bonus: Math.max(0, completed - displayTarget),
                isLowFrequency: true,
                periodLabel: mainItem.period,
                isCapped: false,
                realTarget: displayTarget
            });
        }
    });

    // Sort:
    // 1. Highest Planned Count first (Prioritize high volume goals as requested)
    // 2. Then by Remaining Count (Incomplete first)
    return progress.sort((a, b) => {
        // Primary: Planned count desc
        if (b.planned !== a.planned) {
            return b.planned - a.planned;
        }
        // Secondary: Remaining desc
        const remainingA = Math.max(0, a.planned - a.completed);
        const remainingB = Math.max(0, b.planned - b.completed);
        return remainingB - remainingA;
    });
}

/**
 * Generate progress dots array for display
 * Returns array of { filled: boolean, bonus: boolean }
 */
export function getProgressDots(
    planned: number,
    completed: number,
    maxDots: number = 5
): Array<{ filled: boolean; bonus: boolean }> {
    const dots: Array<{ filled: boolean; bonus: boolean }> = [];
    const totalDots = Math.max(planned, completed);
    const displayDots = Math.min(totalDots, maxDots);

    for (let i = 0; i < displayDots; i++) {
        if (i < completed) {
            // Filled dot
            dots.push({
                filled: true,
                bonus: i >= planned // Beyond planned = bonus
            });
        } else {
            // Empty dot
            dots.push({ filled: false, bonus: false });
        }
    }

    return dots;
}
