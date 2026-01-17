import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheck
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../../../components/ui/atoms/Tooltip';

interface GroupDropdownProps {
    trigger: (isOpen: boolean) => ReactNode;
    children: ReactNode;
    className?: string;
    width?: string;
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    placement?: string;
    maxHeight?: string;
}

export function GroupDropdown({
    trigger,
    children,
    className = "",
    width = "w-72",
    isOpen: controlledIsOpen,
    onOpenChange,
    placement = "top-full right-0 origin-top-right",
    maxHeight = "max-h-[60vh]"
}: GroupDropdownProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

    // Handle outside clicks for non-controlled mode
    useEffect(() => {
        if (isControlled) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setInternalIsOpen(false);
                onOpenChange?.(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, isControlled, onOpenChange]);

    const toggleOpen = () => {
        const next = !isOpen;
        if (!isControlled) setInternalIsOpen(next);
        onOpenChange?.(next);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div onClick={toggleOpen}>
                {trigger(isOpen)}
            </div>

            <div className={`absolute ${placement} mt-3 ${width} bg-sub-alt/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 z-50 px-1 py-2 transform border border-white/5 divide-y divide-white/5 overflow-hidden ${isOpen ? 'opacity-100 visible translate-y-0 text-sm' : 'opacity-0 invisible -translate-y-2 text-sm'}`}>
                <div className={`${maxHeight} overflow-y-auto custom-scrollbar`}>
                    {children}
                </div>
            </div>
        </div>
    );
}

interface ItemProps {
    label: ReactNode;
    tooltipText?: string;
    isActive: boolean;
    onClick: () => void;
    onIndicatorClick?: (e: React.MouseEvent) => void;
    onIconClick?: () => void;
    icon?: ReactNode;
    style?: React.CSSProperties;
    showIndicator?: boolean;
    showCheck?: boolean;
    className?: string;
    indicatorColor?: string;
}

export function Item({
    label,
    tooltipText,
    isActive,
    onClick,
    onIndicatorClick,
    onIconClick,
    icon,
    style,
    showIndicator = true,
    showCheck = false,
    className = "",
    indicatorColor
}: ItemProps) {
    return (
        <div
            className={`flex items-center rounded-xl transition-all group/item-container mx-0.5 ${isActive ? 'bg-sub/30 text-text-primary' : 'text-sub hover:bg-sub/20 hover:text-text-primary'} ${className}`}
            style={style}
        >
            {showIndicator && (
                <button
                    onClick={(e) => {
                        if (onIndicatorClick) {
                            e.stopPropagation();
                            onIndicatorClick(e);
                        }
                    }}
                    type="button"
                    disabled={!onIndicatorClick}
                    className="w-8 h-8 flex items-center justify-center transition-all shrink-0 group/indicator cursor-pointer ml-1"
                >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center transition-all group-hover/indicator:bg-white/10">
                        <div
                            className={`w-3.5 h-3.5 rounded-full transition-all ${isActive
                                ? 'bg-main shadow-[0_0_8px_var(--main-color)]'
                                : 'bg-sub/20 border border-transparent group-hover/item-container:border-sub/40'
                                }`}
                            style={!isActive && indicatorColor ? { backgroundColor: indicatorColor, opacity: 0.8 } : (isActive && indicatorColor ? { backgroundColor: indicatorColor, boxShadow: `0 0 10px ${indicatorColor}` } : undefined)}
                        />
                    </div>
                </button>
            )}

            <button
                onClick={onClick}
                type="button"
                className={`flex-1 flex items-center gap-3 py-2.5 min-w-0 ${showIndicator ? (icon ? 'pr-2 pl-1' : 'pr-3 pl-1') : (icon ? 'pr-2 pl-3' : 'px-3')}`}
            >
                <TooltipProvider delayDuration={400}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="flex-1 text-left lowercase truncate font-mono text-[11px]">{label}</span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px] font-mono">
                            {tooltipText || (typeof label === 'string' ? label : '')}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {icon && (
                    <div
                        className="w-8 flex items-center justify-center transition-colors shrink-0"
                        onClick={(e) => {
                            if (onIconClick) {
                                e.stopPropagation();
                                onIconClick();
                            }
                        }}
                    >
                        {icon}
                    </div>
                )}

                {showCheck && isActive && (
                    <FontAwesomeIcon icon={faCheck} className="text-main text-[10px] shrink-0" />
                )}
            </button>
        </div>
    );
}

GroupDropdown.Item = Item;
