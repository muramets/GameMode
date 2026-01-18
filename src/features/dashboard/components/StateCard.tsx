import { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faHistory, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { OverflowTooltip } from '../../../components/ui/atoms/OverflowTooltip';
import type { StateData } from '../types';
import { renderIcon } from '../../../utils/iconMapper';
import { getTierColor } from '../../../utils/colorUtils';
import { calculateLevel, scoreToXP } from '../../../utils/xpUtils';

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
    onClick,
    onEdit,
    onHistory
}: StateCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    // XP / Level Calculation
    const totalXP = scoreToXP(score);
    const { level, currentLevelXP, progress } = calculateLevel(totalXP);
    const tierColor = getTierColor(level);

    // Display Color
    const displayColor = tierColor;

    // Trend calculation
    const change = score - yesterdayScore;

    // Helper to split name and subtext
    const displayName = state.name;
    const displaySubtext = state.subtext;

    // Determine simplified dependency text
    const innerfaceCount = state.innerfaceIds?.length || 0;
    const protocolCount = state.protocolIds?.length || 0;
    const stateCount = state.stateIds?.length || 0;

    let depText = 'No dependencies';
    const parts = [];
    if (innerfaceCount > 0) parts.push(`${innerfaceCount} Innerfaces`);
    if (protocolCount > 0) parts.push(`${protocolCount} Protocols`);
    if (stateCount > 0) parts.push(`${stateCount} States`);

    if (parts.length > 0) depText = parts.join(', ');

    return (
        <div
            ref={cardRef}
            className="group relative overflow-hidden rounded-2xl bg-sub-alt p-6 min-h-[180px] flex flex-col justify-between transition-all duration-300 cursor-pointer hover:-translate-y-[2px] hover:shadow-lg border border-transparent"
            onClick={onClick}
        >
            {/* Ambient Top Gradient - Anchors the color */}
            <div
                className="absolute inset-x-0 top-0 h-40 opacity-0 group-hover:opacity-10 transition-all duration-500 ease-out"
                style={{
                    background: `linear-gradient(to bottom, ${displayColor}, transparent)`
                }}
            />

            {/* Focused Glow - Moves slightly on hover */}
            <div
                className="absolute -top-16 left-1/2 -translate-x-1/2 w-[60%] h-32 blur-[60px] transition-all duration-700 ease-in-out opacity-[0.10] group-hover:opacity-20 group-hover:scale-125 group-hover:-top-12"
                style={{ backgroundColor: displayColor }}
            />

            {/* Header */}
            <div className="flex items-start mb-4 relative z-10">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Icon Container - Clean and flat */}
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[1.2rem] shrink-0 relative z-20 transition-colors duration-300"
                        style={{
                            backgroundColor: `color-mix(in srgb, ${state.color || '#ffffff'} 20%, transparent)`,
                            color: state.color || '#ffffff',
                            boxShadow: `0 0 15px color-mix(in srgb, ${state.color || '#ffffff'} 8%, transparent)` // Subtle glow to separate from background
                        }}
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
            </div>

            {/* Middle: Actions & Level Display */}
            <div className="relative z-10 my-2 flex items-end justify-between w-full">
                {/* Left: Level Display */}
                <div className="flex items-baseline gap-2">
                    <span className="text-[9px] font-mono text-sub uppercase tracking-widest opacity-40 mb-1 transition-all duration-300 group-hover:text-text-primary group-hover:opacity-100">
                        Lvl
                    </span>
                    <span
                        className="text-[3.5rem] font-light leading-none font-mono tracking-tight transition-colors duration-300"
                        style={{ color: displayColor }}
                    >
                        {level}
                    </span>

                    {Math.abs(change) > 0.001 && (
                        <span className={`text-lg font-medium flex items-center gap-1 opacity-90 ${change > 0 ? 'text-correct' : 'text-error'}`}>
                            <FontAwesomeIcon icon={change > 0 ? faArrowUp : faArrowDown} className="text-[0.8em]" />
                        </span>
                    )}
                </div>

                {/* Right: Actions (Only visible on hover) */}
                <div className="flex flex-col gap-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-end">
                    <button
                        className="w-7 h-7 flex items-center justify-end text-sub hover:text-main transition-colors text-[0.8rem]"
                        title="View history"
                        onClick={(e) => {
                            e.stopPropagation();
                            onHistory?.();
                        }}
                    >
                        <FontAwesomeIcon icon={faHistory} />
                    </button>
                    <button
                        className="w-7 h-7 flex items-center justify-end text-sub hover:text-main transition-colors text-[0.8rem]"
                        title="Edit state"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.();
                        }}
                    >
                        <FontAwesomeIcon icon={faCog} />
                    </button>
                </div>
            </div>

            {/* Progress Bar Section */}
            <div className="relative z-10 my-4 flex flex-col gap-1.5">
                <div className="text-[0.75rem] text-sub font-mono ml-1 opacity-70 transition-all duration-300 group-hover:text-text-primary group-hover:opacity-100">
                    {currentLevelXP}% to next level
                </div>
                <div className="w-full h-[6px] bg-bg-primary/50 rounded-full overflow-hidden">
                    <div
                        className="h-full transition-all duration-500 ease-out rounded-full"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: displayColor,
                            boxShadow: `0 0 10px color-mix(in srgb, ${displayColor} 25%, transparent)`
                        }}
                    />
                </div>
            </div>

            {/* Details Footer */}
            <div className="flex justify-between items-center text-[0.7rem] text-sub font-mono relative z-10 px-1 opacity-70 group-hover:opacity-100  transition-all duration-300 group-hover:text-text-primary">
                <span>{depText}</span>
            </div>
        </div>
    );
}
