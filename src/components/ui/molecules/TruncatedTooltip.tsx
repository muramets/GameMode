import React, { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../atoms/Tooltip';
import { motion } from 'framer-motion';

export const TruncatedTooltip = ({ text, className, as: Component = 'div' }: { text: string, className?: string, as?: any }) => {
    const [hasTruncated, setHasTruncated] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (isHovered) {
            setIsMounted(true);
        } else {
            const timer = setTimeout(() => {
                setIsMounted(false);
            }, 300); // Wait for exit animation to finish
            return () => clearTimeout(timer);
        }
    }, [isHovered]);

    const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
        const element = e.currentTarget;
        const isCurrentlyTruncated = element.scrollWidth > element.clientWidth;

        if (isCurrentlyTruncated) {
            setHasTruncated(true);
            setIsHovered(true);
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const content = (
        <Component
            className={`${className} pointer-events-auto`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {text}
        </Component>
    );

    if (hasTruncated) {
        return (
            <Tooltip open={isMounted} delayDuration={0}>
                <TooltipTrigger asChild>
                    {content}
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    align="start"
                    className="p-0 border-none bg-transparent shadow-none"
                    sideOffset={10}
                    // ensure we don't block clicks while animating out
                    style={{ pointerEvents: isHovered ? 'auto' : 'none' }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{
                            opacity: isHovered ? 1 : 0,
                            y: isHovered ? 0 : 8,
                            scale: isHovered ? 1 : 0.96
                        }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="bg-[#1e1e1e] px-3 py-1.5 rounded-md shadow-2xl border border-white/5"
                    >
                        <span className="font-lexend text-xs text-text-primary max-w-[300px] break-words block">
                            {text}
                        </span>
                    </motion.div>
                </TooltipContent>
            </Tooltip>
        );
    }

    return content;
};
