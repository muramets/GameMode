import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../atoms/Tooltip';

export const TruncatedTooltip = ({ text, className, as: Component = 'div' }: { text: string, className?: string, as?: React.ElementType }) => {
    const [isTruncated, setIsTruncated] = useState(false);

    const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
        const element = e.currentTarget;
        setIsTruncated(element.scrollWidth > element.clientWidth);
    };

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Component
                        className={`${className} truncate pointer-events-auto cursor-pointer`}
                        onMouseEnter={handleMouseEnter}
                    >
                        {text}
                    </Component>
                </TooltipTrigger>
                {isTruncated && (
                    <TooltipContent side="top" align="start">
                        <span className="font-lexend text-xs text-text-primary max-w-[300px] break-words block">
                            {text}
                        </span>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
};
