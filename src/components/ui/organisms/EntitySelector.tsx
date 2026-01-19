import React, { useState, useMemo, useEffect } from 'react';
import { faSearch, faLink, faLinkSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CollapsibleSection } from '../molecules/CollapsibleSection';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../atoms/Tooltip';
import { Input } from '../molecules/Input';

export interface EntityItem {
    id: string | number;
    title: string;
    description?: string;
    group?: string;
    icon?: React.ReactNode;
    color?: string;
    isDeleted?: boolean;
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
    const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');

    const { deletedCount, activeCount } = useMemo(() => {
        return {
            deletedCount: items.filter(i => i.isDeleted).length,
            activeCount: items.filter(i => !i.isDeleted).length
        };
    }, [items]);

    const filteredAndGroupedItems = useMemo(() => {
        // First filter by view mode
        const modeFiltered = items.filter(i =>
            viewMode === 'active' ? !i.isDeleted : i.isDeleted
        );

        const filtered = modeFiltered.filter(i =>
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
    }, [items, searchQuery, viewMode]);

    const showSearch = viewMode === 'active' ? activeCount > 0 : deletedCount > 0;

    // Reset search when switching views
    useEffect(() => {
        setSearchQuery('');
    }, [viewMode]);

    return (
        <div className={`bg-sub-alt/30 rounded-xl p-3 border border-white/5 flex flex-col gap-3 ${height} ${className}`}>
            {/* View Mode Switcher - Only if there are deleted items */}
            {deletedCount > 0 && (
                <div className="flex bg-sub-alt/50 p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setViewMode('active')}
                        className={`flex-1 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === 'active'
                            ? 'bg-main text-black shadow-sm'
                            : 'text-sub hover:text-text-primary'
                            }`}
                    >
                        Active ({activeCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('archived')}
                        className={`flex-1 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === 'archived'
                            ? 'bg-sub text-text-primary shadow-sm'
                            : 'text-sub hover:text-text-primary'
                            }`}
                    >
                        Archived ({deletedCount})
                    </button>
                </div>
            )}

            {/* Search Input */}
            {showSearch && (
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
                                            <div key={item.id} className="relative group/item">
                                                <TooltipProvider delayDuration={500}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="relative">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        if (item.isDeleted) {
                                                                            e.stopPropagation();
                                                                        } else {
                                                                            onToggle(item.id.toString());
                                                                        }
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all font-mono text-[10px] uppercase font-bold tracking-wider relative ${isActive
                                                                        ? ''
                                                                        : 'bg-sub-alt border-transparent text-sub hover:text-text-primary hover:bg-sub'
                                                                        } ${item.isDeleted ? '' : ''}`}
                                                                    style={isActive ? {
                                                                        backgroundColor: `color-mix(in srgb, ${itemColor} 20%, transparent)`,
                                                                        color: itemColor,
                                                                        boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
                                                                        borderColor: 'transparent'
                                                                    } : undefined}
                                                                >
                                                                    <span style={{ color: isActive ? 'currentColor' : itemColor }}>
                                                                        {item.icon}
                                                                    </span>
                                                                    <span className={`truncate max-w-[120px]`}>
                                                                        {item.title.split('.')[0]}
                                                                    </span>
                                                                    {item.isDeleted && (
                                                                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            </div>
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

                                                {/* Explicit Unlink/Link Button for Deleted Items */}
                                                {item.isDeleted && (
                                                    <TooltipProvider delayDuration={0}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onToggle(item.id.toString());
                                                                    }}
                                                                    className="absolute -right-2 -top-2 w-5 h-5 rounded-full bg-sub-alt border border-sub/30 flex items-center justify-center text-[10px] leading-none transition-all shadow-sm z-10 hover:scale-110 group/action"
                                                                >
                                                                    {/* Linked State (Green) - Visible if active and NOT hovered */}
                                                                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity text-correct ${isActive ? 'opacity-100 group-hover/action:opacity-0' : 'opacity-0'
                                                                        }`}>
                                                                        <FontAwesomeIcon icon={faLink} className="w-3 h-3" />
                                                                    </div>
                                                                    {/* Unlink/Link Action (Red) - Visible if Hovered OR inactive */}
                                                                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity text-error ${isActive ? 'opacity-0 group-hover/action:opacity-100' : 'opacity-100'
                                                                        }`}>
                                                                        <FontAwesomeIcon icon={faLinkSlash} className="w-3 h-3" />
                                                                    </div>
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                <span className="text-[10px] font-mono">
                                                                    {isActive ? "Click to unlink" : "Link"}
                                                                </span>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
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
