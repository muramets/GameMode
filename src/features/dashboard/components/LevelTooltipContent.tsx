import { cn } from '../../../utils/styles';
import type { PriorityBreakdown } from '../../../utils/xpUtils';

interface LevelTooltipContentProps {
    breakdown: PriorityBreakdown[];
    tierColor: string;
}

export function LevelTooltipContent({ breakdown, tierColor }: LevelTooltipContentProps) {
    const priorityConfig = {
        high: {
            header: 'High Priority',
            label: 'Impact x10',
            textColor: 'text-red-400',
            bgColor: 'bg-red-400/5'
        },
        medium: {
            header: 'Medium Priority',
            label: 'Impact x3',
            textColor: 'text-yellow-400',
            bgColor: 'bg-yellow-400/5'
        },
        low: {
            header: 'Low Priority',
            label: 'Impact x1',
            textColor: 'text-blue-400',
            bgColor: 'bg-blue-400/5'
        }
    };

    const activeGroups = breakdown.filter(g => g.count > 0);

    // Formula calculations
    let totalWeightedPoints = 0;
    let totalWeight = 0;

    activeGroups.forEach(g => {
        totalWeightedPoints += (g.avgScore * g.count * g.weight);
        totalWeight += (g.count * g.weight);
    });

    const finalWeightedAverage = totalWeight > 0 ? (totalWeightedPoints / totalWeight) : 0;

    return (
        <div className="flex flex-col w-max max-w-[300px] p-2 shadow-2xl">
            <div className="flex flex-col gap-1">
                {activeGroups.map((group, groupIdx) => (
                    <div key={group.priority} className={cn(
                        "flex flex-col gap-2 p-3 rounded-lg transition-all duration-300",
                        priorityConfig[group.priority].bgColor,
                        groupIdx !== 0 && "mt-1"
                    )}>
                        {/* Group Header */}
                        <div className="flex justify-between items-center px-0.5 mb-1">
                            <span className={cn("text-[10px] font-bold uppercase tracking-wider", priorityConfig[group.priority].textColor)}>
                                {priorityConfig[group.priority].header}
                            </span>
                            <span className="text-[10px] text-text-primary font-mono font-medium">
                                AVG {group.avgScore.toFixed(1)}
                            </span>
                        </div>

                        {/* Items */}
                        <div className="flex flex-col gap-1 mt-1">
                            {group.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs group/item px-1 rounded hover:bg-white/10 py-0.5 transition-colors cursor-default">
                                    <span className="text-text-primary/70 font-light truncate pr-2 max-w-[170px]">
                                        {item.name}
                                    </span>
                                    <span className="font-mono text-text-secondary opacity-50 text-[10px]">
                                        {item.score}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Group Formula (Receipt style) */}
                        <div className="mt-2 pt-2 border-t border-white/5 font-mono text-[9px] flex flex-col gap-1">
                            <div className="flex justify-between items-center whitespace-nowrap overflow-hidden">
                                <span className="text-sub/40 shrink-0 italic">
                                    {group.count} {group.count === 1 ? 'skill' : 'skills'} × {group.weight} impact =
                                </span>
                                <span className="text-text-primary/30 font-bold">{group.count * group.weight} units</span>
                            </div>
                            <div className="flex justify-between items-center whitespace-nowrap overflow-hidden">
                                <span className="text-sub/40 shrink-0">
                                    {group.avgScore.toFixed(1)} lvl × {group.count * group.weight} units =
                                </span>
                                <span className={cn("font-bold", priorityConfig[group.priority].textColor)}>
                                    {(group.avgScore * group.count * group.weight).toFixed(1)} points
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Simplified Summary Calculation */}
            <div className="mt-2 p-3 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col gap-2 font-mono">
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-sub/60">Total Points</span>
                        <span className="font-medium text-text-primary/80">{totalWeightedPoints.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-sub/60">Impact Units</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] text-sub/20">({activeGroups.map(g => g.count * g.weight).join(' + ')}) =</span>
                            <span className="font-medium text-text-primary/80">{totalWeight}</span>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-white/10 my-0.5 w-full" />

                <div className="flex justify-between items-center pt-0.5">
                    <span className="text-[10px] text-text-primary uppercase font-bold tracking-widest mr-4">Global Level</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-[10px] text-sub/30 font-mono italic">{totalWeightedPoints.toFixed(1)} / {totalWeight} =</span>
                        <span className="text-lg font-bold" style={{ color: tierColor }}>
                            {finalWeightedAverage.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
