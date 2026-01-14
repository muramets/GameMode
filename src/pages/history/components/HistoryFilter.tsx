import { useState, useMemo, useRef, useEffect } from 'react';
import { GROUP_CONFIG } from '../../../pages/protocols/constants';
import { renderIcon } from '../../../utils/iconMapper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFilter,
    faCalendarAlt,
    faHistory,
    faBolt,
    faLayerGroup,
    faTrash,
    faChevronRight,
    faChevronLeft,
    faSearch,
    faCheck,
    faList,
    faChartBar
} from '@fortawesome/free-solid-svg-icons';
import type { Protocol, Innerface } from '../../../pages/protocols/types';

export type TimeFilter = 'All time' | 'Today' | 'This week' | 'This month';
export type TypeFilter = 'All types' | 'Protocols' | 'Manual';
export type EffectFilter = 'All effects' | 'Positive' | 'Negative';

type FilterView = 'root' | 'protocol_groups' | 'protocols_list' | 'innerfaces';

interface HistoryFilterProps {
    timeFilter: TimeFilter;
    setTimeFilter: (val: TimeFilter) => void;
    typeFilter: TypeFilter;
    setTypeFilter: (val: TypeFilter) => void;
    effectFilter: EffectFilter;
    setEffectFilter: (val: EffectFilter) => void;
    selectedProtocolIds: string[];
    setSelectedProtocolIds: (val: string[]) => void;
    selectedInnerfaceIds: string[];
    setSelectedInnerfaceIds: (val: string[]) => void;
    protocols: Protocol[];
    innerfaces: Innerface[];
    hasActiveFilters: boolean;
    clearFilters: () => void;
}

