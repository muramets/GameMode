import React, { useState, useMemo, useLayoutEffect, useEffect } from 'react';
import type { Protocol, Innerface } from './types';
import { ProtocolRow } from './ProtocolRow';
import { ProtocolSettingsModal } from './components/ProtocolSettingsModal';

import { useScoreContext } from '../../contexts/ScoreProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {

    faSearch,
    faPlus,
    faFilter,
    faCircle
} from '@fortawesome/free-solid-svg-icons';
import { ActiveFiltersList } from '../../components/ui/molecules/ActiveFiltersList';
import { GROUP_CONFIG } from '../../constants/common';
import { CollapsibleSection } from '../../components/ui/molecules/CollapsibleSection';
// Optimization: Isolated heavy rendering component
const ProtocolsContent = React.memo(({
    protocols,
    innerfaces,
    searchQuery,
    activeFilters,
    applyProtocol,
    handleEditProtocol
}: {
    protocols: Protocol[];
    innerfaces: Innerface[];
    searchQuery: string;
    activeFilters: string[];
    applyProtocol: (id: string | number, direction: '+' | '-') => void;
    handleEditProtocol: (id: string | number) => void;
}) => {
    // 1. Heavy Calculation: Map Creation
    const innerfaceMap = useMemo(() => {
        const map = new Map<string, string>();
        innerfaces.forEach((i: Innerface) => {
            map.set(i.id.toString(), i.name.toLowerCase());
        });
        return map;
    }, [innerfaces]);

    // 2. Heavy Calculation: Filtering O(N)
    const filteredProtocols = useMemo(() => {
        // const start = performance.now();
        let filtered = protocols;

        // Apply group filters
        if (activeFilters.length > 0) {
            filtered = filtered.filter((p: Protocol) => {
                if (activeFilters.includes('ungrouped') && !p.group) return true;
                if (p.group && activeFilters.includes(p.group)) return true;
                return false;
            });
        }

        if (!searchQuery.trim()) {
            return filtered;
        }

        const query = searchQuery.toLowerCase();
        const result = filtered.filter((protocol: Protocol) => {
            if (protocol.title.toLowerCase().includes(query)) return true;
            if (protocol.group?.toLowerCase().includes(query)) return true;
            if (protocol.targets.some((id: string | number) => {
                const name = innerfaceMap.get(id.toString());
                return name?.includes(query);
            })) {
                return true;
            }
            return false;
        });

        // Optional: log slow filters
        // console.log(`[PERF] Filter took ${(end - start).toFixed(2)}ms`);
        return result;
    }, [protocols, searchQuery, activeFilters, innerfaceMap]);

    // Grouping Logic
    const groupedProtocols = useMemo(() => {
        const groups: Record<string, Protocol[]> = {};
        const sortOrder = Object.keys(GROUP_CONFIG); // Use defined order from config

        filteredProtocols.forEach(p => {
            const groupName = p.group || 'ungrouped';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(p);
        });

        // Sort groups based on config, putting unknown groups at the end
        const sortedGroups = Object.entries(groups).sort(([keyA], [keyB]) => {
            const indexA = sortOrder.indexOf(keyA);
            const indexB = sortOrder.indexOf(keyB);
            if (indexA === -1 && indexB === -1) return keyA.localeCompare(keyB);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        return sortedGroups;
    }, [filteredProtocols]);

    // 3. Progressive Batching
    // Render first 20 items immediately, then the rest.
    const [renderedCount, setRenderedCount] = useState(20);

    useEffect(() => {
        // Reset to 20 when filters change to ensure fast response
        setRenderedCount(20);
    }, [filteredProtocols]);

    useEffect(() => {
        if (renderedCount < filteredProtocols.length) {
            // Load the rest in the next frame/idle time
            const timer = setTimeout(() => {
                setRenderedCount(prev => Math.min(prev + 200, filteredProtocols.length));
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [renderedCount, filteredProtocols.length]);


    useLayoutEffect(() => {
        const now = performance.now();
        console.log(`[PERF][6] ProtocolsContent: Painted items at ${now.toFixed(2)}ms`);
    });

    if (filteredProtocols.length === 0) {
        return (
            <div className="py-12 text-center flex flex-col items-center justify-center text-sub">
                <div className="mb-4 text-4xl opacity-20">
                    <FontAwesomeIcon icon={faSearch} />
                </div>
                <p>
                    {!searchQuery.trim() && activeFilters.length === 1 && activeFilters[0] === 'ungrouped' ? (
                        <>No <span className="text-text-primary">ungrouped</span> protocols</>
                    ) : !searchQuery.trim() && activeFilters.length > 0 ? (
                        <>No protocols found in <span className="text-text-primary">{activeFilters.join(', ')}</span></>
                    ) : searchQuery.trim() && activeFilters.length > 0 ? (
                        <>No protocols matching "<span className="text-text-primary">{searchQuery}</span>" in selected categories</>
                    ) : searchQuery.trim() ? (
                        <>No protocols found matching "<span className="text-text-primary">{searchQuery}</span>"</>
                    ) : (
                        "No protocols found"
                    )}
                </p>
            </div>
        );
    }

    let currentRenderCount = 0;

    return (
        <div className="flex flex-col gap-8 pb-20">
            {groupedProtocols.map(([groupName, groupProtocols]) => {
                // progressive rendering check per group
                if (currentRenderCount >= renderedCount) return null;
                const protocolsToShow = groupProtocols.slice(0, renderedCount - currentRenderCount);
                currentRenderCount += protocolsToShow.length;

                if (protocolsToShow.length === 0) return null;

                const config = GROUP_CONFIG[groupName] || GROUP_CONFIG['ungrouped'];

                return (
                    <CollapsibleSection
                        key={groupName}
                        defaultOpen={true}
                        title={
                            <div className="flex items-center gap-3">
                                {config && <FontAwesomeIcon icon={config.icon} style={{ color: config.color }} className="text-lg opacity-80" />}
                                <span className={groupName === 'ungrouped' ? 'opacity-50' : ''}>{groupName}</span>
                                <span className="text-xs font-mono font-normal opacity-40 bg-sub/20 px-2 py-0.5 rounded-full ml-auto md:ml-0">
                                    {groupProtocols.length}
                                </span>
                            </div>
                        }
                        className="animate-in fade-in slide-in-from-bottom-2 duration-500"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {protocolsToShow.map((protocol) => (
                                <ProtocolRow
                                    key={protocol.id}
                                    protocol={protocol}
                                    innerfaces={innerfaces}
                                    onLevelUp={(id: string | number) => applyProtocol(id, '+')}
                                    onLevelDown={(id: string | number) => applyProtocol(id, '-')}
                                    onEdit={handleEditProtocol}
                                />
                            ))}
                        </div>
                    </CollapsibleSection>
                );
            })}

            {filteredProtocols.length > renderedCount && (
                <div className="py-4 text-center text-xs text-sub opacity-50">
                    Loading rest...
                </div>
            )}
        </div>
    );
});

export function ProtocolsList() {
    const { applyProtocol, innerfaces, protocols } = useScoreContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProtocolId, setSelectedProtocolId] = useState<string | number | null>(null);

    // Extract unique groups
    const protocolGroups = useMemo(() => {
        const groups = new Set(protocols.map((p: Protocol) => p.group).filter(Boolean));
        return Array.from(groups).sort();
    }, [protocols]);

    const handleAddProtocol = () => {
        setSelectedProtocolId(null);
        setIsModalOpen(true);
    };

    const handleEditProtocol = (id: string | number) => {
        setSelectedProtocolId(id);
        setIsModalOpen(true);
    };

    const toggleFilter = (filter: string) => {
        if (filter === 'all') {
            setActiveFilters([]);
            return;
        }
        setActiveFilters(prev => {
            if (prev.includes(filter)) {
                return prev.filter((f: string) => f !== filter);
            } else {
                return [...prev, filter];
            }
        });
    };

    const removeFilter = (filter: string) => {
        setActiveFilters((prev: string[]) => prev.filter((f: string) => f !== filter));
    };

    // If data is truly missing (e.g. error), we might want safe guards, 
    // but GlobalLoader ensures we have initial data. 
    // We can keep a minimal empty state check if needed, but not a "Loading..." spinner.
    if (!protocols) return null;

    return (
        <div className="flex flex-col gap-6 w-full">

            {/* Header / Controls */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-lexend text-text-primary">Protocols</h1>
                        <p className="text-text-secondary font-mono text-sm mt-1">
                            Manage your routine actions and their impact.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-0">
                            {/* Add Button */}
                            <button
                                onClick={handleAddProtocol}
                                className="h-[46px] w-[36px] flex items-center justify-center rounded-lg text-sub hover:text-main transition-all cursor-pointer"
                                title="Add Protocol"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-xl" />
                            </button>

                            {/* Filter Button with Dropdown */}
                            <div className="relative group">
                                <button className={`h-[46px] w-[36px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${activeFilters.length > 0 ? 'text-text-primary' : 'text-sub hover:text-text-primary'}`}>
                                    <div className="relative">
                                        <FontAwesomeIcon icon={faFilter} className="text-xl" />
                                        {activeFilters.length > 0 && (
                                            <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-main rounded-full flex items-center justify-center text-[9px] text-bg-primary font-bold border border-bg-primary">
                                                {activeFilters.length}
                                            </div>
                                        )}
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                <div className="absolute top-full right-0 mt-2 w-48 bg-sub-alt rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-2 transform origin-top-right border border-white/5">
                                    <div className="flex flex-col">
                                        <button
                                            onClick={() => toggleFilter('all')}
                                            className={`flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-md transition-all group/item ${activeFilters.length === 0 ? 'bg-sub/30' : 'hover:bg-sub/20'}`}
                                        >
                                            <div className="w-4 flex items-center justify-center opacity-70">
                                                <FontAwesomeIcon icon={faFilter} className="text-[10px]" />
                                            </div>
                                            <span className={`text-xs font-mono lowercase ${activeFilters.length === 0 ? 'text-text-primary' : 'text-sub group-hover/item:text-text-primary'}`}>
                                                All Protocols
                                            </span>
                                            {activeFilters.length === 0 && (
                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-main shadow-[0_0_8px_rgba(226,183,20,0.5)]"></div>
                                            )}
                                        </button>

                                        <div className="h-px bg-white/5 my-1 mx-2"></div>

                                        {protocolGroups.map(group => {
                                            const config = GROUP_CONFIG[group as string];
                                            const isActive = activeFilters.includes(group as string);
                                            return (
                                                <button
                                                    key={group}
                                                    onClick={() => toggleFilter(group as string)}
                                                    className={`flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-md transition-all group/item ${isActive ? 'bg-sub/30' : 'hover:bg-sub/20'}`}
                                                >
                                                    <div className="w-4 flex items-center justify-center">
                                                        {config ? (
                                                            <FontAwesomeIcon
                                                                icon={config.icon}
                                                                style={{ color: config.color }}
                                                                className="text-[10px]"
                                                            />
                                                        ) : (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-sub"></div>
                                                        )}
                                                    </div>
                                                    <span className={`text-xs font-mono lowercase ${isActive ? 'text-text-primary' : 'text-sub group-hover/item:text-text-primary'}`}>
                                                        {group}
                                                    </span>
                                                    {isActive && (
                                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-main shadow-[0_0_8px_rgba(226,183,20,0.5)]"></div>
                                                    )}
                                                </button>
                                            );
                                        })}

                                        <div className="h-px bg-white/5 my-1 mx-2"></div>

                                        <button
                                            onClick={() => toggleFilter('ungrouped')}
                                            className={`flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-md transition-all group/item ${activeFilters.includes('ungrouped') ? 'bg-sub/30' : 'hover:bg-sub/20'}`}
                                        >
                                            <div className="w-4 flex items-center justify-center">
                                                <FontAwesomeIcon icon={faCircle} className="text-[10px] text-sub" />
                                            </div>
                                            <span className={`text-xs font-mono lowercase ${activeFilters.includes('ungrouped') ? 'text-text-primary' : 'text-sub group-hover/item:text-text-primary'}`}>
                                                ungrouped
                                            </span>
                                            {activeFilters.includes('ungrouped') && (
                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-main shadow-[0_0_8px_rgba(226,183,20,0.5)]"></div>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative group flex-grow md:flex-grow-0 ml-1">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none">
                                <FontAwesomeIcon icon={faSearch} className="text-sm" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search protocols..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-64 pl-10 pr-4 py-3 bg-sub-alt rounded-lg outline-none text-text-primary placeholder:text-sub font-mono text-sm transition-colors duration-150 focus:bg-sub"
                            />
                        </div>
                    </div>
                </div>

                {/* Active Filter Chips */}
                <ActiveFiltersList
                    label="filtering by:"
                    filters={activeFilters.map(filter => ({
                        id: filter,
                        label: filter,
                        icon: GROUP_CONFIG[filter]?.icon,
                        color: GROUP_CONFIG[filter]?.color,
                        onRemove: () => removeFilter(filter)
                    }))}
                    onClearAll={() => setActiveFilters([])}
                />
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
                <ProtocolsContent
                    protocols={protocols}
                    innerfaces={innerfaces}
                    searchQuery={searchQuery}
                    activeFilters={activeFilters}
                    applyProtocol={applyProtocol}
                    handleEditProtocol={handleEditProtocol}
                />
            </div>

            <ProtocolSettingsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                protocolId={selectedProtocolId}
            />
        </div>
    );
}
