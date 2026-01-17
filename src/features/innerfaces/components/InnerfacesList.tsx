import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useScoreContext } from '../../../contexts/ScoreProvider';
import { InnerfaceSettingsModal } from './InnerfaceSettingsModal';
import { InnerfaceCard } from './InnerfaceCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faGripVertical, faCog, faChevronDown, faBan } from '@fortawesome/free-solid-svg-icons';
import { GroupSettingsModal } from '../../../features/groups/components/GroupSettingsModal';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../../../components/ui/atoms/Tooltip';
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
import { type Innerface, type PowerCategory } from '../types';
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
const InnerfacesDragOverlay = React.memo(({
    innerface,
    groupName,
    categoryName,
    groupsMetadata = {},
    isValidDrop = true
}: {
    innerface?: Innerface | null,
    groupName?: string | null,
    categoryName?: string | null,
    groupsMetadata?: Record<string, { icon: string; color?: string }>;
    isValidDrop?: boolean;
}) => {
    if (categoryName) {
        const config = CATEGORY_CONFIG[categoryName as keyof typeof CATEGORY_CONFIG];
        if (!config) return null;
        const Icon = config.icon;
        return (
            <div className="w-full opacity-90 cursor-grabbing pointer-events-none p-4 bg-bg-secondary rounded-xl border border-white/5 shadow-2xl flex items-center gap-3">
                <Icon className={`w-6 h-6 text-sub`} />
                <span className="text-lg font-bold text-text-primary capitalize">{config.label}</span>
            </div>
        );
    }

    if (groupName) {
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

        return (
            <div className="w-full opacity-90 cursor-grabbing pointer-events-none p-4 bg-bg-secondary rounded-xl border border-white/5 shadow-2xl flex items-center gap-3">
                <FontAwesomeIcon icon={icon} style={{ color }} className="text-lg opacity-80" />
                <span className="text-lg font-bold text-text-primary lowercase">{groupName}</span>
            </div>
        )
    }

    if (!innerface) return null;
    return (
        <div className={`w-full h-full shadow-2xl z-50 transition-transform duration-200 pointer-events-none ${!isValidDrop ? 'scale-95' : 'opacity-90 cursor-grabbing'}`}>
            <InnerfaceCard innerface={innerface} forceHover={true} />
            {!isValidDrop && (
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

import { getMappedIcon } from '../../../utils/iconMapper';
import { Sparkles, Layers, Inbox } from 'lucide-react';

// --- Category Section Header (Skills / Foundations / Uncategorized) ---
const CATEGORY_CONFIG = {
    skill: {
        label: 'Skills',
        icon: Sparkles,
        hoverColor: 'group-hover/category:text-blue-400'
    },
    foundation: {
        label: 'Foundations',
        icon: Layers,
        hoverColor: 'group-hover/category:text-green-400'
    },
    uncategorized: {
        label: 'Uncategorized',
        icon: Inbox,
        hoverColor: 'group-hover/category:text-sub'
    }
} as const;

const CategorySection = React.memo(({
    category,
    children,
    count,
    isCollapsed,
    onToggle
}: {
    category: 'skill' | 'foundation' | 'uncategorized';
    children: React.ReactNode;
    count: number;
    isCollapsed: boolean;
    onToggle: () => void;
}) => {
    if (count === 0) return null;

    const config = CATEGORY_CONFIG[category];
    const Icon = config.icon;

    return (
        <SortableItem id={`category-${category}`}>
            {({ setNodeRef, setActivatorNodeRef, listeners, attributes, style, isDragging }) => (
                <div
                    ref={setNodeRef}
                    style={{
                        ...style,
                        opacity: isDragging ? 0 : 1,
                        transition: isDragging ? 'none' : style.transition,
                        willChange: 'transform'
                    }}
                    className="w-full mb-8"
                >
                    {/* Category Header */}
                    <div className="flex items-center mb-4 group/category">
                        <div className="flex-grow flex items-center justify-between">
                            <button
                                onClick={onToggle}
                                className="flex items-center gap-3 text-2xl font-bold lowercase transition-colors duration-200 outline-none text-sub opacity-30 hover:opacity-100 hover:text-text-primary"
                                aria-expanded={!isCollapsed}
                            >
                                <div className={`transition-transform duration-200 ${!isCollapsed ? '' : '-rotate-90'}`}>
                                    <FontAwesomeIcon icon={faChevronDown} className="text-xl" />
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Icon - inherits text color by default, colored on hover */}
                                    <Icon className={`w-6 h-6 transition-colors duration-200 ${config.hoverColor}`} />
                                    <span>{config.label}</span>
                                    <span className="text-xs font-mono font-normal opacity-40 bg-sub/20 px-2 py-0.5 rounded-full">
                                        {count}
                                    </span>
                                </div>
                            </button>

                            {/* Drag Handle */}
                            <div
                                ref={setActivatorNodeRef}
                                {...listeners}
                                {...attributes}
                                className="opacity-0 group-hover/category:opacity-50 hover:!opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-2 touch-none"
                            >
                                <FontAwesomeIcon icon={faGripVertical} className="text-sm text-sub" />
                            </div>
                        </div>
                    </div>

                    {/* Category Content */}
                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${(!isCollapsed && !isDragging) ? 'opacity-100 max-h-[5000px]' : 'opacity-0 max-h-0'}`}
                    >
                        <div className="py-1">
                            {!isDragging && children}
                        </div>
                    </div>
                </div>
            )}
        </SortableItem>
    );
});

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
                        isOpen={!isCollapsed && !isDragging}
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
                        {!isDragging && (
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
                        )}
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
    onReorderCategories,
    onUpdateInnerface,
    onMoveInnerface,
    onEdit,
    onGroupEdit,
    groupOrder,
    categoryOrder,
    groupsMetadata,
    isGroupCollapsed,
    toggleGroup,
    isCategoryCollapsed,
    toggleCategory
}: {
    innerfaces: Innerface[];
    onReorder: (newOrder: string[]) => void;
    onReorderGroups: (newOrder: string[]) => void;
    onReorderCategories: (newOrder: string[]) => void;
    onUpdateInnerface: (id: string | number, data: Partial<Innerface>) => void;
    onMoveInnerface: (id: string, newGroup: string, orderedIds: string[]) => void;
    onEdit: (id: string | number) => void;
    onGroupEdit: (groupName: string) => void;
    groupOrder: string[];
    categoryOrder: string[];
    groupsMetadata: Record<string, { icon: string; color?: string }>;
    isGroupCollapsed: (groupName: string) => boolean;
    toggleGroup: (groupName: string) => void;
    isCategoryCollapsed: (category: string) => boolean;
    toggleCategory: (category: string) => void;
}) => {
    // --- Local State for Drag (Optimistic UI) ---
    const [items, setItems] = useState<Innerface[]>(innerfaces);

    // Sync items when prop updates (only if not dragging to avoid conflict)
    // We'll reset items on drag end, so we can just update when innerfaces change
    // assuming no external updates happen mid-drag that we care about preserving differently.
    // Actually, dnd-kit recommends updating items during dragOver.

    // We need to track if we are dragging to prevent overwriting local state with props during drag
    const isDraggingRef = React.useRef(false);

    useEffect(() => {
        if (!isDraggingRef.current) {
            setItems(innerfaces);
        }
    }, [innerfaces]);

    // ... hooks ...

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Group logic to categorize items (Skills, Foundations, Uncategorized)
    // AND group them within those categories (e.g. Focus, Energy)
    const { innerfacesByCategory, getGroupsForCategory } = useMemo(() => {
        const byCategory: Record<string, Innerface[]> = {
            skill: [],
            foundation: [],
            uncategorized: []
        };

        items.forEach(i => {
            if (i.category === 'skill') byCategory.skill.push(i);
            else if (i.category === 'foundation') byCategory.foundation.push(i);
            else byCategory.uncategorized.push(i);
        });

        // Helper to group items within a specific category
        const getGroupsForCategory = (category: string) => {
            const groupItems = byCategory[category] || [];

            // Group by 'group' field
            const groups: Record<string, Innerface[]> = {};
            const ungrouped: Innerface[] = [];

            groupItems.forEach(item => {
                if (item.group) {
                    if (!groups[item.group]) groups[item.group] = [];
                    groups[item.group].push(item);
                } else {
                    ungrouped.push(item);
                }
            });

            // Sort groups based on groupOrder
            const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
                const indexA = groupOrder.indexOf(a);
                const indexB = groupOrder.indexOf(b);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return a.localeCompare(b);
            });

            // Append ungrouped at the end if exists
            if (ungrouped.length > 0) {
                sortedGroups.push(['ungrouped', ungrouped]);
            }

            return sortedGroups;
        };

        return { innerfacesByCategory: byCategory, getGroupsForCategory };
    }, [items, groupOrder]);




    // Determine category order safely
    const activeCategoryOrder = useMemo(() => {
        const defaultOrder = ['skill', 'foundation', 'uncategorized'];
        if (!categoryOrder || categoryOrder.length === 0) return defaultOrder;

        // Ensure all categories are present and no extras
        const merged = [...categoryOrder];
        defaultOrder.forEach(c => {
            if (!merged.includes(c)) merged.push(c);
        });
        return merged.filter(c => defaultOrder.includes(c));
    }, [categoryOrder]);

    const categoryIds = useMemo(() => activeCategoryOrder.map(c => `category-${c}`), [activeCategoryOrder]);

    // All sortable items = categories + groups + items (for collision detection context)
    // Actually we use separate SortableContexts, but for 'items' prop of DndContext we need identifiers? 
    // No, SortableContext needs items. DndContext just needs sensors.

    // --- DnD Handlers ---
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<Innerface | null>(null);
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isValidDrop, setIsValidDrop] = useState(true);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        const id = active.id as string;

        setActiveId(id);
        isDraggingRef.current = true;
        setIsValidDrop(true);

        if (id.startsWith('category-')) {
            setActiveCategory(id.replace('category-', ''));
            return;
        }

        if (id.startsWith('group-')) {
            setActiveGroup(id.replace('group-', ''));
            return;
        }

        const item = items.find(i => String(i.id) === id);
        if (item) setActiveItem(item);
    }, [items]);


    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) {
            setIsValidDrop(true);
            return;
        }

        const activeIdStr = String(active.id);
        const overIdStr = String(over.id);

        // --- Category / Group Validation/Skipping ---
        if (activeIdStr.startsWith('category-') || activeIdStr.startsWith('group-')) {
            setIsValidDrop(true);
            return;
        }

        // --- Item Logic ---
        const activeItem = items.find(i => String(i.id) === activeIdStr);
        if (!activeItem) return;

        // 1. Identify Target Category & Group
        // 1. Identify Target Category
        let targetCategory = activeItem.category;

        const overItem = items.find(i => String(i.id) === overIdStr);

        if (overIdStr.startsWith('group-')) {
            const groupName = overIdStr.replace('group-', '');
            // Find category of this group
            const sample = items.find(i => i.group === groupName);
            if (sample) targetCategory = sample.category;
        } else if (overIdStr.startsWith('category-')) {
            targetCategory = overIdStr.replace('category-', '') as PowerCategory;
        } else if (overItem) {
            targetCategory = overItem.category;
        }

        // 2. Validate Category Drop
        if (targetCategory && targetCategory !== activeItem.category) {
            setIsValidDrop(false);
            return;
        }

        setIsValidDrop(true);

        // 3. Move Item in Local State (Optimistic Update)
        // If the target is valid, we move the item in `items` array to reflect the new position/group.

        // Find indexes
        const activeIndex = items.findIndex(i => String(i.id) === activeIdStr);
        const overIndex = items.findIndex(i => String(i.id) === overIdStr);

        // If dragging over a GROUP header
        if (overIdStr.startsWith('group-')) {
            const groupName = overIdStr.replace('group-', '');
            if (activeItem.group !== groupName) {
                // Move logic: Change group, append to end of group (or start?)
                // Usually dnd-kit handles "over container" by moving to that container.

                setItems((prev) => {
                    const newItems = [...prev];
                    // Update group
                    const newItem = { ...newItems[activeIndex], group: groupName === 'ungrouped' ? '' : groupName };
                    newItems[activeIndex] = newItem;

                    // We don't necessarily need to move index if we just changed group, 
                    // unless we want it to visually jump to that group's section.
                    // Since `innerfacesByCategory` derives from `items`, 
                    // just changing the group prop is enough to move it to the other list in UI!
                    // But we might want to ensure it is adjacent to other group items in the main array 
                    // to prevent weird sorting issues if we rely on array order.
                    // Let's just update the group for now.
                    return newItems;
                });
            }
            return;
        }

        // If dragging over another ITEM
        if (overIndex !== -1 && activeIndex !== -1) {
            const overItem = items[overIndex];
            // If items are in different groups (but same category), we update group
            if (activeItem.group !== overItem.group) {
                setItems((prev) => {
                    const newItems = [...prev];
                    const newItem = { ...newItems[activeIndex], group: overItem.group };
                    newItems[activeIndex] = newItem;
                    return arrayMove(newItems, activeIndex, overIndex);
                });
            } else {
                // Same group, just reorder
                if (activeIndex !== overIndex) {
                    setItems((prev) => arrayMove(prev, activeIndex, overIndex));
                }
            }
        }
    }, [items]);


    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        const activeIdStr = String(active?.id);

        isDraggingRef.current = false;

        const resetState = () => {
            setActiveId(null);
            setActiveItem(null);
            setActiveGroup(null);
            setActiveCategory(null);
            setIsValidDrop(true);
        };

        if (!over) {
            setItems(innerfaces);
            resetState();
            return;
        }

        // --- Category / Group Reordering ---
        if (activeIdStr.startsWith('category-') || activeIdStr.startsWith('group-')) {
            const overIdStr = String(over.id);
            if (activeIdStr === overIdStr) {
                resetState();
                return;
            }

            if (activeIdStr.startsWith('category-') && overIdStr.startsWith('category-')) {
                const oldIndex = activeCategoryOrder.indexOf(activeIdStr.replace('category-', ''));
                const newIndex = activeCategoryOrder.indexOf(overIdStr.replace('category-', ''));
                if (oldIndex !== -1 && newIndex !== -1) {
                    onReorderCategories(arrayMove(activeCategoryOrder, oldIndex, newIndex));
                }
            } else if (activeIdStr.startsWith('group-') && overIdStr.startsWith('group-')) {
                const activeGroup = activeIdStr.replace('group-', '');
                const overGroup = overIdStr.replace('group-', '');
                const oldIndex = groupOrder.indexOf(activeGroup);
                const newIndex = groupOrder.indexOf(overGroup);
                if (oldIndex !== -1 && newIndex !== -1) {
                    onReorderGroups(arrayMove(groupOrder, oldIndex, newIndex));
                }
            }
            resetState();
            return;
        }

        // --- Item Reordering & Group Change ---
        // CRITICAL: We look at the OPTIMISTIC 'items' state to see where the item landed.
        // handleDragOver has already moved the item to the correct group and position in 'items'.
        const finalItem = items.find(i => String(i.id) === activeIdStr);
        const originalItem = innerfaces.find(i => String(i.id) === activeIdStr);

        if (finalItem && originalItem) {
            const newGroupVal = finalItem.group || '';
            const currentGroupVal = originalItem.group || '';
            const isGroupChanged = newGroupVal !== currentGroupVal;

            const newOrderIds = items.map(i => String(i.id));
            const currentIds = innerfaces.map(i => String(i.id));
            const isOrderChanged = JSON.stringify(newOrderIds) !== JSON.stringify(currentIds);

            if (isGroupChanged || isOrderChanged) {
                // Always use moveInnerface if there's any change, as it's atomic
                onMoveInnerface(activeIdStr, newGroupVal, newOrderIds);
            }
        }

        resetState();
    }, [activeCategoryOrder, groupOrder, items, innerfaces, onReorderGroups, onReorderCategories, onMoveInnerface]);


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
                <div className="flex flex-col gap-4">
                    {/* Special case: Only Uncategorized exists -> Show groups directly */}
                    {innerfacesByCategory.skill.length === 0 && innerfacesByCategory.foundation.length === 0 && innerfacesByCategory.uncategorized.length > 0 ? (
                        <SortableContext items={getGroupsForCategory('uncategorized').map(([g]) => `group-${g}`)} strategy={verticalListSortingStrategy}>
                            {getGroupsForCategory('uncategorized').map(([groupName, groupItems]) => (
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
                        </SortableContext>
                    ) : (
                        /* Standard View: Categories -> Groups -> Items */
                        <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
                            {activeCategoryOrder.map(category => {
                                const items = innerfacesByCategory[category];
                                const groups = getGroupsForCategory(category);

                                return (
                                    <CategorySection
                                        key={category}
                                        category={category as 'skill' | 'foundation' | 'uncategorized'}
                                        count={items.length}
                                        isCollapsed={isCategoryCollapsed(category)}
                                        onToggle={() => toggleCategory(category)}
                                    >
                                        <SortableContext items={groups.map(([g]) => `group-${g}`)} strategy={verticalListSortingStrategy}>
                                            {groups.map(([groupName, groupItems]) => (
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
                                        </SortableContext>
                                    </CategorySection>
                                );
                            })}
                        </SortableContext>
                    )}
                </div>
                <DragOverlay dropAnimation={null}>
                    {activeId ? (
                        <div className="pointer-events-none transition-none-important">
                            <InnerfacesDragOverlay
                                innerface={activeItem}
                                groupName={activeGroup}
                                categoryName={activeCategory}
                                groupsMetadata={groupsMetadata}
                                isValidDrop={isValidDrop}
                            />
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
    const { reorderInnerfaces, reorderInnerfaceGroups, reorderCategories, updateInnerface, moveInnerface, groupsMetadata, innerfaceGroupOrder, categoryOrder } = useMetadataStore();
    const { isGroupCollapsed, toggleGroup } = useCollapsedGroups('innerfaces');
    const { isGroupCollapsed: isCategoryCollapsed, toggleGroup: toggleCategory } = useCollapsedGroups('innerface-categories');
    const isCoachMode = activeContext?.type === 'viewer';

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInnerfaceId, setSelectedInnerfaceId] = useState<string | number | null>(null);
    const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

    // Sorted innerfaces for rendering
    const sortedInnerfaces = useMemo(() => {
        // Just used for empty check and list view - sort order logic moved inside DragContainer
        return [...innerfaces].sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [innerfaces]);

    const handleCreate = useCallback(() => {
        setIsModalOpen(true);
        setSelectedInnerfaceId(null);
    }, []);

    const handleEdit = useCallback((id: string | number) => {
        setSelectedInnerfaceId(id);
        setIsModalOpen(true);
    }, []);

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

    const handleReorderCategories = useCallback((newCategoryOrder: string[]) => {
        reorderCategories(newCategoryOrder);
    }, [reorderCategories]);

    const handleUpdateInnerface = useCallback((id: string | number, data: Partial<Innerface>) => {
        updateInnerface(id, data);
    }, [updateInnerface]);

    const handleMoveInnerface = useCallback((id: string, newGroup: string, orderedIds: string[]) => {
        moveInnerface(id, newGroup, orderedIds);
    }, [moveInnerface]);

    if (isLoading && innerfaces.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-sub font-mono animate-pulse uppercase tracking-widest text-xs">Loading Powers...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 w-full pb-12">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-text-primary">Powers</h1>
                    <p className="text-sub text-sm">Fundamental metrics and base traits that define your current state.</p>
                </div>
                {!isCoachMode && (
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleCreate}
                                    className="h-[46px] w-[36px] flex items-center justify-center rounded-lg text-sub hover:text-main transition-all cursor-pointer"
                                >
                                    <FontAwesomeIcon icon={faPlus} className="text-xl" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <span className="font-mono text-xs">Add Power</span>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
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
                                <span className="font-lexend text-sm font-medium opacity-50 group-hover:opacity-100 transition-opacity">Create First Power</span>
                            </div>
                        </button>
                    )}
                    {isCoachMode && (
                        <div className="col-span-full text-center py-12 text-sub opacity-50 italic">
                            No powers found for this user.
                        </div>
                    )}
                </div>
            ) : (
                <InnerfacesDragContainer
                    innerfaces={sortedInnerfaces}
                    onReorder={handleReorder}
                    onReorderGroups={handleReorderGroups}
                    onReorderCategories={handleReorderCategories}
                    onUpdateInnerface={handleUpdateInnerface}
                    onMoveInnerface={handleMoveInnerface}
                    onEdit={handleEdit}
                    onGroupEdit={handleGroupEdit}
                    groupOrder={innerfaceGroupOrder || []}
                    categoryOrder={categoryOrder || []}
                    groupsMetadata={groupsMetadata}
                    isGroupCollapsed={isGroupCollapsed}
                    toggleGroup={toggleGroup}
                    isCategoryCollapsed={isCategoryCollapsed}
                    toggleCategory={toggleCategory}
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
