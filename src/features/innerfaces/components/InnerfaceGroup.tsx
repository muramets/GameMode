import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../../../components/ui/molecules/SortableItem';
import { CollapsibleSection } from '../../../components/ui/molecules/CollapsibleSection';
import { DraggableInnerfaceItem } from './DraggableInnerfaceItem';
import { getGroupConfig } from '../../../constants/common';
import { getIcon } from '../../../config/iconRegistry';
import type { Innerface } from '../types';

export const InnerfaceGroup = React.memo(({
    groupName,
    innerfaces,
    onEdit,
    onGroupEdit,
    groupsMetadata,
    isCollapsed,
    onToggleCollapse,
    hideHeader
}: {
    groupName: string;
    innerfaces: Innerface[];
    onEdit: (id: string | number) => void;
    onGroupEdit: (groupName: string) => void;
    groupsMetadata: Record<string, { icon: string; color?: string }>;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    hideHeader?: boolean;
}) => {
    const staticConfig = getGroupConfig(groupName);
    const storeMeta = groupsMetadata[groupName];

    let icon = staticConfig ? getIcon(staticConfig.icon) : getIcon('circle');
    let color = staticConfig?.color || '#d1d0c5';

    if (storeMeta) {
        if (storeMeta.icon) {
            const mapped = getIcon(storeMeta.icon);
            if (mapped) icon = mapped;
        }
        if (storeMeta.color) color = storeMeta.color;
    }

    // Memoize the items list creation
    const itemIds = useMemo(() => innerfaces.map(i => String(i.id)), [innerfaces]);

    const content = (
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
    );

    if (hideHeader) {
        return <div className="mb-8">{content}</div>;
    }

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
                        {!isDragging && content}
                    </CollapsibleSection>
                </div>
            )}
        </SortableItem>
    );
});
