import React from 'react';
import { SortableItem } from '../../../components/ui/molecules/SortableItem';
import { InnerfaceCard } from './InnerfaceCard';
import type { Innerface } from '../types';

export const DraggableInnerfaceItem = React.memo(({
    innerface,
    onEdit,
    onPlanning,
    hasGoal
}: {
    innerface: Innerface;
    onEdit: (id: string | number) => void;
    onPlanning?: () => void;
    hasGoal?: boolean;
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
                        onPlanning={onPlanning}
                        hasGoal={hasGoal}
                    />
                </div>
            )}
        </SortableItem>
    );
}, (prev, next) => {
    return prev.innerface === next.innerface;
});
