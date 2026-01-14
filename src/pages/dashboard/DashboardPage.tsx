import { useAuth } from '../../contexts/AuthProvider';
import { UserProfile } from './components/UserProfile';
import { StatesGrid } from './components/StatesGrid';
import { QuickActionsGrid } from './components/QuickActionsGrid';

import { MOCK_LEVEL_INFO, MOCK_USER_STATS, MOCK_QUICK_ACTIONS } from './components/mockData';

import { useScoreContext } from '../../contexts/ScoreProvider';

export function Dashboard() {
    const { user } = useAuth();
    const { states } = useScoreContext();
    const displayName = user?.displayName || user?.email?.split('@')[0] || "Player";

    return (
        <div className="flex flex-col gap-12 w-full pb-12">
            {/* Welcome / Dashboard - mirroring legacy structure */}
            <UserProfile
                username={displayName}
                levelInfo={MOCK_LEVEL_INFO}
                stats={MOCK_USER_STATS}
            />

            <StatesGrid
                states={states}
                onAddState={() => console.log('Open add state modal')}
            />

            <QuickActionsGrid
                actions={MOCK_QUICK_ACTIONS}
                onAddAction={() => console.log('Add quick action')}
                onActionClick={(id) => console.log('Clicked action', id)}
                onDeleteAction={(id) => console.log('Delete action', id)}
            />

        </div>
    );
}

// Default export for route lazy loading if needed, or just standard export
export default Dashboard;
