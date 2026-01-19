import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { CollapsibleSection } from '../molecules/CollapsibleSection';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../atoms/Tooltip';
import { Input } from '../molecules/Input';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface EntityItem {
    id: string | number;
    title: string;
    description?: string;
    group?: string;
    icon?: IconDefinition | React.ReactNode;
    color?: string;
}

interface EntitySelectorProps {
    items: EntityItem[];
    selectedIds: Set<string>;
    onToggle: (id: string) => void;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
    height?: string;
}

export function EntitySelector({
    items,
    selectedIds,
    onToggle,
    searchPlaceholder = "Search...",
    emptyMessage = "No items found",
    className = "",
    height = "h-[300px]"
}: EntitySelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredAndGroupedItems = useMemo(() => {
        const filtered = items.filter(i =>
            i.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filtered.length === 0) return null;

        const grouped: Record<string, EntityItem[]> = {};
        filtered.forEach(i => {
            const g = i.group || 'ungrouped';
            if (!grouped[g]) grouped[g] = [];
            grouped[g].push(i);
        });

        const sortedGroups = Object.keys(grouped).sort((a, b) => {
            if (a === 'ungrouped') return 1;
            if (b === 'ungrouped') return -1;
            return a.localeCompare(b);
        });

        return { groups: sortedGroups, data: grouped };
    }, [items, searchQuery]);

    return (
        <div className={`bg-sub-alt/30 rounded-xl p-3 border border-white/5 flex flex-col gap-3 ${height} ${className}`}>
            {/* Search Input */}
            {items.length > 0 && (
                <Input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={faSearch}
                    className="!bg-sub-alt/50"
                />
            )}

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col gap-1 h-full">
                    {!filteredAndGroupedItems ? (
                        <div className="w-full h-full flex items-center justify-center text-sub text-sm font-mono">
                            {emptyMessage}
                        </div>
                    ) : (
                        filteredAndGroupedItems.groups.map(groupName => (
                            <CollapsibleSection
                                key={groupName}
                                title={groupName}
                                variant="mini"
                                defaultOpen={true}
                                className="mb-2"
                            >
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {filteredAndGroupedItems.data[groupName].map(item => {
                                        const isActive = selectedIds.has(item.id.toString());
                                        const itemColor = item.color || 'var(--text-primary)';

                                        return (
                                            <TooltipProvider key={item.id} delayDuration={300}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            type="button"
                                                            onClick={() => onToggle(item.id.toString())}
                                                            className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all font-mono text-[10px] uppercase font-bold tracking-wider ${isActive
                                                                ? ''
                                                                : 'bg-sub-alt border-transparent text-sub hover:text-text-primary hover:bg-sub'
                                                                }`}
                                                            style={isActive ? {
                                                                backgroundColor: `color-mix(in srgb, ${itemColor} 20%, transparent)`,
                                                                color: itemColor,
                                                                boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
                                                                borderColor: 'transparent'
                                                            } : undefined}
                                                        >
                                                            <span style={{ color: isActive ? 'currentColor' : itemColor }}>
                                                                {/* Handle both IconDefinition and JSX (like generic emoji) */}
                                                                {/* If it's a valid React element, render it. If it's an object with iconName (IconDefinition), render FontAwesomeIcon */}
                                                                {React.isValidElement(item.icon) ? item.icon : (
                                                                    item.icon && <FontAwesomeIcon icon={item.icon as IconDefinition} />
                                                                )}
                                                            </span>
                                                            <span className="truncate max-w-[120px]">
                                                                {item.title.split('.')[0]}
                                                            </span>
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-bold text-[10px] uppercase tracking-wider">{item.title}</span>
                                                            {item.description && (
                                                                <span className="text-[10px] opacity-70 font-mono text-center">
                                                                    {item.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        );
                                    })}
                                </div>
                            </CollapsibleSection>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
