import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faBed, faMoon, faBook, faBolt } from '@fortawesome/free-solid-svg-icons'; // Example icons
import { QuickActionCard } from './QuickActionCard';
import type { QuickAction } from './types';

// We need a map from string icon names to FontAwesome objects since DB/Mock usually stores strings.
// For now, I'll mapping standard ones used in typical productivity apps.
const ICON_MAP: Record<string, any> = {
    'bed': faBed,
    'moon': faMoon,
    'book': faBook,
    'bolt': faBolt,
    // fallback
    'default': faBolt
};

interface QuickActionsGridProps {
    actions: QuickAction[];
    onAddAction?: () => void;
    onActionClick?: (id: string) => void;
    onDeleteAction?: (id: string) => void;
}

export function QuickActionsGrid({ actions, onAddAction, onActionClick, onDeleteAction }: QuickActionsGridProps) {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-text-primary">Quick Actions</h2>
                <button
                    onClick={onAddAction}
                    title="Add protocol to quick actions"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-sub hover:text-text-primary transition-colors duration-200"
                >
                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {actions.map((action) => (
                    <QuickActionCard
                        key={action.id}
                        action={action}
                        icon={ICON_MAP[action.icon] || ICON_MAP['default']}
                        onClick={() => onActionClick?.(action.id)}
                        onDelete={() => onDeleteAction?.(action.id)}
                    />
                ))}

                {/* Empty State / Add Placeholder if needed, but legacy just showed empty text if 0. 
                    I'll implement the empty state from legacy if array is empty. */}
                {actions.length === 0 && (
                    <div className="col-span-full py-8 text-center text-text-secondary italic bg-sub-alt/20 rounded-lg border border-dashed border-sub-alt">
                        No quick actions defined. Add one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
