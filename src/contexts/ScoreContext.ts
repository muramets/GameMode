import { createContext, useContext } from 'react';
import type { useScores } from '../features/protocols/hooks/useScores';

export interface ScoreContextType extends ReturnType<typeof useScores> {
    initialized: boolean;
    progress: number;
    resetInitialized: () => void;
}

export const ScoreContext = createContext<ScoreContextType | null>(null);

export function useScoreContext() {
    const context = useContext(ScoreContext);
    if (!context) {
        throw new Error('useScoreContext must be used within a ScoreProvider');
    }
    return context;
}
