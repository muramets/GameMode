import React from 'react';

const ShimmerBlock = ({ className }: { className?: string }) => (
    <div className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" style={{ backgroundSize: '200% 100%' }} />
    </div>
);

const SkeletonRow = () => (
    <div className="relative min-h-[72px] bg-sub-alt border border-transparent rounded-xl overflow-hidden mb-2">
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" style={{ backgroundSize: '200% 100%' }} />

        <div className="relative z-10 grid grid-cols-[1.2fr_auto_1fr] items-center gap-4 px-4 h-full py-2">
            {/* Left: Icon + Text */}
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-bg-primary/30 shrink-0" />
                <div className="flex flex-col gap-2 flex-grow min-w-0">
                    <div className="h-4 w-3/4 bg-bg-primary/30 rounded" />
                    <div className="h-3 w-1/2 bg-bg-primary/20 rounded" />
                </div>
            </div>

            {/* Center: Weight */}
            <div className="flex items-center justify-center">
                <div className="w-12 h-4 bg-bg-primary/20 rounded" />
            </div>

            {/* Right: Targets */}
            <div className="flex justify-end items-center gap-1.5 w-full">
                <div className="w-6 h-6 rounded-md bg-bg-primary/30" />
                <div className="w-6 h-6 rounded-md bg-bg-primary/30" />
                <div className="w-6 h-6 rounded-md bg-bg-primary/30" />
                <div className="w-6 h-6 rounded-md bg-bg-primary/10 ml-2" />
            </div>
        </div>
    </div>
);

export const ProtocolsSkeleton = () => {
    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in pb-20">
            {/* Content Groups */}
            <div className="flex flex-col gap-8">
                {[1, 2, 3].map((group) => (
                    <div key={group} className="flex flex-col gap-4">
                        {/* Group Header */}
                        <div className="flex items-center gap-3 px-1">
                            <ShimmerBlock className="w-5 h-5 bg-sub-alt rounded" />
                            <ShimmerBlock className="w-32 h-6 bg-sub-alt rounded" />
                            <ShimmerBlock className="w-8 h-5 bg-sub-alt/50 rounded-full ml-auto md:ml-0" />
                            <div className="h-px bg-white/5 flex-grow ml-4" />
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6].map((item) => (
                                <SkeletonRow key={item} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
