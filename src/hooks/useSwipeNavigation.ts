import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MIN_SWIPE_DISTANCE = 50;
const MAX_VERTICAL_DISTANCE = 50; // Ignore if scrolled vertically too much during swipe

import { PAGE_ORDER } from '../constants/navigation';

export const useSwipeNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const touchStart = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            touchStart.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStart.current) return;

            const touchEnd = {
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY
            };

            const deltaX = touchEnd.x - touchStart.current.x;
            const deltaY = touchEnd.y - touchStart.current.y;

            // 1. Check if vertical movement was too large (likely scrolling)
            if (Math.abs(deltaY) > MAX_VERTICAL_DISTANCE) {
                touchStart.current = null;
                return;
            }

            // 2. Check if horizontal swipe is long enough
            if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE) {
                touchStart.current = null;
                return;
            }

            // 3. Determine Swipe Direction
            const isLeftSwipe = deltaX < 0; // Swipe Left (Move "Forward" -> Right content comes in)
            const isRightSwipe = deltaX > 0; // Swipe Right (Move "Back" -> Left content comes in)

            // 4. Find current page index
            const currentPath = location.pathname;
            const currentIndex = PAGE_ORDER.indexOf(currentPath);

            if (currentIndex === -1) {
                touchStart.current = null;
                return; // Not on one of the swipable pages
            }

            // 5. Navigate
            if (isLeftSwipe) {
                // Go to next page if available
                if (currentIndex < PAGE_ORDER.length - 1) {
                    navigate(PAGE_ORDER[currentIndex + 1]);
                }
            } else if (isRightSwipe) {
                // Go to previous page if available
                if (currentIndex > 0) {
                    navigate(PAGE_ORDER[currentIndex - 1]);
                }
            }

            touchStart.current = null;
        };

        // Attach listeners to window or appropriate container
        // We use passive: false to potentially preventDefault if needed, but for nav usually passive is fine
        // Actually, we probably don't want to preventDefault unless we are sure it's a Nav swipe.
        // But for global navigation, better to just let it be passive.
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [navigate, location.pathname]);
};
