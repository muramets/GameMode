/**
 * TeamSettingsModal Component
 * 
 * Modal for creating/editing team settings (name, icon, color).
 * Includes members list view and delete functionality for owners.
 */

import { useState, useEffect } from 'react';
import { Modal } from '../ui/molecules/Modal';
import { Input } from '../ui/molecules/Input';
import { Button } from '../ui/atoms/Button';
import { useAuth } from '../../contexts/AuthProvider';
import { useTeamStore } from '../../stores/teamStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faExclamationTriangle, faUsers } from '@fortawesome/free-solid-svg-icons';
import { PRESET_COLORS } from '../../constants/common';
import * as Popover from '@radix-ui/react-popover';
import { getMappedIcon } from '../../utils/iconMapper';

interface TeamSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string | null;
}

// Moved outside to avoid recreating on each render
const InputLabel = ({ label }: { label: string }) => (
    <label className="text-[10px] text-main font-mono font-bold uppercase tracking-[0.2em] opacity-90 px-1">
        {label}
    </label>
);

export function TeamSettingsModal({ isOpen, onClose, teamId }: TeamSettingsModalProps) {
    const { user } = useAuth();
    const { teams, createTeam, updateTeam, deleteTeam } = useTeamStore();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('users');
    const [color, setColor] = useState('#e2b714');

    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const team = teamId ? teams.find(t => t.id === teamId) : null;
    const isOwner = team ? team.ownerId === user?.uid : true;

    useEffect(() => {
        if (isOpen && teamId && team) {
            setName(team.name);
            setDescription(team.description || '');
            setIcon(team.icon || 'users');
            setColor(team.themeColor || '#e2b714');
        } else if (isOpen && !teamId) {
            // Create mode
            setName('');
            setDescription('');
            setIcon('users');
            setColor('#e2b714');
        }
        setIsConfirmingDelete(false);
        setIsColorPickerOpen(false);
    }, [isOpen, teamId, team]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) return;

        setIsLoading(true);
        try {
            const data = {
                name: name.trim(),
                description: description.trim() || undefined,
                icon,
                themeColor: color
            };

            if (teamId) {
                await updateTeam(teamId, data);
            } else {
                await createTeam(user.uid, data);
            }
            onClose();
        } catch (err) {
            console.error('Failed to save team:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!teamId || !user) return;

        if (!isConfirmingDelete) {
            setIsConfirmingDelete(true);
            setTimeout(() => setIsConfirmingDelete(false), 3000);
            return;
        }

        setIsLoading(true);
        try {
            await deleteTeam(user.uid, teamId);
            onClose();
        } catch (err) {
            console.error('Failed to delete team:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const iconDef = getMappedIcon(icon);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={teamId ? 'Team Settings' : 'Create Team'}
            onSubmit={handleSubmit}
            footer={
                <>
                    {teamId && isOwner ? (
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isLoading}
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
                            disabled={!name.trim() || isLoading}
                            className="font-bold px-6 py-2 rounded-lg text-[10px] uppercase tracking-wider shadow-[0_0_10px_rgba(226,183,20,0.2)]"
                        >
                            {teamId ? 'Save' : 'Create'}
                        </Button>
                    </div>
                </>
            }
        >
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar px-1">
                {/* Icon Preview */}
                <div className="flex flex-col items-center gap-2">
                    <div
                        className="w-[60px] h-[60px] rounded-full bg-sub-alt flex items-center justify-center shadow-lg"
                        style={{ color }}
                    >
                        {iconDef ? (
                            <FontAwesomeIcon icon={iconDef} className="text-2xl" />
                        ) : (
                            <FontAwesomeIcon icon={faUsers} className="text-2xl" />
                        )}
                    </div>
                </div>

                <div className="flex gap-4 items-start">
                    {/* Name */}
                    <div className="flex-1 flex flex-col gap-1.5">
                        <InputLabel label="Team Name" />
                        <Input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Engineering, Marketing..."
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

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                    <InputLabel label="Description (Optional)" />
                    <Input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="What's this team about?"
                    />
                </div>

                {/* Members Count (Edit mode only) */}
                {teamId && team && (
                    <div className="flex items-center gap-2 text-sub text-sm mt-2">
                        <FontAwesomeIcon icon={faUsers} className="text-xs opacity-60" />
                        <span>{team.memberUids.length} member{team.memberUids.length !== 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>
        </Modal>
    );
}
