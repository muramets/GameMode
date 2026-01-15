import { StateCard } from './StateCard';
import type { StateData } from './types';
import { Plus } from 'lucide-react';

interface StatesGridProps {
    states: StateData[];
    onAddState?: () => void;
    onEdit?: (id: string) => void;
    onHistory?: (id: string) => void;
}

export function StatesGrid({ states, onAddState, onEdit, onHistory }: StatesGridProps) {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-text-primary">Character Stats</h1>
                <button
                    onClick={onAddState}
                    title="Add new state"
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-sub hover:text-text-primary transition-colors duration-200"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

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

                {/* Empty state if no states? or just show grid. */}
                {states.length === 0 && (
                    <div className="col-span-full py-12 text-center text-text-secondary italic">
                        No states defined yet. Add one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
