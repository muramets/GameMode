import { useState, useMemo } from 'react';
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
export function ProtocolsList() {
    const { applyProtocol, innerfaces, protocols, isLoading } = useScoreContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProtocolId, setSelectedProtocolId] = useState<string | number | null>(null);

    // Extract unique groups
    const protocolGroups = useMemo(() => {
        const groups = new Set(protocols.map((p: Protocol) => p.group).filter(Boolean));
        return Array.from(groups).sort();
    }, [protocols]);

    // Filter protocols based on search query and active filters
    const filteredProtocols = useMemo(() => {
        let filtered = protocols;

        // Apply group filters
        if (activeFilters.length > 0) {
            filtered = filtered.filter((p: Protocol) => {
                if (activeFilters.includes('ungrouped') && !p.group) return true;
                if (p.group && activeFilters.includes(p.group)) return true;
                return false;
            });
        }

        if (!searchQuery.trim()) return filtered;

        const query = searchQuery.toLowerCase();
        return filtered.filter((protocol: Protocol) => {
            // Match title
            if (protocol.title.toLowerCase().includes(query)) return true;
            // Match group
            if (protocol.group?.toLowerCase().includes(query)) return true;
            // Match target innerface names
            const targetNames = protocol.targets.map((id: string | number) =>
                innerfaces.find((i: Innerface) => i.id === id)?.name.toLowerCase()
            );
            if (targetNames.some((name: string | undefined) => name?.includes(query))) return true;

            return false;
        });
    }, [protocols, searchQuery, activeFilters, innerfaces]);

    if (isLoading && protocols.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-sub font-mono animate-pulse uppercase tracking-widest text-xs">Loading Protocols...</div>
            </div>
        );
    }

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
                {filteredProtocols.length > 0 ? (
                    filteredProtocols.map((protocol: Protocol) => (
                        <ProtocolRow
                            key={protocol.id}
                            protocol={protocol}
                            innerfaces={innerfaces}
                            onLevelUp={(id: string | number) => applyProtocol(id, '+')}
                            onLevelDown={(id: string | number) => applyProtocol(id, '-')}
                            onEdit={handleEditProtocol}
                        />
                    ))
                ) : (
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
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setActiveFilters([]);
                            }}
                            className="mt-4 text-main hover:underline text-sm"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

            <ProtocolSettingsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                protocolId={selectedProtocolId}
            />
        </div>
    );
}
