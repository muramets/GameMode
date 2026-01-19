import { useState, useEffect, useCallback, useRef } from 'react';
import type { Innerface } from '../../innerfaces/types';
import { useAuth } from '../../../contexts/AuthContext';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { usePlanningStore } from '../../../stores/planningStore';
import { useScoreContext } from '../../../contexts/ScoreContext';
import { calculateLevel, scoreToXP } from '../../../utils/xpUtils';
import { getInterpolatedColor, getLevelGradient } from '../../../utils/colorUtils';
import type { PlanningPeriod } from '../types';

interface UsePlanningLogicProps {
    innerface: Innerface;
    isOpen: boolean;
    onClose: () => void;
}

export function usePlanningLogic({ innerface, isOpen, onClose }: UsePlanningLogicProps) {
    const { user } = useAuth();
    const { activePersonalityId, activeContext } = usePersonalityStore();
    const { goals, setGoal } = usePlanningStore();
    const { protocols } = useScoreContext();

    const currentScore = innerface.currentScore || innerface.initialScore || 0;
    // Use same calculation as InnerfaceCard for color consistency
    const totalXP = scoreToXP(currentScore);
    const { level: currentLevel } = calculateLevel(totalXP);
    const currentColor = getInterpolatedColor(currentLevel);

    // Local State
    const [targetScore, setTargetScore] = useState<number>(currentScore);
    const [period, setPeriod] = useState<PlanningPeriod>('week');
    const [balance, setBalance] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [actionCounts, setActionCounts] = useState<Record<string, number>>({});

    // Interactive Progress Bar State
    const progressBarRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Reset loop when opening
    useEffect(() => {
        if (isOpen) {
            // "Always open at +1"
            const defaultTarget = Math.floor(currentScore) + 1;
            setTargetScore(defaultTarget);

            // Check if there is a saved goal
            const existing = goals[innerface.id];
            if (existing) {
                setPeriod(existing.period);
                setBalance(existing.balance || {});
                if (existing.targetScore) {
                    setTargetScore(existing.targetScore);
                }
                // Load saved action plan if exists
                if (existing.actionCounts && Object.keys(existing.actionCounts).length > 0) {
                    setIsCustomizing(true);
                    setActionCounts(existing.actionCounts);
                } else {
                    setIsCustomizing(false);
                    setActionCounts({});
                }
            } else {
                setIsCustomizing(false);
                setActionCounts({});
                setBalance({});
            }
        }
    }, [isOpen, innerface.id, goals, currentScore]);

    const linkedProtocols = protocols.filter(p => {
        const fromProtocol = (p.targets || []).map(String).includes(innerface.id.toString());
        return fromProtocol;
    });

    const pointsNeeded = Math.max(0, targetScore - currentScore);

    // Smart algorithm: find optimal combination closest to goal
    const getSmartCounts = useCallback(() => {
        const xpNeeded = Math.round(pointsNeeded * 100);
        if (xpNeeded <= 0) return {};

        const sorted = [...linkedProtocols].sort((a, b) =>
            ((b.weight || 0.1) * 100) - ((a.weight || 0.1) * 100)
        );
        const counts: Record<string, number> = {};
        sorted.forEach(p => counts[p.id] = 0);

        // Simple greedy: start with highest XP, then fill with smaller ones
        let remaining = xpNeeded;
        for (const p of sorted) {
            const xp = Math.round((p.weight || 0.1) * 100);
            if (remaining > 0 && xp <= remaining) {
                // Use this action only if it doesn't overshoot alone
                const useCount = Math.floor(remaining / xp);
                counts[p.id] = Math.min(useCount, 999);
                remaining -= counts[p.id] * xp;
            }
        }

        // Check total
        let total = sorted.reduce((sum, p) => sum + counts[p.id] * Math.round((p.weight || 0.1) * 100), 0);

        // If we haven't met the goal, add the smallest action that gets us there
        if (total < xpNeeded) {
            // Sort by XP ascending to find smallest
            const ascending = [...sorted].reverse();
            for (const p of ascending) {
                const xp = Math.round((p.weight || 0.1) * 100);
                while (total < xpNeeded && counts[p.id] < 999) {
                    counts[p.id]++;
                    total += xp;
                }
                if (total >= xpNeeded) break;
            }
        }

        return counts;
    }, [pointsNeeded, linkedProtocols]);

    const handleSave = async () => {
        if (!user || !activePersonalityId) return;
        setIsSubmitting(true);
        try {
            // Determine which counts to save: custom or smart
            const countsToSave = isCustomizing ? actionCounts : getSmartCounts();
            const uid = activeContext?.type === 'personality' && activeContext.uid ? activeContext.uid : user.uid;

            await setGoal(uid, activePersonalityId, {
                innerfaceId: innerface.id,
                targetScore,
                period,
                balance,
                actionCounts: countsToSave
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Interactive Progress Bar Logic ---
    // Slider range: current score (left edge) to current + 10 (right edge)
    const minScore = currentScore;
    const maxScore = currentScore + 10;
    const scoreRange = maxScore - minScore;

    const handleProgressInteraction = useCallback((clientX: number) => {
        if (!progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = x / rect.width;

        // Map 0-1 to minScore-maxScore
        const rawScore = minScore + percentage * scoreRange;

        // Snap to 0.1
        const roundedScore = Math.round(rawScore * 10) / 10;

        setTargetScore(roundedScore);
    }, [minScore, scoreRange]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation(); // Stop dnd-kit or parent drag
        setIsDragging(true);
        handleProgressInteraction(e.clientX);
    }, [handleProgressInteraction]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                e.stopPropagation();
                handleProgressInteraction(e.clientX);
            }
        };
        const handleMouseUp = (e: MouseEvent) => {
            if (isDragging) {
                e.stopPropagation();
                setIsDragging(false);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleProgressInteraction]);

    // Derived values for UI
    const targetXP = scoreToXP(targetScore);
    const { level: targetLevel } = calculateLevel(targetXP);
    const targetColor = getInterpolatedColor(targetLevel);
    const scoreGradient = getLevelGradient(currentLevel, targetLevel);
    const targetPercent = ((targetScore - minScore) / scoreRange) * 100;

    return {
        // State
        currentScore,
        targetScore,
        setTargetScore,
        period,
        setPeriod,
        isSubmitting,
        isCustomizing,
        setIsCustomizing,
        actionCounts,
        setActionCounts,

        // Protocol Data
        linkedProtocols,
        pointsNeeded,
        getSmartCounts,

        // Handlers
        handleSave,
        handleMouseDown,
        progressBarRef,

        // Colors & Visualization
        currentColor,
        targetColor,
        scoreGradient,
        targetPercent
    };
}
