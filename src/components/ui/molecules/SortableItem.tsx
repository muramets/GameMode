import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
    id: string;
    children: (props: {
        setNodeRef: (node: HTMLElement | null) => void;
        setActivatorNodeRef: (node: HTMLElement | null) => void;
        listeners: any;
        attributes: any;
        style: React.CSSProperties;
        isDragging: boolean;
    }) => React.ReactNode;
    disabled?: boolean;
}

export function SortableItem({ id, children, disabled }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        // Ensure dragged item is above others
        zIndex: isDragging ? 50 : undefined,
        position: 'relative' as const,
        touchAction: 'none' // Important for touch devices
    };

    return (
        <React.Fragment>
            {children({
                setNodeRef,
                setActivatorNodeRef,
                listeners,
                attributes,
                style,
                isDragging
            })}
        </React.Fragment>
    );
}
