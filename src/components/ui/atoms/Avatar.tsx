import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { getIcon } from '../../../config/iconRegistry';

// Global (session-level) set to track already loaded avatar URLs
// We use this because browser cache check (img.complete) is unreliable for Firebase URLs 
// which often trigger revalidation requests (304), causing delays and FOUC/blinks.
const sessionLoadedCache = new Set<string>();

interface AvatarProps {
    src?: string;
    alt?: string;
    fallbackIcon?: string | IconProp;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Avatar component that handles smooth transitions from a placeholder icon
 * to the actual image. It uses a session-level cache to skip animations
 * for already loaded images, providing "instant" feel even if browser revalidates.
 */
export function Avatar({
    src,
    alt = 'Avatar',
    fallbackIcon = 'user',
    className = '',
    style = {}
}: AvatarProps) {
    return (
        <AvatarInner
            key={src} // Remount on src change to ensure fresh state
            src={src}
            alt={alt}
            fallbackIcon={fallbackIcon}
            className={className}
            style={style}
        />
    );
}

function AvatarInner({ src, alt, fallbackIcon, className, style }: any) {
    const debugId = src?.slice(-5);

    // Determine if we should consider this loaded immediately
    const startLoaded = !!src && sessionLoadedCache.has(src);

    if (src) {
        console.log(`[Avatar ${debugId}] Mount. startLoaded: ${startLoaded}. Cache size: ${sessionLoadedCache.size}`);
    }

    // If it's already in our session cache, we treat it as loaded instantly.
    // This allows the browser to do its network revalidation (304) in the background
    // while we show the image tag. The image tag will show the previous cached version 
    // or wait slightly, but efficiently avoids the "fade-in" animation reset.
    const [isLoaded, setIsLoaded] = useState(startLoaded);

    // We only animate if we didn't start loaded
    const [shouldAnimate] = useState(!startLoaded);

    const handleLoad = () => {
        if (src) {
            console.log(`[Avatar ${debugId}] handleLoad triggered.`);
            sessionLoadedCache.add(src);
        }
        setIsLoaded(true);
    };

    // Fallback logic for when src changes or error
    useEffect(() => {
        if (!src) return;

        console.log(`[Avatar ${debugId}] Effect run.`);

        // Native check just in case (for first loads that might be fast memory/disk cache)
        const img = new Image();
        img.src = src;
        if (img.complete) {
            console.log(`[Avatar ${debugId}] img.complete is TRUE in effect.`);
            handleLoad();
        }

        return () => {
            console.log(`[Avatar ${debugId}] Unmount.`);
        };
    }, [src]);

    const iconDef = typeof fallbackIcon === 'string' ? getIcon(fallbackIcon) : fallbackIcon;

    return (
        <div className={`relative flex items-center justify-center overflow-hidden ${className}`} style={style}>
            {/* Fallback - visible if loading or error */}
            {(!src || !isLoaded) && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <FontAwesomeIcon icon={iconDef} />
                </div>
            )}

            {/* Image */}
            {src && (
                <img
                    src={src}
                    alt={alt}
                    onLoad={handleLoad}
                    className={`w-full h-full object-cover ${shouldAnimate && !startLoaded ? 'animate-fade-in' : ''} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    style={shouldAnimate && !startLoaded ? { animation: 'fadeIn 0.5s ease-out forwards' } : undefined}
                />
            )}
            {/* Inline keyframe style for independence */}
            {(shouldAnimate && !startLoaded) && (
                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                `}</style>
            )}
        </div>
    );
}
