import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { useHistoryStore } from './historyStore';
import { useMetadataStore } from './metadataStore';

export function StoreSync() {
    const { user } = useAuth();
    const subscribeToHistory = useHistoryStore(state => state.subscribeToHistory);
    const subscribeToMetadata = useMetadataStore(state => state.subscribeToMetadata);
    useEffect(() => {
        if (user) {
            console.log('Syncing data for user:', user.uid);

            // 1. Subscribe to history
            const unsubHistory = subscribeToHistory(user.uid);

            // 2. Subscribe to metadata (Innerfaces, Protocols, States)
            const unsubMetadata = subscribeToMetadata(user.uid);

            return () => {
                unsubHistory();
                unsubMetadata();
            };
        }
    }, [user, subscribeToHistory, subscribeToMetadata]);

    return null;
}
