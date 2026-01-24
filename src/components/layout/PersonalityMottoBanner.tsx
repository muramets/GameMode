import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { usePersonalityStore } from '../../stores/personalityStore';

export function PersonalityMottoBanner() {
    const { activePersonalityId } = usePersonalityStore();

    // Use the key prop to force remount when personality changes, 
    // allowing us to read localStorage in the initial state safely without effects.
    return <PersonalityMottoBannerContent key={activePersonalityId} />;
}

function PersonalityMottoBannerContent() {
    const { personalities, activePersonalityId, activeContext } = usePersonalityStore();
    const activePersonality = personalities.find(p => p.id === activePersonalityId);

    const [isHovered, setIsHovered] = useState(false);
    const [isClosedForToday, setIsClosedForToday] = useState(() => {
        if (!activePersonalityId) return false;
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `motto_closed_${activePersonalityId}`;
        return localStorage.getItem(storageKey) === today;
    });

    const handleClose = () => {
        if (!activePersonalityId) return;

        const today = new Date().toISOString().split('T')[0];
        const storageKey = `motto_closed_${activePersonalityId}`;
        localStorage.setItem(storageKey, today);
        setIsClosedForToday(true);
    };

    // Listen for reset events from settings modal
    useEffect(() => {
        const handleReset = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail?.personalityId === activePersonalityId) {
                setIsClosedForToday(false);
            }
        };

        window.addEventListener('personality-motto-reset', handleReset);
        return () => window.removeEventListener('personality-motto-reset', handleReset);
    }, [activePersonalityId]);

    // Only render if:
    // 1. Not in viewer mode (ViewerBanner takes precedence / is different context)
    // 2. We have an active personality
    // 3. Motto is set and enabled
    // 4. Not closed for today
    if (activeContext?.type === 'viewer') return null;

    // Find active motto
    const activeMotto = activePersonality?.mottos?.find(m => m.isActive) ||
        // Fallback for migration if mottos is empty but legacy motto exists
        (activePersonality?.showMotto && activePersonality?.motto ? { text: activePersonality.motto, isActive: true } : null);

    if (!activeMotto?.text) return null;
    if (isClosedForToday) return null;

    // Use a contrasting color for text based on brightness if possible, 
    // but typically "Coach Mode" banner uses main-color bg and bg-color text.
    // Here we use the personality color (iconColor).
    const backgroundColor = activePersonality?.iconColor || 'var(--main-color)';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: '32px' }} // Slightly smaller than ViewerBanner (47px) to be less intrusive? Or same? Request says "Reuse same element". ViewerBanner is 47px.
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full font-mono text-xs leading-none flex items-center justify-center relative shadow-sm z-50 group/banner"
                style={{
                    backgroundColor: backgroundColor,
                    color: 'var(--bg-color)', // Text color that matches the app background (usually creates high contrast with bright accents)
                    height: '32px'
                }}
            >
                {/* Centered Content Container */}
                <div
                    className="flex items-center justify-center w-full h-full px-8"
                    style={{ maxWidth: '1200px', margin: '0 auto' }}
                >
                    {/* Centered Motto */}
                    <span className="font-bold tracking-wider uppercase opacity-90 truncate max-w-[80%]">
                        {activeMotto.text}
                    </span>
                </div>

                {/* Exit Button - Absolute Right of the BANNER (viewport), not the inner container */}
                <button
                    onClick={handleClose}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center gap-2 transition-opacity hover:opacity-100 opacity-70 z-50 p-2"
                >
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-0 group-hover/banner:opacity-100 transition-opacity duration-200">
                        close for today
                    </span>
                    <FontAwesomeIcon
                        icon={faTimes}
                        className="text-sm"
                        style={{
                            color: isHovered ? 'var(--text-color)' : 'var(--bg-color)',
                            opacity: isHovered ? 1 : 0.8,
                        }}
                    />
                </button>
            </motion.div>
        </AnimatePresence >
    );
}

