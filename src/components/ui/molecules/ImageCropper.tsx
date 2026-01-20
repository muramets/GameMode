import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearchMinus, faSearchPlus } from '@fortawesome/free-solid-svg-icons';

interface ImageCropperProps {
    imageSrc: string;
    onCrop: (base64: string) => void;
    onCancel: () => void;
}

export function ImageCropper({ imageSrc, onCrop }: ImageCropperProps) {
    const [zoom, setZoom] = useState(1);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Canvas size for the output (premium resolution)
    const OUTPUT_SIZE = 400;

    // Viewport size (visual)
    const VIEWPORT_SIZE = 280;

    // Draggable constraints
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const handleSave = useCallback(() => {
        if (!imageRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const currentX = x.get();
        const currentY = y.get();
        const scale = zoom;
        const image = imageRef.current;
        const outputRatio = OUTPUT_SIZE / VIEWPORT_SIZE;

        ctx.save();
        ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

        // Fill white background for transparency safety
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

        ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
        ctx.translate(currentX * outputRatio, currentY * outputRatio);
        ctx.scale(scale * outputRatio, scale * outputRatio);

        ctx.drawImage(
            image,
            -image.naturalWidth / 2,
            -image.naturalHeight / 2
        );

        ctx.restore();

        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        onCrop(base64);
    }, [zoom, x, y, onCrop, OUTPUT_SIZE, VIEWPORT_SIZE]);

    const lastDistRef = useRef<number | null>(null);

    // Listen for external save trigger from modal footer
    useEffect(() => {
        const handleExternalSave = () => handleSave();
        document.addEventListener('cropper-save', handleExternalSave);
        return () => document.removeEventListener('cropper-save', handleExternalSave);
    }, [handleSave]);

    // Handle pinch/wheel zoom
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();

            if (e.ctrlKey) {
                // Pinch -> Zoom
                // For trackpads, deltaY usually represents pinch
                const delta = -e.deltaY * 0.01;

                setZoom(prev => {
                    const newZoom = prev + delta;
                    return Math.min(Math.max(0.1, newZoom), 3);
                });
            } else {
                // No Ctrl -> Pan (Two-finger scroll on trackpad or regular wheel scroll)
                // We subtract delta to match natural scrolling behavior (content follows fingers)
                // depending on OS settings, this usually aligns with "scroll to move view".
                // But for "moving the image", we effectively want to translate it.
                // Standard scroll logic: scrollTop += deltaY.
                // Moving image logic: y -= deltaY (to match scroll behavior).

                const currentX = x.get();
                const currentY = y.get();

                x.set(currentX - e.deltaX);
                y.set(currentY - e.deltaY);
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault();
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault();

                // Calculate distance between two fingers
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];

                const dist = Math.hypot(
                    touch1.clientX - touch2.clientX,
                    touch1.clientY - touch2.clientY
                );

                // We need to store previous distance to calculate delta
                // But since we can't easily store state in this closure without ref,
                // let's rely on a ref for previous distance
                if (lastDistRef.current) {
                    const delta = dist - lastDistRef.current;
                    // Sensitivity factor
                    const zoomDelta = delta * 0.01;

                    setZoom(prev => {
                        const newZoom = prev + zoomDelta;
                        return Math.min(Math.max(0.1, newZoom), 3);
                    });
                }

                lastDistRef.current = dist;
            }
        };

        const handleTouchEnd = () => {
            lastDistRef.current = null;
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [x, y]);

    return (
        <div className="flex flex-col items-center gap-6 w-full">
            {/* Cropper Area with dark background */}
            <div
                ref={containerRef}
                className="relative w-full aspect-square max-w-[320px] bg-bg-primary rounded-xl overflow-hidden mx-auto"
            >
                {/* Image Layer */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.img
                        ref={imageRef}
                        src={imageSrc}
                        alt="Target"
                        style={{ x, y, scale: zoom }}
                        drag
                        dragMomentum={false}
                        className="max-w-none origin-center cursor-move select-none"
                        onLoad={(e) => {
                            const img = e.currentTarget;
                            const ratio = Math.max(VIEWPORT_SIZE / img.naturalWidth, VIEWPORT_SIZE / img.naturalHeight);
                            setZoom(ratio > 1 ? ratio : 1);
                        }}
                    />
                </div>

                {/* Dark Overlay with Circular Cutout using CSS mask */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        maskImage: 'radial-gradient(circle at center, transparent 140px, black 140px)',
                        WebkitMaskImage: 'radial-gradient(circle at center, transparent 140px, black 140px)',
                    }}
                />

                {/* Circular Border */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full border-2 border-white/20 pointer-events-none" />

                {/* Visual Guides */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] pointer-events-none">
                    <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-white/10" />
                    <div className="absolute left-1/2 top-0 w-[0.5px] h-full bg-white/10" />
                </div>
            </div>

            {/* Scale Control */}
            <div className="flex items-center gap-4 w-full max-w-[320px] mx-auto">
                <FontAwesomeIcon icon={faSearchMinus} className="text-sub text-xs shrink-0" />
                <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.01"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-main"
                />
                <FontAwesomeIcon icon={faSearchPlus} className="text-sub text-xs shrink-0" />
            </div>
        </div>
    );
}
