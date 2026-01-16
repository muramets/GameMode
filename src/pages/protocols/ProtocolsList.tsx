import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Protocol, Innerface } from './types';
import { ProtocolRow } from './ProtocolRow';
import { MonkeyTypeLoader } from '../../components/ui/molecules/MonkeyTypeLoader';
import { ProtocolSettingsModal } from './components/ProtocolSettingsModal';
import { useAuth } from '../../contexts/AuthProvider';
import { usePersonalityStore } from '../../stores/personalityStore';
import { useScoreContext } from '../../contexts/ScoreProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faPlus,
    faFilter,
    faCircle,
    faGripVertical,
    faBan,
    faCog
} from '@fortawesome/free-solid-svg-icons';
import { GroupSettingsModal } from '../../components/organisms/GroupSettingsModal';
import { ActiveFiltersList } from '../../components/ui/molecules/ActiveFiltersList';
import { GROUP_CONFIG } from '../../constants/common';
import { CollapsibleSection } from '../../components/ui/molecules/CollapsibleSection';

// DnD Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    DragOverlay,
    type DragStartEvent,
    useDndMonitor
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { useMetadataStore } from '../../stores/metadataStore';

// --- Interaction Context for Zero-Lag DnD ---
import { SortableItem } from '../../components/ui/molecules/SortableItem';

interface InteractionContextType {
    justDroppedId: string | null;
    isDragging: boolean;
    clearJustDropped: () => void;
}

const InteractionContext = React.createContext<InteractionContextType>({
    justDroppedId: null,
    isDragging: false,
    clearJustDropped: () => { }
});

const useInteraction = () => React.useContext(InteractionContext);

import { getMappedIcon } from '../../utils/iconMapper';

// --- Helper Components for Performance ---

const DraggableProtocolItem = React.memo(({
    protocol,
    innerfaces,
    applyProtocol,
    handleEditProtocol,
    isDragEnabled
}: {
    protocol: Protocol;
    innerfaces: Innerface[];
    applyProtocol: (id: string | number, direction: '+' | '-') => void;
    handleEditProtocol: (id: string | number) => void;
    isDragEnabled: boolean;
}) => {
    const { justDroppedId, isDragging, clearJustDropped } = useInteraction();
    const isJustDropped = String(protocol.id) === justDroppedId;

    // Disable heavy interactions if ANY item is dragging (global lock) or if this specific item was just dropped
    const shouldDisableInteractions = isDragging || isJustDropped;

    return (
        <SortableItem key={protocol.id} id={String(protocol.id)} disabled={!isDragEnabled}>
            {({ setNodeRef, listeners, attributes, style, isDragging }) => (
                <div
                    ref={setNodeRef}
                    style={{
                        ...style,
                        opacity: isDragging ? 0 : 1,
                        transition: isDragging ? 'none' : style.transition,
                        willChange: 'transform' // Hardware acceleration hint
                    }}
                    {...listeners}
                    {...attributes}
                    // Handle mouse leave to clear the "just dropped" state
                    onMouseLeave={() => {
                        if (isJustDropped) {
                            clearJustDropped();
                        }
                    }}
                >
                    <ProtocolRow
                        protocol={protocol}
                        innerfaces={innerfaces}
                        onLevelUp={(id: string | number) => applyProtocol(id, '+')}
                        onLevelDown={(id: string | number) => applyProtocol(id, '-')}
                        onEdit={handleEditProtocol}
                        isDisabled={shouldDisableInteractions}
                    />
                </div>
            )}
        </SortableItem>
    );
}, (prev, next) => {
    // Custom comparison to avoid re-renders on ID unrelated changes
    return prev.protocol === next.protocol &&
        prev.innerfaces === next.innerfaces &&
        prev.isDragEnabled === next.isDragEnabled;
});

