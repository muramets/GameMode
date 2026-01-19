import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ICON_PRESETS, getMappedIcon } from '../../../utils/iconMapper';

interface IconPickerProps {
    icon: string;
    onChange: (icon: string) => void;
    color?: string; // Optional color to style the selected icon in the trigger/picker
    align?: 'start' | 'center' | 'end';
    sideOffset?: number;
    className?: string; // Additional classes for the trigger button
    triggerContent?: React.ReactNode; // Optional custom trigger content (overrides default)
    width?: string;
    height?: string;
}

export function IconPicker({
    icon,
    onChange,
    color,
    align = 'start',
    sideOffset = 5,
    className = '',
    triggerContent,
    width = 'w-[80px]', // Default width to match modal design
    height = 'h-[42px]'
}: IconPickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
            <Popover.Trigger asChild>
                <div
                    className={`relative group/icon ${isOpen ? 'bg-sub' : 'bg-sub-alt'} rounded-lg ${height} ${width} transition-colors duration-200 hover:bg-sub focus-within:bg-sub border border-transparent focus-within:border-white/5 cursor-pointer flex items-center justify-center ${className}`}
                    onClick={() => setIsOpen(true)}
                >
                    {triggerContent ? triggerContent : (
                        <div
                            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-colors duration-200"
                            style={{ color: color }}
                        >
                            <FontAwesomeIcon icon={getMappedIcon(icon)} className="text-xl" />
                        </div>
                    )}
                </div>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    className="z-[100] p-2 bg-sub-alt/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col gap-2 min-w-[200px] animate-in fade-in zoom-in-95 duration-200"
                    sideOffset={sideOffset}
                    align={align}
                >
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] font-mono text-sub uppercase">Select Icon</span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-sub hover:text-text-primary transition-colors cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                        </button>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                        {ICON_PRESETS.map((preset: string) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                    onChange(preset);
                                    setIsOpen(false);
                                }}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 cursor-pointer ${icon === preset ? 'bg-white/20 text-text-primary ring-1 ring-white/30' : 'text-sub'}`}
                                style={{ color: icon === preset ? color : undefined }}
                                title={preset}
                            >
                                <FontAwesomeIcon icon={getMappedIcon(preset)} className="text-sm" />
                            </button>
                        ))}
                    </div>
                    <Popover.Arrow className="fill-current text-white/10" />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
