import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Innerface } from '../../innerfaces/types';
import { MonkeyTypeLoader } from '../../../components/ui/molecules/MonkeyTypeLoader';
import { ProtocolSettingsModal } from '../../../components/modals/ProtocolSettingsModal';
import { useScoreContext } from '../../../contexts/ScoreContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { GroupSettingsModal } from '../../../features/groups/components/GroupSettingsModal';
import { ActiveFiltersList } from '../../../components/ui/molecules/ActiveFiltersList';
import { GROUP_CONFIG } from '../../../constants/common';
import { useMetadataStore } from '../../../stores/metadataStore';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { useCollapsedGroups } from '../../../hooks/useCollapsedGroups';
import { useProtocolDnD } from '../hooks/useProtocolDnD';
// New refactored hooks
import { useProtocolsFiltering } from '../hooks/useProtocolsFiltering';
import { useProtocolsGrouping } from '../hooks/useProtocolsGrouping';
// New refactored components
import { ProtocolsToolbar } from './ProtocolsToolbar';
import { ProtocolsContent } from './ProtocolsContent';

export function ProtocolsList() {
    const { applyProtocol, innerfaces, protocols } = useScoreContext();
    const { activeContext } = usePersonalityStore();
    const { reorderProtocols, reorderGroups, groupOrder, groupsMetadata, isLoading } = useMetadataStore();

    // Simplified loading logic: Minimum 500ms display time
    // Simplified loading logic: Minimum 500ms display time ONLY if loading is actually needed
    const [minTimeMet, setMinTimeMet] = useState(!isLoading);
    useEffect(() => {
        if (!minTimeMet) {
            const timer = setTimeout(() => setMinTimeMet(true), 500);
            return () => clearTimeout(timer);
        }
    }, [minTimeMet]);

    const isReady = minTimeMet && !isLoading;

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProtocolId, setSelectedProtocolId] = useState<string | number | null>(null);

    // Group Settings State
    const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string>('');

    // Collapsed Groups Persistence
    const { isGroupCollapsed, toggleGroup } = useCollapsedGroups('protocols-collapsed-groups', false);

    // 1. Data Processing - Create innerface lookup map
    const innerfaceMap = useMemo(() => {
        const map = new Map<string, Innerface>();
        innerfaces.forEach((i: Innerface) => map.set(i.id.toString(), i));
        return map;
    }, [innerfaces]);

    // 2. Use filtering hook (handles search + filters)
    const {
        searchQuery,
        setSearchQuery,
        activeFilters,
        toggleFilter,
        removeFilter,
        filteredProtocols,
    } = useProtocolsFiltering(protocols, innerfaceMap);

    // 3. Use grouping hook (handles grouping + sorting)
    const { groupedProtocols, protocolGroups } = useProtocolsGrouping(
        filteredProtocols,
        groupOrder
    );

    const isDragEnabled = !searchQuery.trim() && (activeFilters.length === 0 || activeFilters.length === 1 && activeFilters[0] === 'ungrouped');
    const isReadOnly = activeContext?.type === 'role' || activeContext?.type === 'viewer';

    const [renderedCount, setRenderedCount] = useState(20);
    const [prevFilteredProtocols, setPrevFilteredProtocols] = useState(filteredProtocols);

    if (filteredProtocols !== prevFilteredProtocols) {
        setPrevFilteredProtocols(filteredProtocols);
        setRenderedCount(20);
    }

    useEffect(() => {
        if (renderedCount < filteredProtocols.length) {
            const timer = setTimeout(() => setRenderedCount(prev => Math.min(prev + 200, filteredProtocols.length)), 0);
            return () => clearTimeout(timer);
        }
    }, [renderedCount, filteredProtocols.length]);

    const handleEditProtocol = useCallback((id: string | number) => {
        setSelectedProtocolId(id);
        setIsModalOpen(true);
    }, []);

    const handleGroupEdit = useCallback((groupName: string) => {
        setSelectedGroup(groupName);
        setIsGroupSettingsOpen(true);
    }, []);

    const onReorderGroups = useCallback((newOrder: string[]) => {
        reorderGroups(newOrder);
    }, [reorderGroups]);

    const onReorderProtocols = useCallback((newItemIds: string[]) => {
        reorderProtocols(newItemIds);
    }, [reorderProtocols]);

    // Note: protocolGroups now comes from useProtocolsGrouping hook
    // Note: toggleFilter and removeFilter now come from useProtocolsFiltering hook

    const {
        sensors,
        active,
        justDroppedId,
        clearJustDropped,
        handleDragStart,
        handleDragEnd
    } = useProtocolDnD({
        groupedProtocols,
        onReorderGroups,
        onReorderProtocols
    });

    const interactionValue = useMemo(() => ({
        justDroppedId,
        isDragging: !!active.id,
        clearJustDropped
    }), [justDroppedId, active.id, clearJustDropped]);

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-lexend text-text-primary">Actions</h1>
                        <p className="text-text-secondary font-mono text-sm mt-1">
                            Manage your routine actions and their impact.
                        </p>
                    </div>

                    {/* Toolbar: Add button, Filter dropdown, Search */}
                    <ProtocolsToolbar
                        onAddProtocol={() => {
                            setSelectedProtocolId(null);
                            setIsModalOpen(true);
                        }}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        activeFilters={activeFilters}
                        protocolGroups={protocolGroups as string[]}
                        onToggleFilter={toggleFilter}
                    />
                </div>

                <ActiveFiltersList
                    label="filtering by:"
                    filters={activeFilters.map(filter => ({
                        id: filter,
                        label: filter,
                        icon: GROUP_CONFIG[filter]?.icon,
                        color: GROUP_CONFIG[filter]?.color,
                        onRemove: () => removeFilter(filter)
                    }))}
                    onClearAll={() => toggleFilter('all')}
                />
            </div>

            {(!isReady) ? (
                <MonkeyTypeLoader />
            ) : filteredProtocols.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <button
                        onClick={() => { setSelectedProtocolId(null); setIsModalOpen(true); }}
                        className="w-full min-h-[72px] border border-dashed border-sub/30 hover:border-sub rounded-xl flex flex-col items-center justify-center gap-2 text-sub hover:text-text-primary transition-all duration-200 group bg-sub-alt/5 hover:bg-sub-alt/10"
                    >
                        <div className="w-10 h-10 rounded-full bg-sub/10 group-hover:bg-sub/20 flex items-center justify-center transition-colors">
                            <FontAwesomeIcon icon={faPlus} className="text-lg" />
                        </div>
                        <span className="font-mono text-sm">Add your first action</span>
                    </button>
                </div>
            ) : (
                <>
                    {/* Protocols content with DnD */}
                    <ProtocolsContent
                        groupedProtocols={groupedProtocols}
                        innerfaces={innerfaces}
                        isDragEnabled={isDragEnabled}
                        isReadOnly={isReadOnly}
                        applyProtocol={applyProtocol}
                        handleEditProtocol={handleEditProtocol}
                        onGroupEdit={handleGroupEdit}
                        groupsMetadata={groupsMetadata}
                        isGroupCollapsed={isGroupCollapsed}
                        toggleGroup={toggleGroup}
                        renderedCount={renderedCount}
                        sensors={sensors}
                        active={active}
                        handleDragStart={handleDragStart}
                        handleDragEnd={handleDragEnd}
                        interactionValue={interactionValue}
                    />
                </>
            )}

            {isModalOpen && (
                <ProtocolSettingsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    protocolId={selectedProtocolId}
                />
            )}

            {isGroupSettingsOpen && selectedGroup && (
                <GroupSettingsModal
                    isOpen={isGroupSettingsOpen}
                    onClose={() => setIsGroupSettingsOpen(false)}
                    groupName={selectedGroup}
                />
            )}
        </div>
    );
}
