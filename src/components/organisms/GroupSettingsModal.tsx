import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../ui/molecules/Modal';
import { Input } from '../ui/molecules/Input';
import { Button } from '../ui/atoms/Button';
import { useAuth } from '../../contexts/AuthProvider';
import { useMetadataStore } from '../../stores/metadataStore';
import { usePersonalityStore } from '../../stores/personalityStore';
import { getMappedIcon, ICON_PRESETS } from '../../utils/iconMapper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { PRESET_COLORS, GROUP_CONFIG } from '../../constants/common';
import * as Popover from '@radix-ui/react-popover';

interface GroupSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupName: string;
}

const InputLabel = ({ label }: { label: string }) => (
    <label className="text-[10px] text-main font-mono font-bold uppercase tracking-[0.2em] opacity-90 px-1">
        {label}
    </label>
);

export function GroupSettingsModal({ isOpen, onClose, groupName }: GroupSettingsModalProps) {
    const { user } = useAuth();
    const { activePersonalityId } = usePersonalityStore();
    const { updateGroupMetadata, renameGroup, groupsMetadata } = useMetadataStore();

    const [name, setName] = useState('');
    const [icon, setIcon] = useState('');
    const [color, setColor] = useState('');
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

    useEffect(() => {
        if (isOpen && groupName) {
            setName(groupName);
            const metadata = groupsMetadata[groupName];
            const config = GROUP_CONFIG[groupName];

            setIcon(metadata?.icon || (config ? config.icon.iconName : 'brain'));
            setColor(metadata?.color || config?.color || '#e2b714');
        }
    }, [isOpen, groupName, groupsMetadata]);

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !activePersonalityId) return;

        // 1. Rename if changed
        if (name.trim() !== groupName && name.trim() !== '') {
            await renameGroup(user.uid, activePersonalityId, groupName, name.trim());
        }

        // 2. Update Metadata (use new name if renamed, otherwise old name)
        const targetName = name.trim() !== '' ? name.trim() : groupName;
        await updateGroupMetadata(user.uid, activePersonalityId, targetName, {
            icon,
            color
        });

        onClose();
    };



    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Edit Group: ${groupName}`}
            onSubmit={handleSave}
            footer={
                <div className="flex items-center gap-2 ml-auto">
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
                        Save Changes
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-5">
                {/* Name Input */}
                <div className="flex flex-col gap-1.5">
                    <InputLabel label="Group Name" />
                    <Input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Health"
                        required
                    />
                    <p className="text-[10px] text-sub italic px-1">
                        Renaming will update all associated protocols and innerfaces.
                    </p>
                </div>

                <div className="flex gap-4">
                    {/* Icon Input & Picker */}
                    <div className="w-24 flex flex-col gap-1.5 relative">
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
                                            // Relaxed length limit to allow typing names like 'physical', but constrain emojis if needed
                                            // Emojis are usually length 1-2. Preset names are longer.
                                            // Let's just allow typing.
                                            setIcon(val);
                                        }}
                                        className={`text-center text-lg p-0 h-[42px] relative z-10 ${getMappedIcon(icon) ? '!text-transparent !caret-text-primary' : ''} !bg-transparent focus:!bg-transparent !border-none outline-none cursor-pointer`}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent trigger if we want to type? 
                                            // Actually user wants "click on Icon input" to open picker.
                                            // If we want typing, focus logic might need to be careful.
                                            // Let's open picker on click, typing still works if focused.
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

                    {/* Color Picker */}
                    <div className="flex flex-col gap-1.5 relative">
                        <InputLabel label="Color" />
                        <Popover.Root open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
                            <Popover.Trigger asChild>
                                <button
                                    type="button"
                                    className="h-[42px] w-[50px] bg-sub-alt rounded-lg border border-transparent hover:bg-sub focus:border-white/5 transition-colors flex items-center justify-center relative cursor-pointer outline-none"
                                >
                                    <div
                                        className="w-5 h-5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)] transition-transform duration-200 active:scale-90"
                                        style={{ backgroundColor: color }}
                                    />
                                </button>
                            </Popover.Trigger>
                            <Popover.Portal>
                                <Popover.Content
                                    className="z-[100] p-2 bg-sub-alt/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col gap-2 min-w-[124px] animate-in fade-in zoom-in-95 duration-200"
                                    sideOffset={5}
                                    align="start"
                                >
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[9px] font-mono text-sub uppercase">Preset</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsColorPickerOpen(false)}
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
                                                    setColor(c);
                                                    setIsColorPickerOpen(false);
                                                }}
                                                className={`w-5 h-5 rounded-full transition-transform hover:scale-125 hover:ring-2 hover:ring-white/30 cursor-pointer ${color === c ? 'ring-2 ring-white/50' : ''}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                    <Popover.Arrow className="fill-current text-white/10" />
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
