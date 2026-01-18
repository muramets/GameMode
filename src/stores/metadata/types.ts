import type { Innerface } from '../../features/innerfaces/types';
import type { Protocol } from '../../features/protocols/types';
import type { StateData } from '../../features/dashboard/types';

export interface MetadataState {
    // --- State ---
    innerfaces: Innerface[];
    protocols: Protocol[];
    states: StateData[];
    pinnedProtocolIds: string[];
    groupsMetadata: Record<string, { icon: string; color?: string }>;
    groupOrder: string[]; // List of protocol group names
    innerfaceGroupOrder: string[]; // List of innerface group names
    categoryOrder: string[]; // List of category names ('skill', 'foundation', 'uncategorized')
    isLoading: boolean;
    loadedCount: number;
    error: string | null;

    // Context State
    context: PathContext | null;
    setContext: (context: PathContext | null) => void;

    // --- Actions (Copied from original store) ---
    // Innerfaces
    addInnerface: (innerface: Omit<Innerface, 'id'>) => Promise<void>;
    updateInnerface: (id: number | string, data: Partial<Innerface>) => Promise<void>;
    deleteInnerface: (id: number | string) => Promise<void>;

    // Protocols
    addProtocol: (protocol: Omit<Protocol, 'id'>) => Promise<void>;
    updateProtocol: (id: number | string, data: Partial<Protocol>) => Promise<void>;
    deleteProtocol: (id: number | string) => Promise<void>;

    // States
    addState: (state: Omit<StateData, 'id'>) => Promise<void>;
    updateState: (id: string, data: Partial<StateData>) => Promise<void>;
    deleteState: (id: string) => Promise<void>;

    // Group Actions
    updateGroupMetadata: (groupName: string, metadata: { icon?: string; color?: string }) => Promise<void>;
    renameGroup: (oldName: string, newName: string) => Promise<void>;

    // Quick Actions
    togglePinnedProtocol: (protocolId: string) => Promise<void>;
    reorderQuickActions: (orderedIds: string[]) => Promise<void>;

    // Protocol Ordering
    reorderProtocols: (orderedIds: string[]) => Promise<void>;
    reorderGroups: (orderedGroups: string[]) => Promise<void>;

    // State Ordering
    reorderStates: (orderedIds: string[]) => Promise<void>;

    // Innerface Ordering
    reorderInnerfaces: (orderedIds: string[]) => Promise<void>;
    moveInnerface: (id: string, newGroup: string, orderedIds: string[]) => Promise<void>;
    reorderInnerfaceGroups: (orderedGroups: string[]) => Promise<void>;
    reorderCategories: (orderedCategories: string[]) => Promise<void>;

    // --- Subscriptions ---
    subscribeToMetadata: (context: PathContext) => () => void;
}

export type PathContext =
    | { type: 'personality'; uid: string; pid: string }
    | { type: 'role'; teamId: string; roleId: string }
    | { type: 'viewer'; targetUid: string; personalityId: string };

export type StateCreator<T> = (
    set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
    get: () => T
) => T;
