import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../components/ui/molecules/Modal';
import { Input } from '../../../components/ui/molecules/Input';
import { Button } from '../../../components/ui/atoms/Button';
import { useAuth } from '../../../contexts/AuthProvider';
import { useMetadataStore } from '../../../stores/metadataStore';
import { renderIcon, getMappedIcon } from '../../../utils/iconMapper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faExclamationTriangle, faPlus, faMinus, faChevronDown, faTimes } from '@fortawesome/free-solid-svg-icons';
import { GROUP_CONFIG, PRESET_COLORS } from '../../../constants/common';
import * as Popover from '@radix-ui/react-popover';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../../../components/ui/atoms/Tooltip';
import { GroupDropdown } from '../../../components/organisms/GroupDropdown';

// 


interface ProtocolSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    protocolId?: number | string | null;
}

export function ProtocolSettingsModal({ isOpen, onClose, protocolId }: ProtocolSettingsModalProps) {
    const { user } = useAuth();
    const { innerfaces, protocols, groupsMetadata, addProtocol, updateProtocol, deleteProtocol, updateGroupMetadata } = useMetadataStore();

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [hover, setHover] = useState(''); // Added hover state
    const [group, setGroup] = useState('');
    const [icon, setIcon] = useState('🔹');
    const [action, setAction] = useState<'+' | '-'>('+');
    const [weight, setWeight] = useState('0.01');
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
    const [isGroupColorPickerOpen, setIsGroupColorPickerOpen] = useState(false);
    const [popupAnchor, setPopupAnchor] = useState<HTMLElement | null>(null);

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
                setWeight(protocol.weight.toString());
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
            setWeight('0.01');
            setTargets([]);
            setColor('#e2b714');
            setIsConfirmingDelete(false);
            setIsGroupDropdownOpen(false);
            setIsColorPickerOpen(false);
            setIsGroupColorPickerOpen(false);
            setEditingGroupColor(null);
            setEditingGroupIcon(null);
        }
    }, [isOpen, protocolId, protocols]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const data = {
            title,
            description,
            hover, // Include hover in submission
            group,
            icon,
            action,
            weight: Number(weight),
            targets,
            color
        };

        if (protocolId) {
            await updateProtocol(user.uid, protocolId, data);
        } else {
            await addProtocol(user.uid, data);
        }
        onClose();
    };

    const handleDelete = async () => {
        if (!protocolId || !user) return;

        if (!isConfirmingDelete) {
            setIsConfirmingDelete(true);
            setTimeout(() => setIsConfirmingDelete(false), 3000);
            return;
        }

        await deleteProtocol(user.uid, protocolId);
        onClose();
    };

    const handleUpdateGroupIcon = async (groupName: string, icon: string) => {
        if (!user) return;
        await updateGroupMetadata(user.uid, groupName, { icon });
        setEditingGroupIcon(null);
    };

    const handleUpdateGroupColor = async (groupName: string, color: string) => {
        if (!user) return;
        await updateGroupMetadata(user.uid, groupName, { color });
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
            title={protocolId ? 'Edit Protocol' : 'Add Protocol'}
            onSubmit={handleSubmit}
            footer={
                <>
                    {protocolId ? (
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={handleDelete}
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
                            className="text-[10px] uppercase tracking-wider font-bold px-4 py-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            className="font-bold px-6 py-2 rounded-lg text-[10px] uppercase tracking-wider shadow-[0_0_10px_rgba(226,183,20,0.2)]"
                        >
                            {protocolId ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </>
            }
        >
            <div className="flex flex-col gap-5">
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
                    <InputLabel label="Hover Text" />
                    <Input
                        type="text"
                        value={hover}
                        onChange={e => setHover(e.target.value)}
                        placeholder="Tooltip text (optional)"
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
                <div className="flex gap-4">
                    {/* Impact */}
                    <div className="w-32 flex flex-col gap-1.5">
                        <InputLabel label="Impact" />
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setAction(action === '+' ? '-' : '+')}
                                className={`w-[42px] h-[42px] shrink-0 rounded-lg flex items-center justify-center transition-colors ${action === '+' ? 'bg-[#98c379]/20 text-[#98c379]' : 'bg-[#ca4754]/20 text-[#ca4754]'}`}
                            >
                                <FontAwesomeIcon icon={action === '+' ? faPlus : faMinus} />
                            </button>
                            <Input
                                type="number"
                                value={weight}
                                onChange={e => setWeight(e.target.value)}
                                step="0.01"
                                min="0"
                                className="flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                    </div>

                    {/* Color */}
                    <div className="w-[60px] flex flex-col gap-1.5 relative">
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
                            <div className="absolute top-[calc(100%+8px)] right-0 w-[180px] z-50 py-2 bg-bg-secondary border border-white/5 rounded-xl shadow-2xl flex flex-wrap justify-center gap-2 animate-in fade-in zoom-in-95 duration-200 p-2 max-h-[160px] overflow-y-auto custom-scrollbar">
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

                    {/* Icon */}
                    <div className="w-20 flex flex-col gap-1.5">
                        <InputLabel label="Icon" />
                        <div className="relative group/icon bg-sub-alt rounded-lg transition-colors duration-200 focus-within:bg-sub border border-transparent focus-within:border-white/5">
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
                                    const newVal = val.length > 2 ? val.slice(-2) : val;
                                    setIcon(newVal);
                                }}
                                className={`text-center text-lg p-0 h-[42px] relative z-10 ${getMappedIcon(icon) ? '!text-transparent !caret-text-primary' : ''} !bg-transparent focus:!bg-transparent !border-none outline-none`}
                                maxLength={5}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <InputLabel label="Affects Innerfaces" />
                    <div className="flex flex-wrap gap-2 py-1">
                        {innerfaces.map(innerface => {
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
                </div>
            </div>
        </Modal >
    );
}
