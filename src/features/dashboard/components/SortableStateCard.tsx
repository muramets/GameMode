
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StateCard } from './StateCard';
import type { StateData } from '../types';

interface SortableStateCardProps {
    state: StateData;
    onEdit?: (id: string) => void;
    onHistory?: (id: string) => void;
}

export function SortableStateCard({ state, onEdit, onHistory }: SortableStateCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: state.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="touch-none" // prevent scrolling while dragging on touch devices
        >
            <StateCard
                state={state}
                {...state}
                onEdit={() => onEdit?.(state.id)}
                onClick={() => onEdit?.(state.id)}
                onHistory={() => onHistory?.(state.id)}
            />
        </div>
    );
} 
