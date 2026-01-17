import React, { useState, useMemo, useCallback } from 'react';
import { useScoreContext } from '../../../contexts/ScoreProvider';
import { InnerfaceSettingsModal } from './InnerfaceSettingsModal';
import { InnerfaceCard } from './InnerfaceCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faGripVertical, faCog } from '@fortawesome/free-solid-svg-icons';
import { GroupSettingsModal } from '../../../features/groups/components/GroupSettingsModal';
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
    type DragOverEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMetadataStore } from '../../../stores/metadataStore';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { SortableItem } from '../../../components/ui/molecules/SortableItem';
import { type Innerface } from '../types';
import { CollapsibleSection } from '../../../components/ui/molecules/CollapsibleSection';
import { GROUP_CONFIG } from '../../../constants/common';
import { useCollapsedGroups } from '../../../hooks/useCollapsedGroups';

// --- Draggable Item Wrapper ---
const DraggableInnerfaceItem = React.memo(({
    innerface,
    onEdit
}: {
    innerface: Innerface;
    onEdit: (id: string | number) => void;
}) => {
    return (
        <SortableItem key={innerface.id} id={String(innerface.id)}>
            {({ setNodeRef, listeners, attributes, style, isDragging }) => (
                <div
                    ref={setNodeRef}
                    style={{
                        ...style,
                        opacity: isDragging ? 0 : 1,
                        transition: isDragging ? 'none' : style.transition,
                        willChange: 'transform'
                    }}
                    {...listeners}
                    {...attributes}
                    className="relative cursor-grab active:cursor-grabbing touch-none"
                // touch-none prevents scrolling while dragging on touch devices
                >
                    <InnerfaceCard
                        innerface={innerface}
                        onEdit={() => onEdit(innerface.id)}
                    />
                </div>
            )}
        </SortableItem>
    );
}, (prev, next) => {
    return prev.innerface === next.innerface;
});

// --- Drag Overlay Component ---
const InnerfacesDragOverlay = React.memo(({ innerface, groupName }: { innerface?: Innerface | null, groupName?: string | null }) => {
    if (groupName) {
        const config = GROUP_CONFIG[groupName] || GROUP_CONFIG['ungrouped'];
        return (
            <div className="w-full opacity-90 cursor-grabbing pointer-events-none p-4 bg-bg-secondary rounded-xl border border-white/5 shadow-2xl flex items-center gap-3">
                {config && <FontAwesomeIcon icon={config.icon} style={{ color: config.color }} className="text-lg opacity-80" />}
                <span className="text-lg font-bold text-text-primary">{groupName}</span>
            </div>
        )
    }

    if (!innerface) return null;
    return (
        <div className="w-full h-full opacity-90 cursor-grabbing shadow-2xl pointer-events-none">
            <InnerfaceCard innerface={innerface} />
        </div>
    );
});

import { getMappedIcon } from '../../../utils/iconMapper';

