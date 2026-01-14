import { InnerfaceCard } from './InnerfaceCard';
import type { Innerface } from '../../protocols/types';

interface InnerfacesGridProps {
    innerfaces: Innerface[];
}

export function InnerfacesGrid({ innerfaces }: InnerfacesGridProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-sub text-xs font-mono uppercase tracking-widest">
                    Core Traits / Innerfaces
                </h2>
                <span className="text-sub text-[10px] font-mono">
                    {innerfaces.length} items
                </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {innerfaces.map((innerface) => (
                    <InnerfaceCard key={innerface.id} innerface={innerface} />
                ))}
            </div>
        </div>
    );
}
