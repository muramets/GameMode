import { useState } from 'react';
import { useScoreContext } from '../../contexts/ScoreProvider';
import { InnerfacesGrid } from './components/InnerfacesGrid';
import { InnerfaceSettingsModal } from './components/InnerfaceSettingsModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

export function InnerfacesPage() {
    const { innerfaces, isLoading } = useScoreContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInnerfaceId, setSelectedInnerfaceId] = useState<string | number | null>(null);

    if (isLoading && innerfaces.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-sub font-mono animate-pulse uppercase tracking-widest text-xs">Loading Innerfaces...</div>
            </div>
        );
    }

    const handleEdit = (id: string | number) => {
        setSelectedInnerfaceId(id);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedInnerfaceId(null);
        setIsModalOpen(true);
    };

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

            <InnerfacesGrid innerfaces={innerfaces} onEdit={handleEdit} />

            <InnerfaceSettingsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                innerfaceId={selectedInnerfaceId}
            />
        </div>
    );
}

export default InnerfacesPage;
