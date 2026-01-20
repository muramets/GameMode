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
    // Track previous state to detect "just closed" transition
    const prevOpenRef = useRef(isModalOpen);

    useEffect(() => {
        // If we transitioned from Open -> Closed
        if (prevOpenRef.current && !isModalOpen) {
            setSuppressTooltip(true);
            const timer = setTimeout(() => {
                setSuppressTooltip(false);
            }, 500);
            return () => clearTimeout(timer);
        }

        // Update ref for next render
        prevOpenRef.current = isModalOpen;
    }, [isModalOpen]);

    // We suppress if:
    // 1. Explicitly suppressed (during the timeout window)
    // 2. Modal is currently open
    // 3. We JUST closed it (prev was true, current is false) - this covers the render gap before effect fires
    // eslint-disable-next-line react-hooks/refs
    const justClosed = prevOpenRef.current && !isModalOpen;

    return suppressTooltip || isModalOpen || justClosed;
}
