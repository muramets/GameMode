import { useState, useCallback } from 'react';

export function useCollapsedGroups(storageKey: string, defaultCollapsed = false) {
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (error) {
            console.warn(`Error reading localStorage key "${storageKey}":`, error);
            return new Set();
        }
    });

    const isGroupCollapsed = useCallback((groupName: string) => {
        if (defaultCollapsed) {
            return !collapsedGroups.has(groupName); // If default is collapsed, set contains EXPANDED groups
        }
        return collapsedGroups.has(groupName); // If default is expanded, set contains COLLAPSED groups
    }, [collapsedGroups, defaultCollapsed]);

    const toggleGroup = useCallback((groupName: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupName)) {
                next.delete(groupName);
            } else {
                next.add(groupName);
            }

            try {
                localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
            } catch (error) {
                console.warn(`Error writing localStorage key "${storageKey}":`, error);
            }

            return next;
        });
    }, [storageKey]);

    return { isGroupCollapsed, toggleGroup };
}
