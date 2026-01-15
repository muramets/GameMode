import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faMinus, faPlus, faCheck } from '@fortawesome/free-solid-svg-icons';
import type { Protocol } from '../../protocols/types'; // Updated import
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TooltipPortal } from '../../../components/ui/atoms/Tooltip';
import { renderIcon } from '../../../utils/iconMapper'; // Need to import this utility

export function QuickActionCard({ action, onAction, onDelete }: { action: Protocol; onAction?: (direction: '+' | '-') => void; onDelete?: () => void }) {
    const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);
    const [feedbackType, setFeedbackType] = useState<'plus' | 'minus' | null>(null);
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

    const handleAction = (direction: '+' | '-') => {
        // Trigger shake
        setShake(direction === '+' ? 'right' : 'left');
        setTimeout(() => setShake(null), 300);

        // Trigger feedback
        setFeedbackType(direction === '+' ? 'plus' : 'minus');
        setTimeout(() => setFeedbackType(null), 1500);

        onAction?.(direction);
    };

    return (
        <TooltipProvider>
            {/* Main Card Container - Handles Hover Scale ONLY */}
            <div className="group relative h-[70px] transition-all duration-300 hover:scale-[1.03] select-none">

                {/* Inner Animation Container - Handles Tilt, Background, & Shadows */}
                <div className={`w-full h-full relative bg-sub-alt rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${shake === 'left' ? 'animate-tilt-left' : shake === 'right' ? 'animate-tilt-right' : ''
                    }`}>

                    <style>{`
                        @keyframes tilt-left {
                            0%, 100% { transform: rotate(0deg); }
                            25% { transform: rotate(-2deg); }
                            75% { transform: rotate(1deg); }
                        }
                        @keyframes tilt-right {
                            0%, 100% { transform: rotate(0deg); }
                            25% { transform: rotate(2deg); }
                            75% { transform: rotate(-1deg); }
                        }
                        .animate-tilt-left { animation: tilt-left 0.3s ease-in-out; }
                        .animate-tilt-right { animation: tilt-right 0.3s ease-in-out; }
                    `}</style>

                    {/* 1. Dynamic Background Gradients */}
                    <div
                        className="absolute inset-0 transition-opacity duration-300"
                        style={{
                            background: `radial-gradient(circle at 100% 50%, rgba(152, 195, 121, 0.4), transparent 70%)`,
                            opacity: hoverSide === 'right' ? 1 : 0
                        }}
                    />
                    <div
                        className="absolute inset-0 transition-opacity duration-300"
                        style={{
                            background: `radial-gradient(circle at 0% 50%, rgba(202,71,84,0.25), transparent 70%)`,
                            opacity: hoverSide === 'left' ? 1 : 0
                        }}
                    />

                    {/* 2. Interaction Layer: Buttons (Underneath Visuals) */}
                    <div className="absolute inset-0 flex z-10">
                        {/* Left Button (Decrease) */}
                        <button
                            className="flex-1 flex items-center justify-start pl-5 text-sub transition-colors focus:outline-none active:scale-95 duration-150"
                            style={{
                                color: feedbackType === 'minus' ? '#ca4754' : hoverSide === 'left' ? '#ca4754' : undefined,
                                transition: 'color 0.2s ease'
                            }}
                            onMouseEnter={() => setHoverSide('left')}
                            onMouseLeave={() => setHoverSide(null)}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAction('-');
                            }}
                        >
                            <div className={`transition-all duration-300 transform ${feedbackType === 'minus' ? 'scale-110' : ''}`}>
                                <FontAwesomeIcon
                                    icon={feedbackType === 'minus' ? faCheck : faMinus}
                                    className={`text-sm transition-all duration-300 ${feedbackType === 'minus' ? 'text-[#ca4754]' : ''}`}
                                />
                            </div>
                        </button>
                        {/* Right Button (Increase/Primary) */}
                        <button
                            className="flex-1 flex items-center justify-end pr-5 text-sub transition-colors focus:outline-none active:scale-95 duration-150"
                            style={{
                                color: feedbackType === 'plus' ? '#98c379' : hoverSide === 'right' ? '#98c379' : undefined, // Explicit green on hover
                                transition: 'color 0.2s ease'
                            }}
                            onMouseEnter={() => setHoverSide('right')}
                            onMouseLeave={() => setHoverSide(null)}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAction('+');
                            }}
                        >
                            <div className={`transition-all duration-300 transform ${feedbackType === 'plus' ? 'scale-110' : ''}`}>
                                <FontAwesomeIcon
                                    icon={feedbackType === 'plus' ? faCheck : faPlus}
                                    className={`text-sm transition-all duration-300 ${feedbackType === 'plus' ? 'text-[#98c379]' : ''}`}
                                />
                            </div>
                        </button>
                    </div>

                    {/* 3. Visual Layer: Text Content (Centered, Wide, Pointer Events None) */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                        <div className="w-[180px] flex items-center justify-center gap-1.5 text-text-primary font-mono text-[0.8rem] font-bold tracking-tight">
                            <span className="opacity-70 text-xs shrink-0 flex items-center justify-center w-4 transition-all duration-300" style={{ transform: feedbackType ? 'scale(1.2)' : 'scale(1)' }}>
                                {feedbackType ? (
                                    <FontAwesomeIcon
                                        icon={feedbackType === 'plus' ? faPlus : faMinus}
                                        className={feedbackType === 'plus' ? "text-[#98c379]" : "text-[#ca4754]"}
                                    />
                                ) : renderIcon(action.icon)}
                            </span>
                            <span ref={titleRef} className={`truncate text-center transition-colors duration-300 ${feedbackType === 'plus' ? 'text-[#98c379]' : feedbackType === 'minus' ? 'text-[#ca4754]' : ''
                                }`}>{action.title}</span>
                        </div>

                        <div
                            className="text-[0.7rem] font-mono transition-colors duration-200 uppercase tracking-wide truncate max-w-[160px]"
                            style={{
                                color: feedbackType === 'plus' ? '#98c379' : feedbackType === 'minus' ? '#ca4754' :
                                    hoverSide === 'right' ? '#98c379' : hoverSide === 'left' ? '#ca4754' : 'var(--text-secondary)'
                            }}
                        >
                            {/* Show description or group */}
                            <span className="opacity-80">{action.group || action.description}</span>
                        </div>
                    </div>

                    {/* Success/Error Ripple Effect Overlay */}
                    <div
                        className={`absolute inset-0 pointer-events-none transition-all duration-500 ease-out z-0 ${feedbackType ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                            background: feedbackType === 'plus'
                                ? `radial-gradient(circle at 85% 50%, rgba(152, 195, 121, 0.2) 0%, transparent 60%)`
                                : `radial-gradient(circle at 15% 50%, rgba(202, 71, 84, 0.2) 0%, transparent 60%)`
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
                                className="w-5 h-5 flex items-center justify-center rounded text-sub/50 hover:text-red-500 hover:bg-bg-primary/80 transition-all opacity-0 group-hover/delete:opacity-100"
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
        </TooltipProvider>
    );
}
