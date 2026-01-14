import React, { createContext, useContext } from 'react';
import { useScores } from '../pages/protocols/hooks/useScores';

const ScoreContext = createContext<ReturnType<typeof useScores> | null>(null);

export function ScoreProvider({ children }: { children: React.ReactNode }) {
    const scoreData = useScores();
    return (
        <ScoreContext.Provider value={scoreData}>
            {children}
        </ScoreContext.Provider>
    );
}

export function useScoreContext() {
    const context = useContext(ScoreContext);
    if (!context) {
        throw new Error('useScoreContext must be used within a ScoreProvider');
    }
    return context;
}
