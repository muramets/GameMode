import { useState, useCallback } from 'react';

export const useTruncation = () => {
    const [isTruncated, setIsTruncated] = useState(false);

    const ref = useCallback((node: HTMLElement | null) => {
        if (node) {
            const checkTruncation = () => {
                setIsTruncated(node.scrollWidth > node.clientWidth);
            };

            // Check immediately
            checkTruncation();

            // Optional: Watch for resize if needed, but for static text usually initial check + window resize is enough
            const resizeObserver = new ResizeObserver(checkTruncation);
            resizeObserver.observe(node);

            return () => resizeObserver.disconnect();
        }
    }, []);

    return { ref, isTruncated };
};
