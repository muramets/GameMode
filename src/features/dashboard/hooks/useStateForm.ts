import { useState, useEffect } from 'react';
import { DEFAULT_STATE_COLOR } from '../../../constants/common';
import { useAuth } from '../../../contexts/AuthContext';
import { useMetadataStore } from '../../../stores/metadataStore';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { useUIStore } from '../../../stores/uiStore';

interface UseStateFormProps {
    stateId?: string | null;
    onClose: () => void;
    isOpen: boolean;
}

export function useStateForm({ stateId, onClose, isOpen }: UseStateFormProps) {
    const { user } = useAuth();
    const { states, innerfaces, protocols, addState, updateState, deleteState, restoreState } = useMetadataStore();
    const { activePersonalityId } = usePersonalityStore();
    const { showToast } = useUIStore();

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [hover, setHover] = useState('');
    const [icon, setIcon] = useState('scale-balanced');
    const [color, setColor] = useState(DEFAULT_STATE_COLOR);
    const [innerfaceIds, setInnerfaceIds] = useState<(string | number)[]>([]);

    // UI State
    // const [isSubmitting, setIsSubmitting] = useState(false); // Removed for Optimistic Close pattern (modal closes instantly)
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    // Load/Reset Effect
    useEffect(() => {
        if (isOpen && stateId) {
            const state = states.find(s => s.id === stateId);
            if (state) {
                setName(state.name);
                setDescription(state.description || '');
                setHover(state.hover || '');
                setIcon(state.icon || 'scale-balanced');
                setColor(state.color || DEFAULT_STATE_COLOR);
                setInnerfaceIds(state.innerfaceIds || []);
            }
        } else if (isOpen) {
            // Reset for new
            setName('');
            setDescription('');
            setHover('');
            setIcon('scale-balanced');
            setColor(DEFAULT_STATE_COLOR);
            setInnerfaceIds([]);

        }
        setIsConfirmingDelete(false);
    }, [isOpen, stateId, states]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user || !activePersonalityId || !name.trim()) return;

        // ✨ Instant close
        onClose();

        try {
            const data = {
                name,
                description,
                hover,
                icon,
                color,
                innerfaceIds
            };

            if (stateId) {
                await updateState(stateId, data);
            } else {
                await addState(data);
            }
        } catch (error) {
            console.error('Failed to save state:', error);
            showToast('Failed to save dimension', 'error');
        } finally {
            // setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!stateId) return;

        if (!isConfirmingDelete) {
            setIsConfirmingDelete(true);
            setTimeout(() => setIsConfirmingDelete(false), 3000);
            return;
        }

        // Save state copy for undo
        const stateCopy = states.find(s => s.id === stateId);
        if (!stateCopy) return;

        // ✨ Instant close
        onClose();

        // Delete state
        try {
            await deleteState(stateId);

            // Show undo toast
            showToast(
                'Dimension deleted',
                'success',
                'Undo',
                async () => {
                    await restoreState(stateCopy);
                }
            );
        } catch (error) {
            console.error('Failed to delete state:', error);
        }
    };

    const toggleInnerface = (id: string | number) => {
        const idStr = id.toString();
        setInnerfaceIds(prev => {
            const exists = prev.some(prevId => prevId.toString() === idStr);
            if (exists) {
                return prev.filter(prevId => prevId.toString() !== idStr);
            }
            return [...prev, id];
        });
    };



    return {
        formState: {
            name, setName,
            description, setDescription,
            hover, setHover,
            icon, setIcon,
            color, setColor,
            innerfaceIds
        },
        uiState: {
            // isSubmitting: false, // Pattern: Optimistic Close (handled in handleSubmit)
            isConfirmingDelete
        },
        data: {
            innerfaces,
            protocols
        },
        handlers: {
            handleSubmit,
            handleDelete,
            toggleInnerface
        }
    };
}
