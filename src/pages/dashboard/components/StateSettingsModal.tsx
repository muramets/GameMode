import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/molecules/Modal';
import { Input } from '../../../components/ui/molecules/Input';
import { Button } from '../../../components/ui/atoms/Button';
import { useAuth } from '../../../contexts/AuthProvider';

import { useMetadataStore } from '../../../stores/metadataStore';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { getMappedIcon, renderIcon, ICON_PRESETS } from '../../../utils/iconMapper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faExclamationTriangle, faTimes, faSearch } from '@fortawesome/free-solid-svg-icons';
import { PRESET_COLORS } from '../../../constants/common';
import * as Popover from '@radix-ui/react-popover';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../../../components/ui/atoms/Tooltip';
import { CollapsibleSection } from '../../../components/ui/molecules/CollapsibleSection';

interface StateSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    stateId?: string | null;
}

export function StateSettingsModal({ isOpen, onClose, stateId }: StateSettingsModalProps) {
    const { user } = useAuth();
    const { states, innerfaces, protocols, addState, updateState, deleteState } = useMetadataStore();
    const { activePersonalityId } = usePersonalityStore();

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('🔥');
    const [color, setColor] = useState('#ca4754');
    const [innerfaceIds, setInnerfaceIds] = useState<(string | number)[]>([]);
    const [protocolIds, setProtocolIds] = useState<(string | number)[]>([]);

    // UI State
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'protocols' | 'innerfaces'>('innerfaces');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen && stateId) {
            const state = states.find(s => s.id === stateId);
            if (state) {
                setName(state.name);
                setDescription(state.description || '');
                setIcon(state.icon || '🔥');
                setColor(state.color || '#ca4754');
                setInnerfaceIds(state.innerfaceIds || []);
                setProtocolIds(state.protocolIds || []);
            }
        } else {
            // Reset for new
            setName('');
            setDescription('');
            setIcon('🔥');
            setColor('#ca4754');
            setInnerfaceIds([]);
            setProtocolIds([]);
            setIsConfirmingDelete(false);
            setIsColorPickerOpen(false);
            setIsColorPickerOpen(false);
            setActiveTab('innerfaces');
            setSearchQuery('');
        }
    }, [isOpen, stateId, states]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !activePersonalityId) return;

        const data = {
            name,
            description,
            icon,
            color,
            innerfaceIds,
            protocolIds
        };

        if (stateId) {
            await updateState(user.uid, activePersonalityId, stateId, data);
        } else {
            await addState(user.uid, activePersonalityId, data);
        }
        onClose();
    };

    const handleDelete = async () => {
        if (!stateId || !user || !activePersonalityId) return;

        if (!isConfirmingDelete) {
            setIsConfirmingDelete(true);
            setTimeout(() => setIsConfirmingDelete(false), 3000);
            return;
        }

        await deleteState(user.uid, activePersonalityId, stateId);
        onClose();
    };

    const InputLabel = ({ label }: { label: string }) => (
        <label className="text-[10px] text-main font-mono font-bold uppercase tracking-[0.2em] opacity-90 px-1">
            {label}
        </label>
    );

    const toggleInnerface = (id: string | number) => {
        setInnerfaceIds(prev => {
            const idStr = id.toString();
            const exists = prev.some(prevId => prevId.toString() === idStr);
            if (exists) {
                return prev.filter(prevId => prevId.toString() !== idStr);
            }
            return [...prev, id];
        });
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={stateId ? 'Edit State' : 'Add State'}
            onSubmit={handleSubmit}
            footer={
                <>
                    {stateId ? (
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
                            className="font-bold px-6 py-2 rounded-lg text-[10px] uppercase tracking-wider shadow-[0_0_10px_rgba(202,71,84,0.2)]"
                        >
                            {stateId ? 'Update' : 'Create'}
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
                        placeholder="e.g. Harmony"
                        required
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <InputLabel label="Description" />
                    <Input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="e.g. You're in the right place"
                    />
                </div>

                <div className="flex gap-4">
                    {/* Color */}
                    <div className="w-[60px] flex flex-col gap-1.5 relative">
                        <InputLabel label="Color" />
                        {/* Color Dropdown Popover */}
                        <Popover.Root open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
                            <Popover.Trigger asChild>
                                <button
                                    type="button"
                                    className="h-[42px] w-full bg-sub-alt rounded-lg border border-transparent hover:bg-sub focus:border-white/5 transition-colors flex items-center justify-center relative cursor-pointer"
                                >
                                    <div
                                        className="w-5 h-5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)] transition-transform duration-200 active:scale-90"
                                        style={{ backgroundColor: color }}
                                    />
                                </button>
                            </Popover.Trigger>
                            <Popover.Anchor className="absolute bottom-0 left-0 w-full h-0" />
                            <Popover.Portal>
                                <Popover.Content
                                    className="z-[100] p-2 bg-sub-alt/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col gap-2 min-w-[150px] animate-in fade-in zoom-in-95 duration-200"
                                    sideOffset={5}
                                    align="start"
                                >
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[9px] font-mono text-sub uppercase">Select Color</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsColorPickerOpen(false)}
                                            className="text-sub hover:text-text-primary transition-colors cursor-pointer"
                                        >
                                            <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-1.5 p-1 max-h-[160px] overflow-y-auto custom-scrollbar">
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
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>
                    </div>

                    {/* Icon & Picker */}
                    <div className="w-20 flex flex-col gap-1.5 relative">
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

                {/* Composition Area */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <InputLabel label="Composition" />
                        <div className="bg-sub-alt rounded-lg p-0.5 flex gap-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('innerfaces')}
                                className={`px-2 py-1 rounded-md text-[10px] font-mono uppercase font-bold transition-all ${activeTab === 'innerfaces' ? 'bg-sub text-text-primary shadow-sm' : 'text-sub hover:text-text-primary'}`}
                            >
                                Innerfaces
                            </button>
                            {/* <button
                                type="button"
                                onClick={() => setActiveTab('protocols')}
                                className={`px-2 py-1 rounded-md text-[10px] font-mono uppercase font-bold transition-all ${activeTab === 'protocols' ? 'bg-sub text-text-primary shadow-sm' : 'text-sub hover:text-text-primary'}`}
                            >
                                Protocols
                            </button> */}
                        </div>
                    </div>

                    <div className="bg-sub-alt/30 rounded-xl p-3 border border-white/5 h-[300px] flex flex-col gap-3">
                        {/* Search Input */}
                        <Input
                            type="text"
                            placeholder={activeTab === 'innerfaces' ? "Search innerfaces..." : "Search protocols..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon={faSearch}
                        />

                        {/* Scrollable List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col gap-1">
                                {activeTab === 'protocols' ? (
                                    protocols.length > 0 ? (
                                        (() => {
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

                                            const sortedGroups = Object.keys(groupedProtocols).sort((a, b) => {
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
                                        })()
                                    ) : (
                                        <div className="w-full text-center py-8 text-sub/40 italic text-xs">No protocols found</div>
                                    )
                                ) : (
                                    innerfaces.length > 0 ? (
                                        (() => {
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
                                                            const isActive = innerfaceIds.some(id => id.toString() === innerface.id.toString());
                                                            const iColor = innerface.color || 'var(--text-primary)';
                                                            return (
                                                                <TooltipProvider key={innerface.id} delayDuration={300}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleInnerface(innerface.id)}
                                                                                className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all font-mono text-[10px] uppercase font-bold tracking-wider ${isActive
                                                                                    ? ''
                                                                                    : 'bg-sub-alt border-transparent text-sub hover:text-text-primary hover:bg-sub'
                                                                                    }`}
                                                                                style={isActive ? {
                                                                                    backgroundColor: `${iColor}33`,
                                                                                    color: iColor,
                                                                                    boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
                                                                                    borderColor: 'transparent'
                                                                                } : undefined}
                                                                            >
                                                                                <span style={{ color: isActive ? 'currentColor' : iColor }}>
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
                                        })()
                                    ) : (
                                        <div className="w-full text-center py-8 text-sub/40 italic text-xs">No innerfaces found</div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
