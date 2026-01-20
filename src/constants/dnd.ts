import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export const DND_SENSORS_CONFIG = {
    pointer: {
        activationConstraint: {
            distance: 2 // Requires 2px movement to start drag (prevents accidental drags on clicks)
        }
    },
    keyboard: {
        coordinateGetter: sortableKeyboardCoordinates
    }
} as const;
