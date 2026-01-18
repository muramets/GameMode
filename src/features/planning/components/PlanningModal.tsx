import React, { useState, useEffect, useRef } from 'react';
import type { Innerface } from '../../innerfaces/types';
import { useScoreContext } from '../../../contexts/ScoreProvider';
import { usePlanningStore } from '../../../stores/planningStore';
import { useAuth } from '../../../contexts/AuthProvider';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { Modal } from '../../../components/ui/molecules/Modal';
import { Button } from '../../../components/ui/atoms/Button';
import { getInterpolatedColor, getLevelGradient } from '../../../utils/colorUtils';
import { renderIcon } from '../../../utils/iconMapper';
import { calculateLevel, scoreToXP } from '../../../utils/xpUtils';
import type { PlanningPeriod } from '../types';

interface PlanningModalProps {
    innerface: Innerface;
    isOpen: boolean;
    onClose: () => void;
}

const PERIODS: PlanningPeriod[] = ['week', 'month', 'quarter', 'year'];

const PERIOD_LABELS: Record<PlanningPeriod, string> = {
    'week': 'Week',
    'month': 'Month',
    'quarter': '3 Months',
    'year': 'Year'
};

export function PlanningModal({ innerface, isOpen, onClose }: PlanningModalProps) {
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

    // Interactive Progress Bar Refs
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
                // Reset to defaults
                setIsCustomizing(false);
                setActionCounts({});
                const defaultBalance: Record<string, number> = {};
                (innerface.protocolIds || []).forEach(pid => {
                    defaultBalance[pid] = 1.0;
                });
                setBalance(defaultBalance);
            }
        }
    }, [isOpen, innerface.id, innerface.protocolIds, goals, currentScore]);

    const linkedProtocols = protocols.filter(p => {
        const fromInnerface = (innerface.protocolIds || []).map(String).includes(p.id.toString());
        const fromProtocol = (p.targets || []).map(String).includes(innerface.id.toString());
        return fromInnerface || fromProtocol;
    });

    // Smart algorithm: find optimal combination closest to goal
    const getSmartCounts = () => {
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
    };

    const handleSave = async () => {
        if (!user || !activePersonalityId) return;
        setIsSubmitting(true);
        try {
            // Determine which counts to save: custom or smart
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

    const handleProgressInteraction = (clientX: number) => {
        if (!progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = x / rect.width;

        // Map 0-1 to minScore-maxScore
        const rawScore = minScore + percentage * scoreRange;

        // Snap to 0.1
        const roundedScore = Math.round(rawScore * 10) / 10;

        setTargetScore(roundedScore);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation(); // Stop dnd-kit or parent drag
        setIsDragging(true);
        handleProgressInteraction(e.clientX);
    };

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
    }, [isDragging, currentScore]);

    // Prevent drag propagation on range inputs
    const stopPropagation = (e: React.PointerEvent | React.MouseEvent) => {
        e.stopPropagation();
    };

    const pointsNeeded = Math.max(0, targetScore - currentScore);
    // Use same calculation as currentLevel for consistency
    const targetXP = scoreToXP(targetScore);
    const { level: targetLevel } = calculateLevel(targetXP);
    const targetColor = getInterpolatedColor(targetLevel);
    const scoreGradient = getLevelGradient(currentLevel, targetLevel);

    // Progress calculation for visual bar (relative to range)
    // 0% = currentScore, 100% = currentScore + 10
    const targetPercent = ((targetScore - minScore) / scoreRange) * 100;

    const SectionLabel = ({ label }: { label: string }) => (
        <label className="text-[10px] uppercase tracking-wider font-bold text-main mb-2 block">
            {label}
        </label>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Start Planning`}
            onSubmit={handleSave}
            footer={
                <div className="flex items-center justify-end gap-3 w-full">
                    <Button
                        variant="neutral"
                        size="sm"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-[10px] uppercase tracking-wider font-bold px-4 py-2 !transition-none"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSave}
                        isLoading={isSubmitting}
                        className="text-[10px] uppercase tracking-wider font-bold px-6 py-2 shadow-[0_0_15px_rgba(226,183,20,0.2)]"
                    >
                        Save Plan
                    </Button>
                </div>
            }
        >
            <div
                className="flex flex-col gap-8 px-1"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >

                {/* 1. Target Goal (Interactive Bar) */}
                <div>
                    <SectionLabel label="Target Goal" />
                    <div className="flex flex-col gap-4 bg-sub-alt/20 rounded-xl p-5 border border-white/5 relative overflow-hidden group">

                        {/* Header Stats */}
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col relative">
                                {/* Blur Effect for Current */}
                                <div
                                    className="absolute -inset-4 blur-xl opacity-20 transition-colors duration-500"
                                    style={{ backgroundColor: currentColor }}
                                />
                                <span className="text-[10px] uppercase text-sub font-mono tracking-wider relative z-10">Current</span>
                                <span
                                    className="text-xl font-mono relative z-10"
                                    style={{ color: currentColor }}
                                >
                                    {currentScore.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex flex-col items-end relative">
                                {/* Blur Effect for Target */}
                                <div
                                    className="absolute -inset-4 blur-xl opacity-20 transition-colors duration-300"
                                    style={{ backgroundColor: targetColor }}
                                />
                                <span className="text-[10px] uppercase text-sub font-mono tracking-wider relative z-10">Target</span>
                                <span
                                    className="text-3xl font-mono font-bold transition-colors duration-300 relative z-10"
                                    style={{ color: targetColor }}
                                >
                                    {targetScore.toFixed(1)}
                                </span>
                            </div>
                        </div>

                        {/* Interactive Bar */}
                        <div
                            className="relative h-8 w-full cursor-pointer touch-none py-2 z-10"
                            onMouseDown={handleMouseDown}
                            onPointerDown={stopPropagation}
                            ref={progressBarRef}
                        >
                            {/* Track Background */}
                            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-sub-alt rounded-full overflow-hidden" />

                            {/* Active Fill - Gradient from left edge to thumb */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full pointer-events-none left-0"
                                style={{
                                    width: `${targetPercent}%`,
                                    background: scoreGradient,
                                    boxShadow: `0 0 10px ${targetColor}40`
                                }}
                            />

                            {/* Thumb / Handle */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 pointer-events-none group-hover:scale-110"
                                style={{
                                    left: `${targetPercent}%`,
                                    borderColor: targetColor,
                                    marginLeft: '-10px'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Timeframe */}
                <div>
                    <SectionLabel label="Timeframe" />
                    <div className="grid grid-cols-4 gap-2">
                        {PERIODS.map(p => {
                            const isActive = period === p;
                            return (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPeriod(p)}
                                    className={`
                                        inline-flex items-center justify-center rounded-lg font-medium text-[10px] font-mono uppercase tracking-wide px-2 py-2.5
                                        ${isActive
                                            ? 'bg-main text-bg-primary'
                                            : 'bg-sub-alt text-text-primary hover:bg-text-primary hover:text-bg-primary'
                                        }
                                    `}
                                >
                                    {PERIOD_LABELS[p]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Stats Projection */}
                <div className="relative overflow-hidden rounded-xl bg-sub-alt/30 p-4">
                    <div className="flex flex-col gap-2">
                        <div className="text-[10px] text-sub font-mono uppercase tracking-wider">
                            Projection
                        </div>
                        {(() => {
                            // Calculate target date based on period
                            const now = new Date();
                            const targetDate = new Date(now);
                            if (period === 'week') targetDate.setDate(now.getDate() + 7);
                            else if (period === 'month') targetDate.setMonth(now.getMonth() + 1);
                            else if (period === 'quarter') targetDate.setMonth(now.getMonth() + 3);
                            else if (period === 'year') targetDate.setFullYear(now.getFullYear() + 1);

                            // Include year if target is in next year
                            const includeYear = targetDate.getFullYear() !== now.getFullYear();
                            const dateStr = targetDate.toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                ...(includeYear ? { year: 'numeric' } : {})
                            });

                            return (
                                <p className="text-sm text-text-primary leading-relaxed">
                                    To reach <span className="font-mono font-bold" style={{ color: targetColor }}>{targetScore.toFixed(1)}</span>
                                    {' '}by {dateStr}
                                    {' '}you need <span className="font-mono font-bold text-white">+{Math.round(pointsNeeded * 100)}</span> XP
                                </p>
                            );
                        })()}
                    </div>
                </div>

                {/* 4. Action Plan - Smart Calculator */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <SectionLabel label="Actions" />
                        {isCustomizing && (
                            <button
                                type="button"
                                onClick={() => setIsCustomizing(false)}
                                className="flex items-center gap-1 text-[10px] font-mono text-sub hover:text-main transition-colors"
                                title="Sync with target"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Sync
                            </button>
                        )}
                    </div>

                    {linkedProtocols.length > 0 ? (
                        <>
                            {/* XP Progress Bar */}
                            {(() => {
                                const xpNeeded = Math.round(pointsNeeded * 100);

                                // Use smart counts if not customizing, otherwise use manual
                                const smartCounts = getSmartCounts();
                                const displayCounts = isCustomizing ? actionCounts : smartCounts;

                                // Calculate current XP
                                const currentXP = linkedProtocols.reduce((sum, p) => {
                                    const count = displayCounts[p.id] || 0;
                                    const xp = Math.round((p.weight || 0.1) * 100);
                                    return sum + (count * xp);
                                }, 0);

                                const isGoalMet = currentXP >= xpNeeded;

                                return (
                                    <>
                                        <div className="mb-3 p-3 rounded-xl bg-sub-alt/30">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-sub font-mono uppercase tracking-wider">
                                                    {isCustomizing ? 'Your Plan' : 'Smart Plan'}
                                                </span>
                                                <span className={`text-sm font-mono font-bold ${isGoalMet ? 'text-green-400' : 'text-main'}`}>
                                                    {currentXP}/{xpNeeded} XP {isGoalMet ? '✓' : ''}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action List */}
                                        <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                                            {linkedProtocols
                                                .sort((a, b) => ((b.weight || 0.1) * 100) - ((a.weight || 0.1) * 100))
                                                .map(p => {
                                                    const xp = Math.round((p.weight || 0.1) * 100);
                                                    const count = displayCounts[p.id] || 0;
                                                    const isNeeded = count > 0;
                                                    const iconColor = p.color || 'var(--main-color)';

                                                    // Handler that auto-switches to custom mode
                                                    const handleCountChange = (delta: number) => {
                                                        if (!isCustomizing) {
                                                            // First click: initialize from smart and switch to custom
                                                            setActionCounts({ ...smartCounts });
                                                            setIsCustomizing(true);
                                                        }
                                                        setActionCounts(prev => ({
                                                            ...prev,
                                                            [p.id]: Math.max(0, Math.min(10, (prev[p.id] ?? smartCounts[p.id] ?? 0) + delta))
                                                        }));
                                                    };

                                                    return (
                                                        <div
                                                            key={p.id}
                                                            className={`group flex items-center justify-between p-2.5 rounded-xl transition-all duration-300
                                                            ${isNeeded
                                                                    ? 'bg-sub-alt/30 hover:bg-sub-alt/40 hover:-translate-y-0.5 hover:shadow-lg'
                                                                    : 'bg-sub-alt/10 opacity-60 hover:opacity-80'
                                                                }`}
                                                        >
                                                            {/* Left: Icon and info */}
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <div className="relative w-8 h-8 flex-shrink-0 rounded-lg overflow-hidden">
                                                                    {isNeeded && (
                                                                        <div
                                                                            className="absolute inset-0 blur-sm opacity-40"
                                                                            style={{ backgroundColor: iconColor }}
                                                                        />
                                                                    )}
                                                                    <div
                                                                        className="relative w-full h-full rounded-lg flex items-center justify-center bg-black/30"
                                                                        style={{ color: isNeeded ? iconColor : 'var(--sub-color)' }}
                                                                    >
                                                                        {renderIcon(p.icon)}
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className={`text-xs font-medium truncate ${isNeeded ? 'text-text-primary' : 'text-sub'}`}>
                                                                        {p.title}
                                                                    </span>
                                                                    <span className="text-[9px] text-sub">
                                                                        +{xp} XP each
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Right: Always show controls */}
                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCountChange(-1)}
                                                                    onMouseDown={stopPropagation}
                                                                    className="w-6 h-6 rounded flex items-center justify-center text-sub hover:text-text-primary hover:bg-sub-alt/50 text-xs"
                                                                >
                                                                    −
                                                                </button>
                                                                <span className={`w-6 text-center text-sm font-mono font-medium ${count > 0 ? 'text-main' : 'text-sub'}`}>
                                                                    {count}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCountChange(1)}
                                                                    onMouseDown={stopPropagation}
                                                                    className="w-6 h-6 rounded flex items-center justify-center text-sub hover:text-text-primary hover:bg-sub-alt/50 text-xs"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </>
                                );
                            })()}
                        </>
                    ) : (
                        <div className="group py-8 text-center border border-dashed border-sub/30 hover:border-sub rounded-xl cursor-default select-none">
                            <span className="text-sm font-mono text-sub opacity-70 group-hover:opacity-100 group-hover:text-text-primary transition-opacity">
                                <span className="font-bold text-main/80 group-hover:text-main">Tip:</span> link actions in Power Settings
                            </span>
                        </div>
                    )}
                </div>

            </div>
        </Modal >
    );
}
