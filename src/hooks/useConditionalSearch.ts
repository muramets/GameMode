import { useState, useEffect, type RefObject } from 'react';

/**
 * Hook for conditional search visibility based on content overflow
 * 
 * Shows search input only when content container has vertical scroll,
 * making it adaptive to any screen size and content amount.
 * 
 * @param containerRef - Ref to the content container element
 * @returns Object with search state and visibility flag
 * 
 * @example
 * const contentRef = useRef<HTMLDivElement>(null);
 * const { searchQuery, setSearchQuery, shouldShowSearch } = useConditionalSearch(contentRef);
 * 
 * return (
 *   <div>
 *     {shouldShowSearch && <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />}
 *     <div ref={contentRef}>{content}</div>
 *   </div>
 * );
 */
export function useConditionalSearch(containerRef: RefObject<HTMLElement | null>) {
    const [shouldShowSearch, setShouldShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const checkOverflow = () => {
            // Check if container has vertical scroll
            const hasVerticalScroll = container.scrollHeight > container.clientHeight;
            setShouldShowSearch(hasVerticalScroll);
        };

        // Initial check after mount
        checkOverflow();

        // Watch for size changes using ResizeObserver
        const resizeObserver = new ResizeObserver(checkOverflow);
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, [containerRef]);

    return {
        searchQuery,
        setSearchQuery,
        shouldShowSearch
    };
}
