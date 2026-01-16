import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../ui/molecules/Modal';
import { Input } from '../ui/molecules/Input';
import { Button } from '../ui/atoms/Button';
import { useAuth } from '../../contexts/AuthProvider';
import { usePersonalityStore } from '../../stores/personalityStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faExclamationTriangle, faUser } from '@fortawesome/free-solid-svg-icons';
import { PRESET_COLORS } from '../../constants/common';
import * as Popover from '@radix-ui/react-popover';
import { ImageCropper } from '../ui/molecules/ImageCropper';

// Moved outside to avoid recreating on each render
const InputLabel = ({ label }: { label: string }) => (
    <label className="text-[10px] text-main font-mono font-bold uppercase tracking-[0.2em] opacity-90 px-1">
        {label}
    </label>
);

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

    const [tempImage, setTempImage] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);


    // Sync form state with props when modal opens - intentional pattern for modal forms
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
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
        setTempImage(null);
        setIsCropping(false);
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [isOpen, personalityId, personalities]);

    const handleSubmit = async (e: FormEvent) => {
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                setTempImage(reader.result as string);
                setIsCropping(true);
            };
            reader.readAsDataURL(file);
            // Reset input so same file can be selected again
            e.target.value = '';
        }
    };

    const handleCropComplete = (croppedBase64: string) => {
        setAvatar(croppedBase64);
        setIsCropping(false);
        setTempImage(null);
    };

    // If cropping, show the cropper instead of the normal form
    if (isCropping && tempImage) {
        return (
            <Modal
                isOpen={isOpen}
                onClose={() => { setIsCropping(false); setTempImage(null); }}
                title="Adjust Avatar"
                className="max-w-md"
                footer={
                    <div className="flex items-center justify-end gap-3 w-full">
                        <Button
                            type="button"
                            variant="neutral"
                            size="sm"
                            onClick={() => { setIsCropping(false); setTempImage(null); }}
                            className="text-[10px] uppercase tracking-wider font-bold px-4 py-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => {
                                // Trigger save from cropper - we need a ref or callback
                                const event = new CustomEvent('cropper-save');
                                document.dispatchEvent(event);
                            }}
                            className="font-bold px-6 py-2 rounded-lg text-[10px] uppercase tracking-wider shadow-[0_0_10px_rgba(226,183,20,0.2)] hover:shadow-[0_0_10px_rgba(209,208,197,0.3)] transition-shadow"
                        >
                            Save
                        </Button>
                    </div>
                }
            >
                <ImageCropper
                    imageSrc={tempImage}
                    onCrop={handleCropComplete}
                    onCancel={() => { setIsCropping(false); setTempImage(null); }}
                />
            </Modal>
        );
    }

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
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar px-1">
                {/* Avatar Section - Centered and Large */}
                <div className="flex flex-col items-center gap-2">
                    <InputLabel label="Profile Picture" />
                    <div className="group relative">
                        <div
                            className="relative w-[80px] h-[80px] rounded-full bg-sub-alt cursor-pointer transition-all duration-150 shadow-lg flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-text-primary/50"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />

                            {avatar ? (
                                <img
                                    src={avatar}
                                    alt="Avatar"
                                    className="w-full h-full object-cover transition-all duration-150 group-hover:brightness-110"
                                />
                            ) : (
                                <FontAwesomeIcon
                                    icon={faUser}
                                    className="text-sub text-3xl opacity-50 transition-all duration-150 group-hover:opacity-100 group-hover:text-bg-primary"
                                />
                            )}
                        </div>

                        {/* Delete Button */}
                        {avatar && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setAvatar('');
                                }}
                                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-error text-bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:scale-110 shadow-md"
                                title="Remove avatar"
                            >
                                <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 items-start">
                    {/* Name (Larger width) */}
                    <div className="flex-1 flex flex-col gap-1.5">
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

                    {/* Color */}
                    <div className="w-[60px] flex flex-col gap-1.5 relative">
                        <InputLabel label="Color" />
                        <Popover.Root open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
                            <Popover.Trigger asChild>
                                <button
                                    type="button"
                                    className="h-[42px] w-full bg-sub-alt rounded-lg border border-transparent hover:bg-sub focus:border-white/5 transition-colors flex items-center justify-center relative"
                                >
                                    <div
                                        className="w-5 h-5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)] transition-transform duration-200 active:scale-90"
                                        style={{ backgroundColor: color }}
                                    />
                                </button>
                            </Popover.Trigger>

                            <Popover.Portal>
                                <Popover.Content
                                    className="z-[100] p-2 bg-bg-secondary border border-white/5 rounded-xl shadow-2xl flex flex-wrap justify-center gap-2 animate-in fade-in zoom-in-95 duration-200 w-[180px] max-h-[160px] overflow-y-auto custom-scrollbar"
                                    sideOffset={8}
                                >
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
                                    <Popover.Arrow className="fill-current text-white/5" />
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
