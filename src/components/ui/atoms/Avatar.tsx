import { useState, useEffect } from 'react';
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
 * 2. Layer 2 (Top): The <img> tag. Always fades in (opacity 0 -> 100) to ensure smoothness.
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

function AvatarInner({ src, alt, fallbackIcon = 'user', className, style }: AvatarProps) {
    // isLoaded tracks if the CURRENT <img> instance has fired onLoad.
    // Initialize based on session cache to avoid "pop-in" for already loaded images
    const [isLoaded, setIsLoaded] = useState(() => {
        if (!src) return false;
        return sessionLoadedCache.has(src);
    });

    useEffect(() => {
        if (!src) return;

        // If already known in cache, strictly speaking we are "loaded",
        // but the <img> tag will handle the actual display.
        // We can skip the pre-loader checks if we trust the cache, 
        // but keeping it ensures redundancy if the cache was wrong (unlikely).
        // For performance, we can skip if already cached.
        if (sessionLoadedCache.has(src)) return;

        const img = new Image();
        img.src = src;

        const onLoad = () => {
            setIsLoaded(true);
            sessionLoadedCache.add(src);
        };

        if (img.complete) {
            onLoad();
        } else {
            img.onload = onLoad;
        }

        return () => {
            img.onload = null;
        };
    }, [src]);

    const handleLoad = () => {
        setIsLoaded(true);
        if (src) sessionLoadedCache.add(src);
    };

    const iconDef = typeof fallbackIcon === 'string' ? getIcon(fallbackIcon) : fallbackIcon;

    return (
        <div
            className={`relative flex items-center justify-center overflow-hidden ${className}`}
            style={style}
        >
            {/* 
              Layer 1: Fallback Icon (Z-0)
              Always rendered underneath. It acts as the background until the image paints.
            */}
            <div className={`absolute inset-0 flex items-center justify-center z-0 ${className?.includes('text-') ? '' : 'text-sub'}`}>
                <FontAwesomeIcon icon={iconDef} />
            </div>

            {/* 
              Layer 2: Actual Image (Z-10)
              Rendered on top. 
              Fades in only if not pre-cached (opacity 0 -> 100)
            */}
            {src && (
                <img
                    src={src}
                    alt={alt}
                    onLoad={handleLoad}
                    className={`w-full h-full object-cover z-10 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                />
            )}
        </div>
    );
}
