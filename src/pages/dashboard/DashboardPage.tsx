import { useAuth } from '../../contexts/AuthProvider';
import { UserProfile } from './components/UserProfile';
import { StatesGrid } from './components/StatesGrid';
import { QuickActionsGrid } from './components/QuickActionsGrid';
import { StateSettingsModal } from './components/StateSettingsModal';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AddQuickActionModal } from './components/AddQuickActionModal';
import { useMetadataStore } from '../../stores/metadataStore';

import { useScoreContext } from '../../contexts/ScoreProvider';

export function Dashboard() {
    const { user } = useAuth();
    const { states, protocols, applyProtocol, isLoading } = useScoreContext();
    const { pinnedProtocolIds, togglePinnedProtocol } = useMetadataStore();
    const navigate = useNavigate();

    const [isStateModalOpen, setIsStateModalOpen] = useState(false);
    const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);
    const [selectedStateId, setSelectedStateId] = useState<string | null>(null);

    // Filter pinned protocols
    const quickActions = protocols.filter(p => pinnedProtocolIds.includes(p.id.toString()));

    // Handle Quick Action Click -> Execute Protocol
    const handleQuickActionClick = (id: string | number, direction: '+' | '-') => {
        applyProtocol(id, direction);
    };

    // Handle Quick Action Delete -> Unpin
    const handleUnpinAction = (id: string | number) => {
        const activePersonalityId = localStorage.getItem('active_personality_id');
        if (user && activePersonalityId) {
            togglePinnedProtocol(user.uid, activePersonalityId, id.toString());
        }
    };

    const handleAddState = () => {
        setSelectedStateId(null);
        setIsStateModalOpen(true);
    };

    const handleEditState = (id: string) => {
        setSelectedStateId(id);
        setIsStateModalOpen(true);
    };

    const handleViewHistory = (stateId: string) => {
        navigate('/history', { state: { filterStateId: stateId } });
    };

    if (isLoading && states.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-sub font-mono animate-pulse uppercase tracking-widest text-xs">Syncing Game State...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-12 w-full pb-12">
            <UserProfile />

            <StatesGrid
                states={states}
                onAddState={handleAddState}
                onEdit={handleEditState}
                onHistory={handleViewHistory}
            />

            <QuickActionsGrid
                actions={quickActions}
                onAddAction={() => setIsQuickActionModalOpen(true)}
                onActionClick={handleQuickActionClick}
                onDeleteAction={handleUnpinAction}
            />

            <AddQuickActionModal
                isOpen={isQuickActionModalOpen}
                onClose={() => setIsQuickActionModalOpen(false)}
            />

            <StateSettingsModal
                isOpen={isStateModalOpen}
                onClose={() => setIsStateModalOpen(false)}
                stateId={selectedStateId}
            />
        </div>
    );
}

export default Dashboard;
