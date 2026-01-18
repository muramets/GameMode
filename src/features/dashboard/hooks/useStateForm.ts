import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useMetadataStore } from '../../../stores/metadataStore';
import { usePersonalityStore } from '../../../stores/personalityStore';

interface UseStateFormProps {
    stateId?: string | null;
    onClose: () => void;
    isOpen: boolean;
}

export function useStateForm({ stateId, onClose, isOpen }: UseStateFormProps) {
    const { user } = useAuth();
    const { states, innerfaces, protocols, addState, updateState, deleteState } = useMetadataStore();
    const { activePersonalityId } = usePersonalityStore();

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('🔥');
    const [color, setColor] = useState('#ca4754');
    const [innerfaceIds, setInnerfaceIds] = useState<(string | number)[]>([]);
    const [protocolIds, setProtocolIds] = useState<(string | number)[]>([]);

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    // Load/Reset Effect
    useEffect(() => {
        if (isOpen && stateId) {
            const state = states.find(s => s.id === stateId);
            if (state) {
                setName(state.name);
                setDescription(state.description || '');
                setIcon(state.icon || '🔥');
                setColor(state.color || '#ca4754');
                setInnerfaceIds(state.innerfaceIds || []);
                setProtocolIds(state.protocolIds || []);
            }
        } else if (isOpen) {
            // Reset for new
            setName('');
            setDescription('');
            setIcon('🔥');
            setColor('#ca4754');
            setInnerfaceIds([]);
            setProtocolIds([]);
        }
        setIsConfirmingDelete(false);
    }, [isOpen, stateId, states]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user || !activePersonalityId || !name.trim()) return;

        setIsSubmitting(true);
        try {
            const data = {
                name,
                description,
                icon,
                color,
                innerfaceIds,
                protocolIds
            };

            if (stateId) {
                await updateState(stateId, data);
            } else {
                await addState(data);
            }
            onClose();
        } catch (error) {
            console.error('Failed to save state:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!stateId) return;

        if (!isConfirmingDelete) {
            setIsConfirmingDelete(true);
            setTimeout(() => setIsConfirmingDelete(false), 3000);
            return;
        }

        setIsSubmitting(true);
        try {
            await deleteState(stateId);
            onClose();
        } catch (error) {
            console.error('Failed to delete state:', error);
        } finally {
            setIsSubmitting(false);
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

    const toggleProtocol = (id: string | number) => {
        const idStr = id.toString();
        setProtocolIds(prev => {
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
            icon, setIcon,
            color, setColor,
            innerfaceIds,
            protocolIds
        },
        uiState: {
            isSubmitting,
            isConfirmingDelete
        },
        data: {
            innerfaces,
            protocols
        },
        handlers: {
            handleSubmit,
            handleDelete,
            toggleInnerface,
            toggleProtocol
        }
    };
}
