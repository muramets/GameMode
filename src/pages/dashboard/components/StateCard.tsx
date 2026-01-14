import { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestion, faCog, faHistory, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { OverflowTooltip } from '../../../components/ui/atoms/OverflowTooltip';
import type { StateData } from './types';
import { renderIcon } from '../../../utils/iconMapper';

interface StateCardProps {
    state: StateData;
    score?: number;
    yesterdayScore?: number;
    color?: string;
    dependencies?: { innerfaces: number; states: number };
    onClick?: () => void;
    onEdit?: () => void;
    onHistory?: () => void;
}

export function StateCard({
    state,
    score = 0,
    yesterdayScore = 0,
    color = '#e2b714',
    dependencies = { innerfaces: 0, states: 0 },
    onClick,
    onEdit,
    onHistory
}: StateCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const percentage = Math.min((score / 10) * 100, 100);
    const change = score - yesterdayScore;

    // Helper to split name and subtext
    const displayName = state.name;
    const displaySubtext = state.subtext;

    // Determine simplified dependency text
    let depText = 'No dependencies';
    if (dependencies.innerfaces > 0 && dependencies.states > 0) {
        depText = `Innerfaces: ${dependencies.innerfaces} States: ${dependencies.states}`;
    } else if (dependencies.innerfaces > 0) {
        depText = `Innerfaces: ${dependencies.innerfaces}`;
    } else if (dependencies.states > 0) {
        depText = `States: ${dependencies.states}`;
    }

    return (
        <div
            ref={cardRef}
            className="group relative overflow-hidden rounded-2xl bg-sub-alt p-6 min-h-[180px] flex flex-col justify-between transition-all duration-300 cursor-pointer hover:-translate-y-[2px] hover:shadow-lg"
            onClick={onClick}
        >
            {/* Ambient Top Gradient - Anchors the color */}
            <div
                className="absolute inset-x-0 top-0 h-40 opacity-0 group-hover:opacity-10 transition-all duration-500 ease-out"
                style={{
                    background: `linear-gradient(to bottom, ${color}, transparent)`
                }}
            />

            {/* Focused Glow - Moves slightly on hover */}
            <div
                className="absolute -top-16 left-1/2 -translate-x-1/2 w-[60%] h-32 blur-[60px] transition-all duration-700 ease-in-out opacity-[0.15] group-hover:opacity-30 group-hover:scale-125 group-hover:-top-12"
                style={{ backgroundColor: color }}
            />

            {/* Header */}
            <div className="flex items-start mb-4 relative z-10">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Icon Container - Clean and flat */}
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[1.2rem] bg-black/20 shrink-0"
                    >
                        {renderIcon(state.icon || '')}
                    </div>

                    {/* Name & Subtext Container */}
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <OverflowTooltip
                            text={displayName}
                            className="text-[17px] font-bold tracking-[0.01em] leading-tight font-mono whitespace-nowrap overflow-hidden text-ellipsis w-full block truncate text-text-primary"
                        />
                        {displaySubtext && (
                            <OverflowTooltip
                                text={displaySubtext}
                                className="text-[11px] text-sub font-medium uppercase tracking-wider opacity-60 group-hover:opacity-100 group-hover:text-text-primary transition-all duration-300 leading-tight font-mono truncate"
                            />
                        )}
                    </div>
                </div>

                {/* Controls - Positioned absolute and lowered to not block title space */}
                <div className="absolute -right-2 top-10 flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out z-20">
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg text-sub hover:text-main transition-colors text-[0.8rem]" title="Info">
                        <FontAwesomeIcon icon={faQuestion} />
                    </button>
                    <button
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-sub hover:text-main transition-colors text-[0.8rem]"
                        title="Edit state"
                        onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                    >
                        <FontAwesomeIcon icon={faCog} />
                    </button>
                    <button
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-sub hover:text-main transition-colors text-[0.8rem]"
                        title="View history"
                        onClick={(e) => { e.stopPropagation(); onHistory?.(); }}
                    >
                        <FontAwesomeIcon icon={faHistory} />
                    </button>
                </div>
            </div>

            {/* Score */}
            <div className="relative z-10 my-2">
                <div className="flex items-baseline gap-2">
                    <span className="text-[3.5rem] font-light leading-none font-mono tracking-tight text-text-primary">
                        {score.toFixed(2)}
                    </span>

                    {Math.abs(change) > 0.001 && (
                        <span className={`text-lg font-medium flex items-center gap-1 opacity-90 ${change > 0 ? 'text-correct' : 'text-error'}`}>
                            <FontAwesomeIcon icon={change > 0 ? faArrowUp : faArrowDown} className="text-[0.8em]" />
                        </span>
                    )}
                </div>

                <div className="text-[0.75rem] text-sub font-mono mt-1 ml-1 flex items-center gap-2 opacity-80">
                    yesterday: {yesterdayScore.toFixed(2)}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-[6px] bg-bg-primary/50 rounded-full overflow-hidden my-4 relative z-10">
                <div
                    className="h-full transition-all duration-500 ease-out rounded-full"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}40`
                    }}
                />
            </div>

            {/* Details Footer */}
            <div className="flex justify-between items-center text-[0.7rem] text-sub font-mono relative z-10 px-1 opacity-70 group-hover:opacity-100 transition-opacity">
                <span>{depText}</span>
                <span className="font-bold">{Math.round(percentage)}%</span>
            </div>
        </div>
    );
}