// --- Innerface Group Component ---
const InnerfaceGroup = React.memo(({
    groupName,
    innerfaces,
    onEdit,
    onGroupEdit,
    groupsMetadata,
    isCollapsed,
    onToggleCollapse
}: {
    groupName: string;
    innerfaces: Innerface[];
    onEdit: (id: string | number) => void;
    onGroupEdit: (groupName: string) => void;
    groupsMetadata: Record<string, { icon: string; color?: string }>;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
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
    const itemIds = useMemo(() => innerfaces.map(i => String(i.id)), [innerfaces]);

    return (
        <SortableItem key={`group-${groupName}`} id={`group-${groupName}`}>
            {({ setNodeRef, setActivatorNodeRef, listeners, attributes, style, isDragging }) => (
                <div
                    ref={setNodeRef}
                    style={{
                        ...style,
                        opacity: isDragging ? 0 : 1,
                        transition: isDragging ? 'none' : style.transition,
                        willChange: 'transform' // Hardware acceleration hint
                    }}
                    className="mb-8"
                >
                    <CollapsibleSection
                        key={groupName}
                        isOpen={!isCollapsed}
                        onToggle={onToggleCollapse}
                        dragHandle={
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
                        title={
                            <div className="flex items-center gap-3">
                                {icon && <FontAwesomeIcon icon={icon} style={{ color: color }} className="text-lg opacity-80" />}
                                <span className={groupName === 'ungrouped' ? 'opacity-50' : ''}>{groupName}</span>
                                <span className="text-xs font-mono font-normal opacity-40 bg-sub/20 px-2 py-0.5 rounded-full ml-auto md:ml-0">
                                    {innerfaces.length}
                                </span>
                            </div>
                        }
                        className={`animate-in fade-in slide-in-from-bottom-2 duration-500`}
                    >
                        <SortableContext items={itemIds} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {innerfaces.map((innerface) => (
                                    <DraggableInnerfaceItem
                                        key={innerface.id}
                                        innerface={innerface}
                                        onEdit={onEdit}
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

// --- Drag Container ---
const InnerfacesDragContainer = React.memo(({
    innerfaces,
    onReorder,
    onReorderGroups,
    onUpdateInnerface,
    onEdit,
    onGroupEdit,
    groupOrder,
    groupsMetadata,
    isGroupCollapsed,
    toggleGroup
}: {
    innerfaces: Innerface[];
    onReorder: (newOrder: string[]) => void;
    onReorderGroups: (newOrder: string[]) => void;
    onUpdateInnerface: (id: string | number, data: Partial<Innerface>) => void;
    onEdit: (id: string | number) => void;
    onGroupEdit: (groupName: string) => void;
    groupOrder: string[];
    groupsMetadata: Record<string, { icon: string; color?: string }>;
    isGroupCollapsed: (groupName: string) => boolean;
    toggleGroup: (groupName: string) => void;
}) => {
    // ... hooks ...
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const groupedInnerfaces = useMemo(() => {
        const groups: Record<string, Innerface[]> = {};

        // Initialize groups from groupOrder to ensure order
        groupOrder.forEach(g => { groups[g] = []; });

        innerfaces.forEach(i => {
            const g = i.group || 'ungrouped';
            if (!groups[g]) groups[g] = [];
            groups[g].push(i);
        });

        // Filter out empty groups BUT keep groups that are in groupOrder (user explicitly ordered them?)
        // Actually, if we want to show empty groups, we should keep them. The loop `groupOrder.forEach` adds them.
        // But if `innerfaces` is filtered, we might not want to show empty groups unless they are intentional?
        // Current logic keeps them if they are in groupOrder.

        return Object.entries(groups)
            .filter(([groupName, items]) => {
                // Hide ungrouped if empty
                if (groupName === 'ungrouped' && items.length === 0) return false;
                return true;
            })
            .sort((a, b) => {
                const idxA = groupOrder.indexOf(a[0]);
                const idxB = groupOrder.indexOf(b[0]);
                if (idxA === -1 && idxB === -1) return 0;
                if (idxA === -1) return 1; // Unknown groups to end
                if (idxB === -1) return -1;
                return idxA - idxB;
            });
    }, [innerfaces, groupOrder]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    }, []);

    const handleDragOver = useCallback((_event: DragOverEvent) => {
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeIdStr = String(active.id);
        const overIdStr = String(over.id);

        if (activeIdStr.startsWith('group-') && overIdStr.startsWith('group-')) {
            const currentGroupList = groupedInnerfaces.map(([g]) => g);
            const oldIndex = currentGroupList.indexOf(activeIdStr.replace('group-', ''));
            const newIndex = currentGroupList.indexOf(overIdStr.replace('group-', ''));

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                const newOrder = arrayMove(currentGroupList, oldIndex, newIndex);
                onReorderGroups(newOrder);
            }
            return;
        }

        if (activeIdStr !== overIdStr && !activeIdStr.startsWith('group-')) {
            const sourceInnerface = innerfaces.find(i => String(i.id) === activeIdStr);
            if (!sourceInnerface) return;

            let targetGroup = sourceInnerface.group || 'ungrouped';

            if (overIdStr.startsWith('group-')) {
                targetGroup = overIdStr.replace('group-', '');
            } else {
                const overInnerface = innerfaces.find(i => String(i.id) === overIdStr);
                if (overInnerface) {
                    targetGroup = overInnerface.group || 'ungrouped';
                }
            }

            if ((sourceInnerface.group || 'ungrouped') !== targetGroup) {
                onUpdateInnerface(sourceInnerface.id, { group: targetGroup === 'ungrouped' ? '' : targetGroup });
            }

            const currentVisualList = groupedInnerfaces.flatMap(([_, items]) => items.map(i => String(i.id)));
            const visualOldIndex = currentVisualList.indexOf(activeIdStr);
            let visualNewIndex = currentVisualList.indexOf(overIdStr);

            if (overIdStr.startsWith('group-')) {
                const groupName = overIdStr.replace('group-', '');
                const groupItems = groupedInnerfaces.find(([g]) => g === groupName)?.[1] || [];
                if (groupItems.length > 0) {
                    visualNewIndex = currentVisualList.indexOf(String(groupItems[0].id));
                }
            }

            if (visualOldIndex !== -1 && visualNewIndex !== -1) {
                const newOrder = arrayMove(currentVisualList, visualOldIndex, visualNewIndex);
                onReorder(newOrder);
            }
        }

    }, [innerfaces, groupedInnerfaces, onReorder, onReorderGroups, onUpdateInnerface]);

    const activeInnerface = useMemo(() =>
        innerfaces.find(i => String(i.id) === activeId) || null
        , [innerfaces, activeId]);

    const activeGroup = useMemo(() =>
        activeId?.startsWith('group-') ? activeId.replace('group-', '') : null
        , [activeId]);

    const groupIds = useMemo(() => groupedInnerfaces.map(([g]) => `group-${g}`), [groupedInnerfaces]);

    return (
        <>
            <style>{`
                .transition-none-important, 
                .transition-none-important * { 
                    transition: none !important; 
                    animation: none !important;
                }
            `}</style>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
            >
                <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-4">
                        {groupedInnerfaces.map(([groupName, groupItems]) => (
                            <InnerfaceGroup
                                key={groupName}
                                groupName={groupName}
                                innerfaces={groupItems}
                                onEdit={onEdit}
                                onGroupEdit={onGroupEdit}
                                groupsMetadata={groupsMetadata}
                                isCollapsed={isGroupCollapsed(groupName)}
                                onToggleCollapse={() => toggleGroup(groupName)}
                            />
                        ))}
                    </div>
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                    {activeId ? (
                        <div className="pointer-events-none transition-none-important">
                            <InnerfacesDragOverlay innerface={activeInnerface} groupName={activeGroup} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </>
    );
});

export function InnerfacesList() {
    const { innerfaces, isLoading } = useScoreContext();
    const { activeContext } = usePersonalityStore();
    const { reorderInnerfaces, reorderInnerfaceGroups, updateInnerface, groupsMetadata, innerfaceGroupOrder } = useMetadataStore();
    const { isGroupCollapsed, toggleGroup } = useCollapsedGroups('innerfaces');
    const isCoachMode = activeContext?.type === 'viewer';

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInnerfaceId, setSelectedInnerfaceId] = useState<string | number | null>(null);
    const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

    // Sorted innerfaces for rendering
    const sortedInnerfaces = useMemo(() => {
        return [...innerfaces].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
    }, [innerfaces]);

    const handleEdit = useCallback((id: string | number) => {
        setSelectedInnerfaceId(id);
        setIsModalOpen(true);
    }, []);

    const handleCreate = () => {
        if (isCoachMode) return;
        setSelectedInnerfaceId(null);
        setIsModalOpen(true);
    };

    const handleGroupEdit = useCallback((groupName: string) => {
        setSelectedGroup(groupName);
        setIsGroupSettingsOpen(true);
    }, []);

    const handleReorder = useCallback((newOrderIdStrs: string[]) => {
        reorderInnerfaces(newOrderIdStrs);
    }, [reorderInnerfaces]);

    const handleReorderGroups = useCallback((newGroupOrder: string[]) => {
        reorderInnerfaceGroups(newGroupOrder);
    }, [reorderInnerfaceGroups]);

    const handleUpdateInnerface = useCallback((id: string | number, data: Partial<Innerface>) => {
        updateInnerface(id, data);
    }, [updateInnerface]);

    if (isLoading && innerfaces.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-sub font-mono animate-pulse uppercase tracking-widest text-xs">Loading Innerfaces...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 w-full pb-12">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-text-primary">Innerfaces</h1>
                    <p className="text-sub text-sm">Fundamental metrics and base traits that define your current state.</p>
                </div>
                {!isCoachMode && (
                    <button
                        onClick={handleCreate}
                        className="h-[46px] w-[36px] flex items-center justify-center rounded-lg text-sub hover:text-main transition-all cursor-pointer"
                        title="Add Innerface"
                    >
                        <FontAwesomeIcon icon={faPlus} className="text-xl" />
                    </button>
                )}
            </div>

            {sortedInnerfaces.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {!isCoachMode && (
                        <button
                            onClick={handleCreate}
                            className="w-full min-h-[120px] border border-dashed border-sub/30 hover:border-sub rounded-xl flex flex-col items-center justify-center gap-2 text-sub hover:text-text-primary transition-all duration-200 group bg-sub-alt/5 hover:bg-sub-alt/10"
                        >
                            <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faPlus} className="text-sm opacity-50 group-hover:opacity-100 transition-opacity" />
                                <span className="font-lexend text-sm font-medium opacity-50 group-hover:opacity-100 transition-opacity">Create First Innerface</span>
                            </div>
                        </button>
                    )}
                    {isCoachMode && (
                        <div className="col-span-full text-center py-12 text-sub opacity-50 italic">
                            No innerfaces found for this user.
                        </div>
                    )}
                </div>
            ) : (
                <InnerfacesDragContainer
                    innerfaces={sortedInnerfaces}
                    onReorder={handleReorder}
                    onReorderGroups={handleReorderGroups}
                    onUpdateInnerface={handleUpdateInnerface}
                    onEdit={handleEdit}
                    onGroupEdit={handleGroupEdit}
                    groupOrder={innerfaceGroupOrder}
                    groupsMetadata={groupsMetadata}
                    isGroupCollapsed={isGroupCollapsed}
                    toggleGroup={toggleGroup}
                />
            )}

            <InnerfaceSettingsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                innerfaceId={selectedInnerfaceId}
            />

            <GroupSettingsModal
                isOpen={isGroupSettingsOpen}
                onClose={() => setIsGroupSettingsOpen(false)}
                groupName={selectedGroup || ''}
            />
        </div>
    );
}

export default InnerfacesList;
