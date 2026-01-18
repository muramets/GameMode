import React from 'react';

interface InteractionContextType {
    justDroppedId: string | null;
    isDragging: boolean;
    clearJustDropped: () => void;
}

export const InteractionContext = React.createContext<InteractionContextType>({
    justDroppedId: null,
    isDragging: false,
    clearJustDropped: () => { }
});

export const useInteraction = () => React.useContext(InteractionContext);
