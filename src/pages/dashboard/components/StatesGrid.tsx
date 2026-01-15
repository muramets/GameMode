import { StateCard } from './StateCard';
import type { StateData } from './types';
import { Plus } from 'lucide-react';
import { CollapsibleSection } from '../../../components/ui/molecules/CollapsibleSection';

interface StatesGridProps {
    states: StateData[];
    onAddState?: () => void;
    onEdit?: (id: string) => void;
    onHistory?: (id: string) => void;
}

export function StatesGrid({ states, onAddState, onEdit, onHistory }: StatesGridProps) {
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {states.map((state) => (
                    <StateCard
                        key={state.id}
                        state={state}
                        // Spread extended properties (score, color, etc) from mock data
                        {...state}
                        onClick={() => onEdit?.(state.id)}
                        onEdit={() => onEdit?.(state.id)}
                        onHistory={() => onHistory?.(state.id)}
                    />
                ))}

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
        </CollapsibleSection>
    );
}
