import { InnerfaceCard } from './InnerfaceCard';
import type { Innerface } from '../../protocols/types';

interface InnerfacesGridProps {
    innerfaces: Innerface[];
    onEdit: (id: string | number) => void;
}

export function InnerfacesGrid({ innerfaces, onEdit }: InnerfacesGridProps) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {innerfaces.map((innerface) => (
                    <InnerfaceCard
                        key={innerface.id}
                        innerface={innerface}
                        onEdit={() => onEdit(innerface.id)}
                    />
                ))}
            </div>
        </div>
    );
}
