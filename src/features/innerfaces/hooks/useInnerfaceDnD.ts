import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
} from '@dnd-kit/sortable';
import type { Innerface, PowerCategory } from '../types';
import { DND_SENSORS_CONFIG } from '../../../constants/dnd';

interface UseInnerfaceDnDProps {
    innerfaces: Innerface[];
    groupOrder: string[];
    categoryOrder: string[];
    onReorderCategories: (newOrder: string[]) => void;
    onReorderGroups: (newOrder: string[]) => void;
    onMoveInnerface: (id: string, newGroup: string, orderedIds: string[]) => void;
}

export const useInnerfaceDnD = ({
    innerfaces,
    groupOrder,
    categoryOrder,
    onReorderCategories,
    onReorderGroups,
    onMoveInnerface,
}: UseInnerfaceDnDProps) => {
    // --- Local State for Drag (Optimistic UI) ---
    // --- Local State for Drag (Optimistic UI) ---
    const [items, setItems] = useState<Innerface[]>(innerfaces);
    const isDraggingRef = useRef(false);

    // Sync items when prop updates
    useEffect(() => {
        if (!isDraggingRef.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setItems(innerfaces);
        }
    }, [innerfaces]);



    const sensors = useSensors(
        useSensor(PointerSensor, DND_SENSORS_CONFIG.pointer),
        useSensor(KeyboardSensor, DND_SENSORS_CONFIG.keyboard)
    );

    // Group logic to categorize items (Skills, Foundations, Uncategorized)
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

    // --- DnD State ---
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

        // 1. Identify Target Category
        let targetCategory = activeItem.category;
        const overItem = items.find(i => String(i.id) === overIdStr);

        if (overIdStr.startsWith('group-')) {
            const groupName = overIdStr.replace('group-', '');
            // Find category of this group
            // Optimization: we can pass a map or search in items
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
        const activeIndex = items.findIndex(i => String(i.id) === activeIdStr);
        const overIndex = items.findIndex(i => String(i.id) === overIdStr);

        // If dragging over a GROUP header
        if (overIdStr.startsWith('group-')) {
            const groupName = overIdStr.replace('group-', '');
            if (activeItem.group !== groupName) {
                setItems((prev) => {
                    const newItems = [...prev];
                    const newItem = { ...newItems[activeIndex], group: groupName === 'ungrouped' ? '' : groupName };
                    newItems[activeIndex] = newItem;
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
                onMoveInnerface(activeIdStr, newGroupVal, newOrderIds);
            }
        }

        resetState();
    }, [activeCategoryOrder, groupOrder, items, innerfaces, onReorderGroups, onReorderCategories, onMoveInnerface]);

    return {
        items,
        sensors,
        activeId,
        activeItem,
        activeGroup,
        activeCategory,
        isValidDrop,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        innerfacesByCategory,
        getGroupsForCategory,
        categoryIds,
        activeCategoryOrder
    };
};
