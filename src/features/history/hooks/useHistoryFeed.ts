import { useState, useEffect, useCallback, useRef } from 'react';
import {
    collection,
    query,
    orderBy,
    limit,
    startAfter,
    where,
    getDocs,
    doc,
    deleteDoc,
    QueryDocumentSnapshot,
    type DocumentData
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthProvider';
import { usePersonalityStore } from '../../../stores/personalityStore';
import type { HistoryRecord } from '../../../types/history';

const PAGE_SIZE = 50;

export interface HistoryFilters {
    protocolIds?: string[];
    innerfaceIds?: string[];
    type?: 'All types' | 'Actions' | 'Manual' | 'System';
    timeRange?: { start: Date; end: Date } | null; // Derived from timeFilter
}

export function useHistoryFeed(filters: HistoryFilters = {}) {
    const { user } = useAuth();
    const { activePersonalityId } = usePersonalityStore();

    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

    // Re-fetch when core params or FILTERS change
    useEffect(() => {
        if (!user || !activePersonalityId) return;

        setIsLoading(true);
        setHasMore(true);
        lastDocRef.current = null; // Reset cursor

        const fetchFirstPage = async () => {
            try {
                const historyRef = collection(db, 'users', user.uid, 'personalities', activePersonalityId, 'history');
                let q = query(historyRef, orderBy('timestamp', 'desc'), limit(PAGE_SIZE));

                // Apply Server-Side Filters (where possible)
                // Note: Firestore requires Composite Indexes for combinations of Eq + Range/Sort.
                // We prioritize 'timestamp' sort.

                const constraints: any[] = [];

                // 1. Protocol Filter (Use 'in' operator, max 10)
                if (filters.protocolIds && filters.protocolIds.length > 0 && filters.protocolIds.length <= 10) {
                    // Note: Requires index for 'protocolId' + 'timestamp' DESC
                    constraints.push(where('protocolId', 'in', filters.protocolIds));
                }

                // 2. Type Filter
                if (filters.type && filters.type !== 'All types') {
                    // Map UI types to DB types
                    let dbType = '';
                    if (filters.type === 'Actions') dbType = 'protocol';
                    if (filters.type === 'Manual') dbType = 'quick_action';
                    if (filters.type === 'System') dbType = 'system';
                    if (dbType) constraints.push(where('type', '==', dbType));
                }

                // 3. Time Filter
                if (filters.timeRange) {
                    constraints.push(where('timestamp', '>=', filters.timeRange.start.toISOString()));
                    constraints.push(where('timestamp', '<=', filters.timeRange.end.toISOString()));
                }

                if (constraints.length > 0) {
                    q = query(historyRef, ...constraints, orderBy('timestamp', 'desc'), limit(PAGE_SIZE));
                }

                const snapshot = await getDocs(q);
                const events: HistoryRecord[] = [];
                snapshot.forEach((doc) => {
                    events.push({ id: doc.id, ...doc.data() } as HistoryRecord);
                });

                setHistory(events);
                if (snapshot.docs.length > 0) {
                    lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
                }
                if (snapshot.docs.length < PAGE_SIZE) {
                    setHasMore(false);
                }

            } catch (err: any) {
                console.error("History feed error:", err);
                // If error is 'failed-precondition', it usually means missing index.
                // We should notify developer, but for user we might fallback or show error.
                if (err.code === 'failed-precondition') {
                    console.warn("Missing Index for query!", err.message);
                }
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFirstPage();

    }, [user, activePersonalityId, JSON.stringify(filters)]); // Deep compare params simple

    const loadMore = useCallback(async () => {
        if (!user || !activePersonalityId || isLoadingMore || !hasMore || !lastDocRef.current) return;

        setIsLoadingMore(true);
        try {
            const historyRef = collection(db, 'users', user.uid, 'personalities', activePersonalityId, 'history');

            // Re-construct same query constraints
            const constraints: any[] = [];
            if (filters.protocolIds && filters.protocolIds.length > 0 && filters.protocolIds.length <= 10) {
                constraints.push(where('protocolId', 'in', filters.protocolIds));
            }
            if (filters.type && filters.type !== 'All types') {
                let dbType = '';
                if (filters.type === 'Actions') dbType = 'protocol';
                if (filters.type === 'Manual') dbType = 'quick_action';
                if (filters.type === 'System') dbType = 'system';
                if (dbType) constraints.push(where('type', '==', dbType));
            }
            if (filters.timeRange) {
                constraints.push(where('timestamp', '>=', filters.timeRange.start.toISOString()));
                constraints.push(where('timestamp', '<=', filters.timeRange.end.toISOString()));
            }

            const q = query(
                historyRef,
                ...constraints,
                orderBy('timestamp', 'desc'),
                startAfter(lastDocRef.current),
                limit(PAGE_SIZE)
            );

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setHasMore(false);
            } else {
                const newEvents: HistoryRecord[] = [];
                snapshot.forEach((doc) => {
                    newEvents.push({ id: doc.id, ...doc.data() } as HistoryRecord);
                });

                setHistory(prev => [...prev, ...newEvents]);
                lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];

                if (snapshot.docs.length < PAGE_SIZE) {
                    setHasMore(false);
                }
            }
        } catch (err: any) {
            console.error("Load more error:", err);
            setError(err.message);
        } finally {
            setIsLoadingMore(false);
        }
    }, [user, activePersonalityId, isLoadingMore, hasMore, JSON.stringify(filters)]);

    const deleteEvent = useCallback(async (id: string) => {
        if (!user || !activePersonalityId) return;
        try {
            const docRef = doc(db, 'users', user.uid, 'personalities', activePersonalityId, 'history', id);
            await deleteDoc(docRef);
            setHistory(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error("Delete error:", err);
        }
    }, [user, activePersonalityId]);

    return {
        history,
        isLoading,
        isLoadingMore,
        hasMore,
        loadMore,
        deleteEvent,
        error
    };
}
