import React, { useState, useRef, useMemo, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Protocol, Innerface } from './types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faCog, faHistory } from '@fortawesome/free-solid-svg-icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/atoms/Tooltip';
import { renderIcon } from '../../utils/iconMapper';

interface ProtocolRowProps {
    protocol: Protocol;
    innerfaces: Innerface[];
    onLevelUp: (id: string | number) => void;
    onLevelDown: (id: string | number) => void;
    onEdit: (id: string | number) => void;
    isDisabled?: boolean;
}

export const ProtocolRow = React.memo(function ProtocolRow({ protocol, innerfaces, onLevelUp, onLevelDown, onEdit, isDisabled }: ProtocolRowProps) {
    const navigate = useNavigate();
    const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);
    const [feedbackType, setFeedbackType] = useState<'plus' | 'minus' | null>(null);
    const [shake, setShake] = useState<'left' | 'right' | null>(null);
    const rowRef = useRef<HTMLDivElement>(null);

    // Derived states to avoid double-renders on drag start
    const effectiveHoverSide = isDisabled ? null : hoverSide;
    const effectiveFeedbackType = isDisabled ? null : feedbackType;
    const effectiveShake = isDisabled ? null : shake;

    // Resolve targets with memoization to avoid lookups on every render
    const targetInnerfaces = useMemo(() => {
        return protocol.targets
            .map(id => innerfaces.find(i => i.id.toString() === id.toString()))
            .filter((i): i is Innerface => i !== undefined);
    }, [protocol.targets, innerfaces]);

    const handleAction = (direction: '+' | '-') => {
        if (isDisabled) return;
        setHoverSide(direction === '+' ? 'right' : 'left');
        setShake(direction === '+' ? 'right' : 'left');
        setTimeout(() => setShake(null), 300);
        setFeedbackType(direction === '+' ? 'plus' : 'minus');
        setTimeout(() => setFeedbackType(null), 500);

        if (direction === '+') onLevelUp(protocol.id);
        else onLevelDown(protocol.id);
    };

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (isDisabled || feedbackType || !rowRef.current) return;
        const rect = rowRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const center = rect.width / 2;
        const deadZone = 10;
        if (x < center - deadZone) setHoverSide('left');
        else if (x > center + deadZone) setHoverSide('right');
        else setHoverSide(null);
    };

    const handleMouseLeave = () => setHoverSide(null);
    const handleClick = () => {
        if (isDisabled) return;
        if (hoverSide === 'left') handleAction('-');
        else if (hoverSide === 'right') handleAction('+');
    };

    return (
        <div
            ref={rowRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            className={`group relative min-h-[72px] bg-sub-alt border border-transparent rounded-xl overflow-hidden select-none 
                ${isDisabled ? 'cursor-default opacity-90 transition-none' : 'hover:scale-[1.005] cursor-pointer transition-all duration-300'} 
                ${effectiveShake === 'left' ? 'animate-tilt-left' : effectiveShake === 'right' ? 'animate-tilt-right' : ''}`}
        >
            <style>{`
                @keyframes tilt-left { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-1deg); } 75% { transform: rotate(0.5deg); } }
                @keyframes tilt-right { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(1deg); } 75% { transform: rotate(-0.5deg); } }
                .animate-tilt-left { animation: tilt-left 0.3s ease-in-out; }
                .animate-tilt-right { animation: tilt-right 0.3s ease-in-out; }
            `}</style>

            <div className={`absolute inset-0 bg-[radial-gradient(circle_at_100%_50%,_rgba(152,195,121,0.15),_transparent_60%)] transition-opacity duration-300 pointer-events-none z-0 ${effectiveHoverSide === 'right' || effectiveFeedbackType === 'plus' ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,_rgba(202,71,84,0.15),_transparent_60%)] transition-opacity duration-300 pointer-events-none z-0 ${effectiveHoverSide === 'left' || effectiveFeedbackType === 'minus' ? 'opacity-100' : 'opacity-0'}`} />

            {!isDisabled && (
                <>
                    <div className={`absolute inset-0 pointer-events-none transition-all duration-500 ease-out z-0 ${effectiveFeedbackType === 'plus' ? 'opacity-100' : 'opacity-0'}`}
                        style={{ background: `radial-gradient(circle at 100% 50%, rgba(152, 195, 121, 0.3) 0%, transparent 70%)` }} />
                    <div className={`absolute inset-0 pointer-events-none transition-all duration-500 ease-out z-0 ${effectiveFeedbackType === 'minus' ? 'opacity-100' : 'opacity-0'}`}
                        style={{ background: `radial-gradient(circle at 0% 50%, rgba(202, 71, 84, 0.3) 0%, transparent 70%)` }} />
                </>
            )}

            <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 h-full py-2">
                <div className="flex items-center gap-3 min-w-0 pointer-events-none">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg text-xl shrink-0 transition-[margin] duration-300 ml-0 group-hover:ml-4"
                        style={{ backgroundColor: `${protocol.color || '#ffffff'}33`, color: protocol.color || 'var(--text-color)', boxShadow: `0 0 15px ${protocol.color || '#ffffff'}15` }}>
                        {renderIcon(protocol.icon)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-grow mr-4">
                        <div className="flex items-center gap-2">
                            <h3 className={`font-lexend text-base font-medium truncate transition-colors duration-300 ${effectiveFeedbackType === 'plus' ? 'text-[#98c379]' : effectiveFeedbackType === 'minus' ? 'text-[#ca4754]' : effectiveHoverSide === 'right' ? 'text-[#98c379]' : effectiveHoverSide === 'left' ? 'text-[#ca4754]' : 'text-text-primary'}`}>
                                {protocol.title}
                            </h3>
                        </div>
                        {protocol.description && (
                            <p className="text-[10px] text-text-secondary truncate font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                                {protocol.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-center pointer-events-none">
                    <span className={`font-lexend text-xs font-bold tracking-wider transition-all duration-300 ${effectiveFeedbackType === 'plus' ? 'text-[#98c379] opacity-100 scale-125' : effectiveFeedbackType === 'minus' ? 'text-[#ca4754] opacity-100 scale-125' : effectiveHoverSide === 'right' ? 'text-[#98c379] opacity-100 scale-110' : effectiveHoverSide === 'left' ? 'text-[#ca4754] opacity-100 scale-110' : 'text-sub opacity-30 group-hover:text-text-primary group-hover:opacity-100'}`}>
                        {protocol.weight} XP
                    </span>
                </div>

                <div className="flex items-center justify-end gap-3 pointer-events-none w-full pl-2">
                    <div className="flex flex-wrap justify-end gap-1.5 content-center pointer-events-auto">
                        {targetInnerfaces.map((innerface: Innerface) => {
                            const InnerfaceIcon = (
                                <div className="w-6 h-6 rounded-md bg-bg-primary/40 flex items-center justify-center shrink-0 transition-colors hover:bg-bg-primary">
                                    <div className="text-[0.7rem] opacity-80" style={{ color: innerface.color }}> {renderIcon(innerface.icon)} </div>
                                </div>
                            );
                            if (isDisabled) return <div key={innerface.id}>{InnerfaceIcon}</div>;
                            return (
                                <Tooltip key={innerface.id}>
                                    <TooltipTrigger asChild>{InnerfaceIcon}</TooltipTrigger>
                                    <TooltipContent side="top"> <span className="font-lexend text-xs">{innerface.name}</span> </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>

                    <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto pl-2 border-l border-white/5 mr-0 group-hover:mr-4">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/history?protocolId=${protocol.id}`); }}
                            className="w-6 h-6 flex items-center justify-center rounded text-sub hover:text-main transition-colors cursor-pointer" title="History">
                            <FontAwesomeIcon icon={faHistory} className="text-[10px]" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onEdit(protocol.id); }}
                            className="w-6 h-6 flex items-center justify-center rounded text-sub hover:text-main transition-colors cursor-pointer" title="Edit">
                            <FontAwesomeIcon icon={faCog} className="text-[10px]" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="absolute inset-y-0 left-0 w-8 flex items-center justify-center pointer-events-none z-20">
                <FontAwesomeIcon icon={faMinus} className={`transition-all duration-300 ${effectiveFeedbackType === 'minus' ? 'opacity-100 text-[#ca4754] scale-150' : effectiveHoverSide === 'left' ? 'opacity-100 -translate-x-0 text-[#ca4754]' : 'opacity-0 -translate-x-4'}`} />
            </div>
            <div className="absolute inset-y-0 right-0 w-8 flex items-center justify-center pointer-events-none z-20">
                <FontAwesomeIcon icon={faPlus} className={`transition-all duration-300 ${effectiveFeedbackType === 'plus' ? 'opacity-100 text-[#98c379] scale-150' : effectiveHoverSide === 'right' ? 'opacity-100 translate-x-0 text-[#98c379]' : 'opacity-0 translate-x-4'}`} />
            </div>
        </div>
    );
});
