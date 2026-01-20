import React, { useState, useRef, useMemo, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Protocol } from '../types';
import type { Innerface } from '../../innerfaces/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faCog, faHistory } from '@fortawesome/free-solid-svg-icons';
import { TruncatedTooltip } from '../../../components/ui/molecules/TruncatedTooltip';
import { AppIcon } from '../../../components/ui/atoms/AppIcon';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/atoms/Tooltip'; // Keep Tooltip import for other usages

// Set to true to visualize layout containers during development/debugging
const DEBUG_LAYOUT = false;

interface ProtocolRowProps {
    protocol: Protocol;
    innerfaces: Innerface[];
    onLevelUp: (id: string | number) => void;
    onLevelDown: (id: string | number) => void;
    onEdit: (id: string | number) => void;
    isDisabled?: boolean; // For Dragging: disable ALL interactions
    isReadOnly?: boolean; // For Role Mode: disable Check-ins, but allow Hover/Edit
}

export const ProtocolRow = React.memo(function ProtocolRow({ protocol, innerfaces, onLevelUp, onLevelDown, onEdit, isDisabled, isReadOnly }: ProtocolRowProps) {
    const navigate = useNavigate();
    const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);
    const [feedbackType, setFeedbackType] = useState<'plus' | 'minus' | null>(null);
    const [shake, setShake] = useState<'left' | 'right' | null>(null);
    const rowRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Derived states to avoid double-renders on drag start
    // If ReadOnly: hoverSide is null (no swipes), but we still allow component hover (isHovered)
    const effectiveHoverSide = (isDisabled || isReadOnly) ? null : hoverSide;
    const effectiveFeedbackType = (isDisabled || isReadOnly) ? null : feedbackType;
    const effectiveShake = (isDisabled || isReadOnly) ? null : shake;

    // Resolve targets with memoization to avoid lookups on every render
    const targetInnerfaces = useMemo(() => {
        return protocol.targets
            .map(id => innerfaces.find(i => i.id.toString() === id.toString()))
            .filter((i): i is Innerface => i !== undefined);
    }, [protocol.targets, innerfaces]);

    const handleAction = (direction: '+' | '-') => {
        if (isDisabled || isReadOnly) return;
        setHoverSide(direction === '+' ? 'right' : 'left');
        setShake(direction === '+' ? 'right' : 'left');
        setTimeout(() => setShake(null), 300);
        setFeedbackType(direction === '+' ? 'plus' : 'minus');
        setTimeout(() => setFeedbackType(null), 500);

        if (direction === '+') onLevelUp(protocol.id);
        else onLevelDown(protocol.id);
    };

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (isDisabled || isReadOnly || feedbackType || !rowRef.current) return;
        const rect = rowRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const center = rect.width / 2;
        const deadZone = 10;
        if (x < center - deadZone) setHoverSide('left');
        else if (x > center + deadZone) setHoverSide('right');
        else setHoverSide(null);
    };

    const handleMouseLeave = () => {
        setHoverSide(null);
        setIsHovered(false);
    };

    const handleMouseEnter = () => {
        // Allow hover state even in ReadOnly (so we can access Settings), but NOT if Disabled (Dragging)
        if (!isDisabled) setIsHovered(true);
    };

    const handleClick = () => {
        if (isDisabled || isReadOnly) return;
        if (hoverSide === 'left') handleAction('-');
        else if (hoverSide === 'right') handleAction('+');
    };

    return (
        <motion.div
            layout
            ref={rowRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            className={`group relative min-h-[72px] bg-sub-alt border border-transparent rounded-xl overflow-hidden select-none 
                ${isDisabled ? 'cursor-grabbing opacity-90' : isReadOnly ? 'cursor-default' : 'cursor-pointer'} 
                ${effectiveShake === 'left' ? 'animate-tilt-left' : effectiveShake === 'right' ? 'animate-tilt-right' : ''}
                ${DEBUG_LAYOUT ? 'border-dashed border-red-500' : ''}`}
            whileHover={!isDisabled ? { scale: 1.002, backgroundColor: 'var(--sub-alt-color)' } : {}}
            transition={{
                layout: { duration: 0.3, type: "spring", stiffness: 400, damping: 40 },
                scale: { duration: 0.2 }
            }}
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

            <motion.div layout className="relative z-10 grid grid-cols-[1.2fr_auto_1fr] items-center gap-4 px-4 h-full py-2">
                <motion.div layout className={`flex items-center gap-3 min-w-0 pointer-events-none ${DEBUG_LAYOUT ? 'border border-blue-500' : ''}`}>
                    <motion.div layout
                        className="flex items-center justify-center w-10 h-10 rounded-lg text-xl shrink-0"
                        animate={{ marginLeft: isHovered ? 16 : 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        style={{
                            backgroundColor: `color-mix(in srgb, ${protocol.color || '#ffffff'} 20%, transparent)`,
                            color: protocol.color || 'var(--text-color)',
                            boxShadow: `0 0 15px color-mix(in srgb, ${protocol.color || '#ffffff'} 8%, transparent)`
                        }}
                    >
                        <AppIcon id={protocol.icon} />
                    </motion.div>
                    <div className="flex flex-col min-w-0 flex-grow mr-2 overflow-hidden">
                        <div className="flex items-center gap-2 max-w-full">
                            <TruncatedTooltip
                                as="h3"
                                text={protocol.title}
                                className={`font-lexend text-base font-medium truncate transition-colors duration-300 ${effectiveFeedbackType === 'plus' ? 'text-[#98c379]' : effectiveFeedbackType === 'minus' ? 'text-[#ca4754]' : effectiveHoverSide === 'right' ? 'text-[#98c379]' : effectiveHoverSide === 'left' ? 'text-[#ca4754]' : 'text-text-primary'}`}
                            />
                        </div>
                        {protocol.description && (
                            <TruncatedTooltip
                                as="p"
                                text={protocol.description}
                                className="text-[10px] text-sub font-mono opacity-60 group-hover:opacity-100 group-hover:text-text-primary transition-all duration-300 truncate block"
                            />
                        )}
                    </div>
                </motion.div>

                <motion.div layout className={`flex items-center justify-center pointer-events-none ${DEBUG_LAYOUT ? 'border border-yellow-500' : ''}`}>
                    <span className={`font-lexend text-xs font-bold tracking-wider transition-all duration-300 ${effectiveFeedbackType === 'plus' ? 'text-[#98c379] opacity-100 scale-125' : effectiveFeedbackType === 'minus' ? 'text-[#ca4754] opacity-100 scale-125' : effectiveHoverSide === 'right' ? 'text-[#98c379] opacity-100 scale-110' : effectiveHoverSide === 'left' ? 'text-[#ca4754] opacity-100 scale-110' : 'text-sub opacity-30 group-hover:text-text-primary group-hover:opacity-100'}`}>
                        {Math.round(protocol.weight * 100)} XP
                    </span>
                </motion.div>

                <motion.div layout className={`flex items-center justify-end gap-3 pointer-events-none w-full ${DEBUG_LAYOUT ? 'border border-green-500' : ''}`}>
                    <motion.div layout className="flex flex-wrap justify-end gap-1.5 content-center pointer-events-auto min-w-0">
                        {targetInnerfaces.map((innerface: Innerface) => {
                            const InnerfaceIcon = (
                                <div
                                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-transform hover:scale-110 duration-200 pointer-events-auto"
                                    style={{
                                        backgroundColor: `color-mix(in srgb, ${innerface.color || '#ffffff'} 10%, transparent)`,
                                        color: innerface.color || '#ffffff',
                                        boxShadow: `0 0 10px color-mix(in srgb, ${innerface.color || '#ffffff'} 5%, transparent)`
                                    }}
                                >
                                    <div className="text-[0.7rem]"> <AppIcon id={innerface.icon} /> </div>
                                </div>
                            );

                            return (
                                <motion.div
                                    layout
                                    key={innerface.id}
                                    className="pointer-events-none"
                                >
                                    {isDisabled ? (
                                        <div>{InnerfaceIcon}</div>
                                    ) : (
                                        <Tooltip>
                                            <TooltipTrigger asChild>{InnerfaceIcon}</TooltipTrigger>
                                            <TooltipContent side="top"> <span className="font-lexend text-xs">{innerface.name}</span> </TooltipContent>
                                        </Tooltip>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    <motion.div
                        layout
                        className="flex flex-col items-center gap-1 pointer-events-auto overflow-hidden shrink-0"
                        style={{
                            opacity: isHovered ? 1 : 0,
                            width: isHovered ? 32 : 0,
                            marginRight: isHovered ? 8 : 0,
                            pointerEvents: isHovered ? 'auto' : 'none'
                        }}
                    >
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/history?protocolId=${protocol.id}`); }}
                            className="w-6 h-6 flex items-center justify-center rounded text-sub hover:text-main transition-colors cursor-pointer" title="History">
                            <FontAwesomeIcon icon={faHistory} className="text-[10px]" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onEdit(protocol.id); }}
                            className="w-6 h-6 flex items-center justify-center rounded text-sub hover:text-main transition-colors cursor-pointer" title="Edit">
                            <FontAwesomeIcon icon={faCog} className="text-[10px]" />
                        </button>
                    </motion.div>
                </motion.div>
            </motion.div>

            <div className="absolute inset-y-0 left-0 w-8 flex items-center justify-center pointer-events-none z-20">
                <FontAwesomeIcon icon={faMinus} className={`transition-all duration-300 ${effectiveFeedbackType === 'minus' ? 'opacity-100 text-[#ca4754] scale-150' : effectiveHoverSide === 'left' ? 'opacity-100 -translate-x-0 text-[#ca4754]' : 'opacity-0 -translate-x-4'}`} />
            </div>
            <div className="absolute inset-y-0 right-0 w-8 flex items-center justify-center pointer-events-none z-20">
                <FontAwesomeIcon icon={faPlus} className={`transition-all duration-300 ${effectiveFeedbackType === 'plus' ? 'opacity-100 text-[#98c379] scale-150' : effectiveHoverSide === 'right' ? 'opacity-100 translate-x-0 text-[#98c379]' : 'opacity-0 translate-x-4'}`} />
            </div>
        </motion.div>
    );
});
