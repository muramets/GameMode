import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useScoreContext } from '../../../contexts/ScoreContext';
import { InnerfaceSettingsModal } from '../../../components/modals/InnerfaceSettingsModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChevronDown, faGripVertical, faSearch } from '@fortawesome/free-solid-svg-icons';
import { GroupSettingsModal } from '../../../features/groups/components/GroupSettingsModal';
import { Input } from '../../../components/ui/molecules/Input';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../../../components/ui/atoms/Tooltip';
import { InnerfacesFilterDropdown } from './InnerfacesFilterDropdown';
import {
    DndContext,
    closestCenter,
    DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMetadataStore } from '../../../stores/metadataStore';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { SortableItem } from '../../../components/ui/molecules/SortableItem';
import { useCollapsedGroups } from '../../../hooks/useCollapsedGroups';
import { InnerfaceGroup } from './InnerfaceGroup';
import { InnerfacesDragOverlay } from './InnerfacesDragOverlay';
import { useInnerfaceDnD } from '../hooks/useInnerfaceDnD';
import { CATEGORY_CONFIG } from '../constants';
import { useConditionalSearch } from '../../../hooks/useConditionalSearch';

// --- Category Section Header ---
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

export function InnerfacesList() {
    const { innerfaces, isLoading } = useScoreContext();
    const { activeContext } = usePersonalityStore();
    const { reorderGroups, reorderCategories, moveInnerface, groupsMetadata, innerfaceGroupOrder, categoryOrder } = useMetadataStore();
    const { isGroupCollapsed, toggleGroup } = useCollapsedGroups('innerfaces');
    const { isGroupCollapsed: isCategoryCollapsed, toggleGroup: toggleCategory } = useCollapsedGroups('innerface-categories');
    const isCoachMode = activeContext?.type === 'viewer';

    // Filter state
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    const toggleFilter = useCallback((filter: string) => {
        if (filter === 'all') {
            setActiveFilters([]);
        } else {
            setActiveFilters(prev =>
                prev.includes(filter)
                    ? prev.filter(f => f !== filter)
                    : [...prev, filter]
            );
        }
    }, []);

    // Extract unique groups
    const innerfaceGroups = useMemo(() => {
        const groups = new Set<string>();
        innerfaces.forEach(i => {
            if (i.group) groups.add(i.group);
        });
        return Array.from(groups).sort();
    }, [innerfaces]);

    // Content ref for conditional search
    const contentRef = useRef<HTMLDivElement>(null);
    const { searchQuery, setSearchQuery, shouldShowSearch } = useConditionalSearch(contentRef);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInnerfaceId, setSelectedInnerfaceId] = useState<string | number | null>(null);
    const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [localOpen, setLocalOpen] = useState(false);

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

    // Filter innerfaces by search query
    const filteredInnerfaces = useMemo(() => {
        if (!searchQuery.trim()) return innerfaces;
        const query = searchQuery.toLowerCase();
        return innerfaces.filter(innerface =>
            innerface.name.toLowerCase().includes(query)
        );
    }, [innerfaces, searchQuery]);

    // Filter by groups
    const filteredByGroup = useMemo(() => {
        if (activeFilters.length === 0) return filteredInnerfaces;

        return filteredInnerfaces.filter(innerface => {
            if (activeFilters.includes('ungrouped') && !innerface.group) return true;
            if (innerface.group && activeFilters.includes(innerface.group)) return true;
            return false;
        });
    }, [filteredInnerfaces, activeFilters]);

    const {
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
    } = useInnerfaceDnD({
        innerfaces: filteredByGroup,
        groupOrder: innerfaceGroupOrder,
        categoryOrder,
        onReorderCategories: reorderCategories,
        onReorderGroups: reorderGroups,
        onMoveInnerface: moveInnerface
    });


    if (isLoading) {
        return <div className="text-center text-sub dark:text-gray-400 py-10">Loading innerfaces...</div>;
    }

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-lexend text-text-primary">Innerfaces</h1>
                    <p className="text-text-secondary font-mono text-sm mt-1">
                        Track skills and foundations you're developing
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {!isCoachMode && (
                        <div className="flex items-center gap-0">
                            <TooltipProvider delayDuration={1000}>
                                <Tooltip
                                    open={isModalOpen ? false : localOpen}
                                    onOpenChange={setLocalOpen}
                                >
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => {
                                                setLocalOpen(false);
                                                handleCreate();
                                            }}
                                            className="h-[46px] w-[36px] flex items-center justify-center rounded-lg text-sub hover:text-main transition-all cursor-pointer"
                                        >
                                            <FontAwesomeIcon icon={faPlus} className="text-xl" />
                                        </button>
                                    </TooltipTrigger>
                                    {!isModalOpen && (
                                        <TooltipContent side="top">
                                            <span className="font-mono text-xs">Add power</span>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>

                            <InnerfacesFilterDropdown
                                activeFilters={activeFilters}
                                innerfaceGroups={innerfaceGroups}
                                onToggleFilter={toggleFilter}
                            />
                        </div>
                    )}

                    {shouldShowSearch && (
                        <div className="flex-grow md:flex-grow-0 ml-1">
                            <Input
                                icon={faSearch}
                                placeholder="Search powers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="md:w-64"
                            />
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .transition-none-important, 
                .transition-none-important * { 
                    transition: none !important; 
                    animation: none !important;
                }
            `}</style>

            {filteredByGroup.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {innerfaces.length === 0 ? (
                        <button
                            onClick={handleCreate}
                            className="w-full min-h-[120px] border border-dashed border-sub/30 hover:border-sub rounded-xl flex flex-col items-center justify-center gap-3 text-sub hover:text-text-primary transition-all duration-200 group bg-sub-alt/5 hover:bg-sub-alt/10 py-6"
                        >
                            <FontAwesomeIcon icon={faPlus} className="text-2xl" />
                            <span className="font-mono text-xs">Add your first power</span>
                        </button>
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                            <span className="font-mono text-sm text-sub">No powers matching your filter</span>
                            <button
                                onClick={() => toggleFilter('all')}
                                className="mt-3 font-mono text-xs text-main hover:text-text-primary transition-colors"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                >
                    <div ref={contentRef} className="flex flex-col gap-4">
                        {/* Special case: Only Uncategorized exists -> Show groups directly */}
                        {innerfacesByCategory.skill.length === 0 && innerfacesByCategory.foundation.length === 0 && innerfacesByCategory.uncategorized.length > 0 ? (
                            (() => {
                                const uncategorizedGroups = getGroupsForCategory('uncategorized');
                                const hideHeader = uncategorizedGroups.length === 1 && uncategorizedGroups[0][0] === 'ungrouped';

                                return (
                                    <SortableContext items={uncategorizedGroups.map(([g]) => `group-${g}`)} strategy={verticalListSortingStrategy}>
                                        {uncategorizedGroups.map(([groupName, groupItems]) => (
                                            <InnerfaceGroup
                                                key={groupName}
                                                groupName={groupName}
                                                innerfaces={groupItems}
                                                onEdit={handleEdit}
                                                onGroupEdit={handleGroupEdit}
                                                groupsMetadata={groupsMetadata}
                                                isCollapsed={isGroupCollapsed(groupName)}
                                                onToggleCollapse={() => toggleGroup(groupName)}
                                                hideHeader={hideHeader && groupName === 'ungrouped'}
                                            />
                                        ))}
                                    </SortableContext>
                                );
                            })()
                        ) : (
                            /* Standard View: Categories -> Groups -> Items */
                            <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
                                {activeCategoryOrder.map(category => {
                                    const items = innerfacesByCategory[category];
                                    const groups = getGroupsForCategory(category);
                                    const hideHeader = groups.length === 1 && groups[0][0] === 'ungrouped';

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
                                                        onEdit={handleEdit}
                                                        onGroupEdit={handleGroupEdit}
                                                        groupsMetadata={groupsMetadata}
                                                        isCollapsed={isGroupCollapsed(groupName)}
                                                        onToggleCollapse={() => toggleGroup(groupName)}
                                                        hideHeader={hideHeader && groupName === 'ungrouped'}
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
            )}

            {isModalOpen && (
                <InnerfaceSettingsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    innerfaceId={selectedInnerfaceId}
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
