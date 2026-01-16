import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../components/ui/molecules/Modal';
import { Input } from '../../../components/ui/molecules/Input';
import { Button } from '../../../components/ui/atoms/Button';
import { useAuth } from '../../../contexts/AuthProvider';
import { useMetadataStore } from '../../../stores/metadataStore';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { useHistoryStore } from '../../../stores/historyStore';
import { getMappedIcon, ICON_PRESETS } from '../../../utils/iconMapper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faExclamationTriangle, faPlus, faChevronDown, faTimes } from '@fortawesome/free-solid-svg-icons';
import { PRESET_COLORS, GROUP_CONFIG } from '../../../constants/common';
import * as Popover from '@radix-ui/react-popover';
import { GroupDropdown } from '../../../components/organisms/GroupDropdown';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../../../components/ui/atoms/Tooltip';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { renderIcon } from '../../../utils/iconMapper';
import { CollapsibleSection } from '../../../components/ui/molecules/CollapsibleSection';

interface InnerfaceSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    innerfaceId?: number | string | null;
}


export function InnerfaceSettingsModal({ isOpen, onClose, innerfaceId }: InnerfaceSettingsModalProps) {
    const { user } = useAuth();
    const { innerfaces, protocols, addInnerface, updateInnerface, deleteInnerface, groupsMetadata, updateGroupMetadata, updateProtocol } = useMetadataStore();
    const { activePersonalityId } = usePersonalityStore();

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('🔹');
    const [initialScore, setInitialScore] = useState('5.00');
    const [color, setColor] = useState('#e2b714');
    const [hover, setHover] = useState('');
    const [group, setGroup] = useState('');
    const [protocolIds, setProtocolIds] = useState<(string | number)[]>([]);

    // UI State
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
    const [editingGroupIcon, setEditingGroupIcon] = useState<string | null>(null);
    const [editingGroupColor, setEditingGroupColor] = useState<string | null>(null);
    const [tempGroupIcon, setTempGroupIcon] = useState('');
    const [tempGroupColor, setTempGroupColor] = useState('');
    const [isGroupColorPickerOpen, setIsGroupColorPickerOpen] = useState(false);
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [popupAnchor, setPopupAnchor] = useState<HTMLElement | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const availableGroups = useMemo(() => {
        const configGroups = Object.keys(GROUP_CONFIG).filter(g => g !== 'ungrouped');
        // Collect groups from innerfaces ONLY to keep lists separate
        const existingIfaceGroups = Array.from(new Set(innerfaces.map(i => i.group))).filter(Boolean) as string[];
        return Array.from(new Set([...configGroups, ...existingIfaceGroups])).sort();
    }, [innerfaces]);

    useEffect(() => {
        if (isOpen && innerfaceId) {
            const innerface = innerfaces.find(i => i.id === innerfaceId);
            if (innerface) {
                const parts = innerface.name.split('. ');
                setName(parts[0]);
                setDescription(parts.slice(1).join('. ') || '');
                setIcon(innerface.icon);
                setInitialScore(innerface.initialScore.toFixed(2));
                setColor(innerface.color || '#e2b714');
                setHover(innerface.hover || '');
                setGroup(innerface.group || '');

                // Merge explicit protocolIds from Innerface AND implicit targets from Protocols
                const explicitIds = innerface.protocolIds || [];
                const implicitIds = protocols
                    .filter(p => p.targets && p.targets.some(t => t.toString() === innerface.id.toString()))
                    .map(p => p.id);

                setProtocolIds(Array.from(new Set([...explicitIds, ...implicitIds])));
            }
        } else {
            // Reset for new
            setName('');
            setDescription('');
            setIcon('🔹');
            setInitialScore('5.00');
            setColor('#e2b714');
            setHover('');
            setGroup('');
            setProtocolIds([]);
            setIsConfirmingDelete(false);
            setIsGroupDropdownOpen(false);
            setIsGroupColorPickerOpen(false);
            setEditingGroupColor(null);
            setEditingGroupIcon(null);
        }
    }, [isOpen, innerfaceId, innerfaces]);

    const handleUpdateGroupIcon = async (groupName: string, icon: string) => {
        await updateGroupMetadata(groupName, { icon });
        setEditingGroupIcon(null);
    };

    const handleUpdateGroupColor = async (groupName: string, color: string) => {
        await updateGroupMetadata(groupName, { color });
        setEditingGroupColor(null);
        setIsGroupColorPickerOpen(false);
    };

    const toggleProtocol = (id: string | number) => {
        setProtocolIds(prev => {
            const idStr = id.toString();
            const exists = prev.some(prevId => prevId.toString() === idStr);
            if (exists) {
                return prev.filter(prevId => prevId.toString() !== idStr);
            }
            return [...prev, id];
        });
    };

    const renderGroupIcon = (groupName: string, iconOverride?: string, colorOverride?: string) => {
        const metadata = groupsMetadata[groupName];
        const config = GROUP_CONFIG[groupName];
        const iconStr = iconOverride || metadata?.icon || (config ? 'CONFIG' : 'brain');
        const colorStr = colorOverride || metadata?.color || config?.color || 'var(--main-color)';

        let iconToRender;
        if (iconStr === 'CONFIG' && config) {
            iconToRender = config.icon;
        } else {
            iconToRender = getMappedIcon(iconStr) || faPlus;
        }

        return (
            <div className="flex items-center justify-center w-full h-full" style={{ color: colorStr }}>
                <FontAwesomeIcon icon={iconToRender} className="text-sm" />
            </div>
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !activePersonalityId) return;

        setIsSubmitting(true);
        try {
            // --- System Event Logging ---
            // 1. Detect Protocol Changes (Links/Unlinks)
            if (innerfaceId) {
                const innerface = innerfaces.find(i => i.id == innerfaceId); // loose comparison for potentially string vs number
                if (innerface) {
                    // Current implicit/effective protocols
                    const currentProtocolIds = new Set([
                        ...(innerface.protocolIds || []),
                        ...protocols.filter(p => p.targets?.some(t => t.toString() === innerface.id.toString())).map(p => p.id)
                    ].map(id => id.toString()));

                    // New selected protocols
                    const newProtocolIds = new Set(protocolIds.map(id => id.toString()));

                    // Find modifications
                    const added = protocolIds.filter(id => !currentProtocolIds.has(id.toString()));
                    const removed = Array.from(currentProtocolIds).filter(id => !newProtocolIds.has(id));

                    // Log additions
                    for (const pid of added) {
                        const protocol = protocols.find(p => p.id.toString() === pid.toString());
                        if (protocol) {
                            try {
                                await useHistoryStore.getState().addSystemEvent(
                                    user.uid,
                                    activePersonalityId,
                                    `Linked: ${protocol.title} ↔ ${name}`
                                );
                            } catch (e) { console.error("Failed to log system event", e); }
                        }
                    }

                    // Log removals
                    for (const pid of removed) {
                        const protocol = protocols.find(p => p.id.toString() === pid);
                        if (protocol) {
                            try {
                                await useHistoryStore.getState().addSystemEvent(
                                    user.uid,
                                    activePersonalityId,
                                    `Unlinked: ${protocol.title} ↔ ${name}`
                                );
                            } catch (e) { console.error("Failed to log system event", e); }
                        }
                    }

                    // 2. Detect Score Changes
                    const newScoreVal = Number(initialScore);
                    const currentScoreVal = Number(innerface.initialScore);

                    if (Math.abs(currentScoreVal - newScoreVal) > 0.001) {
                        try {
                            await useHistoryStore.getState().addSystemEvent(
                                user.uid,
                                activePersonalityId,
                                `Manual Adjustment: ${name}`,
                                { from: currentScoreVal, to: newScoreVal }
                            );
                        } catch (e) { console.error("Failed to log system event", e); }
                    }
                }
            }

            // 1. Bi-directional Cleanup: Ensure deselected protocols remove this innerface from their 'targets'
            if (innerfaceId) {
                const removalPromises = protocols.map(p => {
                    const isTargeting = p.targets?.some(t => t.toString() === innerfaceId.toString());
                    const isSelected = protocolIds.some(id => id.toString() === p.id.toString());

                    if (isTargeting && !isSelected) {
                        // Protocol was targeting this innerface, but is no longer in the selected list
                        // We must remove the link from the protocol side
                        const newTargets = (p.targets || []).filter(t => t.toString() !== innerfaceId.toString());
                        return updateProtocol(p.id, { targets: newTargets });
                    }
                    return Promise.resolve();
                });
                await Promise.all(removalPromises);
            }

            const fullName = description ? `${name}. ${description}` : name;
            const newInitialScore = Number(initialScore);
            const data: any = {
                name: fullName,
                icon,
                initialScore: newInitialScore,
                color,
                hover,
                group,
                protocolIds
            };

            if (innerfaceId) {
                const existing = innerfaces.find(i => i.id === innerfaceId);
                // If initial score changed, update versionTimestamp to trigger Hard Reset
                if (existing && existing.initialScore !== newInitialScore) {
                    data.versionTimestamp = new Date().toISOString();
                }
                await updateInnerface(innerfaceId, data);
            } else {
                // For new ones, set versionTimestamp to current time 
                data.versionTimestamp = new Date().toISOString();
                await addInnerface(data);
            }
            onClose();
        } catch (error) {
            console.error('Failed to save innerface:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!innerfaceId || !user || !activePersonalityId) return;

        if (!isConfirmingDelete) {
            setIsConfirmingDelete(true);
            // Optional: reset after 3 seconds if not clicked again
            setTimeout(() => {
                setIsConfirmingDelete(false);
            }, 3000);
            return;
        }

        await deleteInnerface(innerfaceId);
        onClose();
    };

    const InputLabel = ({ label }: { label: string }) => (
        <label className="text-[10px] text-main font-mono font-bold uppercase tracking-[0.2em] opacity-90 px-1">
            {label}
        </label>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={innerfaceId ? 'Edit Innerface' : 'Add Innerface'}
            onSubmit={handleSubmit}
            footer={
                <>
                    {innerfaceId ? (
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            leftIcon={<FontAwesomeIcon icon={isConfirmingDelete ? faExclamationTriangle : faTrash} />}
                            className="text-[10px] uppercase tracking-wider font-bold px-3 py-2 transition-all duration-200"
                        >
                            {isConfirmingDelete ? 'Are you sure?' : 'Delete'}
                        </Button>
                    ) : <div />}

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="neutral"
                            size="sm"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="text-[10px] uppercase tracking-wider font-bold px-4 py-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            isLoading={isSubmitting}
                            className="font-bold px-6 py-2 rounded-lg text-[10px] uppercase tracking-wider shadow-[0_0_10px_rgba(226,183,20,0.2)]"
                        >
                            {innerfaceId ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </>
            }
        >
            <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto custom-scrollbar px-1">
                <div className="flex flex-col gap-1.5">
                    <InputLabel label="Name" />
                    <Input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Focus"
                        required
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <InputLabel label="Description" />
                    <Input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="e.g. Attentional control"
                    />
                </div>

                <div className="flex flex-col gap-1.5 relative">
                    <InputLabel label="Group" />
                    <GroupDropdown
                        isOpen={isGroupDropdownOpen}
                        onOpenChange={setIsGroupDropdownOpen}
                        width="w-full"
                        maxHeight="max-h-56"
                        trigger={(isOpen) => (
                            <div className="relative w-full" onClick={(e) => {
                                e.stopPropagation();
                                setIsGroupDropdownOpen(true);
                            }}>
                                <Input
                                    type="text"
                                    value={group}
                                    onChange={e => {
                                        setGroup(e.target.value);
                                        setIsGroupDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsGroupDropdownOpen(true)}
                                    placeholder="no group"
                                    className="pr-8"
                                    leftIcon={
                                        group && availableGroups.some(g => g.toLowerCase() === group.toLowerCase()) ? (
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{
                                                    backgroundColor: groupsMetadata[group]?.color || GROUP_CONFIG[group]?.color || 'var(--main-color)',
                                                    boxShadow: `0 0 8px ${groupsMetadata[group]?.color || GROUP_CONFIG[group]?.color || 'var(--main-color)'}`
                                                }}
                                            />
                                        ) : undefined
                                    }
                                />
                                <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 transition-transform duration-200 text-sub/50 pointer-events-none ${isOpen ? 'rotate-180' : ''}`}>
                                    <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
                                </div>
                            </div>
                        )}
                    >
                        <div className="p-1">


                            {availableGroups
                                .filter(g => g.toLowerCase().includes(group.toLowerCase()))
                                .map(g => {
                                    const metadata = groupsMetadata[g];
                                    const config = GROUP_CONFIG[g];
                                    const gColor = metadata?.color || config?.color || 'var(--main-color)';
                                    const isEditingIcon = editingGroupIcon === g;
                                    const isEditingColor = editingGroupColor === g;

                                    return (
                                        <div key={g} className="relative">
                                            <GroupDropdown.Item
                                                label={g}
                                                isActive={group === g}
                                                onClick={() => {
                                                    if (!isEditingIcon && !isEditingColor) {
                                                        setGroup(g);
                                                        setIsGroupDropdownOpen(false);
                                                    }
                                                }}
                                                onIndicatorClick={(e) => {
                                                    if (isGroupColorPickerOpen && editingGroupColor === g) {
                                                        setIsGroupColorPickerOpen(false);
                                                        setEditingGroupColor(null);
                                                    } else {
                                                        setEditingGroupColor(g);
                                                        setPopupAnchor(e.currentTarget as HTMLElement);
                                                        setIsGroupColorPickerOpen(true);
                                                    }
                                                }}
                                                onIconClick={() => {
                                                    setEditingGroupIcon(g);
                                                    setTempGroupIcon(metadata?.icon || (GROUP_CONFIG[g] ? g.toLowerCase() : 'brain'));
                                                }}
                                                indicatorColor={gColor}
                                                icon={
                                                    <div
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${isEditingIcon ? 'bg-black/40 border border-main/50' : 'bg-black/40 group-hover/item-container:bg-black/60 hover:scale-105 border border-white/5'}`}
                                                    >
                                                        {isEditingIcon ? (
                                                            <input
                                                                autoFocus
                                                                className="w-full h-full bg-transparent text-center text-[10px] font-mono outline-none text-text-primary"
                                                                value={tempGroupIcon}
                                                                onChange={(e) => setTempGroupIcon(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleUpdateGroupIcon(g, tempGroupIcon);
                                                                    if (e.key === 'Escape') setEditingGroupIcon(null);
                                                                }}
                                                                onBlur={() => handleUpdateGroupIcon(g, tempGroupIcon)}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        ) : (
                                                            renderGroupIcon(g)
                                                        )}
                                                    </div>
                                                }
                                            />
                                        </div>
                                    );
                                })}

                            {/* Add New Option */}
                            {group.trim() !== '' && !availableGroups.some(g => g.toLowerCase() === group.toLowerCase()) && (
                                <>
                                    <GroupDropdown.Item
                                        label={
                                            <span>
                                                <span className="text-sub opacity-70 mr-1.5">create:</span>
                                                <span className="text-text-primary font-bold">{group}</span>
                                            </span>
                                        }
                                        tooltipText={`Create group: ${group}`}
                                        isActive={false}
                                        indicatorColor={tempGroupColor}
                                        onIndicatorClick={(e) => {
                                            if (isGroupColorPickerOpen && editingGroupColor === 'NEW') {
                                                setIsGroupColorPickerOpen(false);
                                                setEditingGroupColor(null);
                                            } else {
                                                setEditingGroupColor('NEW');
                                                setPopupAnchor(e.currentTarget as HTMLElement);
                                                setIsGroupColorPickerOpen(true);
                                            }
                                        }}
                                        onClick={() => {
                                            if (tempGroupIcon.trim()) {
                                                handleUpdateGroupIcon(group, tempGroupIcon);
                                                if (tempGroupColor) handleUpdateGroupColor(group, tempGroupColor);
                                            }
                                            setGroup(group);
                                            setIsGroupDropdownOpen(false);
                                        }}
                                        onIconClick={() => {
                                            setIsGroupColorPickerOpen(false);
                                            setEditingGroupIcon('NEW');
                                            if (!tempGroupIcon) setTempGroupIcon('brain');
                                        }}
                                        icon={
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${editingGroupIcon === 'NEW' ? 'bg-transparent border border-main/50' : 'bg-main/10 border border-main/20 hover:bg-main hover:text-bg-primary'}`}>
                                                {editingGroupIcon === 'NEW' ? (
                                                    <input
                                                        autoFocus
                                                        className="w-full h-full bg-transparent text-center text-[10px] font-mono outline-none text-text-primary"
                                                        value={tempGroupIcon}
                                                        onChange={(e) => setTempGroupIcon(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') setEditingGroupIcon(null);
                                                            if (e.key === 'Escape') setEditingGroupIcon(null);
                                                        }}
                                                        onBlur={() => setEditingGroupIcon(null)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                                )}
                                            </div>
                                        }
                                    />
                                </>
                            )}

                            {availableGroups.filter(g => g.toLowerCase().includes(group.toLowerCase())).length === 0 && group.trim() === '' && (
                                <div className="px-3 py-2 text-[10px] text-sub italic">No groups found</div>
                            )}

                            <Popover.Root open={isGroupColorPickerOpen} onOpenChange={setIsGroupColorPickerOpen}>
                                {popupAnchor && <Popover.Anchor virtualRef={{ current: popupAnchor }} />}
                                <Popover.Portal>
                                    <Popover.Content
                                        className="z-[100] p-2 bg-sub-alt/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col gap-2 min-w-[124px] animate-in fade-in zoom-in-95 duration-200"
                                        sideOffset={5}
                                        align="start"
                                        onInteractOutside={(e) => {
                                            if (popupAnchor && popupAnchor.contains(e.target as Node)) {
                                                e.preventDefault();
                                            }
                                        }}
                                    >
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-[9px] font-mono text-sub uppercase">Color</span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsGroupColorPickerOpen(false);
                                                    setEditingGroupColor(null);
                                                }}
                                                className="text-sub hover:text-text-primary transition-colors cursor-pointer"
                                            >
                                                <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {PRESET_COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => {
                                                        if (editingGroupColor === 'NEW') {
                                                            setTempGroupColor(c);
                                                        } else if (editingGroupColor) {
                                                            handleUpdateGroupColor(editingGroupColor, c);
                                                        }
                                                        setIsGroupColorPickerOpen(false);
                                                    }}
                                                    className={`w-5 h-5 rounded-full transition-transform hover:scale-125 hover:ring-2 hover:ring-white/30 cursor-pointer ${(editingGroupColor === 'NEW' ? tempGroupColor : (editingGroupColor ? (groupsMetadata[editingGroupColor]?.color || GROUP_CONFIG[editingGroupColor]?.color) : '')) === c
                                                        ? 'ring-2 ring-white/50'
                                                        : ''
                                                        }`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                        <Popover.Arrow className="fill-current text-white/10" />
                                    </Popover.Content>
                                </Popover.Portal>
                            </Popover.Root>
                        </div>
                    </GroupDropdown>
                    {isGroupDropdownOpen && (
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsGroupDropdownOpen(false)}
                        />
                    )}
                </div>

                <div className="flex gap-4">
                    <div className="w-32 flex flex-col gap-1.5">
                        <InputLabel label="Base Level" />
                        <Input
                            type="number"
                            value={initialScore}
                            onChange={e => setInitialScore(e.target.value)}
                            onBlur={() => {
                                const num = parseFloat(initialScore.toString());
                                if (!isNaN(num)) {
                                    setInitialScore(num.toFixed(2));
                                }
                            }}
                            step="0.01"
                            min="0"
                            max="10"
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>

                    {/* Custom Color Picker */}
                    <div className="flex flex-col gap-1.5 relative">
                        <InputLabel label="Color" />
                        <button
                            type="button"
                            onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                            className="h-[42px] w-[50px] bg-sub-alt rounded-lg border border-transparent hover:bg-sub focus:border-white/5 transition-colors flex items-center justify-center relative"
                        >
                            <div
                                className="w-5 h-5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)] transition-transform duration-200 active:scale-90"
                                style={{ backgroundColor: color }}
                            />
                        </button>

                        {/* Dropdown */}
                        {isColorPickerOpen && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-full z-50 py-2 bg-bg-secondary border border-white/5 rounded-xl shadow-2xl flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-200 h-[200px] overflow-y-auto custom-scrollbar">
                                {PRESET_COLORS.map(preset => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => {
                                            setColor(preset);
                                            setIsColorPickerOpen(false);
                                        }}
                                        className="w-6 h-6 rounded-full hover:scale-110 transition-transform shadow-sm relative group shrink-0"
                                        style={{ backgroundColor: preset }}
                                    >
                                        {color === preset && (
                                            <div className="absolute inset-0 rounded-full border-2 border-white/50" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Overlay to close */}
                        {isColorPickerOpen && (
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsColorPickerOpen(false)}
                            />
                        )}
                    </div>

                    <div className="w-16 flex flex-col gap-1.5 relative">
                        <InputLabel label="Icon" />
                        <Popover.Root open={isIconPickerOpen} onOpenChange={setIsIconPickerOpen}>
                            <Popover.Trigger asChild>
                                <div className="relative group/icon bg-sub-alt rounded-lg transition-colors duration-200 focus-within:bg-sub border border-transparent focus-within:border-white/5 cursor-pointer"
                                    onClick={() => setIsIconPickerOpen(true)}
                                >
                                    {getMappedIcon(icon) && (
                                        <div
                                            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-colors duration-200"
                                            style={{ color: color }}
                                        >
                                            <FontAwesomeIcon icon={getMappedIcon(icon)} className="text-sm" />
                                        </div>
                                    )}
                                    <Input
                                        type="text"
                                        value={icon}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setIcon(val);
                                        }}
                                        className={`text-center text-lg p-0 h-[42px] relative z-10 ${getMappedIcon(icon) ? '!text-transparent !caret-text-primary' : ''} !bg-transparent focus:!bg-transparent !border-none outline-none cursor-pointer`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsIconPickerOpen(true);
                                        }}
                                    />
                                </div>
                            </Popover.Trigger>
                            <Popover.Portal>
                                <Popover.Content
                                    className="z-[100] p-2 bg-sub-alt/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col gap-2 min-w-[200px] animate-in fade-in zoom-in-95 duration-200"
                                    sideOffset={5}
                                    align="start"
                                >
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[9px] font-mono text-sub uppercase">Select Icon</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsIconPickerOpen(false)}
                                            className="text-sub hover:text-text-primary transition-colors cursor-pointer"
                                        >
                                            <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-5 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                                        {ICON_PRESETS.map(preset => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => {
                                                    setIcon(preset);
                                                    setIsIconPickerOpen(false);
                                                }}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 cursor-pointer ${icon === preset ? 'bg-white/20 text-text-primary ring-1 ring-white/30' : 'text-sub'}`}
                                                style={{ color: icon === preset ? color : undefined }}
                                                title={preset}
                                            >
                                                <FontAwesomeIcon icon={getMappedIcon(preset)} className="text-sm" />
                                            </button>
                                        ))}
                                    </div>
                                    <Popover.Arrow className="fill-current text-white/10" />
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <InputLabel label="Quick Note" />
                    <Input
                        type="text"
                        value={hover}
                        onChange={e => setHover(e.target.value)}
                        placeholder="Short note shown on tap/hover..."
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <InputLabel label="Composition (Protocols)" />
                    <div className="bg-sub-alt/30 rounded-xl p-3 border border-white/5 h-[300px] flex flex-col gap-3">
                        {/* Search Input */}
                        <Input
                            type="text"
                            placeholder="Search protocols..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon={faSearch}
                        />

                        {/* Scrollable List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col gap-1">
                                {(() => {
                                    // Group Protocols
                                    const filteredProtocols = protocols.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

                                    if (filteredProtocols.length === 0) {
                                        return <div className="w-full text-center py-8 text-sub/40 italic text-xs">No protocols found</div>;
                                    }

                                    const groupedProtocols: Record<string, typeof protocols> = {};
                                    filteredProtocols.forEach(p => {
                                        const g = p.group || 'ungrouped';
                                        if (!groupedProtocols[g]) groupedProtocols[g] = [];
                                        groupedProtocols[g].push(p);
                                    });

                                    // Sort Groups: Configured groups first, then others alphabetically, 'ungrouped' last
                                    const sortedGroups = Object.keys(groupedProtocols).sort((a, b) => {
                                        if (a === 'ungrouped') return 1;
                                        if (b === 'ungrouped') return -1;
                                        // Use predefined order if available (optional)
                                        return a.localeCompare(b);
                                    });

                                    return sortedGroups.map(groupName => (
                                        <CollapsibleSection
                                            key={groupName}
                                            title={groupName}
                                            variant="mini"
                                            defaultOpen={true}
                                            className="mb-2"
                                        >
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {groupedProtocols[groupName].map(protocol => {
                                                    const isActive = protocolIds.some(id => id.toString() === protocol.id.toString());
                                                    const pColor = protocol.color || 'var(--text-primary)';
                                                    return (
                                                        <TooltipProvider key={protocol.id} delayDuration={300}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleProtocol(protocol.id)}
                                                                        className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all font-mono text-[10px] uppercase font-bold tracking-wider ${isActive
                                                                            ? ''
                                                                            : 'bg-sub-alt border-transparent text-sub hover:text-text-primary hover:bg-sub'
                                                                            }`}
                                                                        style={isActive ? {
                                                                            backgroundColor: `${pColor}33`,
                                                                            color: pColor,
                                                                            boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
                                                                            borderColor: 'transparent'
                                                                        } : undefined}
                                                                    >
                                                                        <span style={{ color: isActive ? 'currentColor' : pColor }}>
                                                                            {renderIcon(protocol.icon)}
                                                                        </span>
                                                                        {protocol.title}
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top">
                                                                    <span className="font-mono text-xs">{protocol.description}</span>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    );
                                                })}
                                            </div>
                                        </CollapsibleSection>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
