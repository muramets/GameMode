import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import type { Protocol } from '../features/protocols/types';
import type { PlanningGoal } from '../features/planning/types';
import type { Innerface } from '../features/innerfaces/types';

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
    linkedGoals: Array<{ title: string; count: number }>; // Contributing goals
}

export interface DailyCheckInData {
    dayIndex: number;        // 0 = Monday, 6 = Sunday
    hasCheckIn: boolean;     // Whether any check-in occurred
    checkInCount: number;    // Number of check-ins on this day
    goalCount: number;       // Number of unique goals this check-in contributes to
    linkedGoals: Array<{ title: string }>; // Specific goals this protocol contributes to
}

import type { HistoryRecord } from '../types/history';

/**
 * Calculate progress for actions.
 * - High Frequency (>1/week): Shows Weekly Progress (capped at 7).
 * - Low Frequency (<1/week): Shows Period Progress (e.g. 1/month).
 */
export function getWeeklyProgress(
    goals: Record<string, PlanningGoal>,
    history: HistoryRecord[],
    protocols: Protocol[],
    innerfaces: Innerface[]
): WeeklyActionProgress[] {
    const now = new Date();

    // Define current week window
    const weekRange = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };

    // 1. Map protocols to their weekly targets
    // actionCounts now stores per-week values directly
    interface ProtocolPlan {
        totalWeeklyRate: number; // Sum of items/week
        contributingGoals: Array<{ id: string; count: number }>;
    }

    const planMap: Record<string, ProtocolPlan> = {};

    Object.values(goals).forEach(goal => {
        if (!goal.actionCounts) return;

        Object.entries(goal.actionCounts).forEach(([pid, weeklyCount]) => {
            if (!planMap[pid]) planMap[pid] = { totalWeeklyRate: 0, contributingGoals: [] };
            // actionCounts is already per-week, so just add it
            planMap[pid].totalWeeklyRate += weeklyCount;
            // Record contribution
            if (weeklyCount > 0) {
                planMap[pid].contributingGoals.push({
                    id: String(goal.innerfaceId),
                    count: weeklyCount
                });
            }
        });
    });

    // 2. Build Progress Objects
    const progress: WeeklyActionProgress[] = [];

    Object.entries(planMap).forEach(([protocolId, plan]) => {
        const protocol = protocols.find(p => String(p.id) === protocolId);
        if (!protocol) return;

        // Decision: Is this High or Low frequency?
        // Cutoff: If rate is < 0.9 (allow some float wiggling), treat as Low Frequency
        const isHighFreq = plan.totalWeeklyRate >= 0.8;

        // Resolve Goal Names
        const linkedGoals = plan.contributingGoals.map(cg => {
            const innerface = innerfaces.find(i => String(i.id) === cg.id);
            return {
                title: innerface?.name || 'Unknown Goal',
                count: cg.count
            };
        });

        if (isHighFreq) {
            // --- WEEKLY MODE ---
            const rawTarget = Math.ceil(plan.totalWeeklyRate);

            // Apply Soft Cap (Premium Logic)
            const isCapped = rawTarget > 7;
            const displayTarget = isCapped ? 7 : rawTarget;

            // Count completions in CURRENT WEEK
            let completed = 0;
            history.forEach(r => {
                if ((r.type === 'protocol' || r.type === 'manual_adjustment') && String(r.protocolId) === protocolId) {
                    try {
                        if (isWithinInterval(parseISO(r.timestamp), weekRange)) {
                            completed++;
                        }
                    } catch { /* ignore */ }
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
                realTarget: rawTarget,
                linkedGoals
            });

        } else {
            // --- LOW FREQUENCY MODE ---
            // Less than once a week
            const displayTarget = Math.ceil(plan.totalWeeklyRate);

            // For low frequency, we count in current week
            let completed = 0;
            history.forEach(r => {
                if ((r.type === 'protocol' || r.type === 'manual_adjustment') && String(r.protocolId) === protocolId) {
                    try {
                        if (isWithinInterval(parseISO(r.timestamp), weekRange)) {
                            completed++;
                        }
                    } catch { /* ignore */ }
                }
            });

            progress.push({
                protocolId,
                protocol,
                planned: displayTarget,
                completed,
                bonus: Math.max(0, completed - displayTarget),
                isLowFrequency: true,
                periodLabel: 'week',
                isCapped: false,
                realTarget: displayTarget,
                linkedGoals
            });
        }
    });

    // Sort:
    // 1. Highest Planned Count first (Prioritize high volume goals as requested)
    // 2. Then by Remaining Count (Incomplete first)
    return progress
        .filter(p => p.planned > 0)
        .sort((a, b) => {
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

/**
 * Calculate daily check-ins for a specific protocol across the week
 * Returns array of 7 days (Monday to Sunday) with check-in data
 * 
 * @param protocolId - The protocol to track
 * @param history - All history records
 * @param goals - All planning goals (to determine how many goals this protocol serves)
 * @param innerfaces - All innerfaces (to resolve goal titles)
 * @returns Array of 7 DailyCheckInData objects, one per day of the week
 */
export function getDailyCheckIns(
    protocolId: string,
    history: HistoryRecord[],
    goals: Record<string, PlanningGoal>,
    innerfaces: Innerface[]
): DailyCheckInData[] {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday

    // Initialize 7 days (Mon-Sun)
    const dailyData: DailyCheckInData[] = Array.from({ length: 7 }, (_, i) => ({
        dayIndex: i,
        hasCheckIn: false,
        checkInCount: 0,
        goalCount: 0,
        linkedGoals: []
    }));

    // Collect goals this protocol contributes to
    const linkedGoals: Array<{ title: string }> = [];
    Object.values(goals).forEach(goal => {
        if (goal.actionCounts && goal.actionCounts[protocolId]) {
            const innerface = innerfaces.find(i => String(i.id) === String(goal.innerfaceId));
            if (innerface) {
                linkedGoals.push({ title: innerface.name });
            }
        }
    });
    const goalCount = linkedGoals.length;

    // Process history records for this protocol
    history.forEach(record => {
        if ((record.type === 'protocol' || record.type === 'manual_adjustment') &&
            String(record.protocolId) === protocolId) {
            try {
                const recordDate = parseISO(record.timestamp);
                const weekRange = {
                    start: weekStart,
                    end: endOfWeek(weekStart, { weekStartsOn: 1 })
                };

                if (isWithinInterval(recordDate, weekRange)) {
                    // Calculate day index (0 = Monday, 6 = Sunday)
                    const dayOfWeek = recordDate.getDay();
                    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

                    dailyData[dayIndex].hasCheckIn = true;
                    dailyData[dayIndex].checkInCount++;
                    dailyData[dayIndex].goalCount = goalCount;
                    dailyData[dayIndex].linkedGoals = linkedGoals;
                }
            } catch {
                // Ignore invalid timestamps
            }
        }
    });

    return dailyData;
}
