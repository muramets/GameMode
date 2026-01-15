import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { useHistoryStore } from './historyStore';
import { useMetadataStore } from './metadataStore';
import { usePersonalityStore } from './personalityStore';

export function StoreSync() {
    const { user } = useAuth();
    const subscribeToHistory = useHistoryStore(state => state.subscribeToHistory);
    const subscribeToMetadata = useMetadataStore(state => state.subscribeToMetadata);

    const {
        ensureDefaultPersonality,
        activePersonalityId
    } = usePersonalityStore();

    // 1. Initialize Personalities (and migrate if needed)
    useEffect(() => {
        if (user) {
            ensureDefaultPersonality(user.uid);
        }
    }, [user, ensureDefaultPersonality]);

    // 2. Sync Data when Personality is Active
    useEffect(() => {
        if (user && activePersonalityId) {
            console.log(`[StoreSync] Syncing data for user: ${user.uid}, personality: ${activePersonalityId}`);

            const unsubHistory = subscribeToHistory(user.uid, activePersonalityId);
            const unsubMetadata = subscribeToMetadata(user.uid, activePersonalityId);

            return () => {
                console.log('[StoreSync] Unsubscribing from current personality...');
                unsubHistory();
                unsubMetadata();
            };
        }
    }, [user, activePersonalityId, subscribeToHistory, subscribeToMetadata]);

    return null;
}
