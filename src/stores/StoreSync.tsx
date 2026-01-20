import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useHistoryStore } from './historyStore';
import { useMetadataStore } from './metadataStore';
import { usePersonalityStore } from './personalityStore';
import { useTeamStore, useRoleStore } from './team';
import { usePlanningStore } from './planningStore';

export function StoreSync() {
    const { user } = useAuth();
    const location = useLocation();
    const subscribeToHistory = useHistoryStore(state => state.subscribeToHistory);
    const clearHistory = useHistoryStore(state => state.clearHistory);
    const subscribeToGoals = usePlanningStore(state => state.subscribeToGoals);
    const clearGoals = usePlanningStore(state => state.clearGoals);

    // Use selectors for stable references
    const subscribeToMetadata = useMetadataStore(state => state.subscribeToMetadata);
    const setContext = useMetadataStore(state => state.setContext);
    const subscribeToTeams = useTeamStore(state => state.subscribeToTeams);
    const subscribeToRoles = useRoleStore(state => state.subscribeToRoles);

    const ensureDefaultPersonality = usePersonalityStore(state => state.ensureDefaultPersonality);
    const subscribeToPersonalities = usePersonalityStore(state => state.subscribeToPersonalities);
    const personalities = usePersonalityStore(state => state.personalities);
    const activeContext = usePersonalityStore(state => state.activeContext);

    const isInviteRoute = location.pathname.startsWith('/invite/');

    // 1. Initialize Personalities & Teams
    useEffect(() => {
        if (user) {
            // Subscribe to personalities (Real-time)
            const unsubPersonalities = subscribeToPersonalities(user.uid);

            // Always start listening to teams (needed for loading to complete)
            const unsubTeams = subscribeToTeams(user.uid);

            return () => {
                unsubPersonalities();
                unsubTeams();
            };
        } else {
            // Clear personality store on logout/no-user to prevent stale data
            usePersonalityStore.getState().reset();
        }
    }, [user, subscribeToPersonalities, subscribeToTeams]);

    // 1.5 React to empty personalities (e.g. manual deletion)
    useEffect(() => {
        if (user && !isInviteRoute && personalities.length === 0) {
            // If personalities list becomes empty via sync, ensure default exists
            // We use a small timeout to avoid conflict with initial load
            const timer = setTimeout(() => {
                // Double check specific conditions to avoid endless loop if creation fails
                if (usePersonalityStore.getState().personalities.length === 0 && !usePersonalityStore.getState().isLoading) {
                    ensureDefaultPersonality(user.uid);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [user, personalities.length, isInviteRoute, ensureDefaultPersonality]);

    // 2. Sync Data when Context is Active
    // We use JSON.stringify(activeContext) to prevent cycles if the object reference changes but content is same
    const contextHash = activeContext ? JSON.stringify(activeContext) : null;

    useEffect(() => {
        if (user && activeContext) {
            // History only for personalities (and viewer mode shows target user's data)
            let unsubHistory = () => { };
            if (activeContext.type === 'personality') {
                // Ensure UID is present (fallback for migration)
                const uid = activeContext.uid || user.uid;
                unsubHistory = subscribeToHistory(uid, activeContext.pid);
                const unsubGoals = subscribeToGoals(uid, activeContext.pid);

                // Chain unsubs
                const oldUnsub = unsubHistory;
                unsubHistory = () => { oldUnsub(); unsubGoals(); };
            } else if (activeContext.type === 'viewer') {
                // In viewer mode, subscribe to target user's history
                unsubHistory = subscribeToHistory(activeContext.targetUid, activeContext.personalityId);
                // Also view their goals
                const unsubGoals = subscribeToGoals(activeContext.targetUid, activeContext.personalityId);
                const oldUnsub = unsubHistory;
                unsubHistory = () => { oldUnsub(); unsubGoals(); };
            } else {
                // Role context - NO HISTORY, NO GOALS (for now, unless roles get goals)
                // Explicitly clear history and goals to prevent leakage from previous state
                clearHistory();
                clearGoals();

                // Subscribe to Role Metadata (for name, icon, etc in UI)
                const unsubRoles = subscribeToRoles(activeContext.teamId);
                // Chain unsubs
                const oldUnsub = unsubHistory;
                unsubHistory = () => { oldUnsub(); unsubRoles(); };
            }

            // Build PathContext for metadataStore
            let context;
            if (activeContext.type === 'personality') {
                context = { ...activeContext, uid: activeContext.uid || user.uid };
            } else if (activeContext.type === 'viewer') {
                // Map viewer context to PathContext for read-only data access
                context = {
                    type: 'viewer' as const,
                    targetUid: activeContext.targetUid,
                    personalityId: activeContext.personalityId
                };
            } else {
                // Role context
                context = activeContext;
            }

            // Set context in store for actions to use
            setContext(context);

            const unsubMetadata = subscribeToMetadata(context);

            return () => {
                unsubHistory();
                unsubMetadata();
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, contextHash, subscribeToHistory, subscribeToMetadata, setContext, clearHistory, clearGoals, subscribeToGoals, subscribeToRoles]);

    return null;
}
