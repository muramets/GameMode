import React, { createContext, useContext, useState, useEffect } from 'react';
import { useScores } from '../pages/protocols/hooks/useScores';

interface ScoreContextType extends ReturnType<typeof useScores> {
    initialized: boolean;
    progress: number;
}

const ScoreContext = createContext<ScoreContextType | null>(null);

export function ScoreProvider({ children }: { children: React.ReactNode }) {
    const scoreData = useScores();
    const [initialized, setInitialized] = useState(false);

    // "MonkeyType Style" Smooth Loader
    // The user wants a smooth visual fill that never jumps 15->100.
    // We will decouple "Real Data" from "Visual Progress" entirely for the filling phase.

    // 1. Visual Progress starts at 0.
    // 2. We tick it up smoothly (fake ease-out) to ~95% regardless of data.
    // 3. IF data loads EARLY, we wait for visual to catch up? No, we accelerate visual to 100.
    // 4. IF data loads LATE, we stall visual at 99%.

    const [displayProgress, setDisplayProgress] = useState(0);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        // Start filling smoothly
        interval = setInterval(() => {
            setDisplayProgress(prev => {

                // If real data is loaded, we accelerate to 100
                if (!scoreData.isLoading) {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 5; // Fast finish
                }

                // If still loading, we asymptote to 90%
                if (prev < 90) {
                    // Slow down as we approach 90
                    // (90 - prev) * 0.05 gives exponential decay feel
                    const diff = 90 - prev;
                    const step = Math.max(0.5, diff * 0.1);
                    return prev + step;
                }

                return prev;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [scoreData.isLoading]);

    // Listener for completion
    useEffect(() => {
        if (displayProgress >= 100 && !scoreData.isLoading) {
            const timer = setTimeout(() => {
                setInitialized(true);
            }, 500); // Short settling time at 100%
            return () => clearTimeout(timer);
        }
    }, [displayProgress, scoreData.isLoading]);

    return (
        <ScoreContext.Provider value={{ ...scoreData, initialized, progress: displayProgress }}>
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
