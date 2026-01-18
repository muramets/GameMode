import React, { useMemo } from 'react';
import type { Protocol } from '../../protocols/types';
import { renderIcon } from '../../../utils/iconMapper';

interface PlanningActionListProps {
    linkedProtocols: Protocol[];
    isCustomizing: boolean;
    actionCounts: Record<string, number>;
    smartCounts: Record<string, number>;
    setActionCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    setIsCustomizing: (value: boolean) => void;
    pointsNeeded: number;
}

export function PlanningActionList({
    linkedProtocols,
    isCustomizing,
    actionCounts,
    smartCounts,
    setActionCounts,
    setIsCustomizing,
    pointsNeeded
}: PlanningActionListProps) {

    // Derived state for the summary header
    const { currentXP, xpNeeded, isGoalMet } = useMemo(() => {
        const xpNeeded = Math.round(pointsNeeded * 100);
        const displayCounts = isCustomizing ? actionCounts : smartCounts;

        const currentXP = linkedProtocols.reduce((sum, p) => {
            const count = displayCounts[p.id] || 0;
            const xp = Math.round((p.weight || 0.1) * 100);
            return sum + (count * xp);
        }, 0);

        return {
            currentXP,
            xpNeeded,
            isGoalMet: currentXP >= xpNeeded
        };
    }, [linkedProtocols, pointsNeeded, isCustomizing, actionCounts, smartCounts]);

    // Prevent drag propagation on range inputs
    const stopPropagation = (e: React.PointerEvent | React.MouseEvent) => {
        e.stopPropagation();
    };

    if (linkedProtocols.length === 0) {
        return (
            <div className="group py-8 text-center border border-dashed border-sub/30 hover:border-sub rounded-xl cursor-default select-none">
                <span className="text-sm font-mono text-sub opacity-70 group-hover:opacity-100 group-hover:text-text-primary transition-opacity">
                    <span className="font-bold text-main/80 group-hover:text-main">Tip:</span> link actions in Power Settings
                </span>
            </div>
        );
    }

    // Sort logic
    const sortedProtocols = [...linkedProtocols].sort((a, b) =>
        ((b.weight || 0.1) * 100) - ((a.weight || 0.1) * 100)
    );

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
                {sortedProtocols.map(p => {
                    const xp = Math.round((p.weight || 0.1) * 100);
                    const count = (isCustomizing ? actionCounts[p.id] : smartCounts[p.id]) || 0;
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
}
