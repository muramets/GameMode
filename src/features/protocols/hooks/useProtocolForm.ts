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
    const [instruction, setInstruction] = useState('');
    const [hasInstruction, setHasInstruction] = useState(false);

    // UI State
    // const [isSubmitting, setIsSubmitting] = useState(false); // Removed for Optimistic Close pattern (modal closes instantly)

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
                setInstruction(protocol.instruction || '');
                setHasInstruction(!!protocol.instruction);
            }
        } else if (isOpen) {
            // Reset for new
            setTitle('');
            setDescription('');
            setHover('');
            setGroup('');
            setIcon('check');
            setXp('1');
            setTargets([]);
            setColor('#e2b714');
            setInstruction('');
            setHasInstruction(false);
        }
    }, [isOpen, protocolId, protocols]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !activePersonalityId) return;

        // ✨ Instant close
        onClose();

        try {
            const data = {
                title,
                description,
                hover,
                group,
                icon,
                weight: Number(xp) / 100,
                targets,
                color,
                instruction: hasInstruction ? instruction : '',
            };

            if (protocolId) {
                await updateProtocol(protocolId, data);
            } else {
                await addProtocol(data);
            }
        } catch (error) {
            console.error('Failed to save protocol:', error);
            showToast('Failed to save action', 'error');
        } finally {
            // setIsSubmitting(false);
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
            color, setColor,
            instruction, setInstruction,
            hasInstruction, setHasInstruction,
        },
        uiState: {
            // isSubmitting: false // Pattern: Optimistic Close (handled in handleSubmit)
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
