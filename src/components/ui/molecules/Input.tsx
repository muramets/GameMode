import React, { type InputHTMLAttributes, forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: IconDefinition;
    leftIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', icon, leftIcon, fullWidth = true, ...props }, ref) => {
        return (
            <div className={`relative group ${fullWidth ? 'w-full' : ''}`}>
                {(icon || leftIcon) && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none group-focus-within:text-main transition-colors duration-200">
                        {leftIcon ? leftIcon : (icon && <FontAwesomeIcon icon={icon} className="text-sm" />)}
                    </div>
                )}
                <input
                    ref={ref}
                    className={`
                        w-full bg-sub-alt focus:bg-sub
                        text-text-primary placeholder:text-sub font-mono text-sm
                        rounded-lg outline-none transition-colors duration-200
                        py-2.5 ${(icon || leftIcon) ? 'pl-9 pr-4' : 'px-4'}
                        border border-transparent focus:border-white/5
                        ${className}
                    `}
                    {...props}
                />
            </div>
        );
    }
);

Input.displayName = 'Input';
