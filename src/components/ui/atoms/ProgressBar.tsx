interface ProgressBarProps {
    current: number;
    max: number;
    colorClass?: string;
    className?: string;
    heightClass?: string;
}

export function ProgressBar({
    current,
    max,
    colorClass = 'bg-main',
    className = '',
    heightClass = 'h-2'
}: ProgressBarProps) {
    const percentage = Math.min(Math.max((current / max) * 100, 0), 100);

    return (
        <div className={`w-full bg-sub-alt rounded-full overflow-hidden ${heightClass} ${className}`}>
            <div
                className={`h-full transition-all duration-300 ease-out ${colorClass}`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
}
