import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';
import * as Popover from '@radix-ui/react-popover';
import { GroupDropdown } from '../../groups/components/GroupDropdown';
import { Input } from '../../../components/ui/molecules/Input';
import { getMappedIcon } from '../../../utils/iconMapper';
import { GROUP_CONFIG, PRESET_COLORS } from '../../../constants/common';
import { IconPicker } from '../../../components/ui/molecules/IconPicker';

interface ProtocolGroupSelectorProps {
    group: string;
    setGroup: (group: string) => void;
    availableGroups: string[];
    groupsMetadata: Record<string, { icon?: string; color?: string }>;
    onUpdateMetadata: (groupName: string, data: { icon?: string; color?: string }) => Promise<void>;
}

const InputLabel = ({ label }: { label: string }) => (
    <label className="text-[10px] text-main font-mono font-bold uppercase tracking-[0.2em] opacity-90 px-1">
        {label}
    </label>
);

export function ProtocolGroupSelector({
    group,
    setGroup,
    availableGroups,
    groupsMetadata,
    onUpdateMetadata
}: ProtocolGroupSelectorProps) {

    // Local UI State
    const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
    const [editingGroupColor, setEditingGroupColor] = useState<string | null>(null);
    const [tempGroupIcon, setTempGroupIcon] = useState(''); // Used for creating NEW group
    const [tempGroupColor, setTempGroupColor] = useState('');
    const [isGroupColorPickerOpen, setIsGroupColorPickerOpen] = useState(false);
    const [popupAnchor, setPopupAnchor] = useState<HTMLElement | null>(null);

    const handleUpdateGroupIcon = async (groupName: string, icon: string) => {
        await onUpdateMetadata(groupName, { icon });
    };

    const handleUpdateGroupColor = async (groupName: string, color: string) => {
        await onUpdateMetadata(groupName, { color });
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

    return (
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

                            return (
                                <div key={g} className="relative">
                                    <GroupDropdown.Item
                                        label={g}
                                        isActive={group === g}
                                        onClick={() => {
                                            if (!editingGroupColor) {
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
                                        indicatorColor={gColor}
                                        icon={
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <IconPicker
                                                    icon={metadata?.icon || (GROUP_CONFIG[g] ? 'CONFIG' : 'brain')}
                                                    onChange={(icon) => handleUpdateGroupIcon(g, icon)}
                                                    width="w-8"
                                                    height="h-8"
                                                    className="bg-black/40 group-hover/item-container:bg-black/60 hover:scale-105 border border-white/5 hover:border-white/20"
                                                    triggerContent={renderGroupIcon(g)}
                                                />
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
                                icon={
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <IconPicker
                                            icon={tempGroupIcon || 'brain'}
                                            onChange={(icon) => setTempGroupIcon(icon)}
                                            width="w-8"
                                            height="h-8"
                                            className="bg-main/10 border border-main/20 hover:bg-main hover:text-bg-primary transition-all pb-0.5"
                                            triggerContent={
                                                tempGroupIcon ? (
                                                    <FontAwesomeIcon icon={getMappedIcon(tempGroupIcon) || faPlus} className="text-sm" />
                                                ) : (
                                                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                                )
                                            }
                                        />
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
    );
}
