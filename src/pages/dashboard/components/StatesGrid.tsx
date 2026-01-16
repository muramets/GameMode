import type { StateData } from './types';
import { Plus } from 'lucide-react';
import { CollapsibleSection } from '../../../components/ui/molecules/CollapsibleSection';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { SortableStateCard } from './SortableStateCard';
import { StateCard } from './StateCard';
import { useMetadataStore } from '../../../stores/metadataStore';
import { useAuth } from '../../../contexts/AuthProvider';
import { useState } from 'react';

interface StatesGridProps {
    states: StateData[];
    onAddState?: () => void;
    onEdit?: (id: string) => void;
    onHistory?: (id: string) => void;
}

export function StatesGrid({ states, onAddState, onEdit, onHistory }: StatesGridProps) {
    const { user } = useAuth();
    const { reorderStates } = useMetadataStore();
    const activePersonalityId = localStorage.getItem('active_personality_id');
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            // Require movement of 3px before drag starts to prevent accidental drags on click
            activationConstraint: {
                distance: 3
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (active.id !== over?.id) {
            const oldIndex = states.findIndex((s) => s.id === active.id);
            const newIndex = states.findIndex((s) => s.id === over?.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(states, oldIndex, newIndex);
                if (user && activePersonalityId) {
                    reorderStates(user.uid, activePersonalityId, newOrder.map(s => s.id));
                }
            }
        }
    };

    return (
        <CollapsibleSection
            title="Character Stats"
            trailing={
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddState?.();
                    }}
                    title="Add new state"
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-sub hover:text-text-primary transition-colors duration-200"
                >
                    <Plus className="w-5 h-5" />
                </button>
            }
        >
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={(event) => setActiveId(String(event.active.id))}
                onDragEnd={handleDragEnd}
            >
                <DragOverlay dropAnimation={null}>
                    {activeId ? (
                        <div className="cursor-grabbing opacity-90 scale-[1.02] shadow-2xl touch-none">
                            {/* Find the state object for the active ID */}
                            {(() => {
                                const activeState = states.find(s => s.id === activeId);
                                if (!activeState) return null;
                                return <StateCard state={activeState} {...activeState} />;
                            })()}
                        </div>
                    ) : null}
                </DragOverlay>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <SortableContext
                        items={states.map(s => s.id)}
                        strategy={rectSortingStrategy}
                    >
                        {states.map((state) => (
                            <SortableStateCard
                                key={state.id}
                                state={state}
                                onEdit={onEdit}
                                onHistory={onHistory}
                            />
                        ))}
                    </SortableContext>

                    {/* Empty State / Add Placeholder */}
                    {states.length === 0 && (
                        <button
                            onClick={onAddState}
                            className="col-span-full md:col-span-1 min-h-[180px] border border-dashed border-sub-alt rounded-2xl flex flex-col items-center justify-center text-sub hover:text-text-primary hover:border-sub transition-all group"
                        >
                            <Plus className="w-8 h-8 opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
                            <span className="text-sm font-mono mt-3 group-hover:opacity-100 transition-opacity duration-300">Add First State</span>
                        </button>
                    )}
                </div>
            </DndContext>
        </CollapsibleSection>
    );
}
