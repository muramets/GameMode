
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuickActionCard } from './QuickActionCard';
import type { Protocol } from '../../../pages/protocols/types';

interface SortableQuickActionCardProps {
    action: Protocol;
    onClick: (id: string | number, direction: '+' | '-') => void;
    onDelete: (id: string | number) => void;
}

export function SortableQuickActionCard({ action, onClick, onDelete }: SortableQuickActionCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: action.id });

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
            className="touch-none h-full" // Ensure full height for grid alignment
        >
            <QuickActionCard
                action={action}
                onAction={(direction) => onClick(action.id, direction)}
                onDelete={() => onDelete(action.id)}
            />
        </div>
    );
}
