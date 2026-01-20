import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/atoms/Card';
import type { Innerface } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faHistory, faArrowUp, faArrowDown, faBullseye } from '@fortawesome/free-solid-svg-icons';
import { getTierColor } from '../../../utils/colorUtils';
import { calculateLevel, scoreToXP } from '../../../utils/xpUtils';
import { PowerIcon } from './PowerIcon';
import { TruncatedTooltip } from '../../../components/ui/molecules/TruncatedTooltip';

interface InnerfaceCardProps {
    innerface: Innerface;
    onEdit?: () => void;
    onPlanning?: () => void;
    forceHover?: boolean;
    hasGoal?: boolean;
}

export function InnerfaceCard({ innerface, onEdit, onPlanning, forceHover, hasGoal }: InnerfaceCardProps) {
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
        <Card className={`group relative overflow-hidden p-4 flex flex-col justify-between min-h-[120px] transition-all duration-300 border border-transparent text-left select-none cursor-grab active:cursor-grabbing ${forceHover ? '-translate-y-[2px] shadow-lg' : 'hover:-translate-y-[2px] hover:shadow-lg'}`}>
            {/* 1. Dynamic Gradient from Tier Color */}
            <div
                className={`absolute -right-10 -bottom-10 w-48 h-48 blur-[60px] transition-opacity duration-500 opacity-[0.10] ${forceHover ? 'opacity-[0.20]' : 'group-hover:opacity-[0.20]'}`}
                style={{
                    background: `radial-gradient(circle, ${tierColor} 0%, transparent 70%)`
                }}
            />

            {/* Focused Glow */}
            <div
                className={`absolute inset-x-0 top-0 h-24 opacity-0 transition-all duration-500 ease-out pointer-events-none ${forceHover ? 'opacity-[0.05]' : 'group-hover:opacity-[0.05]'}`}
                style={{
                    background: `linear-gradient(to bottom, ${tierColor}, transparent)`
                }}
            />

            {/* Header: Icon & Title */}
            <div className="flex items-start justify-between relative z-10 w-full mb-1">
                <div className="flex items-start gap-3 w-full pr-1">
                    {/* Icon */}
                    <PowerIcon
                        icon={innerface.icon}
                        color={innerface.color}
                        category={innerface.category}
                        size="w-10 h-10"
                        className={`transition-all duration-300 ${forceHover ? 'scale-105' : 'group-hover:scale-105'}`}
                    />

                    {/* Title */}
                    <div className="flex flex-col min-w-0 pt-0.5 flex-1 pr-2">
                        <TruncatedTooltip
                            as="h3"
                            text={innerface.name}
                            className="font-lexend font-medium text-sm leading-tight text-text-primary truncate w-full"
                        />
                        {innerface.description && (
                            <TruncatedTooltip
                                as="p"
                                text={innerface.description}
                                className={`text-[10px] text-sub font-mono uppercase tracking-wider opacity-60 truncate mt-0.5 transition-all duration-300 w-full ${forceHover ? 'opacity-100 text-text-primary' : 'group-hover:opacity-100 group-hover:text-text-primary'}`}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Middle: Actions & Level Display */}
            <div className="relative z-10 mt-auto mb-3 flex items-end justify-between w-full">
                {/* Left: Actions */}
                <div className="flex flex-col gap-0">
                    {/* History - only on hover */}
                    <button
                        onClick={handleHistory}
                        className={`w-10 h-7 flex items-center justify-start text-sub hover:text-main transition-all duration-200 opacity-0 ${forceHover ? 'opacity-100' : 'group-hover:opacity-100'}`}
                        title="View History"
                    >
                        <FontAwesomeIcon icon={faHistory} className="text-xs" />
                    </button>
                    {/* Settings - only on hover */}
                    <button
                        onClick={handleEdit}
                        className={`w-10 h-7 flex items-center justify-start text-sub hover:text-main transition-all duration-200 opacity-0 ${forceHover ? 'opacity-100' : 'group-hover:opacity-100'}`}
                        title="Settings"
                    >
                        <FontAwesomeIcon icon={faCog} className="text-xs" />
                    </button>
                    {/* Target - always visible when goal set, otherwise on hover */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlanning?.();
                        }}
                        className={`w-10 h-7 flex items-center justify-start transition-all duration-200 
                            ${hasGoal
                                ? 'opacity-100 text-main hover:text-white'
                                : `opacity-0 text-sub hover:text-main ${forceHover ? 'opacity-100' : 'group-hover:opacity-100'}`
                            }`}
                        title={hasGoal ? "View Goal" : "Set Goal"}
                    >
                        <FontAwesomeIcon icon={faBullseye} className="text-xs" />
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
                            <span className={`text-[9px] font-mono text-sub uppercase tracking-widest opacity-40 mb-1 transition-all duration-300 block ${forceHover ? 'text-text-primary opacity-100' : 'group-hover:text-text-primary group-hover:opacity-100'}`}>
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
                <div className={`flex justify-between items-center text-[9px] font-mono text-sub opacity-50 transition-all duration-200 ${forceHover ? 'opacity-100 text-text-primary' : 'group-hover:opacity-100 group-hover:text-text-primary'}`}>
                    <span>{currentLevelXP} / 100 XP</span>
                    <span>{totalXP} Total</span>
                </div>
            </div>

        </Card>
    );
}
