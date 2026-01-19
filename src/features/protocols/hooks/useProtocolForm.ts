import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useMetadataStore } from '../../../stores/metadataStore';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { useUIStore } from '../../../stores/uiStore';


interface UseProtocolFormProps {
    protocolId?: number | string | null;
    onClose: () => void;
    isOpen: boolean;
}

export function useProtocolForm({ protocolId, onClose, isOpen }: UseProtocolFormProps) {
    const { user } = useAuth();
    const {
        innerfaces,
        protocols,
        groupsMetadata,
        addProtocol,
        updateProtocol,
        deleteProtocol,
        restoreProtocol,

        updateGroupMetadata,
        deleteGroup
    } = useMetadataStore();
    const { activePersonalityId } = usePersonalityStore();
    const { showToast } = useUIStore();

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [hover, setHover] = useState('');
    const [group, setGroup] = useState('');
    const [icon, setIcon] = useState('check');
    const [xp, setXp] = useState('1');
    const [targets, setTargets] = useState<(string | number)[]>([]);
    const [color, setColor] = useState('#e2b714');

    // UI State

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize Form
    useEffect(() => {
        if (isOpen && protocolId) {
            const protocol = protocols.find(p => p.id === protocolId);
            if (protocol) {
                setTitle(protocol.title);
                setDescription(protocol.description);
                setHover(protocol.hover || '');
                setGroup(protocol.group || '');
                setIcon(protocol.icon);
                const derivedXp = Math.round(protocol.weight * 100);
                setXp(derivedXp.toString());
                setTargets(protocol.targets);
                setColor(protocol.color || '#e2b714');
            }
        } else if (isOpen) {
            // Reset for new
            setTitle('');
            setDescription('');
            setHover('');
            setGroup('');
            setIcon('check');
            setIcon('check');
            setXp('1');
            setTargets([]);
            setColor('#e2b714');
            setColor('#e2b714');
        }
    }, [isOpen, protocolId, protocols]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !activePersonalityId) return;

        setIsSubmitting(true);
        try {
            // SSOT: Relationships are managed primarily in the Protocol document (targets array).
            // No manual synchronization with Innerface documents is required here.

            const data = {
                title,
                description,
                hover,
                group,
                icon,
                weight: Number(xp) / 100,
                targets,
                color
            };

            if (protocolId) {
                await updateProtocol(protocolId, data);
            } else {
                await addProtocol(data);
            }
            onClose();
        } catch (error) {
            console.error('Failed to save protocol:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!protocolId) return;

        // Save protocol copy for undo
        const protocolCopy = protocols.find(p => p.id === protocolId);
        if (!protocolCopy) return;

        // ✨ Instant close
        onClose();

        // Delete protocol
        await deleteProtocol(protocolId);

        // Show undo toast
        showToast(
            'Action deleted',
            'success',
            'Undo',
            async () => {
                await restoreProtocol(protocolCopy);
            }
        );
    };

    const availableGroups = useMemo(() => {
        const groups = new Set<string>();
        Object.keys(groupsMetadata).forEach(g => groups.add(g));
        innerfaces.forEach(i => { if (i.group) groups.add(i.group); });
        protocols.forEach(p => { if (p.group) groups.add(p.group); });
        return Array.from(groups).sort();
    }, [groupsMetadata, innerfaces, protocols]);

    const handleGroupMetadataUpdate = async (groupName: string, data: { icon?: string; color?: string }) => {
        await updateGroupMetadata(groupName, data);
    };

    return {
        // State
        formState: {
            title, setTitle,
            description, setDescription,
            hover, setHover,
            group, setGroup,
            icon, setIcon,
            xp, setXp,
            targets, setTargets,
            color, setColor
        },
        uiState: {
            isSubmitting
        },
        // Data
        availableGroups,
        innerfaces,
        groupsMetadata,
        // Handlers
        handleSubmit,
        handleDelete,
        handleDeleteGroup: deleteGroup,
        handleUpdateGroupMetadata: handleGroupMetadataUpdate
    };
}
