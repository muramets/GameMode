import type { Innerface } from '../../innerfaces/types';
import { Modal } from '../../../components/ui/molecules/Modal';
import { Button } from '../../../components/ui/atoms/Button';
import type { PlanningPeriod } from '../types';
import { usePlanningLogic } from '../hooks/usePlanningLogic';
import { PlanningActionList } from './PlanningActionList';

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

const SectionLabel = ({ label }: { label: string }) => (
    <label className="text-[10px] uppercase tracking-wider font-bold text-main mb-2 block">
        {label}
    </label>
);

export function PlanningModal(props: PlanningModalProps) {
    const {
        // State
        currentScore,
        targetScore,
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
    } = usePlanningLogic(props);

    // Prevent drag propagation on range inputs
    const stopPropagation = (e: React.PointerEvent | React.MouseEvent) => {
        e.stopPropagation();
    };



    return (
        <Modal
            isOpen={props.isOpen}
            onClose={props.onClose}
            title={`Start Planning`}
            onSubmit={handleSave}
            footer={
                <div className="flex items-center justify-end gap-3 w-full">
                    <Button
                        variant="neutral"
                        size="sm"
                        onClick={props.onClose}
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
                onPointerDown={stopPropagation}
                onMouseDown={stopPropagation}
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

                    <PlanningActionList
                        linkedProtocols={linkedProtocols}
                        isCustomizing={isCustomizing}
                        actionCounts={actionCounts}
                        smartCounts={getSmartCounts()}
                        setActionCounts={setActionCounts}
                        setIsCustomizing={setIsCustomizing}
                        pointsNeeded={pointsNeeded}
                    />
                </div>

            </div>
        </Modal >
    );
}
