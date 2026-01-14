import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import type { QuickAction } from './types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TooltipPortal } from '../../components/ui/Tooltip';

interface QuickActionCardProps {
    action: QuickAction;
    icon: IconProp;
    onClick?: () => void;
    onDelete?: () => void;
}

export function QuickActionCard({ action, icon, onClick, onDelete }: QuickActionCardProps) {
    const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);
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

    return (
        <TooltipProvider>
            {/* Main Card Container */}
            <div className="group relative h-[70px] bg-sub-alt rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-lg select-none">

                {/* 1. Dynamic Background Gradients */}
                <div
                    className={`absolute inset-0 bg-[radial-gradient(circle_at_100%_50%,_rgba(152,195,121,0.25),_transparent_70%)] transition-opacity duration-300 ${hoverSide === 'right' ? 'opacity-100' : 'opacity-0'}`}
                />
                <div
                    className={`absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,_rgba(202,71,84,0.25),_transparent_70%)] transition-opacity duration-300 ${hoverSide === 'left' ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* 2. Interaction Layer: Buttons (Underneath Visuals) */}
                <div className="absolute inset-0 flex z-10">
                    {/* Left Button */}
                    <button
                        className="flex-1 flex items-center justify-start pl-5 text-sub hover:text-[#ca4754] transition-colors focus:outline-none active:scale-95 duration-150"
                        onMouseEnter={() => setHoverSide('left')}
                        onMouseLeave={() => setHoverSide(null)}
                        onClick={(e) => {
                            e.stopPropagation();
                            console.log('Decrease', action.id);
                        }}
                    >
                        <FontAwesomeIcon icon={faMinus} className="text-sm" />
                    </button>
                    {/* Right Button */}
                    <button
                        className="flex-1 flex items-center justify-end pr-5 text-sub hover:text-[#98c379] transition-colors focus:outline-none active:scale-95 duration-150"
                        onMouseEnter={() => setHoverSide('right')}
                        onMouseLeave={() => setHoverSide(null)}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick?.();
                        }}
                    >
                        <FontAwesomeIcon icon={faPlus} className="text-sm" />
                    </button>
                </div>

                {/* 3. Visual Layer: Text Content (Centered, Wide, Pointer Events None) */}
                {/* w-[180px] allows text to extend over buttons without blocking clicks (due to pointer-events-none) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                    <div className="w-[180px] flex items-center justify-center gap-1.5 text-text-primary font-mono text-[0.8rem] font-bold tracking-tight">
                        <FontAwesomeIcon icon={icon} className="opacity-70 text-xs shrink-0" />
                        <span ref={titleRef} className="truncate text-center">{action.title}</span>
                    </div>

                    <div className={`text-[0.7rem] font-mono transition-colors duration-200 uppercase tracking-wide ${hoverSide === 'right' ? 'text-[#98c379]' :
                        hoverSide === 'left' ? 'text-[#ca4754]' :
                            'text-sub'
                        }`}>
                        {action.xp ? `${action.xp} XP` : action.details}
                    </div>
                </div>

                {/* 4. Neutral Zone Layer: Central Interaction for Tooltip (Blocks Button Clicks in Center) */}
                {/* w-[40px] centered. Captures hover for tooltip. Blocks clicks to underlying buttons. */}
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <div
                            className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[40px] z-30"
                            onMouseEnter={checkTruncation}
                        // No onClick, so it acts as a "dead zone" for clicks, or we could pass click to something else if needed.
                        // User wanted "neutral hover".
                        />
                    </TooltipTrigger>

                    {(action.hover || isTruncated) && (
                        <TooltipPortal>
                            <TooltipContent sideOffset={5} className="z-[100] max-w-[200px] break-words">
                                {isTruncated && (
                                    <div className="font-bold border-b border-sub/50 pb-1 mb-1 text-center">
                                        {action.title}
                                    </div>
                                )}
                                <div className="text-center">{action.hover || action.details}</div>
                            </TooltipContent>
                        </TooltipPortal>
                    )}
                </Tooltip>

                {/* 5. Delete Zone: Top Right Corner Only (Highest Z-Index) */}
                {onDelete && (
                    <div className="absolute top-0 right-0 w-8 h-8 z-50 flex items-start justify-end p-1 group/delete pointer-events-auto">
                        <button
                            className="w-5 h-5 flex items-center justify-center rounded text-sub/50 hover:text-red-500 hover:bg-bg-primary/80 transition-all opacity-0 group-hover/delete:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            title="Remove"
                        >
                            <FontAwesomeIcon icon={faTimes} size="xs" />
                        </button>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
