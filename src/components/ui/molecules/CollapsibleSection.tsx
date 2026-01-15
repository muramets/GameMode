import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

interface CollapsibleSectionProps {
    title: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    trailing?: React.ReactNode;
    className?: string;
}

export function CollapsibleSection({
    title,
    children,
    defaultOpen = true,
    trailing,
    className = ''
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`w-full ${className}`}>
            <div className="flex items-center justify-between mb-4 group">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 text-2xl font-bold text-sub hover:text-text-primary transition-colors duration-200 outline-none lowercase"
                    aria-expanded={isOpen}
                >
                    <div className={`transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}>
                        <FontAwesomeIcon icon={faChevronDown} className="text-xl" />
                    </div>
                    <span>{title}</span>
                </button>

                {trailing && (
                    <div className="flex items-center">
                        {trailing}
                    </div>
                )}
            </div>

            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0'
                    }`}
            >
                <div className="py-1">
                    {children}
                </div>
            </div>
        </div>
    );
}
