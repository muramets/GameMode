import React, { useRef, useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TooltipPortal } from './Tooltip';

interface OverflowTooltipProps {
    text: string;
    className?: string; // Classes for the text container (should include truncate)
    children?: React.ReactNode; // Optional custom trigger content
}

export function OverflowTooltip({ text, className, children }: OverflowTooltipProps) {
    const textRef = useRef<HTMLDivElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    const checkTruncation = () => {
        const element = textRef.current;
        if (element) {
            setIsTruncated(element.scrollWidth > element.clientWidth);
        }
    };

    // Check on mount and window resize
    useEffect(() => {
        checkTruncation();
        window.addEventListener('resize', checkTruncation);
        return () => window.removeEventListener('resize', checkTruncation);
    }, [text]);

    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <div
                        ref={textRef}
                        className={className}
                        onMouseEnter={checkTruncation}
                    >
                        {children || text}
                    </div>
                </TooltipTrigger>
                {isTruncated && (
                    <TooltipPortal>
                        <TooltipContent>
                            <p className="max-w-[300px] break-words">{text}</p>
                        </TooltipContent>
                    </TooltipPortal>
                )}
            </Tooltip>
        </TooltipProvider>
    );
}
