import { create } from 'zustand';
import { MOCK_INNERFACES, MOCK_PROTOCOLS } from '../pages/protocols/mockData';
import { MOCK_STATES } from '../pages/dashboard/components/mockData';
import type { Innerface, Protocol } from '../pages/protocols/types';
import type { StateData } from '../pages/dashboard/components/types';

interface MetadataState {
    innerfaces: Innerface[];
    protocols: Protocol[];
    states: StateData[];

    // Actions
    // Future: load from Firestore overrides
}

export const useMetadataStore = create<MetadataState>(() => ({
    innerfaces: MOCK_INNERFACES,
    protocols: MOCK_PROTOCOLS,
    states: MOCK_STATES,
}));
