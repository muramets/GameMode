import React, { useState, useMemo, useCallback } from 'react';
import { useScoreContext } from '../../contexts/ScoreProvider';
import { InnerfaceSettingsModal } from './components/InnerfaceSettingsModal';
import { InnerfaceCard } from './components/InnerfaceCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
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
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useMetadataStore } from '../../stores/metadataStore';
import { SortableItem } from '../../components/ui/molecules/SortableItem';
import { type Innerface } from '../protocols/types';
import { useAuth } from '../../contexts/AuthProvider';
import { usePersonalityStore } from '../../stores/personalityStore';

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
                    className="relative cursor-grab active:cursor-grabbing touch-none" // touch-none prevents scrolling while dragging on touch devices
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
const InnerfacesDragOverlay = React.memo(({ innerface }: { innerface: Innerface | null }) => {
    if (!innerface) return null;
    return (
        <div className="w-full h-full opacity-90 cursor-grabbing shadow-2xl pointer-events-none">
            <InnerfaceCard innerface={innerface} />
        </div>
    );
});


// --- Drag Container ---
const InnerfacesDragContainer = React.memo(({
    innerfaces,
    onReorder,
    onEdit,
}: {
    innerfaces: Innerface[];
    onReorder: (newOrder: string[]) => void;
    onEdit: (id: string | number) => void;
}) => {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const activeIdStr = String(active.id);
            const overIdStr = String(over.id);

            const oldIndex = innerfaces.findIndex(i => String(i.id) === activeIdStr);
            const newIndex = innerfaces.findIndex(i => String(i.id) === overIdStr);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(innerfaces.map(i => String(i.id)), oldIndex, newIndex);
                onReorder(newOrder);
            }
        }

    }, [innerfaces, onReorder]);

    const activeInnerface = useMemo(() =>
        innerfaces.find(i => String(i.id) === activeId) || null
        , [innerfaces, activeId]);

    const itemIds = useMemo(() => innerfaces.map(i => String(i.id)), [innerfaces]);

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

                <DragOverlay dropAnimation={null}>
                    {activeId ? (
                        <div className="pointer-events-none transition-none-important">
                            <InnerfacesDragOverlay innerface={activeInnerface} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </>
    );
});


export function InnerfacesPage() {
    const { innerfaces, isLoading } = useScoreContext();
    const { user } = useAuth();
    const { activePersonalityId } = usePersonalityStore();
    const { reorderInnerfaces } = useMetadataStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInnerfaceId, setSelectedInnerfaceId] = useState<string | number | null>(null);

    // Sort innerfaces by their 'order' field locally before rendering
    const sortedInnerfaces = useMemo(() => {
        return [...innerfaces].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
    }, [innerfaces]);


    const handleEdit = useCallback((id: string | number) => {
        setSelectedInnerfaceId(id);
        setIsModalOpen(true);
    }, []);

    const handleCreate = () => {
        setSelectedInnerfaceId(null);
        setIsModalOpen(true);
    };

    const handleReorder = useCallback((newOrderIdStrs: string[]) => {
        if (user && activePersonalityId) {
            reorderInnerfaces(user.uid, activePersonalityId, newOrderIdStrs);
        }
    }, [user, activePersonalityId, reorderInnerfaces]);


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
                <button
                    onClick={handleCreate}
                    className="h-[46px] w-[36px] flex items-center justify-center rounded-lg text-sub hover:text-main transition-all cursor-pointer"
                    title="Add Innerface"
                >
                    <FontAwesomeIcon icon={faPlus} className="text-xl" />
                </button>
            </div>

            <InnerfacesDragContainer
                innerfaces={sortedInnerfaces}
                onReorder={handleReorder}
                onEdit={handleEdit}
            />

            <InnerfaceSettingsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                innerfaceId={selectedInnerfaceId}
            />
        </div>
    );
}

export default InnerfacesPage;
