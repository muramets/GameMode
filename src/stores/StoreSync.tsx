import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { useHistoryStore } from './historyStore';
import { useMetadataStore } from './metadataStore';
import { usePersonalityStore } from './personalityStore';

export function StoreSync() {
    const { user } = useAuth();
    const subscribeToHistory = useHistoryStore(state => state.subscribeToHistory);
    const { subscribeToMetadata, setContext } = useMetadataStore();

    const {
        ensureDefaultPersonality,
        activeContext
    } = usePersonalityStore();

    // 1. Initialize Personalities
    useEffect(() => {
        if (user) {
            ensureDefaultPersonality(user.uid);
        }
    }, [user, ensureDefaultPersonality]);

    // 2. Sync Data when Context is Active
    useEffect(() => {
        if (user && activeContext) {
            console.log(`[StoreSync] Syncing data for context:`, activeContext);

            // History only for personalities
            let unsubHistory = () => { };
            if (activeContext.type === 'personality') {
                // Ensure UID is present (fallback for migration)
                const uid = activeContext.uid || user.uid;
                unsubHistory = subscribeToHistory(uid, activeContext.pid);
            }

            // Metadata for both
            const context = activeContext.type === 'personality'
                ? { ...activeContext, uid: activeContext.uid || user.uid }
                : activeContext;

            // Set context in store for actions to use
            setContext(context);

            const unsubMetadata = subscribeToMetadata(context);

            return () => {
                console.log('[StoreSync] Unsubscribing...');
                unsubHistory();
                unsubMetadata();
            };
        }
    }, [user, activeContext, subscribeToHistory, subscribeToMetadata]);

    return null;
}
