import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { QuickActionCard } from './QuickActionCard';
import type { Protocol } from '../../protocols/types';
import { CollapsibleSection } from '../../../components/ui/molecules/CollapsibleSection';

interface QuickActionsGridProps {
    actions: Protocol[];
    totalProtocolCount?: number;
    onAddAction?: () => void;
    onActionClick?: (id: string | number, direction: '+' | '-') => void;
    onDeleteAction?: (id: string | number) => void;
}

export function QuickActionsGrid({ actions, totalProtocolCount = 0, onAddAction, onActionClick, onDeleteAction }: QuickActionsGridProps) {
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {actions.map((action) => (
                    <QuickActionCard
                        key={action.id}
                        action={action}
                        onAction={(direction) => onActionClick?.(action.id, direction)}
                        onDelete={() => onDeleteAction?.(action.id)}
                    />
                ))}

                {/* Empty State / Add Placeholder */}
                {actions.length === 0 && totalProtocolCount > 0 && (
                    <button
                        onClick={onAddAction}
                        className="col-span-full md:col-span-1 h-[70px] border border-dashed border-sub-alt rounded-lg flex flex-col items-center justify-center text-sub hover:text-text-primary hover:border-sub transition-all group"
                    >
                        <FontAwesomeIcon icon={faPlus} className="text-lg opacity-50 group-hover:opacity-100" />
                        <span className="text-xs font-mono mt-1">Add first quick action</span>
                    </button>
                )}

                {/* Zero Protocols Placeholder */}
                {actions.length === 0 && totalProtocolCount === 0 && (
                    <div className="col-span-full h-[70px] flex items-center justify-center text-sm font-mono text-sub">
                        <span><span className="font-bold">tip:</span> pin your protocols for quick action here</span>
                    </div>
                )}
            </div>
        </CollapsibleSection>
    );
}
