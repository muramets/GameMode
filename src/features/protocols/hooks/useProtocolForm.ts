import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useMetadataStore } from '../../../stores/metadataStore';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { useHistoryStore } from '../../../stores/historyStore';
import { GROUP_CONFIG } from '../../../constants/common';

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
        updateGroupMetadata
    } = useMetadataStore();
    const { activePersonalityId } = usePersonalityStore();

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [hover, setHover] = useState('');
    const [group, setGroup] = useState('');
    const [icon, setIcon] = useState('🔹');
    const [action, setAction] = useState<'+' | '-'>('+');
    const [xp, setXp] = useState('1');
    const [targets, setTargets] = useState<(string | number)[]>([]);
    const [color, setColor] = useState('#e2b714');

    // UI State
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
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
                setAction(protocol.action || '+');
                const derivedXp = protocol.xp ?? Math.round(protocol.weight * 100);
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
            setIcon('🔹');
            setAction('+');
            setXp('1');
            setTargets([]);
            setColor('#e2b714');
            setIsConfirmingDelete(false);
        }
    }, [isOpen, protocolId, protocols]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !activePersonalityId) return;

        setIsSubmitting(true);
        try {
            // --- System Event Logging & Bidirectional Sync ---
            if (protocolId) {
                const currentProtocol = protocols.find(p => p.id === protocolId);
                if (currentProtocol) {
                    const currentTargets = new Set((currentProtocol.targets || []).map(t => t.toString()));
                    const newTargets = new Set(targets.map(t => t.toString()));

                    const added = targets.filter(t => !currentTargets.has(t.toString()));
                    const removed = Array.from(currentTargets).filter(t => !newTargets.has(t));

                    // Log additions + Bidirectional Sync
                    for (const tid of added) {
                        const innerface = innerfaces.find(i => i.id.toString() === tid.toString());
                        if (innerface) {
                            try {
                                await useHistoryStore.getState().addSystemEvent(
                                    user.uid,
                                    activePersonalityId,
                                    `Linked: ${title} ↔ ${innerface.name.split('.')[0]}`
                                );

                                const currentProtocolIds = innerface.protocolIds || [];
                                if (!currentProtocolIds.some(pid => pid.toString() === protocolId.toString())) {
                                    const newProtocolIds = [...currentProtocolIds, protocolId.toString()];
                                    await useMetadataStore.getState().updateInnerface(
                                        innerface.id,
                                        { protocolIds: newProtocolIds }
                                    );
                                }
                            } catch (e) { console.error("Failed to sync/log system event", e); }
                        }
                    }

                    // Log removals
                    for (const tid of removed) {
                        const innerface = innerfaces.find(i => i.id.toString() === tid);
                        if (innerface) {
                            try {
                                await useHistoryStore.getState().addSystemEvent(
                                    user.uid,
                                    activePersonalityId,
                                    `Unlinked: ${title} ↔ ${innerface.name.split('.')[0]}`
                                );

                                if (innerface.protocolIds?.some(pid => pid.toString() === protocolId.toString())) {
                                    const newProtocolIds = innerface.protocolIds.filter(pid => pid.toString() !== protocolId.toString());
                                    await useMetadataStore.getState().updateInnerface(
                                        innerface.id,
                                        { protocolIds: newProtocolIds }
                                    );
                                }
                            } catch (e) { console.error("Failed to sync/log system event", e); }
                        }
                    }
                }
            }

            const data = {
                title,
                description,
                hover,
                group,
                icon,
                action,
                xp: Number(xp),
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

        if (!isConfirmingDelete) {
            setIsConfirmingDelete(true);
            setTimeout(() => setIsConfirmingDelete(false), 3000);
            return;
        }

        await deleteProtocol(protocolId);
        onClose();
    };

    const availableGroups = useMemo(() => {
        const configGroups = Object.keys(GROUP_CONFIG).filter(g => g !== 'ungrouped');
        const existingGroups = Array.from(new Set(protocols.map(p => p.group))).filter(Boolean) as string[];
        return Array.from(new Set([...configGroups, ...existingGroups])).sort();
    }, [protocols]);

    const handleUpdateGroupMetadata = async (groupName: string, data: { icon?: string; color?: string }) => {
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
            action, setAction,
            xp, setXp,
            targets, setTargets,
            color, setColor
        },
        uiState: {
            isConfirmingDelete,
            isSubmitting
        },
        // Data
        availableGroups,
        innerfaces,
        groupsMetadata,
        // Handlers
        handleSubmit,
        handleDelete,
        handleUpdateGroupMetadata
    };
}
