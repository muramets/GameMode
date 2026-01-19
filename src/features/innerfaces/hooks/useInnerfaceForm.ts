import { useState, useEffect, useMemo } from 'react';
import { useMetadataStore } from '../../../stores/metadataStore';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { useUIStore } from '../../../stores/uiStore';
import { getGroupConfig } from '../../../constants/common';
import type { PowerCategory } from '../types';

interface UseInnerfaceFormProps {
    innerfaceId?: number | string | null;
    onClose: () => void;
    isOpen: boolean;
}

export function useInnerfaceForm({ innerfaceId, onClose, isOpen }: UseInnerfaceFormProps) {
    const {
        innerfaces,
        protocols,
        groupsMetadata,
        addInnerface,
        updateInnerface,
        deleteInnerface,
        restoreInnerface,
        updateProtocol,
        updateGroupMetadata,
        deleteGroup
    } = useMetadataStore();

    const { activeContext } = usePersonalityStore();
    const { showToast } = useUIStore();
    const isCoachMode = activeContext?.type === 'viewer';

    const currentInnerface = useMemo(() =>
        innerfaces.find(i => i.id.toString() === innerfaceId?.toString()),
        [innerfaces, innerfaceId]);

    // Bidirectional Protocol Sync Logic (Now SSOT from protocols)
    const initialProtocolIds = useMemo(() => {
        if (!innerfaceId) return [];
        return protocols
            .filter(p => p.targets?.some(t => t.toString() === innerfaceId.toString()))
            .map(p => p.id.toString());
    }, [protocols, innerfaceId]);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [group, setGroup] = useState('');
    const [initialScore, setInitialScore] = useState('0');
    const [color, setColor] = useState('var(--main-color)');
    const [icon, setIcon] = useState('bullseye');
    const [hover, setHover] = useState('');
    const [protocolIds, setProtocolIds] = useState<string[]>([]);
    const [category, setCategory] = useState<PowerCategory>(null);

    // UI/Flow State
    // UI/Flow State
    // const [isSubmitting, setIsSubmitting] = useState(false); // Optimistic close removes need for loading state


    // Group Dropdown State
    const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);

    // Available Groups Calculation
    const availableGroups = useMemo(() => {
        const groups = new Set<string>();
        Object.keys(groupsMetadata).forEach(g => groups.add(g));
        innerfaces.forEach(i => { if (i.group) groups.add(i.group); });
        protocols.forEach(p => { if (p.group) groups.add(p.group); });
        return Array.from(groups).sort();
    }, [groupsMetadata, innerfaces, protocols]);

    // Reset/Load Effect
    useEffect(() => {
        if (isOpen) {
            if (currentInnerface) {
                setName(currentInnerface.name);
                setDescription(currentInnerface.description || '');
                setGroup(currentInnerface.group || '');
                setInitialScore((currentInnerface.initialScore || 0).toString());
                setColor(currentInnerface.color || 'var(--main-color)');
                setIcon(currentInnerface.icon || 'bullseye');
                setHover(currentInnerface.hover || '');
                setProtocolIds(initialProtocolIds);
                setCategory(currentInnerface.category || null);
            } else {
                // Reset
                setName('');
                setDescription('');
                setGroup('');
                setInitialScore('0');
                setColor('var(--main-color)');
                setIcon('bullseye');
                setHover('');
                setProtocolIds([]);
                setCategory(null);
            }

            setIsGroupDropdownOpen(false);
        }
    }, [isOpen, currentInnerface, initialProtocolIds]);

    const toggleProtocol = (pId: string | number) => {
        const idStr = pId.toString();
        setProtocolIds(prev =>
            prev.includes(idStr)
                ? prev.filter(id => id !== idStr)
                : [...prev, idStr]
        );
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!name.trim()) return;

        // ✨ Instant close
        onClose();

        // No need for loading state since we closed
        // setIsSubmitting(true); 

        try {
            const innerfaceData = {
                name,
                description,
                group,
                initialScore: parseFloat(initialScore) || 0,
                color,
                icon,
                hover,
                // protocolIds REMOVED - we don't save this to innerface anymore
                category
            };

            let targetId: string | number = innerfaceId || '';

            if (innerfaceId && currentInnerface) {
                // Update existing Innerface
                await updateInnerface(innerfaceId, innerfaceData);
            } else {
                // Create new Innerface and capture the generated ID
                targetId = await addInnerface(innerfaceData);
            }

            // Sync Protocols (SSOT: Protocol targets are the source of truth)
            // Ensure bidirectional consistency by updating Protocol documents
            if (targetId) {
                const finalProtocolIds = new Set(protocolIds.map(String));
                const protocolUpdates = protocols.map(async (p) => {
                    const isSelected = finalProtocolIds.has(p.id.toString());
                    const currentTargets = (p.targets || []).map(String);
                    const isLinked = currentTargets.includes(targetId.toString());

                    // Add linkage if selected but not yet linked
                    if (isSelected && !isLinked) {
                        await updateProtocol(p.id, {
                            targets: [...(p.targets || []), targetId]
                        });
                    }
                    // Remove linkage if deselected but currently linked
                    else if (!isSelected && isLinked) {
                        await updateProtocol(p.id, {
                            targets: (p.targets || []).filter(t => t.toString() !== targetId.toString())
                        });
                    }
                });
                await Promise.all(protocolUpdates);
            }

        } catch (error) {
            console.error('Failed to save innerface:', error);
            showToast('Failed to save power', 'error'); // Ensure user gets feedback
        } finally {
            // setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!innerfaceId) return;


        // Save innerface copy for undo
        const innerfaceCopy = innerfaces.find(i => i.id === innerfaceId);
        if (!innerfaceCopy) return;

        // ✨ Instant close
        onClose();

        // Delete innerface
        try {
            await deleteInnerface(innerfaceId);

            // Show undo toast
            showToast(
                'Power deleted',
                'success',
                'Undo',
                async () => {
                    await restoreInnerface(innerfaceCopy);
                }
            );
        } catch (error) {
            console.error('Failed to delete innerface:', error);
        }
    };

    // Group Metadata Helpers
    const getGroupColor = (g: string) =>
        groupsMetadata[g]?.color || getGroupConfig(g)?.color || 'var(--main-color)';

    const getGroupIcon = (g: string) =>
        groupsMetadata[g]?.icon || getGroupConfig(g)?.icon || 'brain';

    return {
        formState: {
            name, setName,
            description, setDescription,
            group, setGroup,
            initialScore, setInitialScore,
            color, setColor,
            icon, setIcon,
            hover, setHover,
            protocolIds, setProtocolIds,
            category, setCategory
        },
        uiState: {
            // isSubmitting,

            isGroupDropdownOpen, setIsGroupDropdownOpen,
            isCoachMode
        },
        data: {
            availableGroups,
            protocols, // Passed for EntitySelector
            groupsMetadata
        },
        handlers: {
            handleSubmit,
            handleDelete,
            handleDeleteGroup: deleteGroup,
            toggleProtocol,
            updateGroupMetadata
        },
        utils: {
            getGroupColor,
            getGroupIcon
        }
    };
}
