import { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { getIcon } from '../../../config/iconRegistry';

// Global (session-level) set to track already loaded avatar URLs
// We use this to decide if we should use a fade-in animation or an instant show.
const sessionLoadedCache = new Set<string>();

interface AvatarProps {
    src?: string;
    alt?: string;
    fallbackIcon?: string | IconProp;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Avatar component with a layered loading strategy:
 * 1. Layer 1 (Bottom): Fallback icon, visible until the image is definitely painted.
 * 2. Layer 2 (Top): The <img> tag. If cached in session, it's opacity:1 immediately.
 * This prevents "holes" during rapid unmount/mount cycles while the browser repaints.
 */
export function Avatar({
    src,
    alt = 'Avatar',
    fallbackIcon = 'user',
    className = '',
    style = {}
}: AvatarProps) {
    // Stable key per src ensures clean lifecycle for each image
    return (
        <AvatarInner
            key={src || 'no-src'}
            src={src}
            alt={alt}
            fallbackIcon={fallbackIcon}
            className={className}
            style={style}
        />
    );
}

function AvatarInner({ src, alt, fallbackIcon, className, style }: any) {
    // isLoaded tracks if the CURRENT <img> instance has fired onLoad.
    const [isLoaded, setIsLoaded] = useState(false);

    // wasCached is locked at mount time. It decides if we skip the fade-in.
    // If true, we show the image at opacity 100% immediately.
    const wasCached = useMemo(() => !!src && sessionLoadedCache.has(src), [src]);

    useEffect(() => {
        if (!src) return;

        // Native check: if memory cache is instant, mark as loaded quickly
        const img = new Image();
        img.src = src;
        if (img.complete) {
            sessionLoadedCache.add(src);
            setIsLoaded(true);
        }
    }, [src]);

    const handleLoad = () => {
        if (src) sessionLoadedCache.add(src);
        setIsLoaded(true);
    };

    const iconDef = typeof fallbackIcon === 'string' ? getIcon(fallbackIcon) : fallbackIcon;

    return (
        <div
            className={`relative flex items-center justify-center overflow-hidden bg-bg-primary/50 ${className}`}
            style={style}
        >
            {/* 
              Layer 1: Fallback Icon (Z-0)
              Always rendered underneath. It acts as the background until the image paints.
            */}
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-sub/30 z-0">
                    <FontAwesomeIcon icon={iconDef} />
                </div>
            )}

            {/* 
              Layer 2: Actual Image (Z-10)
              Rendered on top. 
              - If wasCached=true: Opacity 100 immediately.
              - If wasCached=false: Opacity 0 -> 100 (Fade in)
            */}
            {src && (
                <img
                    src={src}
                    alt={alt}
                    onLoad={handleLoad}
                    className={`w-full h-full object-cover z-10 ${wasCached
                            ? 'opacity-100' // INSTANT SHOW
                            : (isLoaded ? 'opacity-100 transition-opacity duration-500' : 'opacity-0') // FADE IN
                        }`}
                />
            )}

            {/* Fade-in animation styles for new images only (backward compatibility) */}
            {!wasCached && isLoaded && (
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
