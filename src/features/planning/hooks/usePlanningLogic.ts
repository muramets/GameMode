import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Innerface } from '../../innerfaces/types';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { usePlanningStore } from '../../../stores/planningStore';
import { useScoreContext } from '../../../contexts/ScoreContext';
import { calculateLevel, scoreToXP } from '../../../utils/xpUtils';
import { getInterpolatedColor, getLevelGradient } from '../../../utils/colorUtils';
import type { PathContext } from '../../../stores/metadata/types';


interface UsePlanningLogicProps {
    innerface: Innerface;
    isOpen: boolean;
    onClose: () => void;
}

export function usePlanningLogic({ innerface, isOpen, onClose }: UsePlanningLogicProps) {
    const { activeContext } = usePersonalityStore();
    const { goals, setGoal, deleteGoal } = usePlanningStore();
    const { protocols } = useScoreContext();

    const currentScore = innerface.currentScore || innerface.initialScore || 0;
    // Use same calculation as InnerfaceCard for color consistency
    const totalXP = scoreToXP(currentScore);
    const { level: currentLevel } = calculateLevel(totalXP);
    const currentColor = getInterpolatedColor(currentLevel);

    // Local State
    const [targetScore, setTargetScore] = useState<number>(currentScore);
    const [balance, setBalance] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [actionCounts, setActionCounts] = useState<Record<string, number>>({});

    // Interactive Progress Bar State
    const progressBarRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const linkedProtocols = useMemo(() => protocols.filter(p => {
        const fromProtocol = (p.targets || []).map(String).includes(innerface.id.toString());
        return fromProtocol;
    }), [protocols, innerface.id]);

    // Reset loop when opening
    useEffect(() => {
        if (isOpen) {
            // "Always open at +1"
            const defaultTarget = Math.round(currentScore + 1);
            setTargetScore(defaultTarget);

            // Check if there is a saved goal
            const existing = goals[innerface.id];
            if (existing) {
                setBalance(existing.balance || {});
                if (existing.targetScore) {
                    setTargetScore(existing.targetScore);
                }
                // Load saved action plan if exists
                if (existing.actionCounts && Object.keys(existing.actionCounts).length > 0) {
                    setIsCustomizing(true);
                    setActionCounts(existing.actionCounts);
                } else {
                    // Fallback for legacy plans without counts
                    setIsCustomizing(false);
                    setActionCounts({});
                }
            } else {
                // NEW: Default to Medium Pace (3/week) for linked protocols
                const defaults: Record<string, number> = {};
                linkedProtocols.forEach(p => {
                    defaults[p.id] = 3; // Medium pace constant
                });

                setIsCustomizing(false);
                setActionCounts(defaults);
                setBalance({});
            }
        }
    }, [isOpen, innerface.id, goals, currentScore, linkedProtocols]); // linkedProtocols is dynamic but derived from contexts, acceptable to track or omit if stable. Ideally omit to avoid loops if protocols change often, but correct React way is include. Logic above uses it only on mount/open.

    const pointsNeeded = Math.max(0, targetScore - currentScore);

    const handleSave = async () => {
        if (!activeContext) return;
        setIsSubmitting(true);
        try {
            // Construct PathContext
            let context: PathContext | null = null;
            if (activeContext.type === 'role') {
                context = { type: 'role', teamId: activeContext.teamId, roleId: activeContext.roleId };
            } else if (activeContext.type === 'viewer') {
                context = { type: 'viewer', targetUid: activeContext.targetUid, personalityId: activeContext.personalityId };
            } else if (activeContext.type === 'personality') {
                context = { type: 'personality', uid: activeContext.uid, pid: activeContext.pid };
            }

            if (context) {
                await setGoal(context, {
                    innerfaceId: innerface.id,
                    targetScore,
                    balance,
                    actionCounts // Always save what is in state
                });
                onClose();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Check if there is an existing plan to allow deletion
    const hasExistingPlan = !!goals[innerface.id];

    const handleDelete = async () => {
        if (!activeContext) return;
        setIsSubmitting(true);
        try {
            let context: PathContext | null = null;
            if (activeContext.type === 'role') {
                context = { type: 'role', teamId: activeContext.teamId, roleId: activeContext.roleId };
            } else if (activeContext.type === 'viewer') {
                context = { type: 'viewer', targetUid: activeContext.targetUid, personalityId: activeContext.personalityId };
            } else if (activeContext.type === 'personality') {
                context = { type: 'personality', uid: activeContext.uid, pid: activeContext.pid };
            }

            if (context) {
                await deleteGoal(context, innerface.id);
                onClose();
            }
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
        isSubmitting,
        isCustomizing,
        setIsCustomizing,
        actionCounts,
        setActionCounts,

        // Protocol Data
        linkedProtocols,
        pointsNeeded,

        // Handlers
        handleSave,
        handleDelete,
        hasExistingPlan,
        handleMouseDown,
        progressBarRef,

        // Colors & Visualization
        currentColor,
        targetColor,
        scoreGradient,
        targetPercent
    };
}
