import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { useHistoryStore } from './historyStore';
import { useMetadataStore } from './metadataStore';
import { usePersonalityStore } from './personalityStore';

export function StoreSync() {
    const { user } = useAuth();
    const subscribeToHistory = useHistoryStore(state => state.subscribeToHistory);

    // Use selectors for stable references and to avoid re-renders on unrelated state changes
    const subscribeToMetadata = useMetadataStore(state => state.subscribeToMetadata);
    const setContext = useMetadataStore(state => state.setContext);

    const ensureDefaultPersonality = usePersonalityStore(state => state.ensureDefaultPersonality);
    const activeContext = usePersonalityStore(state => state.activeContext);

    // 1. Initialize Personalities
    useEffect(() => {
        if (user) {
            ensureDefaultPersonality(user.uid);
        }
    }, [user, ensureDefaultPersonality]);

    // 2. Sync Data when Context is Active
    // We use JSON.stringify(activeContext) to prevent cycles if the object reference changes but content is same
    const contextHash = activeContext ? JSON.stringify(activeContext) : null;

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
    }, [user, contextHash, subscribeToHistory, subscribeToMetadata, setContext]); // Removed activeContext, added contextHash

    return null;
}
