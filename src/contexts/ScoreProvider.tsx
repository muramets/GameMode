import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useScores } from '../pages/protocols/hooks/useScores';
import { useTeamStore } from '../stores/teamStore';
import { usePersonalityStore } from '../stores/personalityStore';

interface ScoreContextType extends ReturnType<typeof useScores> {
    initialized: boolean;
    progress: number;
    resetInitialized: () => void;
}

const ScoreContext = createContext<ScoreContextType | null>(null);

export function ScoreProvider({ children }: { children: React.ReactNode }) {
    const scoreData = useScores();
    const teamsLoading = useTeamStore(state => state.isLoading);
    const roles = useTeamStore(state => state.roles);
    const personalitiesLoading = usePersonalityStore(state => state.isLoading);
    const activeContext = usePersonalityStore(state => state.activeContext);
    const [initialized, setInitialized] = useState(false);

    // "MonkeyType Style" Smooth Loader
    // The user wants a smooth visual fill that never jumps 15->100.
    // We will decouple "Real Data" from "Visual Progress" entirely for the filling phase.

    // 1. Visual Progress starts at 0.
    // 2. We tick it up smoothly (fake ease-out) to ~95% regardless of data.
    // 3. IF data loads EARLY, we wait for visual to catch up? No, we accelerate visual to 100.
    // 4. IF data loads LATE, we stall visual at 99%.

    const [displayProgress, setDisplayProgress] = useState(0);

    // If context is ROLE, we also need to wait for that team's roles to be loaded
    const isRoleMetadataMissing = activeContext?.type === 'role' && !roles[activeContext.teamId];

    const isLoading = scoreData.isLoading || teamsLoading || personalitiesLoading || isRoleMetadataMissing;

    // Track previous loading state to detect transitions
    const wasLoadingRef = React.useRef(isLoading);

    // Reset progress only when TRANSITIONING from not-loading to loading
    React.useLayoutEffect(() => {
        const wasLoading = wasLoadingRef.current;
        wasLoadingRef.current = isLoading;

        // Only reset if we're starting a NEW loading cycle (was false, now true)
        if (isLoading && !wasLoading && initialized) {
            setDisplayProgress(0);
            // We DO NOT set initialized(false) here. 
            // Doing so causes infinite loops if background fetches toggle isLoading.
            // Once initialized, the app should handle loading states locally (skeletons/spinners).
        }
    }, [isLoading, initialized]);

    useEffect(() => {
        const interval = setInterval(() => {
            setDisplayProgress(prev => {
                // If real data is loaded, we accelerate to 100
                if (!isLoading) {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return Math.min(100, prev + 5); // Fast finish
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
    }, [isLoading]);

    // Listener for completion
    useEffect(() => {
        // If real data is loaded, we allow the progress to finish
        if (!isLoading) {
            // If we are stuck at 90+ but data is ready, force finish
            if (displayProgress >= 90 && displayProgress < 100) {
                setDisplayProgress(100);
            }
        }

        if (displayProgress >= 100 && !isLoading) {
            const timer = setTimeout(() => {
                setInitialized(true);
            }, 500); // Short settling time at 100%
            return () => clearTimeout(timer);
        }
    }, [displayProgress, isLoading]);

    // Allows external components (e.g., JoinInvitePage) to reset the initialization state
    // and start a fresh loading cycle. This is critical for invite flow to maintain
    // a single continuous progress bar animation from join start to dashboard load.
    const resetInitialized = React.useCallback(() => {
        setInitialized(false);
        setDisplayProgress(0);
    }, []);

    const contextValue = useMemo(() => ({
        ...scoreData,
        initialized,
        progress: displayProgress,
        resetInitialized
    }), [scoreData, initialized, displayProgress, resetInitialized]);

    return (
        <ScoreContext.Provider value={contextValue}>
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
