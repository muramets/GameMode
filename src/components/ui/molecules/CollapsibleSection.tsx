import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

interface CollapsibleSectionProps {
    title: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    trailing?: React.ReactNode;
    className?: string;
    variant?: 'default' | 'mini';
}

export function CollapsibleSection({
    title,
    children,
    defaultOpen = true,
    trailing,
    dragHandle,
    className = '',
    variant = 'default'
}: CollapsibleSectionProps & { dragHandle?: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const isMini = variant === 'mini';
    const headerClass = isMini
        ? "text-xs font-bold text-sub hover:text-text-primary uppercase tracking-widest"
        : "text-2xl font-bold text-sub hover:text-text-primary lowercase";

    const iconClass = isMini ? "text-[10px]" : "text-xl";
    const gapClass = isMini ? "gap-2" : "gap-3";
    const mbClass = isMini ? "mb-2" : "mb-4";

    return (
        <div className={`w-full ${className}`}>
            <div className={`flex items-center ${mbClass} group`}>
                {dragHandle && (
                    <div className="mr-2">
                        {dragHandle}
                    </div>
                )}
                <div className="flex-grow flex items-center justify-between">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`flex items-center ${gapClass} ${headerClass} transition-colors duration-200 outline-none`}
                        aria-expanded={isOpen}
                    >
                        <div className={`transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}>
                            <FontAwesomeIcon icon={faChevronDown} className={iconClass} />
                        </div>
                        <span>{title}</span>
                    </button>

                    {trailing && (
                        <div className="flex items-center">
                            {trailing}
                        </div>
                    )}
                </div>
            </div>

            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0'
                    }`}
            >
                <div className={isMini ? "py-0" : "py-1"}>
                    {children}
                </div>
            </div>
        </div>
    );
}
