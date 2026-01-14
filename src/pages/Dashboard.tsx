import { useAuth } from '../contexts/AuthProvider';
import { UserProfile } from '../features/dashboard/UserProfile';
import { StatesGrid } from '../features/dashboard/StatesGrid';
import { QuickActionsGrid } from '../features/dashboard/QuickActionsGrid';
import type { QuickAction } from '../features/dashboard/types';

// Mock data for initial implementation
const MOCK_LEVEL_INFO = {
    level: 5,
    currentXP: 350,
    maxXP: 1000,
    percentage: 35,
    note: "padawan"
};

const MOCK_STATS = {
    checkinsToday: 3,
    xpToday: 150,
    checkinsMonth: 24,
    xpMonth: 1200
};

const MOCK_STATES = [
    {
        id: '1',
        name: 'Mental Clarity',
        emoji: '🧠',
        subtext: 'Cognitive Resource',
        score: 7.2,
        yesterdayScore: 6.8,
        color: '#98c379',
        dependencies: { innerfaces: 2, states: 1 }
    },
    {
        id: '2',
        name: 'Social Battery',
        emoji: '🔋',
        subtext: 'Interaction Energy',
        score: 4.5,
        yesterdayScore: 5.0,
        color: '#e6934a',
        dependencies: { innerfaces: 3, states: 0 }
    },
    {
        id: '3',
        name: 'Physical Energy',
        emoji: '⚡',
        subtext: 'Body Vitality',
        score: 8.1,
        yesterdayScore: 7.9,
        color: '#98c379',
        dependencies: { innerfaces: 1, states: 2 }
    },
    {
        id: '4',
        name: 'Focus',
        emoji: '🎯',
        subtext: 'Attention Span',
        score: 2.4,
        yesterdayScore: 2.0,
        color: '#ca4754',
        dependencies: { innerfaces: 0, states: 0 }
    },
];

const MOCK_QUICK_ACTIONS: QuickAction[] = [
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

export function Dashboard() {
    const { user } = useAuth();
    const displayName = user?.displayName || user?.email?.split('@')[0] || "Player";

    return (
        <div className="flex flex-col gap-8 w-full">
            {/* Welcome / Dashboard - mirroring legacy structure */}

            <UserProfile
                username={displayName}
                levelInfo={MOCK_LEVEL_INFO}
                stats={MOCK_STATS}
            />

            <StatesGrid
                states={MOCK_STATES}
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
