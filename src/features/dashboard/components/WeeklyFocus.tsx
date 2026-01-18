import { useMemo, useState } from 'react';
import { usePlanningStore } from '../../../stores/planningStore';
import { useScoreContext } from '../../../contexts/ScoreProvider';
import { renderIcon } from '../../../utils/iconMapper';
import { getWeeklyProgress, getProgressDots } from '../../../utils/weeklyProgressUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/atoms/Tooltip';

const ITEMS_PER_PAGE = 5;

export function WeeklyFocus() {
    const { goals } = usePlanningStore();
    const { protocols, history } = useScoreContext();
    const [currentPage, setCurrentPage] = useState(0);

    // Calculate weekly progress using memoized utility
    const weeklyProgress = useMemo(() => {
        return getWeeklyProgress(goals, history, protocols);
    }, [goals, history, protocols]);

    if (weeklyProgress.length === 0) return null;

    const totalPages = Math.ceil(weeklyProgress.length / ITEMS_PER_PAGE);
    const displayedItems = weeklyProgress.slice(
        currentPage * ITEMS_PER_PAGE,
        (currentPage + 1) * ITEMS_PER_PAGE
    );

    return (
        <div className="flex flex-col items-center gap-3 animate-fade-in cursor-default select-none">
            <span className="text-[10px] font-mono text-sub uppercase tracking-widest opacity-60">
                Weekly Focus
            </span>
            <div className="flex flex-col gap-2 w-full max-w-[200px] min-h-[148px]"> {/* Fixed min-height to prevent layout jump */}
                {displayedItems.map(({ protocol, planned, completed, bonus, isCapped, isLowFrequency, periodLabel, realTarget }) => {
                    const isComplete = completed >= planned;
                    const dots = getProgressDots(planned, completed, 5);

                    // Crown Color Logic:
                    // Green (#98c379) = Complete & Real Goal Met (or no cap)
                    // Orange (#d19a66) = Complete (7/7) but technically Capped (real needed > 7)
                    // Gold (#E2B714) = In Progress
                    const crownColor = isCapped ? '#d19a66' : '#98c379';
                    const progressColor = isComplete ? crownColor : '#E2B714';

                    // Find last check-in note for this protocol
                    const lastRecord = history.find(r =>
                        (r.type === 'protocol' || r.type === 'quick_action') &&
                        String(r.protocolId) === String(protocol.id) &&
                        r.details?.note
                    );
                    const lastNote = lastRecord?.details?.note as string | undefined;

                    return (
                        <div
                            key={protocol.id}
                            className="flex items-center gap-2 animate-fade-in"
                        >
                            {/* Icon with Rich Tooltip */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`w-6 h-6 flex items-center justify-center rounded text-xs transition-all duration-300
                                            ${completed > 0 ? '' : 'grayscale opacity-50'}
                                        `}
                                        style={{
                                            backgroundColor: `${protocol.color || '#ffffff'}33`,
                                            color: protocol.color || 'var(--text-color)',
                                            boxShadow: `0 0 10px ${protocol.color || '#ffffff'}15`
                                        }}
                                    >
                                        {renderIcon(protocol.icon)}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-[200px]">
                                    <div className="flex flex-col gap-2">
                                        <div>
                                            <p className="font-bold text-xs">{protocol.title}</p>
                                            {protocol.description && (
                                                <p className="text-[10px] text-sub text-wrap">{protocol.description}</p>
                                            )}
                                        </div>

                                        {isLowFrequency && (
                                            <div className="pt-2 border-t border-white/10">
                                                <p className="text-[9px] text-sub uppercase tracking-wider mb-0.5">
                                                    Frequency Goal
                                                </p>
                                                <p className="text-[10px] text-main">
                                                    {planned} actions per {periodLabel}
                                                </p>
                                            </div>
                                        )}

                                        {isCapped && (
                                            <div className="pt-2 border-t border-white/10">
                                                <p className="text-[9px] text-[#d19a66] uppercase tracking-wider mb-0.5 font-bold">
                                                    Maximum Effort! 🔥
                                                </p>
                                                <p className="text-[10px] text-sub">
                                                    You're doing 7/7, but your ambitious deadline technically needs <b>{realTarget}/week</b>.
                                                    <br />
                                                    <span className="italic opacity-80">Tip: Extending your target date might make this journey more enjoyable.</span>
                                                </p>
                                            </div>
                                        )}

                                        {lastNote && (
                                            <div className="pt-2 border-t border-white/10">
                                                <p className="text-[9px] text-sub uppercase tracking-wider mb-0.5">Quick Note</p>
                                                <p className="text-[10px] italic text-[#E2B714]">"{lastNote}"</p>
                                            </div>
                                        )}

                                        {/* Progress Summary in Tooltip */}
                                        <div className="pt-2 border-t border-white/10 flex justify-between text-[10px] font-mono">
                                            <span className="text-sub">Progress</span>
                                            <span style={{ color: isComplete ? crownColor : 'var(--text-sub)' }}>
                                                {completed}/{planned} {bonus > 0 && `(+${bonus})`}
                                            </span>
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>

                            {/* Progress Checks (replaced dots) */}
                            <div className="flex items-center gap-0.5 flex-1">
                                {dots.map((dot, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 flex items-center justify-center transition-all duration-300
                                            ${dot.filled
                                                ? '' // Color handled via style
                                                : 'text-sub-alt/30' // Gray check for remaining
                                            }`}
                                        style={dot.filled ? { color: progressColor } : undefined}
                                    >
                                        <span className="text-[8px] leading-none">✓</span>
                                    </div>
                                ))}
                                {/* Show +N if more than maxDots */}
                                {completed > 5 && (
                                    <span className="text-[9px] font-mono text-main ml-1">
                                        +{completed - 5}
                                    </span>
                                )}
                            </div>

                            {/* Status Indicator */}
                            {/* Fixed width for count so crown doesn't shift layout */}
                            <div className="flex items-center gap-1.5 ml-2">
                                <span className={`text-[10px] font-mono w-6 text-right ${isComplete ? 'line-through text-sub opacity-50' : 'text-sub'}`}>
                                    {completed}/{planned}
                                </span>
                                <div className="w-3 flex justify-center">
                                    {isComplete && (
                                        <span className="text-[10px] animate-bounce-subtle" style={{ color: isComplete ? crownColor : '' }} title="Goal Met!">
                                            <FontAwesomeIcon icon={faCrown} />
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination Dots */}
            {totalPages > 1 && (
                <div className="flex gap-1.5 mt-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentPage
                                    ? 'bg-main scale-125'
                                    : 'bg-white/10 hover:bg-white/20'
                                }`}
                        />
                    ))}
                </div>
            )}

            <style>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-2px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s infinite ease-in-out;
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(2px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
