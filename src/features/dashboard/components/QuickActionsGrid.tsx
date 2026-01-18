import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import type { Protocol } from '../../protocols/types';
import { CollapsibleSection } from '../../../components/ui/molecules/CollapsibleSection';
import {
    DndContext,
    closestCenter,
    DragOverlay,
} from '@dnd-kit/core';
import {
    SortableContext,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { SortableQuickActionCard } from './SortableQuickActionCard';
import { QuickActionCard } from './QuickActionCard';
import { useMetadataStore } from '../../../stores/metadataStore';
import { useSortableList } from '../../../hooks/useSortableList';

interface QuickActionsGridProps {
    actions: Protocol[];
    totalProtocolCount?: number;
    onAddAction?: () => void;
    onActionClick?: (id: string | number, direction: '+' | '-') => void;
    onDeleteAction?: (id: string | number) => void;
    isDisabled?: boolean;
}

export function QuickActionsGrid({
    actions,
    totalProtocolCount = 0,
    onAddAction,
    onActionClick,
    onDeleteAction,
    isDisabled
}: QuickActionsGridProps) {
    const { reorderQuickActions } = useMetadataStore();
    const navigate = useNavigate();

    const { sensors, activeId, handleDragStart, handleDragEnd } = useSortableList({
        items: actions,
        onReorder: reorderQuickActions
    });

    return (
        <CollapsibleSection
            title="Quick Actions"
            trailing={
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddAction?.();
                    }}
                    title="Add protocol to quick actions"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-sub hover:text-text-primary transition-colors duration-200"
                >
                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                </button>
            }
        >
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <DragOverlay dropAnimation={null}>
                    {activeId ? (
                        <div className="cursor-grabbing opacity-90 scale-[1.02] shadow-2xl touch-none h-full">
                            {/* Find the action object for the active ID */}
                            {(() => {
                                const activeAction = actions.find(a => a.id === activeId);
                                if (!activeAction) return null;
                                return (
                                    <QuickActionCard
                                        action={activeAction}
                                        onAction={() => null} // No-op during drag
                                        onDelete={() => null} // No-op during drag
                                    />
                                );
                            })()}
                        </div>
                    ) : null}
                </DragOverlay>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-2">
                    <SortableContext
                        items={actions.map(a => a.id)}
                        strategy={rectSortingStrategy}
                    >
                        {actions.map((action) => (
                            <SortableQuickActionCard
                                key={action.id}
                                action={action}
                                onClick={(id, dir) => onActionClick?.(id, dir)}
                                onDelete={(id) => onDeleteAction?.(id)}
                                isDisabled={isDisabled}
                            />
                        ))}
                    </SortableContext>

                    {/* Empty State / Add Placeholder */}
                    {actions.length === 0 && totalProtocolCount > 0 && (
                        <button
                            onClick={onAddAction}
                            className="col-span-full md:col-span-1 h-[70px] border border-dashed border-sub/30 hover:border-sub rounded-lg flex flex-col items-center justify-center gap-2 text-sub hover:text-text-primary transition-all duration-200 group bg-sub-alt/5 hover:bg-sub-alt/10"
                        >
                            <FontAwesomeIcon icon={faPlus} className="text-lg" />
                            <span className="text-xs font-mono">Add your first quick action</span>
                        </button>
                    )}

                    {/* Zero Protocols Placeholder */}
                    {actions.length === 0 && totalProtocolCount === 0 && (
                        <button
                            onClick={() => navigate('/actions')}
                            className="col-span-full md:col-span-1 h-[70px] border border-dashed border-sub/30 hover:border-sub rounded-lg flex flex-col items-center justify-center gap-2 text-sub hover:text-text-primary transition-all duration-200 group bg-sub-alt/5 hover:bg-sub-alt/10"
                        >
                            <FontAwesomeIcon icon={faPlus} className="text-lg" />
                            <span className="font-mono text-xs">Start by adding actions</span>
                        </button>
                    )}
                </div>
            </DndContext>
        </CollapsibleSection>
    );
}

