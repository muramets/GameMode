import { useAuth } from '../../contexts/AuthProvider';
import { UserProfile } from './components/UserProfile';
import { StatesGrid } from './components/StatesGrid';
import { QuickActionsGrid } from './components/QuickActionsGrid';
import { StateSettingsModal } from './components/StateSettingsModal';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { QuickAction } from './components/types';

const DEFAULT_LEVEL_INFO = {
    level: 5,
    currentXP: 350,
    maxXP: 1000,
    percentage: 35,
    note: "padawan"
};

const DEFAULT_USER_STATS = {
    checkinsToday: 3,
    xpToday: 150,
    checkinsMonth: 24,
    xpMonth: 1200
};

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
    {
        id: 'qa1',
        title: 'Morning Read',
        icon: 'book',
        details: 'Education',
        xp: 10,
        color: 'positive',
        hover: 'Read 10 pages of a non-fiction book'
    },
    {
        id: 'qa2',
        title: 'Power Nap',
        icon: 'moon',
        details: 'Restore Energy',
        xp: 5,
        color: 'neutral'
    },
    {
        id: 'qa3',
        title: 'Deep Work',
        icon: 'bolt',
        details: 'Focus Mode',
        xp: 20,
        color: 'neutral'
    }
];

import { useScoreContext } from '../../contexts/ScoreProvider';

export function Dashboard() {
    const { user } = useAuth();
    const { states, isLoading } = useScoreContext();
    const displayName = user?.displayName || user?.email?.split('@')[0] || "Player";
    const navigate = useNavigate();

    const [isStateModalOpen, setIsStateModalOpen] = useState(false);
    const [selectedStateId, setSelectedStateId] = useState<string | null>(null);



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
            {/* Welcome / Dashboard - mirroring legacy structure */}
            <UserProfile
                username={displayName}
                levelInfo={DEFAULT_LEVEL_INFO}
                stats={DEFAULT_USER_STATS}
            />

            <StatesGrid
                states={states}
                onAddState={handleAddState}
                onEdit={handleEditState}
                onHistory={handleViewHistory}
            />

            <QuickActionsGrid
                actions={DEFAULT_QUICK_ACTIONS}
                onAddAction={() => console.log('Add quick action')}
                onActionClick={(id) => console.log('Clicked action', id)}
                onDeleteAction={(id) => console.log('Delete action', id)}
            />


            <StateSettingsModal
                isOpen={isStateModalOpen}
                onClose={() => setIsStateModalOpen(false)}
                stateId={selectedStateId}
            />
        </div>
    );
}

// Default export for route lazy loading if needed, or just standard export
export default Dashboard;
