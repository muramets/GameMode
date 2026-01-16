import { useState, useRef, useEffect } from 'react';
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

    const handleSave = () => {
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
    };

    // Listen for external save trigger from modal footer
    useEffect(() => {
        const handleExternalSave = () => handleSave();
        document.addEventListener('cropper-save', handleExternalSave);
        return () => document.removeEventListener('cropper-save', handleExternalSave);
    }, [zoom]); // Re-attach when zoom changes to capture current state

    return (
        <div className="flex flex-col items-center gap-6 w-full">
            {/* Cropper Area with dark background */}
            <div className="relative w-full aspect-square max-w-[320px] bg-bg-primary rounded-xl overflow-hidden mx-auto">
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
                    ref={containerRef}
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
