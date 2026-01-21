import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
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
import { useMetadataStore } from '../../../stores/metadataStore';

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
    const setHasPendingWrites = useMetadataStore(state => state.setHasPendingWrites);

    // --- Local State for Drag (Optimistic UI) ---
    const [items, setItems] = useState<Innerface[]>(innerfaces);
    const [localCategoryOrder, setLocalCategoryOrder] = useState<string[]>(categoryOrder);
    const [localGroupOrder, setLocalGroupOrder] = useState<string[]>(groupOrder);
    const isDraggingRef = useRef(false);
    const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Preserve groups that existed at drag start to prevent them from disappearing
    const dragStartGroupsRef = useRef<Record<string, string[]>>({});

    // CRITICAL: Refs to track current state values for debounced save (avoid stale closures)
    const localCategoryOrderRef = useRef(localCategoryOrder);
    const localGroupOrderRef = useRef(localGroupOrder);
    const itemsRef = useRef(items);

    // Keep refs in sync with state
    useEffect(() => {
        localCategoryOrderRef.current = localCategoryOrder;
    }, [localCategoryOrder]);

    useEffect(() => {
        localGroupOrderRef.current = localGroupOrder;
    }, [localGroupOrder]);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    // Sync items when prop updates, BUT ignore if we are actively dragging
    useEffect(() => {
        if (!isDraggingRef.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setItems(innerfaces);
            setLocalCategoryOrder(categoryOrder);
            setLocalGroupOrder(groupOrder);
        }
    }, [innerfaces, categoryOrder, groupOrder]);

    const sensors = useSensors(
        useSensor(MouseSensor, DND_SENSORS_CONFIG.mouse),
        useSensor(TouchSensor, DND_SENSORS_CONFIG.touch),
        useSensor(KeyboardSensor, DND_SENSORS_CONFIG.keyboard)
    );


    // --- Data Derivation (no manual stabilization - React.memo in components handles it) ---

    const { innerfacesByCategory, getGroupsForCategory } = useMemo(() => {
        const newByCategory: Record<string, Innerface[]> = {
            skill: [],
            foundation: [],
            uncategorized: []
        };

        items.forEach(i => {
            if (i.category === 'skill') newByCategory.skill.push(i);
            else if (i.category === 'foundation') newByCategory.foundation.push(i);
            else newByCategory.uncategorized.push(i);
        });

        // Note: No stabilization here - we want all field updates to flow through
        // Stabilization is only applied at the group level in getGroupsForCategory

        // Memoized helper to group items within a specific category
        const getGroupsForCategory = (category: string) => {
            const groupItems = newByCategory[category] || [];

            // Generate current state of groups
            const groups: Record<string, Innerface[]> = {};
            const ungroupedArr: Innerface[] = [];

            groupItems.forEach(item => {
                if (item.group) {
                    if (!groups[item.group]) groups[item.group] = [];
                    groups[item.group].push(item);
                } else {
                    ungroupedArr.push(item);
                }
            });

            // Sort group names based on localGroupOrder
            // During drag, include groups that existed at drag start (even if now empty)
            const allGroupNames = new Set(Object.keys(groups));
            if (isDraggingRef.current && dragStartGroupsRef.current[category]) {
                dragStartGroupsRef.current[category].forEach(g => allGroupNames.add(g));
            }

            const sortedGroupNames = Array.from(allGroupNames).sort((a, b) => {
                const indexA = localGroupOrder.indexOf(a);
                const indexB = localGroupOrder.indexOf(b);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return a.localeCompare(b);
            });

            const currentGroups: [string, Innerface[]][] = sortedGroupNames.map(name => [name, groups[name] || []]);
            if (ungroupedArr.length > 0) {
                currentGroups.push(['ungrouped', ungroupedArr]);
            }

            // No manual stabilization - React.memo in child components handles re-render prevention
            return currentGroups;
        };

        return { innerfacesByCategory: newByCategory, getGroupsForCategory };
    }, [items, localGroupOrder]);

    // Determine category order safely
    const activeCategoryOrder = useMemo(() => {
        const defaultOrder = ['skill', 'foundation', 'uncategorized'];
        const baseOrder = localCategoryOrder && localCategoryOrder.length > 0 ? localCategoryOrder : categoryOrder;

        const merged = [...baseOrder];
        defaultOrder.forEach(c => {
            if (!merged.includes(c)) merged.push(c);
        });
        return merged.filter(c => defaultOrder.includes(c));
    }, [localCategoryOrder, categoryOrder]);

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
        console.debug('[DnD] Drag Start:', id);

        setActiveId(id);
        isDraggingRef.current = true;
        setIsValidDrop(true);

        // Capture current groups per category at drag start
        const groupsSnapshot: Record<string, string[]> = {};
        ['skill', 'foundation', 'uncategorized'].forEach(cat => {
            const catItems = items.filter(i => (i.category || 'uncategorized') === cat);
            const catGroups = new Set(catItems.map(i => i.group).filter(Boolean) as string[]);
            groupsSnapshot[cat] = Array.from(catGroups);
        });
        dragStartGroupsRef.current = groupsSnapshot;

        if (id.startsWith('category-')) {
            setActiveCategory(id.replace('category-', ''));
            setActiveGroup(null);
            return;
        }

        if (id.startsWith('group-')) {
            const parts = id.split('-');
            const cat = parts[1];
            const groupName = parts.slice(2).join('-');
            console.log('[DnD Debug] Dragging Group:', { groupName, category: cat });

            setActiveGroup(groupName);
            setActiveCategory(cat);

            // If localGroupOrder is empty, initialize it with all unique group names present in items
            // This ensures we can reorder them even if no order was ever saved to Firebase
            setLocalGroupOrder((prev) => {
                if (prev.length > 0) return prev;
                const uniqueGroups = Array.from(new Set(items.map(i => i.group).filter(Boolean))) as string[];
                console.log('[DnD Debug] Initializing local group order:', uniqueGroups);
                return uniqueGroups;
            });
            return;
        }

        const item = items.find(i => String(i.id) === id);
        if (item) {
            console.log('[DnD Debug] Dragging Item:', item.name);
            setActiveItem(item);
        }
    }, [items]);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) {
            if (isValidDrop !== true) setIsValidDrop(true);
            return;
        }

        const activeIdStr = String(active.id);
        const overIdStr = String(over.id);

        if (activeIdStr === overIdStr) return;

        const itemMap = new Map(items.map((i, idx) => [String(i.id), { item: i, index: idx }]));
        const activeData = itemMap.get(activeIdStr);

        // Note: activeData is undefined for categories and groups - that's OK!
        // We only return early if we're trying to drag an ITEM which doesn't exist
        if (!activeData && !activeIdStr.startsWith('category-') && !activeIdStr.startsWith('group-')) return;

        const activeItem = activeData?.item;
        const activeIndex = activeData?.index ?? -1;

        // --- Category Reordering ---
        // Note: We use custom collision detection in InnerfacesList to ensure we ONLY match with other categories
        if (activeIdStr.startsWith('category-')) {
            if (overIdStr.startsWith('category-')) {
                const activeCat = activeIdStr.replace('category-', '');
                const overCat = overIdStr.replace('category-', '');

                if (activeCat !== overCat) {
                    setLocalCategoryOrder((prev) => {
                        // CRITICAL FIX: Initialize with activeCategoryOrder if empty
                        // This ensures we have valid indices for arrayMove on first drag
                        const workingOrder = prev.length > 0 ? prev : activeCategoryOrder;

                        const oldIndex = workingOrder.indexOf(activeCat);
                        const newIndex = workingOrder.indexOf(overCat);
                        if (oldIndex !== -1 && newIndex !== -1) {
                            return arrayMove(workingOrder, oldIndex, newIndex);
                        }
                        return workingOrder;
                    });
                }
            }
            setIsValidDrop(true);
            return;
        }

        // --- Group Reordering ---
        if (activeIdStr.startsWith('group-')) {
            const activeParts = activeIdStr.split('-');
            const activeCat = activeParts[1];
            const activeGrp = activeParts.slice(2).join('-');

            let overGrp: string | undefined;
            let overCat: string | null | undefined;

            if (overIdStr.startsWith('group-')) {
                const overParts = overIdStr.split('-');
                overCat = overParts[1];
                overGrp = overParts.slice(2).join('-');
            } else if (overIdStr.startsWith('category-')) {
                overCat = overIdStr.replace('category-', '');
                if (overCat === activeCat) {
                    const typedCat = overCat as PowerCategory;
                    if (typedCat) {
                        const catGroups = getGroupsForCategory(typedCat);
                        if (catGroups.length > 0) {
                            overGrp = catGroups[0][0];
                        }
                    }
                }
            } else {
                const overData = itemMap.get(overIdStr);
                if (overData) {
                    overCat = overData.item.category;
                    overGrp = overData.item.group || 'ungrouped';
                }
            }

            if (activeCat === overCat && activeGrp && overGrp && activeGrp !== overGrp) {
                setLocalGroupOrder((prev) => {
                    const next = [...prev];
                    if (!next.includes(activeGrp)) { next.push(activeGrp); }
                    if (!next.includes(overGrp!)) { next.push(overGrp!); }

                    const oldIndex = next.indexOf(activeGrp);
                    const newIndex = next.indexOf(overGrp!);

                    if (oldIndex !== -1 && newIndex !== -1) {
                        return arrayMove(next, oldIndex, newIndex);
                    }
                    return prev;
                });
                setIsValidDrop(true);
            }
            return;
        }

        // --- Item Logic ---
        if (!activeItem) return;

        // 1. Identify Target Category
        let targetCategory: PowerCategory | undefined;
        const overData = itemMap.get(overIdStr);

        // Initialize targetCategory with activeItem's category
        targetCategory = activeItem.category;

        if (overIdStr.startsWith('group-')) {
            const parts = overIdStr.split('-');
            targetCategory = parts[1] as PowerCategory;
        } else if (overIdStr.startsWith('category-')) {
            targetCategory = overIdStr.replace('category-', '') as PowerCategory;
        } else if (overData) {
            targetCategory = overData.item.category;
        }

        // 2. Validate Category Drop
        const newValid = !targetCategory || targetCategory === activeItem.category;
        if (isValidDrop !== newValid) {
            setIsValidDrop(newValid);
        }

        if (!newValid) return;

        // 3. Move Item in Local State (Optimistic Update)
        const overIndex = overData ? overData.index : -1;

        // If dragging over a GROUP header
        if (overIdStr.startsWith('group-')) {
            const parts = overIdStr.split('-');
            const groupName = parts.slice(2).join('-');
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
            const overItem = overData!.item;
            // If items are in different groups (but same category), we update group
            if (activeItem.group !== overItem.group) {
                setItems((prev) => {
                    const newItems = [...prev];
                    const newItem = { ...newItems[activeIndex], group: overItem.group };
                    newItems[activeIndex] = newItem;
                    return arrayMove(newItems, activeIndex, overIndex);
                });
            } else {
                // Same group - update local state for visual reorder
                if (activeIndex !== overIndex) {
                    setItems((prev) => arrayMove(prev, activeIndex, overIndex));
                }
            }
        }
    }, [items, getGroupsForCategory, isValidDrop]);

    // --- 3. Drag End Handler (Persist Changes) ---
    /**
     * handleDragEnd:
     * Finalizes the drag operation, calculates the final state, and triggers persistence.
     * Uses a debounced save to prevent excessive writes to Firebase during rapid reordering.
     */
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        const activeIdStr = String(active?.id);

        console.debug('[DnD] Drag End', { active: activeIdStr, over: over?.id });

        // --- CRITICAL: Set pending flag FIRST to prevent sync from overwriting local state ---
        // This tells the subscription listener to ignore incoming updates while we are in the middle of a user action.
        setHasPendingWrites(true);
        if (pendingSaveRef.current) {
            clearTimeout(pendingSaveRef.current);
        }

        // Define resetState so it can be used for cleanup
        const resetState = () => {
            setActiveId(null);
            setActiveItem(null);
            setActiveGroup(null);
            setActiveCategory(null);
            setIsValidDrop(true);
        };

        if (!over) {
            // Cancelled drag - reset to store state
            pendingSaveRef.current = null;
            setHasPendingWrites(false);
            setItems(innerfaces);
            setLocalCategoryOrder(categoryOrder);
            setLocalGroupOrder(groupOrder);
            resetState();
            return;
        }

        const activeItem = items.find(i => String(i.id) === activeIdStr);

        // --- 1. Category Sorting ---
        if (activeIdStr.startsWith('category-')) {
            // Note: The actual reordering logic happens in handleDragOver for visual feedback.
            // Here we just persist the final order of categories.
            // We use the LOCAL order because it has already been updated optimistically.
        }

        // --- 2. Item Handlers (Group Change or Reorder) ---
        else if (activeItem && over) {
            // Logic handled via local state update in DragOver/DragEnd
            // We just need to ensure the final state is captured for saving.
        }

        // 3. Schedule the actual save
        pendingSaveRef.current = setTimeout(() => {
            console.debug('[useInnerfaceDnD] Executing debounced save...');

            // --- Category / Group Reordering ---
            // CRITICAL FIX: Use refs to get current state values (avoid stale closures)
            if (activeIdStr.startsWith('category-') || activeIdStr.startsWith('group-')) {
                if (activeIdStr.startsWith('category-')) {
                    const currentOrder = localCategoryOrderRef.current;
                    console.info('[useInnerfaceDnD] Persisting Category Order', currentOrder);
                    onReorderCategories(currentOrder);
                } else if (activeIdStr.startsWith('group-')) {
                    const currentOrder = localGroupOrderRef.current;
                    console.info('[useInnerfaceDnD] Persisting Group Order', currentOrder);
                    onReorderGroups(currentOrder);
                }
            } else {
                // --- Item Reordering ---
                const currentItems = itemsRef.current;
                const reorderedIds = currentItems.map(i => String(i.id));
                const movedItem = currentItems.find(i => String(i.id) === activeIdStr);

                if (movedItem) {
                    const targetGroup = movedItem.group || 'ungrouped';
                    console.info(`[useInnerfaceDnD] Moving item ${movedItem.name} to ${targetGroup}`);
                    onMoveInnerface(activeIdStr, targetGroup, reorderedIds);
                }
            }

            // 4. Release the lock after a short delay to allow Firebase to ack
            setTimeout(() => {
                setHasPendingWrites(false);
                pendingSaveRef.current = null;
            }, 500);

        }, 1000); // 1 second debounce

        // Delay state reset to next animation frame for smoother transition
        requestAnimationFrame(() => {
            resetState();
        });
    }, [localCategoryOrder, localGroupOrder, items, innerfaces, onReorderGroups, onReorderCategories, onMoveInnerface, categoryOrder, groupOrder, setHasPendingWrites]);

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
