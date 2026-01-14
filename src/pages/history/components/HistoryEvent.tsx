import { format, parseISO } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faTrash } from '@fortawesome/free-solid-svg-icons';
import { renderIcon } from '../../../utils/iconMapper';
import type { HistoryRecord } from '../../../types/history';
import type { Innerface } from '../../../pages/protocols/types';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/atoms/Tooltip';

interface HistoryEventProps {
    event: HistoryRecord;
    innerfaces: Innerface[];
    onDelete: (id: string) => void;
    onFilterInnerface: (id: string) => void;
}

export function HistoryEvent({ event, innerfaces, onDelete, onFilterInnerface }: HistoryEventProps) {
    const isPositive = event.action === '+';
    const hoverGradient = isPositive ? 'rgba(152,195,121,0.25)' : 'rgba(202,71,84,0.25)';

    // Reduced base intensity from 0.15 to 0.08
    const baseGradient = isPositive ? 'rgba(152,195,121,0.08)' : 'rgba(202,71,84,0.08)';

    return (
        <div
            className="group relative flex items-center gap-6 p-5 rounded-2xl bg-sub-alt transition-all duration-300 border border-transparent overflow-hidden shadow-sm hover:scale-[1.02] hover:shadow-lg cursor-default"
        >
            {/* Dynamic Background Gradient (Right side) */}
            <div
                className="absolute inset-0 transition-all duration-500 pointer-events-none opacity-100"
                style={{
                    background: `radial-gradient(circle at 100% 50%, ${baseGradient}, transparent 60%)`
                }}
            />
            {/* Hover Gradient Overlay */}
            <div
                className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100"
                style={{
                    background: `radial-gradient(circle at 100% 50%, ${hoverGradient}, transparent 70%)`
                }}
            />

            {/* Icon Wrapper */}
            <div className="relative w-14 h-14 flex items-center justify-center rounded-2xl bg-black/30 text-2xl shrink-0 text-text-primary group-hover:scale-105 transition-transform duration-500 z-10">
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isPositive ? 'bg-correct/10' : 'bg-error/10'}`} />
                {renderIcon(event.protocolIcon)}
            </div>

            {/* Main Content Area */}
            <div className="relative flex-1 flex items-center justify-between min-w-0 z-10">
                <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-lexend font-bold text-text-primary truncate transition-colors group-hover:text-main/80">
                            {event.protocolName}
                        </h3>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-sub font-mono uppercase tracking-[0.15em] opacity-60 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faClock} className="text-[0.8em]" />
                            {format(parseISO(event.timestamp), 'HH:mm')}
                        </div>
                        <span className="opacity-20">•</span>
                        <span>{event.type === 'protocol' ? 'check-in' : 'manual adjustment'}</span>
                    </div>
                </div>

                {/* Innerface Changes Grid */}
                <div className="hidden lg:flex flex-wrap justify-end gap-2 max-w-[50%]">
                    {Object.entries(event.changes).map(([innerfaceId, change]) => {
                        const iface = innerfaces.find(i => i.id == innerfaceId);
                        return (
                            <TooltipProvider key={innerfaceId} delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => onFilterInnerface(innerfaceId)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-black/20 hover:bg-black/40 transition-colors border border-transparent hover:border-white/5 group/iface cursor-pointer"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: iface?.color || 'gray' }} />
                                            <span className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-tight opacity-70 group-hover/iface:opacity-100 transition-opacity">
                                                {iface ? iface.name.split('.')[0] : innerfaceId}
                                            </span>
                                            <div className="h-3 w-px bg-white/5" />
                                            <span className={`text-[10px] font-mono font-black ${change > 0 ? 'text-correct' : 'text-error'}`}>
                                                {change > 0 ? '+' : ''}{change.toFixed(2)}
                                            </span>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <span className="font-mono text-xs">Filter by {iface?.name || innerfaceId}</span>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>

                {/* Delete/Undo Action */}
                <button
                    onClick={() => onDelete(event.id)}
                    className="ml-6 w-11 h-11 flex items-center justify-center rounded-xl bg-sub-alt hover:bg-error/20 text-sub hover:text-error transition-all duration-300 shrink-0 shadow-lg hover:rotate-6 active:scale-95 opacity-0 group-hover:opacity-100 translation-y-2 group-hover:translate-y-0 z-20"
                    title="Revert this event"
                >
                    <FontAwesomeIcon icon={faTrash} className="text-sm" />
                </button>
            </div>
        </div>
    );
}
