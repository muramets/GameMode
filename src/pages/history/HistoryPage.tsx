import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useSearchParams } from 'react-router-dom';

import { useMetadataStore } from '../../stores/metadataStore';
import { useHistoryFeed } from '../../features/history/hooks/useHistoryFeed';
import { format, isToday, isYesterday, parseISO, startOfWeek, startOfMonth } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch
} from '@fortawesome/free-solid-svg-icons';
import { HistoryFilter } from './components/HistoryFilter';
import { Input } from '../../components/ui/molecules/Input';
import { Button } from '../../components/ui/atoms/Button';
import { ActiveFiltersList } from '../../components/ui/molecules/ActiveFiltersList';
import { HistoryEvent } from './components/HistoryEvent';
import type { TimeFilter, TypeFilter, EffectFilter } from './components/HistoryFilter';
import type { HistoryRecord } from '../../types/history';

export default function HistoryPage() {
    const { innerfaces, protocols, states, groupsMetadata } = useMetadataStore();
    const location = useLocation();

    const [searchParams, setSearchParams] = useSearchParams();

    // Filters state
    const [searchQuery, setSearchQuery] = useState('');
    // Time filter still uses state (defaults to All time)
    const [timeFilter, setTimeFilter] = useState<TimeFilter>(() => {
        return (location.state as HistoryPageState)?.filterTime || (searchParams.get('time') as TimeFilter) || 'All time';
    });
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('All types');
    const [effectFilter, setEffectFilter] = useState<EffectFilter>('All effects');

    // Derived from URL
    const selectedProtocolIds = useMemo(() => searchParams.getAll('protocolId'), [searchParams]);
    const selectedInnerfaceIds = useMemo(() => searchParams.getAll('innerfaceId'), [searchParams]);
    const selectedStateIds = useMemo(() => searchParams.getAll('stateId'), [searchParams]);

    interface HistoryPageState {
        filterStateId?: string;
        filterInnerfaceId?: string;
        filterTime?: TimeFilter;
    }

    const setSelectedProtocolIds = useCallback((ids: string[]) => {
        setSearchParams((prev: URLSearchParams) => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('protocolId');
            ids.forEach(id => newParams.append('protocolId', id));
            return newParams;
        });
    }, [setSearchParams]);

    const setSelectedInnerfaceIds = useCallback((ids: string[]) => {
        setSearchParams((prev: URLSearchParams) => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('innerfaceId');
            ids.forEach(id => newParams.append('innerfaceId', id));
            return newParams;
        });
    }, [setSearchParams]);

    const setSelectedStateIds = useCallback((ids: string[]) => {
        setSearchParams((prev: URLSearchParams) => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('stateId');
            ids.forEach(id => newParams.append('stateId', id));
            return newParams;
        });
    }, [setSearchParams]);

    // Derived Server-Side Filters
    const serverFilters = useMemo(() => {
        // 1. Time Range
        let timeRange: { start: Date; end: Date } | null = null;
        if (timeFilter !== 'All time') {
            const now = new Date();
            if (timeFilter === 'Today') {
                // Start of today
                const start = new Date(now);
                start.setHours(0, 0, 0, 0);
                timeRange = { start, end: now };
            } else if (timeFilter === 'This week') {
                const start = startOfWeek(now, { weekStartsOn: 1 });
                timeRange = { start, end: now };
            } else if (timeFilter === 'This month') {
                const start = startOfMonth(now);
                timeRange = { start, end: now };
            }
        }

        // 2. Protocols
        // Note: We only pass explicit protocol IDs.
        // If State filter is used, we derived protocol IDs from it.
        let protocolIdsToFilter: string[] | undefined = undefined;
        if (selectedProtocolIds.length > 0) {
            protocolIdsToFilter = selectedProtocolIds;
        }

        return {
            protocolIds: protocolIdsToFilter,
            type: typeFilter,
            timeRange
        };
    }, [timeFilter, typeFilter, selectedProtocolIds]);

    // Pass filters to hook (Triggers Server-Side Fetch)
    const { history, isLoading, isLoadingMore, hasMore, loadMore, deleteEvent } = useHistoryFeed(serverFilters);

    // Infinite Scroll Observer
    const observerTarget = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    loadMore();
                }
            },
            { threshold: 1.0 }
        );

        const currentTarget = observerTarget.current;

        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [observerTarget, hasMore, isLoadingMore, loadMore]);

    // Initialize from location state (fallback for complex navigations not using URL)
    // Initialize from location state (fallback for complex navigations not using URL)
    useEffect(() => {
        const state = location.state as HistoryPageState;
        if (state?.filterStateId) {
            const sid = state.filterStateId;
            if (!selectedStateIds.includes(sid)) {
                setSelectedStateIds([sid]);
            }
        }
        // Note: filterInnerfaceId etc handled by URL ideally, but if legacy state passed:
        if (state?.filterInnerfaceId) {
            const iid = state.filterInnerfaceId;
            if (!selectedInnerfaceIds.includes(iid.toString())) {
                setSelectedInnerfaceIds([iid.toString()]);
            }
        }
    }, [location.state, selectedStateIds, selectedInnerfaceIds, setSelectedStateIds, setSelectedInnerfaceIds]);

    const filteredHistory = useMemo(() => {
        return history.filter(event => {
            // Search filter (Client Side)
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    event.protocolName.toLowerCase().includes(query) ||
                    Object.keys(event.changes).some(id => id.toString().toLowerCase().includes(query));
                if (!matchesSearch) return false;
            }

            // Time & Type & Protocol Filter checks REMOVED (Handled Server-Side)
            // Note: We keep them here mostly for safety if server returns wider set, 
            // but effectively server handles primary filtering. 
            // EXCEPT: If we have complex logic that server couldn't handle (e.g. >10 protocols),
            // current server impl limits to 10. If we had 11 selected, server ignores filter (safely?), 
            // so we SHOULD technically keep client filter as fallback.

            // Re-applying Type filter client-side just in case
            if (typeFilter !== 'All types') {
                if (typeFilter === 'Actions' && event.type !== 'protocol') return false;
                if (typeFilter === 'Manual' && event.type !== 'quick_action') return false;
                if (typeFilter === 'System' && event.type !== 'system') return false;
            }

            // Effect filter (Client Side Only)
            if (effectFilter !== 'All effects') {
                const isPositive = event.action === '+';
                if (effectFilter === 'Positive' && !isPositive) return false;
                if (effectFilter === 'Negative' && isPositive) return false;
            }

            // Innerface filter (Client Side Only - too complex for standard index)
            if (selectedInnerfaceIds.length > 0) {
                const eventInnerfaces = Object.keys(event.changes || {});
                const hasMatchingInnerface = selectedInnerfaceIds.some((id: string) => eventInnerfaces.includes(id));
                if (!hasMatchingInnerface) return false;
            }

            // State filter (Client Side Logic)
            if (selectedStateIds.length > 0) {
                // ... (Logic for states requires matching either protocol set OR innerface set)
                // This is hard to fully server-side without Denormalization.
                const relatedStates = states.filter(s => selectedStateIds.includes(s.id));
                const validProtocolIds = relatedStates.flatMap(s => s.protocolIds || []).map(String);
                const validInnerfaceIds = relatedStates.flatMap(s => s.innerfaceIds || []).map(String);

                const matchesProtocol = validProtocolIds.includes(event.protocolId.toString());
                const eventInnerfaces = Object.keys(event.changes || {});
                const matchesInnerface = eventInnerfaces.some(id => validInnerfaceIds.includes(id));

                if (!matchesProtocol && !matchesInnerface) return false;
            }

            return true;
        });
    }, [history, searchQuery, typeFilter, effectFilter, selectedInnerfaceIds, selectedStateIds, states]);

    const groupedHistory = useMemo(() => {
        const groups: Record<string, typeof filteredHistory> = {};

        filteredHistory.forEach(event => {
            const date = parseISO(event.timestamp);
            const dateKey = format(date, 'yyyy-MM-dd');

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

    if (isLoading && history.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-sub font-mono animate-pulse uppercase tracking-widest text-xs">Loading Archives...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 w-full pb-12">
            {/* Header Mirroring ProtocolsList */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-lexend text-text-primary">history</h1>
                    <p className="text-text-secondary font-mono text-sm mt-1">
                        {history.length} events loaded
                        {hasMore && <span className="opacity-50"> (scroll for more)</span>}
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
                        groupsMetadata={groupsMetadata}
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
                        label: typeFilter === 'Actions' ? 'Check-ins' : typeFilter === 'Manual' ? 'Manual Changes' : typeFilter,
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
                        onRemove: () => setSelectedProtocolIds(selectedProtocolIds.filter((pid: string) => pid !== id))
                    })),
                    ...selectedInnerfaceIds.map(id => ({
                        id: `innerface-${id}`,
                        label: innerfaces.find(i => i.id.toString() === id)?.name.split('.')[0] || id,
                        icon: undefined,
                        onRemove: () => setSelectedInnerfaceIds(selectedInnerfaceIds.filter((iid: string) => iid !== id))
                    })),
                    ...selectedStateIds.map(id => ({
                        id: `state-${id}`,
                        label: states.find(s => s.id === id)?.name || id,
                        icon: undefined,
                        onRemove: () => setSelectedStateIds(selectedStateIds.filter((sid: string) => sid !== id))
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

            {/* Loading Indicator / Sentinel */}
            {hasMore && (
                <div ref={observerTarget} className="flex justify-center py-8">
                    {isLoadingMore ? (
                        <div className="text-sub font-mono animate-pulse text-xs">Loading older events...</div>
                    ) : (
                        <div className="h-4" /> // Invisible trigger
                    )}
                </div>
            )}

            {!hasMore && history.length > 0 && (
                <div className="text-center py-8 text-sub/50 font-mono text-xs">
                    Start of timeline
                </div>
            )}

            {filteredHistory.length === 0 && history.length > 0 && (
                <div className="py-32 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-sub-alt rounded-full flex items-center justify-center mb-8 text-sub/10">
                        <FontAwesomeIcon icon={faSearch} className="text-4xl" />
                    </div>
                    <h3 className="text-xl font-lexend font-bold text-text-secondary mb-3">No matching events</h3>
                    <p className="text-text-secondary font-mono text-sm max-w-sm mb-8">
                        Your filters are too strict. No records were found matching these specific conditions.
                        {hasMore && " Scroll down to load more history."}
                    </p>
                    <Button
                        variant="primary"
                        onClick={clearFilters}
                        className="px-8 py-6 rounded-xl font-mono text-xs font-black uppercase tracking-[0.25em] transition-all hover:shadow-text-primary/20 shadow-xl shadow-main/20"
                    >
                        Reset All Filters
                    </Button>
                </div>
            )}
        </div>
    );
}
