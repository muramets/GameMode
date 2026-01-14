import type { LevelInfo, UserStats, StateData, QuickAction } from './types';

export const MOCK_LEVEL_INFO: LevelInfo = {
    level: 5,
    currentXP: 350,
    maxXP: 1000,
    percentage: 35,
    note: "padawan"
};

export const MOCK_USER_STATS: UserStats = {
    checkinsToday: 3,
    xpToday: 150,
    checkinsMonth: 24,
    xpMonth: 1200
};

export const MOCK_STATES: StateData[] = [
    {
        id: 'mental_clarity',
        name: 'Mental clarity',
        icon: 'brain',
        subtext: 'Cognitive Resource',
        color: '#ca4754', // focus color
        innerfaceIds: [1, 2, 3],
        stateIds: []
    },
    {
        id: 'physical_shape',
        name: 'Physical Shape',
        icon: 'body-sync',
        subtext: 'Built presence',
        color: '#98c379', // body sync color
        innerfaceIds: [4],
        stateIds: []
    },
    {
        id: 'harmony',
        name: 'Harmony',
        icon: 'harmony',
        subtext: 'You\'re in the right place',
        color: '#e2b714', // engagement color
        innerfaceIds: [5, 2, 1],
        stateIds: []
    }
];

export const MOCK_QUICK_ACTIONS: QuickAction[] = [
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
