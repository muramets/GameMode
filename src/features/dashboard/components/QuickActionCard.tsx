import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import type { Protocol } from '../../protocols/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TooltipPortal } from '../../../components/ui/atoms/Tooltip';
import { renderIcon } from '../../../utils/iconMapper'; // Need to import this utility

export function QuickActionCard({ action, onAction, onDelete, isDisabled }: { action: Protocol; onAction?: (direction: '+' | '-') => void; onDelete?: () => void; isDisabled?: boolean }) {
    const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);
    const [feedbackType, setFeedbackType] = useState<'plus' | 'minus' | null>(null);
    const [contentFeedbackType, setContentFeedbackType] = useState<'plus' | 'minus' | null>(null);
    const [shake, setShake] = useState<'left' | 'right' | null>(null);
    const titleRef = useRef<HTMLSpanElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    const checkTruncation = () => {
        const element = titleRef.current;
        if (element) {
            setIsTruncated(element.scrollWidth > element.clientWidth);
        }
    };

    useEffect(() => {
        checkTruncation();
        window.addEventListener('resize', checkTruncation);
        return () => window.removeEventListener('resize', checkTruncation);
    }, [action.title]);

    // Derived states to avoid sticking/double-renders (matching ProtocolRow pattern)
    const effectiveHoverSide = isDisabled ? null : hoverSide;
    const effectiveFeedbackType = isDisabled ? null : feedbackType;
    const effectiveContentFeedbackType = isDisabled ? null : contentFeedbackType;
    const effectiveShake = isDisabled ? null : shake;

    const handleAction = (direction: '+' | '-') => {
        if (isDisabled) return;
        // Trigger shake
        setShake(direction === '+' ? 'right' : 'left');
        setTimeout(() => setShake(null), 300);

        // Trigger feedback (Scale/Colors) - 500ms
        setFeedbackType(direction === '+' ? 'plus' : 'minus');
        setTimeout(() => setFeedbackType(null), 500);

        // Trigger content (Icon -> XP) - 800ms (500ms + 300ms transition)
        setContentFeedbackType(direction === '+' ? 'plus' : 'minus');
        setTimeout(() => setContentFeedbackType(null), 800);

        onAction?.(direction);
    };

    return (
        <TooltipProvider>
            {/* Main Card Container - Handles Hover Scale ONLY */}
            <div className={`group relative h-[70px] transition-all duration-300 select-none ${isDisabled ? 'cursor-default opacity-90' : 'hover:scale-[1.03] cursor-pointer'}`}>

                {/* Inner Animation Container - Handles Tilt, Background, & Shadows */}
                <div className={`w-full h-full relative bg-sub-alt rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${effectiveShake === 'left' ? 'animate-tilt-left' : effectiveShake === 'right' ? 'animate-tilt-right' : ''
                    }`}>

                    <style>{`
                        @keyframes tilt-left {
                            0%, 100% { transform: rotate(0deg); }
                            25% { transform: rotate(-1deg); }
                            75% { transform: rotate(0.5deg); }
                        }
                        @keyframes tilt-right {
                            0%, 100% { transform: rotate(0deg); }
                            25% { transform: rotate(1deg); }
                            75% { transform: rotate(-0.5deg); }
                        }
                        .animate-tilt-left { animation: tilt-left 0.3s ease-in-out; }
                        .animate-tilt-right { animation: tilt-right 0.3s ease-in-out; }
                    `}</style>

                    {/* 1. Dynamic Background Gradients */}
                    <div
                        className="absolute inset-0 transition-opacity duration-300"
                        style={{
                            background: `radial-gradient(circle at 100% 50%, rgba(152, 195, 121, 0.4), transparent 70%)`,
                            opacity: effectiveHoverSide === 'right' ? 1 : 0
                        }}
                    />
                    <div
                        className="absolute inset-0 transition-opacity duration-300"
                        style={{
                            background: `radial-gradient(circle at 0% 50%, rgba(202,71,84,0.25), transparent 70%)`,
                            opacity: effectiveHoverSide === 'left' ? 1 : 0
                        }}
                    />

                    {/* 2. Interaction Layer: Buttons (Underneath Visuals) */}
                    <div className="absolute inset-0 flex z-10">
                        {/* Left Button (Decrease) */}
                        <button
                            className="flex-1 flex items-center justify-start pl-5 text-sub transition-colors focus:outline-none duration-150"
                            style={{
                                color: effectiveFeedbackType === 'minus' ? '#ca4754' : effectiveHoverSide === 'left' ? '#ca4754' : undefined,
                                transition: 'color 0.2s ease'
                            }}
                            onMouseEnter={() => setHoverSide('left')}
                            onMouseLeave={() => setHoverSide(null)}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAction('-');
                            }}
                        >
                            <div className={`transition-all duration-300 transform ${effectiveFeedbackType === 'minus' ? 'scale-150' : ''}`}>
                                <FontAwesomeIcon
                                    icon={faMinus}
                                    className={`text-sm transition-all duration-300 ${effectiveFeedbackType === 'minus' ? 'text-[#ca4754]' : ''}`}
                                />
                            </div>
                        </button>
                        {/* Right Button (Increase/Primary) */}
                        <button
                            className="flex-1 flex items-center justify-end pr-5 text-sub transition-colors focus:outline-none duration-150"
                            style={{
                                color: effectiveFeedbackType === 'plus' ? '#98c379' : effectiveHoverSide === 'right' ? '#98c379' : undefined, // Explicit green on hover
                                transition: 'color 0.2s ease'
                            }}
                            onMouseEnter={() => setHoverSide('right')}
                            onMouseLeave={() => setHoverSide(null)}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAction('+');
                            }}
                        >
                            <div className={`transition-all duration-300 transform ${effectiveFeedbackType === 'plus' ? 'scale-150' : ''}`}>
                                <FontAwesomeIcon
                                    icon={faPlus}
                                    className={`text-sm transition-all duration-300 ${effectiveFeedbackType === 'plus' ? 'text-[#98c379]' : ''}`}
                                />
                            </div>
                        </button>
                    </div>

                    {/* 3. Visual Layer: Text Content (Centered, Wide, Pointer Events None) */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                        <motion.div
                            layout
                            animate={{
                                scale: effectiveFeedbackType ? 1.25 : 1,
                                y: effectiveFeedbackType ? -4 : 0
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30
                            }}
                            className="w-[180px] flex items-center justify-center gap-3 text-text-primary font-mono text-[0.8rem] font-bold tracking-tight"
                        >
                            <motion.div
                                layout
                                initial={false}
                                animate={{
                                    backgroundColor: effectiveHoverSide === 'right' ? 'color-mix(in srgb, var(--correct-color) 20%, transparent)' :
                                        effectiveHoverSide === 'left' ? 'color-mix(in srgb, var(--error-color) 20%, transparent)' :
                                            `color-mix(in srgb, ${action.color || '#ffffff'} 20%, transparent)`,
                                    boxShadow: effectiveHoverSide === 'right' ? '0 0 10px color-mix(in srgb, var(--correct-color) 20%, transparent)' :
                                        effectiveHoverSide === 'left' ? '0 0 10px color-mix(in srgb, var(--error-color) 20%, transparent)' :
                                            `0 0 10px color-mix(in srgb, ${action.color || '#ffffff'} 8%, transparent)`,
                                    color: effectiveHoverSide === 'right' ? 'var(--correct-color)' :
                                        effectiveHoverSide === 'left' ? 'var(--error-color)' :
                                            action.color || 'var(--text-primary)'
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30
                                }}
                                className={`rounded-md flex items-center justify-center shrink-0 relative z-20 h-6 w-6`}
                            >
                                <span className={`text-[0.65rem] opacity-90 flex items-center justify-center`}>
                                    {renderIcon(action.icon)}
                                </span>
                            </motion.div>

                            <motion.span
                                layout
                                ref={titleRef}
                                className={`truncate text-center transition-colors duration-300 origin-left ${effectiveFeedbackType === 'plus' || effectiveHoverSide === 'right' ? 'text-correct' : effectiveFeedbackType === 'minus' || effectiveHoverSide === 'left' ? 'text-error' : ''
                                    }`}
                            >
                                {action.title}
                            </motion.span>
                        </motion.div>

                        <div
                            className="text-[0.7rem] font-mono transition-colors duration-300 uppercase tracking-wide truncate max-w-[160px] text-text-secondary opacity-80 group-hover:text-text-primary group-hover:opacity-100"
                        >
                            {/* Show description or group */}
                            <AnimatePresence mode="wait" initial={false}>
                                {effectiveContentFeedbackType ? (
                                    <motion.span
                                        key="xp-feedback"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.2 }}
                                        className={`font-bold ${effectiveContentFeedbackType === 'plus' ? 'text-[#98c379]' : 'text-[#ca4754]'}`}
                                    >
                                        {effectiveContentFeedbackType === 'plus' ? '+' : ''}{action.xp ?? Math.round(action.weight * 100)} XP
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="group-name"
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {action.group || action.description}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Success/Error Ripple Effect Overlay - SPLIT into two to avoid flash */}
                    <div
                        className={`absolute inset-0 pointer-events-none transition-all duration-500 ease-out z-0 ${effectiveFeedbackType === 'plus' ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                            background: `radial-gradient(circle at 85% 50%, rgba(152, 195, 121, 0.2) 0%, transparent 60%)`
                        }}
                    />
                    <div
                        className={`absolute inset-0 pointer-events-none transition-all duration-500 ease-out z-0 ${effectiveFeedbackType === 'minus' ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                            background: `radial-gradient(circle at 15% 50%, rgba(202, 71, 84, 0.2) 0%, transparent 60%)`
                        }}
                    />

                    {/* 4. Neutral Zone Layer: Central Interaction for Tooltip */}
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <div
                                className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[40px] z-30"
                                onMouseEnter={checkTruncation}
                            // "Dead zone" for clicks to allow tooltip hover
                            />
                        </TooltipTrigger>
                        {/* ... tooltip content */}
                        {(action.hover || action.description || isTruncated) && (
                            <TooltipPortal>
                                <TooltipContent sideOffset={5} className="z-[100] max-w-[200px] break-words">
                                    <div className="font-bold border-b border-sub/50 pb-1 mb-1 text-center">
                                        {action.title}
                                    </div>
                                    <div className="text-center text-xs">{action.hover || action.description}</div>
                                </TooltipContent>
                            </TooltipPortal>
                        )}
                    </Tooltip>

                    {/* 5. Delete/Unpin Zone */}
                    {onDelete && (
                        <div className="absolute top-0 right-0 w-8 h-8 z-50 flex items-start justify-end p-1 group/delete pointer-events-auto">
                            <button
                                className={`w-5 h-5 flex items-center justify-center rounded text-sub/50 hover:text-red-500 hover:bg-bg-primary/80 transition-all opacity-0 ${isDisabled ? 'group-hover:opacity-100' : 'group-hover/delete:opacity-100'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                title="Unpin"
                            >
                                <FontAwesomeIcon icon={faTimes} size="xs" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider >
    );
}
