import { useState, useEffect, useRef } from 'react';

/**
 * Hook to suppress tooltips for a short duration after a modal is closed.
 * This prevents focus return from triggering a tooltip when the mouse is elsewhere.
 * 
 * @param isModalOpen Current modal open state
 * @returns boolean Whether tooltips should be suppressed
 */
export function useTooltipSuppression(isModalOpen: boolean) {
    const [suppressTooltip, setSuppressTooltip] = useState(false);
    const wasModalOpen = useRef(isModalOpen);

    useEffect(() => {
        if (wasModalOpen.current && !isModalOpen) {
            // Use setTimeout to avoid synchronous state update in effect warning
            const timer = setTimeout(() => setSuppressTooltip(true), 0);
            const clearTimer = setTimeout(() => setSuppressTooltip(false), 500);
            return () => {
                clearTimeout(timer);
                clearTimeout(clearTimer);
            };
        }
        wasModalOpen.current = isModalOpen;
    }, [isModalOpen]);

    return suppressTooltip;
}
