import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/molecules/Modal';
import { Input } from '../../../components/ui/molecules/Input';
import { Button } from '../../../components/ui/atoms/Button';
import { useAuth } from '../../../contexts/AuthProvider';
import { useMetadataStore } from '../../../stores/metadataStore';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { getMappedIcon } from '../../../utils/iconMapper';
// import type { Innerface } from '../../../pages/protocols/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { PRESET_COLORS } from '../../../constants/common';

interface InnerfaceSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    innerfaceId?: number | string | null;
}


export function InnerfaceSettingsModal({ isOpen, onClose, innerfaceId }: InnerfaceSettingsModalProps) {
    const { user } = useAuth();
    const { innerfaces, addInnerface, updateInnerface, deleteInnerface } = useMetadataStore();
    const { activePersonalityId } = usePersonalityStore();

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('🔹');
    const [initialScore, setInitialScore] = useState('5.00');
    const [color, setColor] = useState('#e2b714');
    const [hover, setHover] = useState('');

    // UI State
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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
            }
        } else {
            // Reset for new
            setName('');
            setDescription('');
            setIcon('🔹');
            setInitialScore('5.00');
            setColor('#e2b714');
            setHover('');
            setIsConfirmingDelete(false);
        }
    }, [isOpen, innerfaceId, innerfaces]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !activePersonalityId) return;

        const fullName = description ? `${name}. ${description}` : name;
        const newInitialScore = Number(initialScore);
        const data: any = {
            name: fullName,
            icon,
            initialScore: newInitialScore,
            color,
            hover
        };

        if (innerfaceId) {
            const existing = innerfaces.find(i => i.id === innerfaceId);
            // If initial score changed, update versionTimestamp to trigger Hard Reset
            if (existing && existing.initialScore !== newInitialScore) {
                data.versionTimestamp = new Date().toISOString();
            }
            await updateInnerface(user.uid, activePersonalityId, innerfaceId, data);
        } else {
            // For new ones, set versionTimestamp to current time 
            data.versionTimestamp = new Date().toISOString();
            await addInnerface(user.uid, activePersonalityId, data);
        }
        onClose();
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

        await deleteInnerface(user.uid, activePersonalityId, innerfaceId);
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
                            {innerfaceId ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </>
            }
        >
            <div className="flex flex-col gap-5">
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

                <div className="flex gap-4">
                    <div className="w-32 flex flex-col gap-1.5">
                        <InputLabel label="Starting Point" />
                        <Input
                            type="number"
                            value={initialScore}
                            onChange={e => setInitialScore(e.target.value)}
                            onBlur={() => {
                                const num = parseFloat(initialScore.toString()); // Ensure it's treated as value
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

                    <div className="w-16 flex flex-col gap-1.5">
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
                                    // Take the last character entered (replace mode) 
                                    // or just allow standard typing if empty.
                                    // Using slice(-2) allows for surrogate pairs (emojis)
                                    const val = e.target.value;
                                    const newVal = val.length > 2 ? val.slice(-2) : val;
                                    setIcon(newVal);
                                }}
                                className={`text-center text-lg p-0 h-[42px] relative z-10 ${getMappedIcon(icon) ? '!text-transparent !caret-text-primary' : ''} !bg-transparent focus:!bg-transparent !border-none outline-none`}
                                maxLength={5} // Allow typing to trigger slice logic
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <InputLabel label="Hover Text" />
                    <Input
                        type="text"
                        value={hover}
                        onChange={e => setHover(e.target.value)}
                        placeholder="Tooltip text..."
                    />
                </div>
            </div>
        </Modal>
    );
}
