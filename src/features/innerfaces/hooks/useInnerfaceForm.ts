import { useState, useEffect, useMemo } from 'react';
import { useMetadataStore } from '../../../stores/metadataStore';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { useUIStore } from '../../../stores/uiStore';
import { GROUP_CONFIG } from '../../../constants/common';
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
        updateGroupMetadata
    } = useMetadataStore();

    const { activeContext } = usePersonalityStore();
    const { showToast } = useUIStore();
    const isCoachMode = activeContext?.type === 'viewer';

    const currentInnerface = useMemo(() =>
        innerfaces.find(i => i.id.toString() === innerfaceId?.toString()),
        [innerfaces, innerfaceId]);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [group, setGroup] = useState('');
    const [initialScore, setInitialScore] = useState('0');
    const [color, setColor] = useState('var(--main-color)');
    const [icon, setIcon] = useState('brain');
    const [hover, setHover] = useState('');
    const [protocolIds, setProtocolIds] = useState<string[]>([]);
    const [category, setCategory] = useState<PowerCategory>(null);

    // UI/Flow State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    // Group Dropdown State (Extracted to keep Modal clean, or could be kept in Modal?)
    // Keeping basic state here might be useful if we want to reset it on close
    const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);

    // Available Groups Calculation
    const availableGroups = useMemo(() => {
        const groups = new Set<string>(['Physical', 'Mental', 'Emotional', 'Spiritual', 'Social']);
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
                setIcon(currentInnerface.icon || 'brain');
                setHover(currentInnerface.hover || '');

                // Bidirectional Protocol Sync Logic
                const fromInnerface = (currentInnerface.protocolIds || []).map(String);
                const fromProtocols = protocols
                    .filter(p => p.targets?.some(t => t.toString() === currentInnerface.id.toString()))
                    .map(p => p.id.toString());

                setProtocolIds(Array.from(new Set([...fromInnerface, ...fromProtocols])));
                setCategory(currentInnerface.category || null);
            } else {
                // Reset
                setName('');
                setDescription('');
                setGroup('');
                setInitialScore('0');
                setColor('var(--main-color)');
                setIcon('brain');
                setHover('');
                setProtocolIds([]);
                setCategory(null);
            }
            setIsConfirmingDelete(false);
            setIsGroupDropdownOpen(false);
        }
    }, [isOpen, currentInnerface, protocols]);

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

        setIsSubmitting(true);
        try {
            const innerfaceData = {
                name,
                description,
                group,
                initialScore: parseFloat(initialScore) || 0,
                color,
                icon,
                hover,
                protocolIds: protocolIds.map(id => id.toString()),
                category
            };

            if (innerfaceId && currentInnerface) {
                // Update Existing
                await updateInnerface(innerfaceId, innerfaceData);

                // Sync Protocols
                const finalProtocolIds = new Set(protocolIds.map(String));
                const protocolUpdates = protocols.map(async (p) => {
                    const isSelected = finalProtocolIds.has(p.id.toString());
                    const currentTargets = (p.targets || []).map(String);
                    const isLinked = currentTargets.includes(innerfaceId.toString());

                    if (isSelected && !isLinked) {
                        await updateProtocol(p.id, {
                            targets: [...(p.targets || []), innerfaceId]
                        });
                    } else if (!isSelected && isLinked) {
                        await updateProtocol(p.id, {
                            targets: (p.targets || []).filter(t => t.toString() !== innerfaceId.toString())
                        });
                    }
                });
                await Promise.all(protocolUpdates);
            } else {
                // Create New
                await addInnerface(innerfaceData);
            }
            onClose();
        } catch (error) {
            console.error('Failed to save innerface:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!innerfaceId) return;
        if (!isConfirmingDelete) {
            setIsConfirmingDelete(true);
            return;
        }

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
        groupsMetadata[g]?.color || GROUP_CONFIG[g]?.color || 'var(--main-color)';

    const getGroupIcon = (g: string) =>
        groupsMetadata[g]?.icon || GROUP_CONFIG[g]?.icon?.iconName || 'brain';

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
            isSubmitting,
            isConfirmingDelete,
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
            toggleProtocol,
            updateGroupMetadata
        },
        utils: {
            getGroupColor,
            getGroupIcon
        }
    };
}
