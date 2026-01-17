import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../components/ui/molecules/Modal';
import { Input } from '../../../components/ui/molecules/Input';
import { Button } from '../../../components/ui/atoms/Button';
import { useAuth } from '../../../contexts/AuthProvider';
import { useMetadataStore } from '../../../stores/metadataStore';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { useHistoryStore } from '../../../stores/historyStore';
import { renderIcon, getMappedIcon, ICON_PRESETS } from '../../../utils/iconMapper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faExclamationTriangle, faPlus, faChevronDown, faTimes } from '@fortawesome/free-solid-svg-icons';
import { GROUP_CONFIG, PRESET_COLORS } from '../../../constants/common';
import * as Popover from '@radix-ui/react-popover';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../../../components/ui/atoms/Tooltip';
import { GroupDropdown } from '../../../features/groups/components/GroupDropdown';
import { CollapsibleSection } from '../../../components/ui/molecules/CollapsibleSection';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

// 

interface ProtocolSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    protocolId?: number | string | null;
}

export function ProtocolSettingsModal({ isOpen, onClose, protocolId }: ProtocolSettingsModalProps) {
    const { user } = useAuth();
    const { innerfaces, protocols, groupsMetadata, addProtocol, updateProtocol, deleteProtocol, updateGroupMetadata } = useMetadataStore();
    const { activePersonalityId } = usePersonalityStore();

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [hover, setHover] = useState(''); // Added hover state
    const [group, setGroup] = useState('');
    const [icon, setIcon] = useState('🔹');
    const [action, setAction] = useState<'+' | '-'>('+');
    const [xp, setXp] = useState('1'); // Use XP (Integer)
    const [targets, setTargets] = useState<(string | number)[]>([]);
    const [color, setColor] = useState('#e2b714');

    // UI State
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
    const [editingGroupIcon, setEditingGroupIcon] = useState<string | null>(null);
    const [editingGroupColor, setEditingGroupColor] = useState<string | null>(null);
    const [tempGroupIcon, setTempGroupIcon] = useState('');
    const [tempGroupColor, setTempGroupColor] = useState('');
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [isGroupColorPickerOpen, setIsGroupColorPickerOpen] = useState(false);
    const [popupAnchor, setPopupAnchor] = useState<HTMLElement | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const availableGroups = useMemo(() => {
        const configGroups = Object.keys(GROUP_CONFIG).filter(g => g !== 'ungrouped');
        const existingGroups = Array.from(new Set(protocols.map(p => p.group))).filter(Boolean) as string[];
        return Array.from(new Set([...configGroups, ...existingGroups])).sort();
    }, [protocols]);

    useEffect(() => {
        if (isOpen && protocolId) {
            const protocol = protocols.find(p => p.id === protocolId);
            if (protocol) {
                setTitle(protocol.title);
                setDescription(protocol.description);
                setHover(protocol.hover || ''); // Initialize hover
                setGroup(protocol.group || '');
                setIcon(protocol.icon);
                setAction(protocol.action || '+');
                // Calculate XP from stored weight if xp is missing
                const derivedXp = protocol.xp ?? Math.round(protocol.weight * 100);
                setXp(derivedXp.toString());
                setTargets(protocol.targets);
                setColor(protocol.color || '#e2b714');
            }
        } else {
            // Reset for new
            setTitle('');
            setDescription('');
            setHover(''); // Reset hover
            setGroup('');
            setIcon('🔹');
            setAction('+');
            setXp('1');
            setTargets([]);
            setColor('#e2b714');
            setIsConfirmingDelete(false);
            setIsGroupDropdownOpen(false);
            setIsColorPickerOpen(false);
            setIsGroupColorPickerOpen(false);
            setEditingGroupColor(null);
            setEditingGroupColor(null);
            setEditingGroupIcon(null);
            setSearchQuery('');
        }
    }, [isOpen, protocolId, protocols]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !activePersonalityId) return;

        setIsSubmitting(true);
        try {

            // --- System Event Logging ---
            // Detect Protocol Changes (Links/Unlinks)
            if (protocolId) {
                const currentProtocol = protocols.find(p => p.id === protocolId);
                if (currentProtocol) {
                    // Determine effective current targets (explicit + implicit from innerface side)
                    // Note: Protocol.targets is the source of truth for "explicit" links from protocol side.
                    // But Innerface.protocolIds also creates a link.
                    // However, this modal only edits Protocol.targets. 
                    // Any link created here manifests as an ID in Protocol.targets.

                    const currentTargets = new Set((currentProtocol.targets || []).map(t => t.toString()));
                    const newTargets = new Set(targets.map(t => t.toString()));

                    const added = targets.filter(t => !currentTargets.has(t.toString()));
                    const removed = Array.from(currentTargets).filter(t => !newTargets.has(t));

                    // Log additions
                    for (const tid of added) {
                        const innerface = innerfaces.find(i => i.id.toString() === tid.toString());
                        if (innerface) {
                            try {
                                await useHistoryStore.getState().addSystemEvent(
                                    user.uid,
                                    activePersonalityId,
                                    `Linked: ${title} ↔ ${innerface.name.split('.')[0]}`
                                );
                            } catch (e) { console.error("Failed to log system event", e); }
                        }
                    }

                    // Log removals
                    for (const tid of removed) {
                        const innerface = innerfaces.find(i => i.id.toString() === tid);
                        if (innerface) {
                            try {
                                // 1. Log System Event
                                await useHistoryStore.getState().addSystemEvent(
                                    user.uid,
                                    activePersonalityId,
                                    `Unlinked: ${title} ↔ ${innerface.name.split('.')[0]}`
                                );

                                // 2. Bi-directional Sync: Remove this protocol from the innerface's protocolIds
                                // Check if the innerface actually has this protocol explicitly linked
                                if (innerface.protocolIds?.some(pid => pid.toString() === protocolId.toString())) {
                                    const newProtocolIds = innerface.protocolIds.filter(pid => pid.toString() !== protocolId.toString());
                                    await useMetadataStore.getState().updateInnerface(
                                        innerface.id,
                                        { protocolIds: newProtocolIds }
                                    );
                                } else {
                                    // Innerface does not have this protocol explicit ID. No update needed.
                                }

                            } catch (e) { console.error("Failed to sync/log system event", e); }
                        }
                    }
                }
            }

            const data = {
                title,
                description,
                hover, // Include hover in submission
                group,
                icon,
                action,
                xp: Number(xp),
                weight: Number(xp) / 100, // Derived weight for backward compatibility
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

    const handleUpdateGroupIcon = async (groupName: string, icon: string) => {
        await updateGroupMetadata(groupName, { icon });
        setEditingGroupIcon(null);
    };

    const handleUpdateGroupColor = async (groupName: string, color: string) => {
        await updateGroupMetadata(groupName, { color });
        setEditingGroupColor(null);
        setIsGroupColorPickerOpen(false);
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

    const toggleTarget = (id: string | number) => {
        setTargets(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
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
            title={protocolId ? 'Edit Action' : 'Add Action'}
            onSubmit={handleSubmit}
            footer={
                <>
                    {protocolId ? (
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
                            {protocolId ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </>
            }
        >
            <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto custom-scrollbar px-1">
                <div className="flex flex-col gap-1.5">
                    <InputLabel label="Title" />
                    <Input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Morning Meditation"
                        required
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <InputLabel label="Description" />
                    <Input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="e.g. 10 minutes of mindfulness"
                    />
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
                                                if (!tempGroupColor) setTempGroupColor('#e2b714');
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
                <div className="flex flex-col gap-5">
                    {/* XP Reward Row */}
                    <div className="flex flex-col gap-3">
                        <InputLabel label="XP Reward" />

                        {/* Presets */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setXp('1')}
                                className={`px-2 py-3 rounded-xl border text-[10px] font-mono uppercase tracking-wide transition-all ${xp === '1' ? 'bg-[#e2b714] border-[#e2b714] text-bg-primary font-bold shadow-[0_0_15px_rgba(226,183,20,0.3)]' : 'bg-sub-alt border-transparent text-sub hover:text-text-primary hover:bg-sub'}`}
                            >
                                Easy: 1 XP
                            </button>
                            <button
                                type="button"
                                onClick={() => setXp('5')}
                                className={`px-2 py-3 rounded-xl border text-[10px] font-mono uppercase tracking-wide transition-all ${xp === '5' ? 'bg-[#e2b714] border-[#e2b714] text-bg-primary font-bold shadow-[0_0_15px_rgba(226,183,20,0.3)]' : 'bg-sub-alt border-transparent text-sub hover:text-text-primary hover:bg-sub'}`}
                            >
                                Medium: 5 XP
                            </button>
                            <button
                                type="button"
                                onClick={() => setXp('20')}
                                className={`px-2 py-3 rounded-xl border text-[10px] font-mono uppercase tracking-wide transition-all ${xp === '20' ? 'bg-[#e2b714] border-[#e2b714] text-bg-primary font-bold shadow-[0_0_15px_rgba(226,183,20,0.3)]' : 'bg-sub-alt border-transparent text-sub hover:text-text-primary hover:bg-sub'}`}
                            >
                                Hard: 20 XP
                            </button>
                        </div>

                        {/* Separator */}
                        <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-white/10"></div>
                            <span className="flex-shrink-0 mx-2 text-[9px] text-sub/50 uppercase tracking-widest font-mono">or enter manually</span>
                            <div className="flex-grow border-t border-white/10"></div>
                        </div>

                        {/* Manual Input */}
                        <Input
                            type="number"
                            value={xp}
                            onChange={e => setXp(e.target.value)}
                            step="1"
                            min="1"
                            className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center h-[42px] text-lg font-mono font-bold"
                        />
                    </div>

                    {/* Style Row (Color & Icon) */}
                    <div className="flex gap-4">
                        {/* Color */}
                        <div className="w-[80px] flex flex-col gap-1.5 relative">
                            <InputLabel label="Color" />
                            <button
                                type="button"
                                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                                className="h-[42px] w-full bg-sub-alt rounded-lg border border-transparent hover:bg-sub focus:border-white/5 transition-colors flex items-center justify-center relative"
                            >
                                <div
                                    className="w-5 h-5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)] transition-transform duration-200 active:scale-90"
                                    style={{ backgroundColor: color }}
                                />
                            </button>

                            {/* Color Dropdown */}
                            {isColorPickerOpen && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-[180px] z-50 py-2 bg-bg-secondary border border-white/5 rounded-xl shadow-2xl flex flex-wrap justify-center gap-2 animate-in fade-in zoom-in-95 duration-200 p-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                                    {PRESET_COLORS.map((preset: string) => (
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

                            {isColorPickerOpen && (
                                <div className="fixed inset-0 z-40" onClick={() => setIsColorPickerOpen(false)} />
                            )}
                        </div>

                        {/* Icon & Picker */}
                        <div className="w-[80px] flex flex-col gap-1.5 relative">
                            <InputLabel label="Icon" />
                            <Popover.Root open={isIconPickerOpen} onOpenChange={setIsIconPickerOpen}>
                                <Popover.Trigger asChild>
                                    <div className="relative group/icon bg-sub-alt rounded-lg h-[42px] transition-colors duration-200 focus-within:bg-sub border border-transparent focus-within:border-white/5 cursor-pointer flex items-center justify-center"
                                        onClick={() => setIsIconPickerOpen(true)}
                                    >
                                        <div
                                            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-colors duration-200"
                                            style={{ color: color }}
                                        >
                                            <FontAwesomeIcon icon={getMappedIcon(icon)} className="text-xl" />
                                        </div>
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
                                            {ICON_PRESETS.map((preset: string) => (
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
                </div>

                <div className="flex flex-col gap-2">
                    <InputLabel label="Affects Powers" />
                    <div className="bg-sub-alt/30 rounded-xl p-3 border border-white/5 h-[300px] flex flex-col gap-3">
                        {/* Search Input */}
                        <Input
                            type="text"
                            placeholder="Search powers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon={faSearch}
                        />

                        {/* Scrollable List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col gap-1">
                                {(() => {
                                    const filteredInnerfaces = innerfaces.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

                                    if (filteredInnerfaces.length === 0) {
                                        return <div className="w-full text-center py-8 text-sub/40 italic text-xs">No innerfaces found</div>;
                                    }

                                    const groupedInnerfaces: Record<string, typeof innerfaces> = {};
                                    filteredInnerfaces.forEach(i => {
                                        const g = i.group || 'ungrouped';
                                        if (!groupedInnerfaces[g]) groupedInnerfaces[g] = [];
                                        groupedInnerfaces[g].push(i);
                                    });

                                    const sortedGroups = Object.keys(groupedInnerfaces).sort((a, b) => {
                                        if (a === 'ungrouped') return 1;
                                        if (b === 'ungrouped') return -1;
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
                                                {groupedInnerfaces[groupName].map(innerface => {
                                                    const isActive = targets.includes(innerface.id);
                                                    return (
                                                        <TooltipProvider key={innerface.id} delayDuration={300}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleTarget(innerface.id)}
                                                                        className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all font-mono text-[10px] uppercase font-bold tracking-wider ${isActive
                                                                            ? ''
                                                                            : 'bg-sub-alt border-transparent text-sub hover:text-text-primary hover:bg-sub'
                                                                            }`}
                                                                        style={isActive ? {
                                                                            backgroundColor: `${innerface.color}33`,
                                                                            color: innerface.color,
                                                                            boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
                                                                            borderColor: 'transparent'
                                                                        } : undefined}
                                                                    >
                                                                        <span style={{ color: isActive ? 'currentColor' : innerface.color }}>
                                                                            {renderIcon(innerface.icon)}
                                                                        </span>
                                                                        {innerface.name.split('.')[0]}
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top">
                                                                    <span className="font-mono text-xs">{innerface.hover || innerface.name}</span>
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
        </Modal >
    );
}
