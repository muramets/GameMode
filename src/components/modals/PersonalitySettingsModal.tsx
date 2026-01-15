import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/molecules/Modal';
import { Input } from '../ui/molecules/Input';
import { Button } from '../ui/atoms/Button';
import { useAuth } from '../../contexts/AuthProvider';
import { usePersonalityStore } from '../../stores/personalityStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { PRESET_COLORS } from '../../constants/common';

interface PersonalitySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    personalityId: string | null;
}

export function PersonalitySettingsModal({ isOpen, onClose, personalityId }: PersonalitySettingsModalProps) {
    const { user } = useAuth();
    const { personalities, updatePersonality, deletePersonality, addPersonality, switchPersonality } = usePersonalityStore();

    const [name, setName] = useState('');
    const [icon, setIcon] = useState('user');
    const [color, setColor] = useState('#e2b714');
    const [avatar, setAvatar] = useState(''); // URL for avatar

    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

    useEffect(() => {
        if (isOpen && personalityId) {
            const p = personalities.find(p => p.id === personalityId);
            if (p) {
                setName(p.name);
                setIcon(p.icon || 'user');
                setColor(p.themeColor || '#e2b714');
                setAvatar(p.avatar || '');
            }
        } else if (isOpen && !personalityId) {
            // New Mode
            setName('');
            setIcon('user');
            setColor('#e2b714');
            setAvatar('');
        }
        setIsConfirmingDelete(false);
        setIsColorPickerOpen(false);
    }, [isOpen, personalityId, personalities]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) return;

        const data = {
            name,
            icon,
            themeColor: color,
            avatar
        };

        try {
            if (personalityId) {
                await updatePersonality(user.uid, personalityId, data);
            } else {
                const newId = await addPersonality(user.uid, name, data);
                await switchPersonality(user.uid, newId);
            }
            onClose();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!personalityId || !user) return;

        if (!isConfirmingDelete) {
            setIsConfirmingDelete(true);
            setTimeout(() => setIsConfirmingDelete(false), 3000);
            return;
        }

        await deletePersonality(user.uid, personalityId);
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
            title={personalityId ? 'Personality Settings' : 'Create Personality'}
            onSubmit={handleSubmit}
            footer={
                <>
                    {personalityId ? (
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={handleDelete}
                            leftIcon={<FontAwesomeIcon icon={isConfirmingDelete ? faExclamationTriangle : faTrash} />}
                            className="text-[10px] uppercase tracking-wider font-bold px-3 py-2 transition-all duration-200"
                        >
                            {isConfirmingDelete ? 'Confirm Delete' : 'Delete'}
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
                            disabled={!name.trim()}
                            className="font-bold px-6 py-2 rounded-lg text-[10px] uppercase tracking-wider shadow-[0_0_10px_rgba(226,183,20,0.2)]"
                        >
                            {personalityId ? 'Save' : 'Create'}
                        </Button>
                    </div>
                </>
            }
        >
            <div className="flex flex-col gap-5">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                    <InputLabel label="Name" />
                    <Input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Work, Gaming..."
                        autoFocus
                        required
                    />
                </div>

                <div className="flex gap-4">
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

                    {/* Avatar URL (Optional) */}
                    <div className="flex-1 flex flex-col gap-1.5">
                        <InputLabel label="Avatar URL (Optional)" />
                        <Input
                            type="text"
                            value={avatar}
                            onChange={e => setAvatar(e.target.value)}
                            placeholder="https://..."
                            className="md:text-xs"
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
}
