import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { useHistoryStore } from './historyStore';

export function StoreSync() {
    const { user } = useAuth();
    const subscribeToHistory = useHistoryStore(state => state.subscribeToHistory);

    useEffect(() => {
        if (user) {
            console.log('Subscribing to history for user:', user.uid);
            const unsubscribe = subscribeToHistory(user.uid);
            return () => unsubscribe();
        }
    }, [user, subscribeToHistory]);

    return null;
}