const ProtocolGroup = React.memo(({
    groupName,
    protocols,
    innerfaces,
    isDragEnabled,
    applyProtocol,
    handleEditProtocol,
    onGroupEdit,
    groupsMetadata
}: {
    groupName: string;
    protocols: Protocol[];
    innerfaces: Innerface[];
    isDragEnabled: boolean;
    applyProtocol: any;
    handleEditProtocol: any;
    onGroupEdit: (groupName: string) => void;
    groupsMetadata: Record<string, { icon: string; color?: string }>;
}) => {
    const staticConfig = GROUP_CONFIG[groupName] || GROUP_CONFIG['ungrouped'];
    const storeMeta = groupsMetadata[groupName];

    let icon = staticConfig.icon;
    let color = staticConfig.color;

    if (storeMeta) {
        if (storeMeta.icon) {
            const mapped = getMappedIcon(storeMeta.icon);
            if (mapped) icon = mapped;
        }
        if (storeMeta.color) color = storeMeta.color;
    }

    // Memoize the items list creation
    const itemsIds = useMemo(() => protocols.map(p => String(p.id)), [protocols]);

    // Memoize the items list creation

    return (
        <SortableItem key={`group-${groupName}`} id={`group-${groupName}`} disabled={!isDragEnabled}>
            {({ setNodeRef, setActivatorNodeRef, listeners, attributes, style, isDragging }) => (
                <div
                    ref={setNodeRef}
                    style={{
                        ...style,
                        opacity: isDragging ? 0 : 1,
                        willChange: 'transform' // Hardware acceleration hint
                    }}
                    className="mb-4"
                >
                    <CollapsibleSection
                        key={groupName}
                        defaultOpen={true}
                        dragHandle={
                            isDragEnabled && (
                                <div
                                    ref={setActivatorNodeRef}
                                    {...listeners}
                                    {...attributes}
                                    className="cursor-grab active:cursor-grabbing text-sub hover:text-text-primary active:text-text-primary px-1 -ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                    title="Drag to reorder group"
                                    onPointerDown={(e) => {
                                        e.stopPropagation();
                                        listeners?.onPointerDown?.(e);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faGripVertical} className="text-sm" />
                                </div>
                            )
                        }
                        title={
                            <div className="flex items-center gap-3">
                                {icon && <FontAwesomeIcon icon={icon} style={{ color: color }} className="text-lg opacity-80" />}
                                <span className={groupName === 'ungrouped' ? 'opacity-50' : ''}>{groupName}</span>
                                <span className="text-xs font-mono font-normal opacity-40 bg-sub/20 px-2 py-0.5 rounded-full ml-auto md:ml-0">
                                    {protocols.length}
                                </span>
                            </div>
                        }
                        trailing={
                            groupName !== 'ungrouped' && (
                                <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sub hover:text-text-primary p-2 ml-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onGroupEdit(groupName);
                                    }}
                                    title="Group Settings"
                                >
                                    <FontAwesomeIcon icon={faCog} className="text-sm" />
                                </button>
                            )
                        }
                        className={`animate-in fade-in slide-in-from-bottom-2 duration-500`}
                    >
                        <SortableContext
                            items={itemsIds}
                            strategy={rectSortingStrategy}
                            disabled={!isDragEnabled}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {protocols.map((protocol) => (
                                    <DraggableProtocolItem
                                        key={protocol.id}
                                        protocol={protocol}
                                        innerfaces={innerfaces}
                                        applyProtocol={applyProtocol}
                                        handleEditProtocol={handleEditProtocol}
                                        isDragEnabled={isDragEnabled}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </CollapsibleSection>
                </div>
            )}
        </SortableItem>
    );
});


const noOp = () => { };

// ProtocolsDragOverlay: Decoupled component to avoid root re-renders during drag moves
const ProtocolsDragOverlay = React.memo(({
    activeProtocol,
    activeGroup,
    innerfaces,
    groupedProtocols
}: {
    activeProtocol: Protocol | null,
    activeGroup: string | null,
    innerfaces: Innerface[],
    groupedProtocols: [string, Protocol[]][]
}) => {
    const [isInvalid, setIsInvalid] = useState(false);

    // Memoize the source group to avoid repeating this lookup 60 times/sec
    const sourceGroup = useMemo(() => {
        if (!activeProtocol) return null;
        return groupedProtocols.find(([_, ps]) => ps.find(p => p.id === activeProtocol.id))?.[0];
    }, [activeProtocol, groupedProtocols]);

    useDndMonitor({
        onDragOver: ({ over }) => {
            if (!over || !sourceGroup) {
                if (isInvalid) setIsInvalid(false);
                return;
            }
            const overId = String(over.id);
            // Ignore hovering over the active item itself, but ensure we reset invalid state
            if (overId === String(activeProtocol?.id)) {
                if (isInvalid) setIsInvalid(false);
                return;
            }

            let targetGroup: string | undefined;
            if (overId.startsWith('group-')) {
                targetGroup = overId.replace('group-', '');
            } else {
                targetGroup = groupedProtocols.find(([_, ps]) => ps.find(p => String(p.id) === overId))?.[0];
            }

            // Boolean flip optimization: Only re-render if validity changes
            const newInvalid = targetGroup !== sourceGroup;
            if (newInvalid !== isInvalid) {
                setIsInvalid(newInvalid);
            }
        },
        onDragEnd: () => setIsInvalid(false),
        onDragCancel: () => setIsInvalid(false),
    });

    if (activeGroup) {
        return (
            <div className="w-full bg-bg-primary/90 p-4 rounded-lg border border-sub/20 shadow-2xl scale-105 cursor-grabbing z-50">
                <div className="flex items-center gap-3 text-2xl font-bold text-text-primary">
                    <FontAwesomeIcon icon={faGripVertical} className="text-sm text-text-primary mr-2" />
                    <span>{activeGroup}</span>
                </div>
            </div>
        );
    }

    if (!activeProtocol) return null;

    return (
        <div className={`w-full shadow-2xl z-50 transition-transform duration-200 ${isInvalid ? 'scale-95 cursor-not-allowed' : 'opacity-90 cursor-grabbing'}`}>
            <ProtocolRow
                protocol={activeProtocol}
                innerfaces={innerfaces}
                onLevelUp={noOp}
                onLevelDown={noOp}
                onEdit={noOp}
                isDisabled={true}
            />
            {isInvalid && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[2px]" />
                    <div className="relative z-10 bg-bg-primary/40 backdrop-blur-md text-[#ca4754] rounded-full w-12 h-12 flex items-center justify-center shadow-[0_0_20px_rgba(202,71,84,0.3)] border border-[#ca4754]/20 animate-in zoom-in duration-200">
                        <FontAwesomeIcon icon={faBan} className="text-xl" />
                    </div>
                </div>
            )}
        </div>
    );
});

// Optimized Protocols Content - Pure List View
const ProtocolsContent = React.memo(({
    groupedProtocols,
    innerfaces,
    renderedCount,
    isDragEnabled,
    applyProtocol,
    handleEditProtocol,
    onGroupEdit,
    groupsMetadata
}: {
    groupedProtocols: [string, Protocol[]][];
    innerfaces: Innerface[];
    renderedCount: number;
    isDragEnabled: boolean;
    applyProtocol: (id: string | number, direction: '+' | '-') => void;
    handleEditProtocol: (id: string | number) => void;
    onGroupEdit: (groupName: string) => void;
    groupsMetadata: Record<string, { icon: string; color?: string }>;
}) => {
    const sortableGroupIds = useMemo(() => groupedProtocols.map(([name]) => `group-${name}`), [groupedProtocols]);

    let currentRenderCount = 0;
    return (
        <div className="flex flex-col gap-8 pb-20">
            <SortableContext
                items={sortableGroupIds}
                strategy={verticalListSortingStrategy}
                disabled={!isDragEnabled}
            >
                {groupedProtocols.map(([groupName, groupProtocols]) => {
                    if (currentRenderCount >= renderedCount) return null;
                    const protocolsToShow = groupProtocols.slice(0, renderedCount - currentRenderCount);
                    currentRenderCount += protocolsToShow.length;
                    if (protocolsToShow.length === 0) return null;

                    return (
                        <ProtocolGroup
                            key={groupName}
                            groupName={groupName}
                            protocols={protocolsToShow}
                            innerfaces={innerfaces}
                            isDragEnabled={isDragEnabled}
                            applyProtocol={applyProtocol}
                            handleEditProtocol={handleEditProtocol}
                            onGroupEdit={onGroupEdit}
                            groupsMetadata={groupsMetadata}
                        />
                    );
                })}
            </SortableContext>

            {groupedProtocols.reduce((acc, [, protos]) => acc + protos.length, 0) > renderedCount && (
                <div className="py-4 text-center text-xs text-sub opacity-50">
                    Loading rest...
                </div>
            )}
        </div>
    );
});

// Isolated Container for DnD State
const ProtocolsDragContainer = React.memo(({
    groupedProtocols,
    innerfaces,
    onReorderGroups,
    onReorderProtocols,
    children
}: {
    groupedProtocols: [string, Protocol[]][];
    innerfaces: Innerface[];
    onReorderGroups: (newOrder: string[]) => void;
    onReorderProtocols: (newOrder: string[]) => void;
    children: React.ReactNode;
}) => {
    /**
     * ATOMIC DND ARCHITECTURE
     * This component isolates drag state to prevent parent re-renders (ProtocolsList).
     * It uses a global lock (InteractionContext) to freeze hover effects during sorting,
     * maintaining 60fps even with expensive sub-components.
     */
    // konsolidate DnD state to ensure atomic updates
    const [active, setActive] = useState<{
        id: string | null;
        protocol: Protocol | null;
        group: string | null;
    }>({ id: null, protocol: null, group: null });

    const [justDroppedId, setJustDroppedId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8 // Enable clicks by requiring 8px movement for drag start
            }
        }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const id = String(event.active.id);
        setJustDroppedId(null);

        let protocol: Protocol | null = null;
        let group: string | null = null;

        if (id.startsWith('group-')) {
            group = id.replace('group-', '');
        } else {
            for (const [, ps] of groupedProtocols) {
                const found = ps.find((x: Protocol) => String(x.id) === id);
                if (found) { protocol = found; break; }
            }
        }

        setActive({ id, protocol, group });
    }, [groupedProtocols]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active: dndActive, over } = event;
        const activeIdStr = String(dndActive.id);
        const overIdStr = over ? String(over.id) : null;

        setActive({ id: null, protocol: null, group: null });
        setJustDroppedId(activeIdStr);

        if (!over || activeIdStr === overIdStr) return;

        if (activeIdStr.startsWith('group-') && overIdStr?.startsWith('group-')) {
            const activeGrp = activeIdStr.replace('group-', '');
            const overGrp = overIdStr.replace('group-', '');
            const currentNames = groupedProtocols.map(([name]) => name);
            const oldIdx = currentNames.indexOf(activeGrp);
            const newIdx = currentNames.indexOf(overGrp);
            if (oldIdx !== -1 && newIdx !== -1) {
                onReorderGroups(arrayMove(currentNames, oldIdx, newIdx));
            }
        } else if (!activeIdStr.startsWith('group-') && overIdStr && !overIdStr.startsWith('group-')) {
            const sourceEntry = groupedProtocols.find(([, ps]) => ps.some((p: Protocol) => p.id.toString() === activeIdStr));
            if (!sourceEntry) return;
            const [, groupItems] = sourceEntry;
            if (groupItems.some((p: Protocol) => p.id.toString() === overIdStr)) {
                const oldIdx = groupItems.findIndex((p: Protocol) => p.id.toString() === activeIdStr);
                const newIdx = groupItems.findIndex((p: Protocol) => p.id.toString() === overIdStr);
                onReorderProtocols(arrayMove(groupItems, oldIdx, newIdx).map((p: Protocol) => p.id.toString()));
            }
        }
    }, [groupedProtocols, onReorderGroups, onReorderProtocols]);

    const clearJustDropped = useCallback(() => setJustDroppedId(null), []);

    const interactionValue = useMemo(() => ({
        justDroppedId,
        isDragging: !!active.id,
        clearJustDropped
    }), [justDroppedId, active.id, clearJustDropped]);

    return (
        <InteractionContext.Provider value={interactionValue}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <style>{`
                    .transition-none-important, 
                    .transition-none-important * { 
                        transition: none !important; 
                        animation: none !important;
                    }
                `}</style>

                {children}

                {active.id && <div className="fixed inset-0 z-40 bg-transparent pointer-events-auto" />}

                <DragOverlay dropAnimation={null}>
                    {active.id ? (
                        <div className="pointer-events-none transition-none-important">
                            <ProtocolsDragOverlay
                                activeProtocol={active.protocol}
                                activeGroup={active.group}
                                innerfaces={innerfaces}
                                groupedProtocols={groupedProtocols}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </InteractionContext.Provider>
    );
});

