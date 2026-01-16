import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useScoreContext } from '../../contexts/ScoreProvider';
import { useMetadataStore } from '../../stores/metadataStore';
import { format, isToday, isYesterday, parseISO, isWithinInterval, startOfWeek, startOfMonth } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch
} from '@fortawesome/free-solid-svg-icons';
import { HistoryFilter } from './components/HistoryFilter';
import { Input } from '../../components/ui/molecules/Input';
import { ActiveFiltersList } from '../../components/ui/molecules/ActiveFiltersList';
import { HistoryEvent } from './components/HistoryEvent';
import type { TimeFilter, TypeFilter, EffectFilter } from './components/HistoryFilter';
import type { HistoryRecord } from '../../types/history';

export default function HistoryPage() {
    const { history, deleteEvent } = useScoreContext();
    const { innerfaces, protocols, states } = useMetadataStore();
    const location = useLocation();

    // Filters state
    const [searchQuery, setSearchQuery] = useState('');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('All time');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('All types');
    const [effectFilter, setEffectFilter] = useState<EffectFilter>('All effects');
    const [selectedProtocolIds, setSelectedProtocolIds] = useState<string[]>([]);
    const [selectedInnerfaceIds, setSelectedInnerfaceIds] = useState<string[]>([]);
    const [selectedStateIds, setSelectedStateIds] = useState<string[]>([]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const protocolId = params.get('protocolId');
        const innerfaceId = params.get('innerfaceId') || location.state?.filterInnerfaceId;
        const stateId = location.state?.filterStateId;
        const filterTime = location.state?.filterTime;

        if (protocolId) {
            setSelectedProtocolIds([protocolId]);
        }
        if (innerfaceId) {
            setSelectedInnerfaceIds([innerfaceId.toString()]);
        }
        if (stateId) {
            setSelectedStateIds([stateId]);
        }
        if (filterTime) {
            setTimeFilter(filterTime);
        }

        // Clean up URL/State
        if (protocolId || innerfaceId || location.state) {
            window.history.replaceState({}, document.title, location.pathname);
        }
    }, [location, states]);

    const filteredHistory = useMemo(() => {
        return history.filter(event => {
            // Search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    event.protocolName.toLowerCase().includes(query) ||
                    Object.keys(event.changes).some(id => id.toString().toLowerCase().includes(query));
                if (!matchesSearch) return false;
            }

            // Time filter
            if (timeFilter !== 'All time') {
                const eventDate = parseISO(event.timestamp);
                const now = new Date();
                if (timeFilter === 'Today' && !isToday(eventDate)) return false;
                if (timeFilter === 'This week' && !isWithinInterval(eventDate, { start: startOfWeek(now), end: now })) return false;
                if (timeFilter === 'This month' && !isWithinInterval(eventDate, { start: startOfMonth(now), end: now })) return false;
            }

            // Type filter
            if (typeFilter !== 'All types') {
                if (typeFilter === 'Protocols' && event.type !== 'protocol') return false;
                if (typeFilter === 'Manual' && event.type !== 'quick_action') return false;
                if (typeFilter === 'System' && event.type !== 'system') return false;
            }

            // Effect filter
            if (effectFilter !== 'All effects') {
                const isPositive = event.action === '+';
                if (effectFilter === 'Positive' && !isPositive) return false;
                if (effectFilter === 'Negative' && isPositive) return false;
            }

            // Protocol filter (Multi-select OR logic)
            if (selectedProtocolIds.length > 0) {
                if (!selectedProtocolIds.includes(event.protocolId.toString())) return false;
            }

            // Innerface filter (Multi-select OR logic)
            if (selectedInnerfaceIds.length > 0) {
                const eventInnerfaces = Object.keys(event.changes || {});
                const hasMatchingInnerface = selectedInnerfaceIds.some(id => eventInnerfaces.includes(id));
                if (!hasMatchingInnerface) return false;
            }

            // State filter (Multi-select OR logic)
            if (selectedStateIds.length > 0) {
                const relatedStates = states.filter(s => selectedStateIds.includes(s.id));

                // Collect all valid protocol and innerface IDs from the selected states
                const validProtocolIds = relatedStates
                    .flatMap(s => s.protocolIds || [])
                    .map(id => id.toString());

                const validInnerfaceIds = relatedStates
                    .flatMap(s => s.innerfaceIds || [])
                    .map(id => id.toString());

                // Check if event matches either protocol OR innerface
                const matchesProtocol = validProtocolIds.includes(event.protocolId.toString());
                const eventInnerfaces = Object.keys(event.changes || {});
                const matchesInnerface = eventInnerfaces.some(id => validInnerfaceIds.includes(id));

                if (!matchesProtocol && !matchesInnerface) return false;
            }

            return true;
        });
    }, [history, searchQuery, timeFilter, typeFilter, effectFilter, selectedProtocolIds, selectedInnerfaceIds, selectedStateIds, states]);

    const groupedHistory = useMemo(() => {
        const groups: Record<string, typeof filteredHistory> = {};

        filteredHistory.forEach(event => {
            const date = parseISO(event.timestamp);
            let dateKey = format(date, 'yyyy-MM-dd');

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(event);
        });

        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    }, [filteredHistory]);

    const getDateLabel = (dateStr: string) => {
        const date = parseISO(dateStr + 'T00:00:00');
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMMM d, yyyy');
    };

    const hasActiveFilters = searchQuery.trim() !== '' ||
        timeFilter !== 'All time' ||
        typeFilter !== 'All types' ||
        effectFilter !== 'All effects' ||
        selectedProtocolIds.length > 0 ||
        selectedInnerfaceIds.length > 0 ||
        selectedStateIds.length > 0;

    const clearFilters = () => {
        setSearchQuery('');
        setTimeFilter('All time');
        setTypeFilter('All types');
        setEffectFilter('All effects');
        setSelectedProtocolIds([]);
        setSelectedInnerfaceIds([]);
        setSelectedStateIds([]);
    };

    return (
        <div className="flex flex-col gap-8 w-full pb-12">
            {/* Header Mirroring ProtocolsList */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-lexend text-text-primary">history</h1>
                    <p className="text-text-secondary font-mono text-sm mt-1">
                        {history.length} lifecycle events recorded in total.
                    </p>
                </div>

                <div className="flex items-stretch gap-2 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="flex-grow md:flex-grow-0 ml-1 md:w-64">
                        <Input
                            icon={faSearch}
                            placeholder="Search timeline..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <HistoryFilter
                        timeFilter={timeFilter}
                        setTimeFilter={setTimeFilter}
                        typeFilter={typeFilter}
                        setTypeFilter={setTypeFilter}
                        effectFilter={effectFilter}
                        setEffectFilter={setEffectFilter}
                        selectedProtocolIds={selectedProtocolIds}
                        setSelectedProtocolIds={setSelectedProtocolIds}
                        selectedInnerfaceIds={selectedInnerfaceIds}
                        setSelectedInnerfaceIds={setSelectedInnerfaceIds}
                        selectedStateIds={selectedStateIds}
                        setSelectedStateIds={setSelectedStateIds}
                        protocols={protocols}
                        innerfaces={innerfaces}
                        states={states}
                        hasActiveFilters={hasActiveFilters}
                        clearFilters={clearFilters}
                    />
                </div>
            </div>

            {/* Active Chips Area */}
            <ActiveFiltersList
                className="-mt-4 mb-4"
                filters={[
                    ...(searchQuery ? [{
                        id: 'search',
                        label: `query: ${searchQuery}`,
                        icon: faSearch,
                        color: 'var(--main-color)',
                        onRemove: () => setSearchQuery('')
                    }] : []),
                    ...(timeFilter !== 'All time' ? [{
                        id: 'time',
                        label: timeFilter,
                        icon: undefined,
                        onRemove: () => setTimeFilter('All time')
                    }] : []),
                    ...(typeFilter !== 'All types' ? [{
                        id: 'type',
                        label: typeFilter === 'Protocols' ? 'Check-ins' : typeFilter === 'Manual' ? 'Manual Changes' : typeFilter,
                        icon: undefined,
                        onRemove: () => setTypeFilter('All types')
                    }] : []),
                    ...(effectFilter !== 'All effects' ? [{
                        id: 'effect',
                        label: effectFilter,
                        icon: undefined,
                        onRemove: () => setEffectFilter('All effects')
                    }] : []),
                    ...selectedProtocolIds.map(id => ({
                        id: `protocol-${id}`,
                        label: protocols.find(p => p.id.toString() === id)?.title || id,
                        icon: undefined,
                        onRemove: () => setSelectedProtocolIds(selectedProtocolIds.filter(pid => pid !== id))
                    })),
                    ...selectedInnerfaceIds.map(id => ({
                        id: `innerface-${id}`,
                        label: innerfaces.find(i => i.id.toString() === id)?.name.split('.')[0] || id,
                        icon: undefined,
                        onRemove: () => setSelectedInnerfaceIds(selectedInnerfaceIds.filter(iid => iid !== id))
                    })),
                    ...selectedStateIds.map(id => ({
                        id: `state-${id}`,
                        label: states.find(s => s.id === id)?.name || id,
                        icon: undefined,
                        onRemove: () => setSelectedStateIds(selectedStateIds.filter(sid => sid !== id))
                    }))
                ]}
                onClearAll={hasActiveFilters ? clearFilters : undefined}
            />

            {/* List */}
            {/* History Feed */}
            <div className="flex flex-col gap-8">
                {groupedHistory.map(([dateKey, events]) => (
                    <div key={dateKey} className="flex flex-col gap-4">
                        <h2 className="text-text-secondary font-mono text-sm pl-1 flex items-baseline">
                            {getDateLabel(dateKey)}<span className="opacity-50">: {events.length}</span>
                        </h2>
                        <div className="flex flex-col gap-2">
                            <AnimatePresence mode="popLayout">
                                {events.map((event: HistoryRecord) => {
                                    const protocol = protocols.find(p => p.id.toString() === event.protocolId.toString());
                                    return (
                                        <motion.div
                                            key={event.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{
                                                opacity: 0,
                                                x: -50,
                                                height: 0,
                                                marginBottom: 0,
                                                filter: 'blur(4px)'
                                            }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <HistoryEvent
                                                event={event}
                                                innerfaces={innerfaces}
                                                protocolColor={protocol?.color}
                                                onDelete={deleteEvent}
                                                onFilterInnerface={(id) => setSelectedInnerfaceIds([...selectedInnerfaceIds, id])}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                ))}
            </div>

            {filteredHistory.length === 0 && history.length > 0 && (
                <div className="py-32 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-sub-alt rounded-full flex items-center justify-center mb-8 text-sub/10">
                        <FontAwesomeIcon icon={faSearch} className="text-4xl" />
                    </div>
                    <h3 className="text-xl font-lexend font-bold text-text-secondary mb-3">No matching events</h3>
                    <p className="text-sub font-mono text-sm max-w-sm opacity-50 mb-8">
                        Your filters are too strict. No records were found matching these specific conditions.
                    </p>
                    <button
                        onClick={clearFilters}
                        className="px-8 py-3 bg-main text-bg-primary rounded-xl font-mono text-xs font-black uppercase tracking-[0.25em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-main/20"
                    >
                        Reset All Filters
                    </button>
                </div>
            )}
        </div>
    );
}
