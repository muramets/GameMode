import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/atoms/Card';
import type { Innerface } from '../../../pages/protocols/types';
import { renderIcon } from '../../../utils/iconMapper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faHistory, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { getTierColor } from '../../../utils/colorUtils';
import { calculateLevel, scoreToXP } from '../../../utils/xpUtils';

import { TruncatedTooltip } from '../../../components/ui/molecules/TruncatedTooltip';

interface InnerfaceCardProps {
    innerface: Innerface;
    onEdit?: () => void;
}

export function InnerfaceCard({ innerface, onEdit }: InnerfaceCardProps) {
    const navigate = useNavigate();

    // XP Calculation
    const currentScore = innerface.currentScore || innerface.initialScore || 0;
    const totalXP = scoreToXP(currentScore);
    const { level, currentLevelXP, progress } = calculateLevel(totalXP);
    const tierColor = getTierColor(level);

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
            {/* 1. Dynamic Gradient from Tier Color */}
            <div
                className="absolute -right-10 -bottom-10 w-48 h-48 blur-[60px] transition-opacity duration-500 opacity-[0.10] group-hover:opacity-[0.20]"
                style={{
                    background: `radial-gradient(circle, ${tierColor} 0%, transparent 70%)`
                }}
            />

            {/* Focused Glow */}
            <div
                className="absolute inset-x-0 top-0 h-24 opacity-0 group-hover:opacity-[0.05] transition-all duration-500 ease-out pointer-events-none"
                style={{
                    background: `linear-gradient(to bottom, ${tierColor}, transparent)`
                }}
            />

            {/* Header: Icon & Title */}
            <div className="flex items-start justify-between relative z-10 w-full mb-1">
                <div className="flex items-start gap-3 w-full pr-1">
                    {/* Icon */}
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform duration-300"
                        style={{
                            backgroundColor: `${innerface.color || '#ffffff'}33`,
                            color: innerface.color || '#ffffff',
                            boxShadow: `0 0 15px ${innerface.color || '#ffffff'}15`
                        }}
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

            {/* Middle: Actions & Level Display */}
            <div className="relative z-10 mt-auto mb-3 flex items-end justify-between w-full">
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

                {/* Right: Big Level Number */}
                <div className="flex flex-col items-end">
                    <div className="flex items-baseline gap-1">
                        <div className="flex flex-col items-center justify-end relative">
                            {currentScore !== innerface.initialScore && (
                                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold leading-none ${currentScore > innerface.initialScore ? 'text-correct' : 'text-error'}`}>
                                    <FontAwesomeIcon icon={currentScore > innerface.initialScore ? faArrowUp : faArrowDown} />
                                </span>
                            )}
                            <span className="text-[9px] font-mono text-sub uppercase tracking-widest opacity-40 mb-1 group-hover:text-text-primary group-hover:opacity-100 transition-all duration-300 block">
                                Lvl
                            </span>
                        </div>
                        <div
                            className="text-[2.5rem] font-medium font-mono leading-none tracking-tight transition-colors duration-300"
                            style={{ color: tierColor }}
                        >
                            {level}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom: Progress Bar (XP to next level) */}
            <div className="relative z-10 w-full flex flex-col gap-1">
                <div className="h-[4px] bg-bg-primary/50 w-full rounded-full overflow-hidden">
                    <div
                        className="h-full transition-all duration-300 ease-out rounded-full"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: tierColor
                        }}
                    />
                </div>
                {/* XP Detail (Visible on hover or always small) */}
                <div className="flex justify-between items-center text-[9px] font-mono text-sub opacity-50 group-hover:opacity-100 group-hover:text-text-primary transition-all duration-200">
                    <span>{currentLevelXP} / 100 XP</span>
                    <span>{totalXP} Total</span>
                </div>
            </div>
        </Card>
    );
}