export function HistoryFilter({
    timeFilter,
    setTimeFilter,
    typeFilter,
    setTypeFilter,
    effectFilter,
    setEffectFilter,
    selectedProtocolIds,
    setSelectedProtocolIds,
    selectedInnerfaceIds,
    setSelectedInnerfaceIds,
    protocols,
    innerfaces,
    hasActiveFilters,
    clearFilters
}: HistoryFilterProps) {
    const [view, setView] = useState<FilterView>('root');
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    const handleMouseEnter = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        closeTimeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 300);
    };

    // Reset search when view changes
    useEffect(() => {
        setSearchQuery('');
        if (view !== 'root' && view !== 'protocol_groups' && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    }, [view]);

    // Group protocols
    const protocolGroups = useMemo(() => {
        const groups = new Set<string>();
        protocols.forEach(p => groups.add(p.group || 'Other'));
        return Array.from(groups).sort();
    }, [protocols]);

    const filteredProtocols = useMemo(() => {
        if (!selectedGroup) return [];
        return protocols.filter(p =>
            (p.group || 'Other') === selectedGroup &&
            p.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [protocols, selectedGroup, searchQuery]);

    const filteredInnerfaces = useMemo(() => {
        return innerfaces.filter(i =>
            i.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [innerfaces, searchQuery]);

    const getProtocolLabel = (ids: string[]) => {
        if (ids.length === 0) return 'All protocols';
        if (ids.length === 1) return protocols.find(p => p.id.toString() === ids[0])?.title || ids[0];
        return `${ids.length} selected`;
    };

    const getInnerfaceLabel = (ids: string[]) => {
        if (ids.length === 0) return 'All innerfaces';
        if (ids.length === 1) return innerfaces.find(i => i.id.toString() === ids[0])?.name.split('.')[0] || ids[0];
        return `${ids.length} selected`;
    };

    const toggleProtocol = (id: string) => {
        if (selectedProtocolIds.includes(id)) {
            setSelectedProtocolIds(selectedProtocolIds.filter(pid => pid !== id));
        } else {
            setSelectedProtocolIds([...selectedProtocolIds, id]);
        }
    };

    const toggleInnerface = (id: string) => {
        if (selectedInnerfaceIds.includes(id)) {
            setSelectedInnerfaceIds(selectedInnerfaceIds.filter(iid => iid !== id));
        } else {
            setSelectedInnerfaceIds([...selectedInnerfaceIds, id]);
        }
    };

    const FilterSection = ({ title, icon, options, value, onChange }: any) => (
        <div className="flex flex-col gap-1 py-2 first:pt-1 last:pb-1">
            <div className="px-3 py-2 flex items-center gap-2 text-[10px] text-main font-mono font-bold uppercase tracking-[0.2em] opacity-90">
                <FontAwesomeIcon icon={icon} className="text-[0.9em]" />
                {title}
            </div>
            <div className="h-px bg-white/10 mb-1 mx-3"></div>
            <div className="flex flex-col gap-0.5">
                {options.map((opt: any) => {
                    const label = typeof opt === 'string' ? opt : opt.label;
                    const val = typeof opt === 'string' ? opt : opt.id;
                    const isActive = value === val;

                    return (
                        <button
                            key={val}
                            onClick={() => onChange(val)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-mono transition-all group/item ${isActive ? 'bg-sub/30 text-text-primary' : 'text-sub hover:bg-sub/20 hover:text-text-primary'}`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full transition-all ${isActive
                                ? 'bg-main shadow-[0_0_8px_var(--main-color)] scale-110'
                                : 'bg-sub/20 border border-transparent group-hover/item:border-sub/40'
                                }`} />
                            <span className="flex-1 text-left lowercase">{label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const NavigationButton = ({ title, icon, value, onClick, active }: any) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-[11px] font-mono transition-all group/nav ${active ? 'bg-sub/30 text-text-primary' : 'text-sub hover:bg-sub/20 hover:text-text-primary'}`}
        >
            <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={icon} className={active ? 'text-main' : 'opacity-70'} />
                <div className="flex flex-col items-start gap-0.5">
                    <span className="uppercase tracking-wider font-bold opacity-90">{title}</span>
                    <span className="text-[10px] opacity-60 lowercase">{value}</span>
                </div>
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="text-[9px] opacity-50 group-hover/nav:translate-x-0.5 transition-transform" />
        </button>
    );

    const SearchHeader = ({ title, showSearch, onBack }: { title: string, showSearch: boolean, onBack: () => void }) => (
        <div className="pb-2 border-b border-white/5 mb-2 sticky top-0 bg-sub-alt/95 backdrop-blur-xl z-10">
            <div className="flex items-center gap-2 px-1 py-1 mb-2">
                <button
                    onClick={onBack}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-sub/20 text-sub hover:text-text-primary transition-colors"
                >
                    <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                </button>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">{title}</span>
            </div>
            {showSearch && (
                <div className="px-1">
                    <div className="relative group/search">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub/50 text-[10px]" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Filter list..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-sub/10 rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-mono text-text-primary placeholder:text-sub/40 outline-none focus:bg-sub/20 transition-colors"
                        />
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button className={`flex items-center justify-center px-3 py-3 transition-all cursor-pointer ${hasActiveFilters ? 'text-main' : isOpen ? 'text-text-primary' : 'text-sub hover:text-text-primary'}`}>
                <div className="relative">
                    <FontAwesomeIcon icon={faFilter} className="text-xl" />
                    {hasActiveFilters && (
                        <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-main rounded-full flex items-center justify-center text-[9px] text-bg-primary font-bold border border-bg-primary">
                            !
                        </div>
                    )}
                </div>
            </button>

            {/* Dropdown Menu */}
            <div className={`absolute top-full right-0 mt-3 w-64 bg-sub-alt/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 z-50 p-2 transform origin-top-right border border-white/5 divide-y divide-white/5 overflow-hidden ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                <div className="max-h-[70vh] min-h-[320px] overflow-y-auto custom-scrollbar">

                    {view === 'root' && (
                        <div className="animate-in slide-in-from-left-4 duration-200">
                            <div className="py-2">
                                <div className="px-3 py-2 flex items-center gap-2 text-[10px] text-main font-mono font-bold uppercase tracking-[0.2em] opacity-90">
                                    <FontAwesomeIcon icon={faLayerGroup} className="text-[0.9em]" />
                                    Specifics
                                </div>
                                <div className="h-px bg-white/10 mb-1 mx-3"></div>
                                <div className="flex flex-col gap-1 px-1">
                                    <NavigationButton
                                        title="Protocol"
                                        icon={faList}
                                        value={getProtocolLabel(selectedProtocolIds)}
                                        onClick={() => setView('protocol_groups')}
                                        active={selectedProtocolIds.length > 0}
                                    />
                                    <NavigationButton
                                        title="Innerface"
                                        icon={faChartBar}
                                        value={getInnerfaceLabel(selectedInnerfaceIds)}
                                        onClick={() => setView('innerfaces')}
                                        active={selectedInnerfaceIds.length > 0}
                                    />
                                </div>
                            </div>

                            <FilterSection
                                title="Time Period"
                                icon={faCalendarAlt}
                                options={['All time', 'Today', 'This week', 'This month']}
                                value={timeFilter}
                                onChange={setTimeFilter}
                            />
                            <FilterSection
                                title="Type"
                                icon={faHistory}
                                options={[
                                    'All types',
                                    { id: 'Protocols', label: 'Check-ins' },
                                    { id: 'Manual', label: 'Manual Score Adjustments' }
                                ]}
                                value={typeFilter}
                                onChange={setTypeFilter}
                            />

                            <FilterSection
                                title="Effect"
                                icon={faBolt}
                                options={['All effects', 'Positive', 'Negative']}
                                value={effectFilter}
                                onChange={setEffectFilter}
                            />
                        </div>
                    )}

                    {view === 'protocol_groups' && (
                        <div className="animate-in slide-in-from-right-4 duration-200 h-full flex flex-col">
                            <SearchHeader
                                title="Select Group"
                                showSearch={false}
                                onBack={() => setView('root')}
                            />

                            <button
                                onClick={() => { setSelectedProtocolIds([]); setView('root'); }}
                                className={`flex items-center gap-3 px-3 py-2 mx-1 mt-1 rounded-lg text-[11px] font-mono transition-all ${selectedProtocolIds.length === 0 ? 'bg-sub/30 text-text-primary' : 'text-sub hover:bg-sub/20 hover:text-text-primary'}`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${selectedProtocolIds.length === 0 ? 'bg-main shadow-[0_0_8px_var(--main-color)]' : 'bg-sub/20'}`} />
                                All protocols
                            </button>

                            <div className="flex flex-col gap-0.5 mt-2 px-1">
                                {protocolGroups.map(group => {
                                    const config = GROUP_CONFIG[group];
                                    return (
                                        <button
                                            key={group}
                                            onClick={() => { setSelectedGroup(group); setView('protocols_list'); }}
                                            className="flex items-center justify-between px-3 py-3 rounded-lg text-[11px] font-mono transition-all text-sub hover:bg-sub/20 hover:text-text-primary group/item"
                                            style={config ? { '--hover-color': config.color } as React.CSSProperties : undefined}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 flex justify-center text-xs opacity-70 transition-colors group-hover/item:text-[var(--hover-color)]">
                                                    {config ? (
                                                        <FontAwesomeIcon icon={config.icon} />
                                                    ) : (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-sub/50" />
                                                    )}
                                                </div>
                                                <span className="uppercase tracking-wider font-bold opacity-90">{group}</span>
                                            </div>
                                            <FontAwesomeIcon icon={faChevronRight} className="text-[9px] opacity-30 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition-all" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {view === 'protocols_list' && (
                        <div className="animate-in slide-in-from-right-4 duration-200 h-full flex flex-col">
                            <SearchHeader
                                title={selectedGroup || 'Protocols'}
                                showSearch={filteredProtocols.length > 5}
                                onBack={() => setView('protocol_groups')}
                            />

                            <div className="flex flex-col gap-0.5 mt-1 px-1">
                                {filteredProtocols.map(p => {
                                    const isSelected = selectedProtocolIds.includes(p.id.toString());
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => toggleProtocol(p.id.toString())}
                                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-mono transition-all group/item ${isSelected ? 'bg-sub/30 text-text-primary' : 'text-sub hover:bg-sub/20 hover:text-text-primary'}`}
                                            style={p.color ? { '--hover-color': p.color } as React.CSSProperties : undefined}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-4 flex justify-center text-sm opacity-80 transition-colors ${p.color ? 'group-hover/item:text-[var(--hover-color)]' : ''}`}>
                                                    {renderIcon(p.icon)}
                                                </span>
                                                <span className="lowercase">{p.title}</span>
                                            </div>
                                            {isSelected && <FontAwesomeIcon icon={faCheck} className="text-main text-[10px]" />}
                                        </button>
                                    );
                                })}
                                {filteredProtocols.length === 0 && (
                                    <div className="p-4 text-center text-sub/50 text-xs font-mono">No protocols found</div>
                                )}
                            </div>
                        </div>
                    )}

                    {view === 'innerfaces' && (
                        <div className="animate-in slide-in-from-right-4 duration-200">
                            <SearchHeader
                                title="Select Innerface"
                                showSearch={innerfaces.length > 10}
                                onBack={() => setView('root')}
                            />

                            <button
                                onClick={() => { setSelectedInnerfaceIds([]); setView('root'); }}
                                className={`flex items-center gap-3 px-3 py-2 mx-1 mt-1 rounded-lg text-[11px] font-mono transition-all ${selectedInnerfaceIds.length === 0 ? 'bg-sub/30 text-text-primary' : 'text-sub hover:bg-sub/20 hover:text-text-primary'}`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${selectedInnerfaceIds.length === 0 ? 'bg-main shadow-[0_0_8px_var(--main-color)]' : 'bg-sub/20'}`} />
                                All innerfaces
                            </button>

                            <div className="flex flex-col gap-0.5 mt-2 px-1">
                                {filteredInnerfaces.map(i => {
                                    const isSelected = selectedInnerfaceIds.includes(i.id.toString());
                                    return (
                                        <button
                                            key={i.id}
                                            onClick={() => toggleInnerface(i.id.toString())}
                                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-mono transition-all group/item ${isSelected ? 'bg-sub/30 text-text-primary' : 'text-sub hover:bg-sub/20 hover:text-text-primary'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-4 flex justify-center text-sm opacity-80">{renderIcon(i.icon)}</span>
                                                <span className="lowercase">{i.name.split('.')[0]}</span>
                                            </div>
                                            {isSelected && <FontAwesomeIcon icon={faCheck} className="text-main text-[10px]" />}
                                        </button>
                                    );
                                })}
                                {filteredInnerfaces.length === 0 && (
                                    <div className="p-4 text-center text-sub/50 text-xs font-mono">No innerfaces found</div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
                {hasActiveFilters && view === 'root' && (
                    <button
                        onClick={clearFilters}
                        className="w-full py-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-error hover:bg-error/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <FontAwesomeIcon icon={faTrash} className="text-[9px]" />
                        Clear All Filters
                    </button>
                )}
            </div>
        </div>
    );
}