export function ProtocolsList() {
    const { applyProtocol, innerfaces, protocols } = useScoreContext();
    const { user } = useAuth();
    const { activePersonalityId } = usePersonalityStore();
    const { reorderProtocols, reorderGroups, groupOrder, groupsMetadata } = useMetadataStore();

    // Simplified loading logic: Minimum 500ms display time
    const [minTimeMet, setMinTimeMet] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setMinTimeMet(true), 500);
        return () => clearTimeout(timer);
    }, []);

    const isReady = minTimeMet && !!protocols && protocols.length > 0;

    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProtocolId, setSelectedProtocolId] = useState<string | number | null>(null);

    // Group Settings State
    const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string>('');

    // 1. Data Processing - Root Level (Static during drag)
    const innerfaceMap = useMemo(() => {
        const map = new Map<string, Innerface>();
        innerfaces.forEach((i: Innerface) => map.set(i.id.toString(), i));
        return map;
    }, [innerfaces]);

    const filteredProtocols = useMemo(() => {
        let filtered = protocols;
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
            if (protocol.title.toLowerCase().includes(query)) return true;
            if (protocol.group?.toLowerCase().includes(query)) return true;
            return protocol.targets.some((id: string | number) => innerfaceMap.get(id.toString())?.name.toLowerCase().includes(query));
        });
    }, [protocols, searchQuery, activeFilters, innerfaceMap]);

    const groupedProtocols = useMemo(() => {
        const groups: Record<string, Protocol[]> = {};
        const sortedProtocols = [...filteredProtocols].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
        sortedProtocols.forEach(p => {
            const groupName = p.group || 'ungrouped';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(p);
        });
        const dynamicSortOrder = groupOrder.length > 0 ? groupOrder : Object.keys(GROUP_CONFIG);
        return Object.entries(groups).sort(([keyA], [keyB]) => {
            const indexA = dynamicSortOrder.indexOf(keyA);
            const indexB = dynamicSortOrder.indexOf(keyB);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return keyA.localeCompare(keyB);
        });
    }, [filteredProtocols, groupOrder]);

    const isDragEnabled = !searchQuery.trim() && (activeFilters.length === 0 || activeFilters.length === 1 && activeFilters[0] === 'ungrouped');

    const [renderedCount, setRenderedCount] = useState(20);
    useEffect(() => { setRenderedCount(20); }, [filteredProtocols]);
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
        if (user && activePersonalityId) reorderGroups(user.uid, activePersonalityId, newOrder);
    }, [user, activePersonalityId, reorderGroups]);

    const onReorderProtocols = useCallback((newItemIds: string[]) => {
        if (user && activePersonalityId) reorderProtocols(user.uid, activePersonalityId, newItemIds);
    }, [user, activePersonalityId, reorderProtocols]);

    // Extract unique groups
    const protocolGroups = useMemo(() => {
        const groups = new Set(protocols.map((p: Protocol) => p.group).filter(Boolean));
        return Array.from(groups).sort((a, b) => {
            if (!a || !b) return 0;
            const idxA = groupOrder.indexOf(a as string);
            const idxB = groupOrder.indexOf(b as string);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return (a as string).localeCompare(b as string);
        });
    }, [protocols, groupOrder]);

    const toggleFilter = (filter: string) => {
        if (filter === 'all') { setActiveFilters([]); return; }
        setActiveFilters(prev => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]);
    };

    const removeFilter = (filter: string) => {
        setActiveFilters(prev => prev.filter(f => f !== filter));
    };

    return (
        <div className="flex flex-col gap-6 w-full">
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
                            <button
                                onClick={() => { setSelectedProtocolId(null); setIsModalOpen(true); }}
                                className="h-[46px] w-[36px] flex items-center justify-center rounded-lg text-sub hover:text-main transition-all cursor-pointer"
                                title="Add Protocol"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-xl" />
                            </button>

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

                                <div className="absolute top-full right-0 mt-2 w-48 bg-sub-alt rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-2 transform origin-top-right border border-white/5">
                                    <div className="flex flex-col">
                                        <button
                                            onClick={() => toggleFilter('all')}
                                            className={`flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-md transition-all group/item ${activeFilters.length === 0 ? 'bg-sub/30' : 'hover:bg-sub/20'}`}
                                        >
                                            <div className="w-4 flex items-center justify-center opacity-70">
                                                <FontAwesomeIcon icon={faFilter} className="text-[10px]" />
                                            </div>
                                            <span className="text-xs font-mono lowercase text-text-primary">all protocols</span>
                                            {activeFilters.length === 0 && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-main shadow-[0_0_8px_rgba(226,183,20,0.5)]"></div>}
                                        </button>

                                        <div className="h-px bg-white/5 my-1 mx-2"></div>

                                        {protocolGroups.map(group => {
                                            const config = GROUP_CONFIG[group as string];
                                            const isActive = activeFilters.includes(group as string);
                                            return (
                                                <button
                                                    key={group as string}
                                                    onClick={() => toggleFilter(group as string)}
                                                    className={`flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-md transition-all group/item ${isActive ? 'bg-sub/30' : 'hover:bg-sub/20'}`}
                                                >
                                                    <div className="w-4 flex items-center justify-center">
                                                        {config ? <FontAwesomeIcon icon={config.icon} style={{ color: config.color }} className="text-[10px]" /> : <div className="w-1.5 h-1.5 rounded-full bg-sub"></div>}
                                                    </div>
                                                    <span className={`text-xs font-mono lowercase ${isActive ? 'text-text-primary' : 'text-sub'}`}>{group as string}</span>
                                                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-main shadow-[0_0_8px_rgba(226,183,20,0.5)]"></div>}
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
                                            <span className={`text-xs font-mono lowercase ${activeFilters.includes('ungrouped') ? 'text-text-primary' : 'text-sub'}`}>ungrouped</span>
                                            {activeFilters.includes('ungrouped') && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-main shadow-[0_0_8px_rgba(226,183,20,0.5)]"></div>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

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

            {(!isReady) ? (
                <MonkeyTypeLoader />
            ) : filteredProtocols.length === 0 ? (
                <div className="py-12 text-center text-sub"><FontAwesomeIcon icon={faSearch} className="text-4xl opacity-20 mb-4" /><p>No protocols found</p></div>
            ) : (
                <ProtocolsDragContainer
                    groupedProtocols={groupedProtocols}
                    innerfaces={innerfaces}
                    onReorderGroups={onReorderGroups}
                    onReorderProtocols={onReorderProtocols}
                >
                    <ProtocolsContent
                        groupedProtocols={groupedProtocols}
                        innerfaces={innerfaces}
                        isDragEnabled={isDragEnabled}
                        applyProtocol={applyProtocol}
                        handleEditProtocol={handleEditProtocol}
                        onGroupEdit={handleGroupEdit}
                        renderedCount={renderedCount}
                        groupsMetadata={groupsMetadata}
                    />
                </ProtocolsDragContainer>
            )}

            {isModalOpen && (
                <ProtocolSettingsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} protocolId={selectedProtocolId} />
            )}

            <GroupSettingsModal
                isOpen={isGroupSettingsOpen}
                onClose={() => setIsGroupSettingsOpen(false)}
                groupName={selectedGroup}
            />
        </div>
    );
}
