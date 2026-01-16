import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/atoms/Card';
import type { Innerface } from '../../../pages/protocols/types';
import { renderIcon } from '../../../utils/iconMapper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faHistory, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { ProgressBar } from '../../../components/ui/atoms/ProgressBar';
import { getScoreColor } from '../../../utils/colorUtils';

import { TruncatedTooltip } from '../../../components/ui/molecules/TruncatedTooltip';

interface InnerfaceCardProps {
    innerface: Innerface;
    onEdit?: () => void;
}

export function InnerfaceCard({ innerface, onEdit }: InnerfaceCardProps) {
    const navigate = useNavigate();
    const score = innerface.currentScore || innerface.initialScore;
    const dynamicColor = getScoreColor(score);

    const handleHistory = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate('/history', { state: { filterInnerfaceId: String(innerface.id) } });
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit?.();
    };

    return (
        <Card className="group relative overflow-hidden p-4 flex flex-col justify-between min-h-[120px] hover:-translate-y-[2px] transition-all duration-300 hover:shadow-lg border border-transparent text-left select-none cursor-default">
            {/* 1. Dynamic Gradient from Score (Radiates from bottom right where score usually is, or center) */}
            {/* Positioning it roughly behind the score area */}
            <div
                className="absolute -right-10 -bottom-10 w-48 h-48 blur-[60px] transition-opacity duration-500 opacity-[0.15] group-hover:opacity-[0.25]"
                style={{
                    background: `radial-gradient(circle, ${dynamicColor} 0%, transparent 70%)`
                }}
            />

            {/* Focused Glow -  Ambient top light */}
            <div
                className="absolute inset-x-0 top-0 h-24 opacity-0 group-hover:opacity-[0.05] transition-all duration-500 ease-out pointer-events-none"
                style={{
                    background: `linear-gradient(to bottom, ${dynamicColor}, transparent)`
                }}
            />

            {/* Header: Icon & Title */}
            <div className="flex items-start justify-between relative z-10 w-full mb-2">
                <div className="flex items-start gap-3 w-full pr-1">
                    {/* Icon */}
                    <div
                        className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform duration-300"
                        style={{ color: innerface.color }}
                    >
                        {renderIcon(innerface.icon)}
                    </div>

                    {/* Title */}
                    <div className="flex flex-col min-w-0 pt-0.5 flex-1 pr-2">
                        <TruncatedTooltip
                            as="h3"
                            text={innerface.name.split('.')[0]}
                            className="font-lexend font-medium text-sm leading-tight text-text-primary truncate w-full"
                        />
                        {innerface.name.split('.')[1] && (
                            <TruncatedTooltip
                                as="p"
                                text={innerface.name.split('.')[1].trim()}
                                className="text-[10px] text-sub font-mono uppercase tracking-wider opacity-60 truncate mt-0.5 group-hover:opacity-100 group-hover:text-text-primary transition-all duration-300 w-full"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Middle: Actions & Score */}
            <div className="relative z-10 mt-auto mb-2 flex items-end justify-between w-full">
                {/* Left: Actions (Only visible on hover) */}
                <div className="flex flex-col gap-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={handleHistory}
                        className="w-10 h-7 flex items-center justify-start text-sub hover:text-main transition-colors duration-200"
                        title="View History"
                    >
                        <FontAwesomeIcon icon={faHistory} className="text-xs" />
                    </button>
                    <button
                        onClick={handleEdit}
                        className="w-10 h-7 flex items-center justify-start text-sub hover:text-main transition-colors duration-200"
                        title="Settings"
                    >
                        <FontAwesomeIcon icon={faCog} className="text-xs" />
                    </button>
                </div>

                {/* Right: Score */}
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        {/* Trend Indicator */}
                        {(() => {
                            const score = innerface.currentScore || innerface.initialScore;
                            const initial = innerface.initialScore || 0;
                            const delta = score - initial;

                            if (Math.abs(delta) <= 0.01) return null;

                            return (
                                <div className={`text-base ${delta > 0 ? 'text-[#98c379]' : 'text-[#ca4754]'} opacity-80 flex items-center`}>
                                    <FontAwesomeIcon icon={delta > 0 ? faArrowUp : faArrowDown} className="text-xs" />
                                </div>
                            );
                        })()}
                        <div
                            className="text-[2rem] font-light font-mono leading-none tracking-tight transition-colors duration-300"
                            style={{ color: dynamicColor }}
                        >
                            {score.toFixed(2)}
                        </div>
                    </div>
                    <span className="text-[9px] font-mono text-sub uppercase tracking-widest opacity-40 mt-1 group-hover:opacity-100 group-hover:text-text-primary transition-all duration-300">
                        Starting Point: {innerface.initialScore}
                    </span>
                </div>
            </div>

            {/* Bottom: Progress Bar */}
            <div className="relative z-10 w-full">
                <ProgressBar
                    current={score}
                    max={10}
                    customColor={dynamicColor}
                    heightClass="h-[4px]"
                    trackColorClass="bg-bg-primary/50"
                />
            </div>
        </Card>
    );
}
