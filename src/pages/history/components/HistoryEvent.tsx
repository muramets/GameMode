import { format, parseISO } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faTrash, faGear, faTrashArrowUp } from '@fortawesome/free-solid-svg-icons';
import { AppIcon } from '../../../components/ui/atoms/AppIcon';
import { PowerIcon } from '../../../features/innerfaces/components/PowerIcon';
import { ConfirmButton } from '../../../components/ui/molecules/ConfirmButton';
import type { HistoryRecord } from '../../../types/history';
import type { Innerface } from '../../../features/innerfaces/types';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/atoms/Tooltip';

interface HistoryEventProps {
    event: HistoryRecord;
    innerfaces: Innerface[];
    protocolColor?: string;
    onDelete: (id: string) => void;
    onFilterInnerface: (id: string) => void;
}

export function HistoryEvent({ event, innerfaces, protocolColor, onDelete, onFilterInnerface }: HistoryEventProps) {
    const isPositive = event.weight > 0;
    const isSystem = event.type === 'system';

    // System events use neutral gray
    const effectiveColor = isSystem
        ? 'var(--sub-color)'
        : (protocolColor || (isPositive ? 'var(--correct-color)' : 'var(--error-color)'));

    // Replicate ProtocolRow style: color with 0.15 opacity for base gradient
    const gradientColor = isSystem
        ? 'transparent'
        : (isPositive ? 'rgba(152,195,121,0.15)' : 'rgba(202,71,84,0.15)');

    const hoverGradientColor = isSystem
        ? 'rgba(255,255,255,0.05)'
        : (isPositive ? 'rgba(152,195,121,0.25)' : 'rgba(202,71,84,0.25)');

    return (
        <div
            className="group relative flex items-center gap-6 p-5 rounded-2xl bg-sub-alt transition-all duration-300 border border-transparent overflow-hidden shadow-sm hover:shadow-xl hover:bg-sub-alt/80 cursor-default"
        >
            {/* Dynamic Background Gradient (Right side) */}
            <div
                className="absolute inset-0 transition-all duration-500 pointer-events-none opacity-80"
                style={{
                    background: `radial-gradient(circle at 100% 50%, ${gradientColor}, transparent 60%)`
                }}
            />
            {/* Hover Gradient Overlay */}
            <div
                className={`absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100`}
                style={{
                    background: `radial-gradient(circle at 100% 50%, ${hoverGradientColor}, transparent 70%)`
                }}
            />

            {/* Icon Wrapper - Conditionally Render Protocol Style or Innerface Style */}
            {event.type === 'manual_adjustment' && event.targets && event.targets.length > 0 ? (
                // Use PowerIcon for consistency with Innerface tokens (correct Shape + Color)
                (() => {
                    const targetId = event.targets![0]; // Non-null assertion safe due to check
                    const targetInnerface = innerfaces.find(i => i.id == targetId);
                    return (
                        <div className="relative z-10 group-hover:scale-105 transition-transform duration-500">
                            <PowerIcon
                                icon={event.protocolIcon}
                                color={targetInnerface?.color || effectiveColor} // Prefer innerface color for identity
                                category={targetInnerface?.category} // Crucial: This drives the Shape
                                size="w-14 h-14"
                                glowSize="20px"
                            />
                        </div>
                    );
                })()
            ) : (
                // Default Protocol/System Icon Style
                <div
                    className="relative w-14 h-14 flex items-center justify-center rounded-2xl text-2xl shrink-0 transition-all duration-500 z-10 group-hover:scale-105"
                    style={{
                        backgroundColor: `color-mix(in srgb, ${effectiveColor} 20%, transparent)`, // 20% opacity like ProtocolRow's icon background
                        color: effectiveColor,
                        boxShadow: `0 0 20px color-mix(in srgb, ${effectiveColor} 8%, transparent)`
                    }}
                >
                    {/* Glow layer on hover */}
                    <div
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                        style={{ backgroundColor: effectiveColor }}
                    />
                    {isSystem ? (
                        <FontAwesomeIcon icon={faGear} />
                    ) : (
                        <AppIcon id={event.protocolIcon} />
                    )}
                </div>
            )}

            {/* Main Content Area */}
            <div className="relative flex-1 flex flex-col lg:flex-row lg:items-center justify-between min-w-0 z-10 gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-lexend font-bold text-text-primary truncate transition-colors group-hover:text-text-primary">
                            {event.protocolName}
                        </h3>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-sub font-mono uppercase tracking-[0.15em] opacity-60 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faClock} className="text-[0.8em]" />
                            {format(parseISO(event.timestamp), 'HH:mm')}
                        </div>
                        <span className="opacity-20">•</span>
                        <span>
                            {event.type === 'protocol' ? 'check-in' :
                                event.type === 'manual_adjustment' ? 'manual adjustment' :
                                    'system event'}
                        </span>

                        {/* Show details for system events (e.g. score adjustments) */}
                        {isSystem && event.details?.from !== undefined && event.details?.to !== undefined && (
                            <>
                                <span className="opacity-20">•</span>
                                <span className="text-sub">
                                    {event.details.from.toFixed(2)} → <span className="text-text-primary">{event.details.to.toFixed(2)}</span>
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Innerface Changes Grid - Left aligned with justify-start */}
                <div className="flex flex-wrap justify-start lg:justify-end gap-2 max-w-full">
                    {Object.entries(event.changes).map(([innerfaceId, change]) => {
                        const iface = innerfaces.find(i => i.id == innerfaceId);
                        const isHistorical = iface?.versionTimestamp && event.timestamp <= iface.versionTimestamp;
                        const xpChange = Math.round(change * 100);

                        return (
                            <TooltipProvider key={innerfaceId} delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => onFilterInnerface(innerfaceId)}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-black/20 hover:bg-black/30 transition-all border border-transparent hover:border-white/5 active:scale-95 group/iface cursor-pointer ${isHistorical ? 'opacity-30 grayscale-[0.5] hover:opacity-60 scale-[0.98]' : ''}`}
                                        >
                                            <div
                                                className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                                style={{ backgroundColor: iface?.color || 'gray', boxShadow: `0 0 10px ${iface?.color || 'gray'}40` }}
                                            />
                                            <span className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-tight opacity-70 group-hover/iface:opacity-100 transition-opacity">
                                                {iface ? iface.name.split('.')[0] : innerfaceId}
                                                {isHistorical && <span className="ml-2 opacity-50 text-[7px] font-black tracking-widest uppercase bg-white/5 px-1 rounded-sm">Archived</span>}
                                                {!isHistorical && iface?.deletedAt && <span className="ml-2 opacity-50 text-[7px] font-black tracking-widest uppercase bg-error/10 text-error px-1 rounded-sm">Deleted</span>}
                                            </span>
                                            <div className="h-3 w-px bg-white/5" />
                                            <span className={`text-[10px] font-mono font-black ${change > 0 ? 'text-correct' : 'text-error'}`}>
                                                {change > 0 ? '+' : ''}{xpChange} XP
                                            </span>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <span className="font-mono text-xs">
                                            {isHistorical
                                                ? `Archived: This entry belonged to a previous "Starting Point".`
                                                : iface?.deletedAt
                                                    ? `This power has been deleted, but its history contributes to your score.`
                                                    : `Filter by ${iface?.name || innerfaceId}`}
                                        </span>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>
            </div>

            {/* Delete/Undo Action */}
            <TooltipProvider>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <span className="relative ml-2 rounded-xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 z-20 transition-all duration-300">
                            <ConfirmButton
                                onConfirm={() => onDelete(event.id)}
                                defaultText=""
                                confirmText=""
                                defaultIcon={<FontAwesomeIcon icon={faTrash} className="text-sm" />}
                                confirmIcon={<FontAwesomeIcon icon={faTrashArrowUp} className="text-sm" />}
                                variant="history"
                                size="history-icon"
                                className="rounded-xl"
                            />
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="font-lexend text-xs">Revert this event</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
