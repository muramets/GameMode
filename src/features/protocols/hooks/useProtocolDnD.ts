import { useState, useCallback } from 'react';
import {
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
} from '@dnd-kit/sortable';
import type { Protocol } from '../types';
import { DND_SENSORS_CONFIG } from '../../../constants/dnd';

interface UseProtocolDnDProps {
    groupedProtocols: [string, Protocol[]][];
    onReorderGroups: (newOrder: string[]) => void;
    onReorderProtocols: (newOrder: string[]) => void;
}

export const useProtocolDnD = ({
    groupedProtocols,
    onReorderGroups,
    onReorderProtocols,
}: UseProtocolDnDProps) => {
    // ATOMIC DND ARCHITECTURE
    const [active, setActive] = useState<{
        id: string | null;
        protocol: Protocol | null;
        group: string | null;
    }>({ id: null, protocol: null, group: null });

    const [justDroppedId, setJustDroppedId] = useState<string | null>(null);



    const sensors = useSensors(
        useSensor(PointerSensor, DND_SENSORS_CONFIG.pointer),
        useSensor(KeyboardSensor, DND_SENSORS_CONFIG.keyboard)
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const id = String(event.active.id);
        setJustDroppedId(null);

        let protocol: Protocol | null = null;
        let group: string | null = null;

        if (id.startsWith('group-')) {
            group = id.replace('group-', '');
        } else {
            for (const [, ps] of groupedProtocols) {
                const found = ps.find((x: Protocol) => String(x.id) === id);
                if (found) { protocol = found; break; }
            }
        }

        setActive({ id, protocol, group });
    }, [groupedProtocols]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active: dndActive, over } = event;
        const activeIdStr = String(dndActive.id);
        const overIdStr = over ? String(over.id) : null;

        setActive({ id: null, protocol: null, group: null });
        setJustDroppedId(activeIdStr);

        if (!over || activeIdStr === overIdStr) return;

        if (activeIdStr.startsWith('group-') && overIdStr?.startsWith('group-')) {
            const activeGrp = activeIdStr.replace('group-', '');
            const overGrp = overIdStr.replace('group-', '');
            const currentNames = groupedProtocols.map(([name]) => name);
            const oldIdx = currentNames.indexOf(activeGrp);
            const newIdx = currentNames.indexOf(overGrp);
            if (oldIdx !== -1 && newIdx !== -1) {
                onReorderGroups(arrayMove(currentNames, oldIdx, newIdx));
            }
        } else if (!activeIdStr.startsWith('group-') && overIdStr && !overIdStr.startsWith('group-')) {
            const sourceEntry = groupedProtocols.find(([, ps]) => ps.some((p: Protocol) => p.id.toString() === activeIdStr));
            if (!sourceEntry) return;
            const [, groupItems] = sourceEntry;
            if (groupItems.some((p: Protocol) => p.id.toString() === overIdStr)) {
                const oldIdx = groupItems.findIndex((p: Protocol) => p.id.toString() === activeIdStr);
                const newIdx = groupItems.findIndex((p: Protocol) => p.id.toString() === overIdStr);
                onReorderProtocols(arrayMove(groupItems, oldIdx, newIdx).map((p: Protocol) => p.id.toString()));
            }
        }
    }, [groupedProtocols, onReorderGroups, onReorderProtocols]);

    const clearJustDropped = useCallback(() => setJustDroppedId(null), []);

    return {
        sensors,
        active,
        justDroppedId,
        clearJustDropped,
        handleDragStart,
        handleDragEnd
    };
};
