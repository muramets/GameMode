import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import { useHistoryStore } from './historyStore';
import { useMetadataStore } from './metadataStore';
import { usePersonalityStore } from './personalityStore';
import { useTeamStore } from './teamStore';
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
    const subscribeToRoles = useTeamStore(state => state.subscribeToRoles);

    const ensureDefaultPersonality = usePersonalityStore(state => state.ensureDefaultPersonality);
    const loadPersonalities = usePersonalityStore(state => state.loadPersonalities);
    const activeContext = usePersonalityStore(state => state.activeContext);

    const isInviteRoute = location.pathname.startsWith('/invite/');

    // 1. Initialize Personalities & Teams
    useEffect(() => {
        if (user) {
            // On invite routes, DON'T create default personality - JoinInvitePage will create the role personality
            // But DO load personalities to complete loading state
            if (!isInviteRoute) {
                ensureDefaultPersonality(user.uid);
            } else {
                // Just load personalities list without creating defaults
                loadPersonalities(user.uid);
            }

            // Always start listening to teams (needed for loading to complete)
            const unsubTeams = subscribeToTeams(user.uid);
            return () => unsubTeams();
        }
    }, [user, ensureDefaultPersonality, loadPersonalities, subscribeToTeams, isInviteRoute]);

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

            console.log('[StoreSync] Subscribing to metadata with context:', contextHash);
            const unsubMetadata = subscribeToMetadata(context);

            return () => {
                console.log('[StoreSync] Cleanup for context:', contextHash);
                unsubHistory();
                unsubMetadata();
            };
        } else {
            console.log('[StoreSync] Skipping sync - missing user or activeContext', { hasUser: !!user, hasActiveContext: !!activeContext });
        }
    }, [user, contextHash, subscribeToHistory, subscribeToMetadata, setContext, clearHistory]); // Removed activeContext, added contextHash

    return null;
}
