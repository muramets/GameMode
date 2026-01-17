import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import { useHistoryStore } from './historyStore';
import { useMetadataStore } from './metadataStore';
import { usePersonalityStore } from './personalityStore';
import { useTeamStore } from './teamStore';

export function StoreSync() {
    const { user } = useAuth();
    const location = useLocation();
    const subscribeToHistory = useHistoryStore(state => state.subscribeToHistory);

    // Use selectors for stable references
    const subscribeToMetadata = useMetadataStore(state => state.subscribeToMetadata);
    const setContext = useMetadataStore(state => state.setContext);
    const subscribeToTeams = useTeamStore(state => state.subscribeToTeams);

    const ensureDefaultPersonality = usePersonalityStore(state => state.ensureDefaultPersonality);
    const activeContext = usePersonalityStore(state => state.activeContext);

    // 1. Initialize Personalities & Teams
    useEffect(() => {
        if (user && !location.pathname.startsWith('/invite/')) {
            ensureDefaultPersonality(user.uid);

            // Start listening to teams immediately
            const unsubTeams = subscribeToTeams(user.uid);
            return () => unsubTeams();
        }
    }, [user, ensureDefaultPersonality, subscribeToTeams, location.pathname]);

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
            } else if (activeContext.type === 'viewer') {
                // In viewer mode, subscribe to target user's history
                unsubHistory = subscribeToHistory(activeContext.targetUid, activeContext.personalityId);
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
    }, [user, contextHash, subscribeToHistory, subscribeToMetadata, setContext]); // Removed activeContext, added contextHash

    return null;
}
