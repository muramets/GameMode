import { useState, useMemo } from 'react';
import { MOCK_PROTOCOLS, MOCK_INNERFACES } from './mockData';
import { ProtocolRow } from './ProtocolRow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faPlus,
    faFilter,
    faDumbbell,
    faBrain,
    faBath,
    faMugHot,
    faBookOpen,
    faLeaf,
    faXmark,
    faCircle
} from '@fortawesome/free-solid-svg-icons';

const GROUP_CONFIG: Record<string, { icon: any; color: string }> = {
    Physical: { icon: faDumbbell, color: '#98c379' },
    Mental: { icon: faBrain, color: '#ca4754' },
    Recovery: { icon: faBath, color: '#7fb3d3' },
    Work: { icon: faMugHot, color: '#e2b714' },
    Learning: { icon: faBookOpen, color: '#e2b714' },
    Substances: { icon: faLeaf, color: '#ca4754' },
    ungrouped: { icon: faCircle, color: '#666666' },
};

export function ProtocolsList() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    // Extract unique groups
    const protocolGroups = useMemo(() => {
        const groups = new Set(MOCK_PROTOCOLS.map(p => p.group).filter(Boolean));
        return Array.from(groups).sort();
    }, []);

    // Filter protocols based on search query and active filters
    const filteredProtocols = useMemo(() => {
        let filtered = MOCK_PROTOCOLS;

        // Apply group filters
        if (activeFilters.length > 0) {
            filtered = filtered.filter(p => {
                if (activeFilters.includes('ungrouped') && !p.group) return true;
                if (p.group && activeFilters.includes(p.group)) return true;
                return false;
            });
        }

        if (!searchQuery.trim()) return filtered;

        const query = searchQuery.toLowerCase();
        return filtered.filter(protocol => {
            // Match title
            if (protocol.title.toLowerCase().includes(query)) return true;
            // Match group
            if (protocol.group?.toLowerCase().includes(query)) return true;
            // Match target innerface names
            const targetNames = protocol.targets.map(id =>
                MOCK_INNERFACES.find(i => i.id === id)?.name.toLowerCase()
            );
            if (targetNames.some(name => name?.includes(query))) return true;

            return false;
        });
    }, [searchQuery, activeFilters]);

    // Handlers
    const handleLevelUp = (id: string | number) => console.log('Level Up:', id);
    const handleLevelDown = (id: string | number) => console.log('Level Down:', id);
    const handleEdit = (id: string | number) => console.log('Edit:', id);
    const handleViewHistory = (id: string | number) => console.log('View History:', id);
    const handleAddProtocol = () => console.log('Add Protocol Clicked');

    const toggleFilter = (filter: string) => {
        if (filter === 'all') {
            setActiveFilters([]);
            return;
        }

        setActiveFilters(prev => {
            if (prev.includes(filter)) {
                return prev.filter(f => f !== filter);
            } else {
                return [...prev, filter];
            }
        });
    };

    const removeFilter = (filter: string) => {
        setActiveFilters(prev => prev.filter(f => f !== filter));
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
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                            </button>

                            {/* Filter Button with Dropdown */}
                            <div className="relative group">
                                <button className={`h-[46px] w-[36px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${activeFilters.length > 0 ? 'text-text-primary' : 'text-sub hover:text-text-primary'}`}>
                                    <div className="relative">
                                        <FontAwesomeIcon icon={faFilter} className="text-sm" />
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
                {activeFilters.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <span className="text-sub font-mono text-[10px] px-1 lowercase">filtering by:</span>
                        {activeFilters.map(filter => (
                            <div key={filter} className="flex items-center gap-2 bg-sub-alt px-3 py-1 rounded-full text-text-primary font-mono text-[10px] lowercase shadow-sm">
                                {GROUP_CONFIG[filter] && (
                                    <FontAwesomeIcon
                                        icon={GROUP_CONFIG[filter].icon}
                                        style={{ color: GROUP_CONFIG[filter].color }}
                                        className="text-[9px]"
                                    />
                                )}
                                <span>{filter}</span>
                                <button
                                    onClick={() => removeFilter(filter)}
                                    className="ml-1 text-sub hover:text-[#ca4754] transition-colors cursor-pointer"
                                    title={`Remove ${filter} filter`}
                                >
                                    <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => setActiveFilters([])}
                            className="text-sub hover:text-main font-mono text-[10px] lowercase px-2 transition-colors"
                        >
                            clear all
                        </button>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
                {filteredProtocols.length > 0 ? (
                    filteredProtocols.map(protocol => (
                        <ProtocolRow
                            key={protocol.id}
                            protocol={protocol}
                            innerfaces={MOCK_INNERFACES}
                            onLevelUp={handleLevelUp}
                            onLevelDown={handleLevelDown}
                            onEdit={handleEdit}
                            onViewHistory={handleViewHistory}
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
        </div >
    );
}
