import { useState, useEffect, useMemo } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../ui/molecules/Modal';
import { Input } from '../ui/molecules/Input';
import { Button } from '../ui/atoms/Button';
import { useAuth } from '../../contexts/AuthProvider';
import { useTeamStore } from '../../stores/teamStore';
import { useMetadataStore } from '../../stores/metadataStore';
import { usePersonalityStore } from '../../stores/personalityStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTrash,
    faExclamationTriangle,
    faUser,
    faCopy,
    faLink,
    faCheck,
    faSearch,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import { PRESET_COLORS } from '../../constants/common';
import * as Popover from '@radix-ui/react-popover';
import { getMappedIcon, renderIcon } from '../../utils/iconMapper';
import type { RoleTemplate } from '../../types/team';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/atoms/Tooltip';
import { CollapsibleSection } from '../ui/molecules/CollapsibleSection';

interface RoleSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string | null;
    roleId: string | null;
}

// Moved outside to avoid recreating on each render
const InputLabel = ({ label }: { label: string }) => (
    <label className="text-[10px] text-main font-mono font-bold uppercase tracking-[0.2em] opacity-90 px-1">
        {label}
    </label>
);

type SelectionTab = 'protocols' | 'innerfaces' | 'states';

export function RoleSettingsModal({ isOpen, onClose, teamId, roleId }: RoleSettingsModalProps) {
    const { user } = useAuth();
    const { teams, roles, createRole, updateRole, deleteRole, generateInviteLink } = useTeamStore();
    const {
        innerfaces,
        protocols,
        states,
        groupsMetadata,
        groupOrder,
        pinnedProtocolIds
    } = useMetadataStore();
    const { personalities, activePersonalityId } = usePersonalityStore();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('user');
    const [color, setColor] = useState('#e2b714');

    const [selectedInnerfaces, setSelectedInnerfaces] = useState<Set<string>>(new Set());
    const [selectedProtocols, setSelectedProtocols] = useState<Set<string>>(new Set());
    const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());

    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // UI state for composition
    const [activeTab, setActiveTab] = useState<SelectionTab>('protocols');
    const [searchQuery, setSearchQuery] = useState('');

    const team = teamId ? teams.find(t => t.id === teamId) : null;
    const role = teamId && roleId ? roles[teamId]?.find(r => r.id === roleId) : null;
    const isOwner = team ? team.ownerId === user?.uid : true;

    useEffect(() => {
        if (isOpen && roleId && role) {
            setName(role.name);
            setDescription(role.description || '');
            setIcon(role.icon || 'user');
            setColor(role.themeColor || '#e2b714');

            // Load template selections
            const template = role.templateData;
            if (template) {
                setSelectedInnerfaces(new Set(template.innerfaces?.map(i => i.id.toString()) || []));
                setSelectedProtocols(new Set(template.protocols?.map(p => p.id.toString()) || []));
                setSelectedStates(new Set(template.states?.map(s => s.id) || []));
            }
        } else if (isOpen && !roleId) {
            // Create mode - start with nothing selected (as requested)
            setName('');
            setDescription('');
            setIcon('user');
            setColor('#e2b714');
            setSelectedInnerfaces(new Set());
            setSelectedProtocols(new Set());
            setSelectedStates(new Set());
        }
        setIsConfirmingDelete(false);
        setIsColorPickerOpen(false);
        setInviteLink(null);
        setCopied(false);
        setSearchQuery('');
        setActiveTab('protocols');
    }, [isOpen, roleId, role]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim() || !teamId) return;

        setIsLoading(true);
        try {
            // Filter groups to only include those that are used by selected protocols
            const selectedProtocolObjs = protocols.filter(p => selectedProtocols.has(p.id.toString()));
            const usedGroupNames = new Set(selectedProtocolObjs.map(p => p.group).filter(Boolean) as string[]);

            const filteredGroupsMetadata = Object.fromEntries(
                Object.entries(groupsMetadata).filter(([name]) => usedGroupNames.has(name))
            );
            const filteredGroupOrder = groupOrder.filter(name => usedGroupNames.has(name));

            const template: RoleTemplate = {
                innerfaces: innerfaces.filter(i => selectedInnerfaces.has(i.id.toString())),
                protocols: selectedProtocolObjs,
                states: states.filter(s => selectedStates.has(s.id)),
                groups: filteredGroupsMetadata,
                groupOrder: filteredGroupOrder,
                innerfaceGroupOrder: [],
                pinnedProtocolIds: pinnedProtocolIds.filter(id => selectedProtocols.has(id))
            };

            const data = {
                name: name.trim(),
                description: description.trim(),
                icon,
                themeColor: color,
                templateData: template
            };

            if (roleId) {
                await updateRole(teamId, roleId, data);
            } else {
                await createRole(teamId, data);
            }
            onClose();
        } catch (err) {
            console.error('Failed to save role:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!teamId || !roleId || !user) return;

        if (!isConfirmingDelete) {
            setIsConfirmingDelete(true);
            setTimeout(() => setIsConfirmingDelete(false), 3000);
            return;
        }

        setIsLoading(true);
        try {
            await deleteRole(teamId, roleId);
            onClose();
        } catch (err) {
            console.error('Failed to delete role:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const isSynced = useMemo(() => {
        if (innerfaces.length === 0 && protocols.length === 0 && states.length === 0) return false;

        const allInnerfacesSelected = innerfaces.every(i => selectedInnerfaces.has(i.id.toString()));
        const allProtocolsSelected = protocols.every(p => selectedProtocols.has(p.id.toString()));
        const allStatesSelected = states.every(s => selectedStates.has(s.id));

        return allInnerfacesSelected && allProtocolsSelected && allStatesSelected;
    }, [innerfaces, protocols, states, selectedInnerfaces, selectedProtocols, selectedStates]);

    const handlePersonalitySync = () => {
        if (isSynced) {
            // If already synced, clicking clears all (acting as a toggle)
            setSelectedInnerfaces(new Set());
            setSelectedProtocols(new Set());
            setSelectedStates(new Set());
            return;
        }

        // Copy current personality's items
        setSelectedInnerfaces(new Set(innerfaces.map(i => i.id.toString())));
        setSelectedProtocols(new Set(protocols.map(p => p.id.toString())));
        setSelectedStates(new Set(states.map(s => s.id)));

        // Sync settings if not already set
        const activeP = personalities.find(p => p.id === activePersonalityId);
        if (activeP) {
            if (!name) setName(activeP.name);
            if (!description && activeP.description) setDescription(activeP.description);
            if (activeP.icon) setIcon(activeP.icon);
            if (activeP.themeColor) setColor(activeP.themeColor);
        }
    };

    const handleGenerateInvite = async () => {
        if (!teamId || !roleId || !user) return;

        try {
            const link = await generateInviteLink(teamId, roleId, user.uid);
            setInviteLink(link);
        } catch (err) {
            console.error('Failed to generate invite:', err);
        }
    };

    const handleCopyLink = () => {
        if (!inviteLink) return;
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleItem = (id: string, type: SelectionTab) => {
        if (type === 'innerfaces') {
            const next = new Set(selectedInnerfaces);
            if (next.has(id)) next.delete(id); else next.add(id);
            setSelectedInnerfaces(next);
        } else if (type === 'protocols') {
            const next = new Set(selectedProtocols);
            if (next.has(id)) next.delete(id); else next.add(id);
            setSelectedProtocols(next);
        } else if (type === 'states') {
            const next = new Set(selectedStates);
            if (next.has(id)) next.delete(id); else next.add(id);
            setSelectedStates(next);
        }
    };

    // Filtered and grouped items for composition view
    const itemsToRender = useMemo(() => {
        const query = searchQuery.toLowerCase();

        if (activeTab === 'protocols') {
            const filtered = protocols.filter(p => p.title.toLowerCase().includes(query));
            const grouped: Record<string, typeof protocols> = {};
            filtered.forEach(p => {
                const g = p.group || 'ungrouped';
                if (!grouped[g]) grouped[g] = [];
                grouped[g].push(p);
            });
            return Object.entries(grouped);
        } else if (activeTab === 'innerfaces') {
            const filtered = innerfaces.filter(i => i.name.toLowerCase().includes(query));
            const grouped: Record<string, typeof innerfaces> = {};
            filtered.forEach(i => {
                const g = i.group || 'ungrouped';
                if (!grouped[g]) grouped[g] = [];
                grouped[g].push(i);
            });
            return Object.entries(grouped);
        } else {
            const filtered = states.filter(s => s.name.toLowerCase().includes(query));
            return [['states', filtered] as [string, typeof states]];
        }
    }, [activeTab, searchQuery, protocols, innerfaces, states]);

    const iconDef = getMappedIcon(icon);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={roleId ? 'Role Settings' : 'Create Role'}
            onSubmit={handleSubmit}
            className="max-w-xl"
            footer={
                <>
                    {roleId && isOwner ? (
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isLoading}
                            leftIcon={<FontAwesomeIcon icon={isConfirmingDelete ? faExclamationTriangle : faTrash} />}
                            className="text-[10px] uppercase tracking-wider font-bold px-3 py-2"
                        >
                            {isConfirmingDelete ? 'Confirm' : 'Delete'}
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
                            className="font-bold px-6 py-2 rounded-lg text-[10px] uppercase tracking-wider"
                        >
                            {roleId ? 'Save' : 'Create'}
                        </Button>
                    </div>
                </>
            }
        >
            <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto custom-scrollbar px-1">
                {/* Header: Icon, Name, Color */}
                <div className="flex gap-4 items-end">
                    {/* Icon Preview */}
                    <div className="flex flex-col items-center gap-2 mb-0.5">
                        <div
                            className="w-[42px] h-[42px] rounded-xl bg-sub-alt flex items-center justify-center shadow-lg border border-white/5"
                            style={{ color }}
                        >
                            {iconDef ? (
                                <FontAwesomeIcon icon={iconDef} className="text-lg" />
                            ) : (
                                <FontAwesomeIcon icon={faUser} className="text-lg" />
                            )}
                        </div>
                    </div>

                    {/* Name */}
                    <div className="flex-1 flex flex-col gap-1.5">
                        <InputLabel label="Role Name" />
                        <Input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Backend Dev, Designer..."
                            required
                        />
                    </div>

                    {/* Color Spinner/Picker */}
                    <div className="w-[60px] flex flex-col gap-1.5 relative">
                        <InputLabel label="Color" />
                        <Popover.Root open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
                            <Popover.Trigger asChild>
                                <button
                                    type="button"
                                    className="h-[42px] w-full bg-sub-alt rounded-lg border border-transparent hover:bg-sub transition-colors flex items-center justify-center cursor-pointer"
                                >
                                    <div
                                        className="w-5 h-5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)]"
                                        style={{ backgroundColor: color }}
                                    />
                                </button>
                            </Popover.Trigger>

                            <Popover.Portal>
                                <Popover.Content
                                    className="z-[100] p-2 bg-sub-alt/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col gap-2 min-w-[150px] animate-in fade-in zoom-in-95 duration-200"
                                    sideOffset={8}
                                    align="end"
                                >
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[9px] font-mono text-sub uppercase">Select Color</span>
                                        <button type="button" onClick={() => setIsColorPickerOpen(false)} className="text-sub hover:text-text-primary">
                                            <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-1.5 p-1">
                                        {PRESET_COLORS.map((preset: string) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => {
                                                    setColor(preset);
                                                    setIsColorPickerOpen(false);
                                                }}
                                                className={`w-6 h-6 rounded-full hover:scale-125 transition-transform shadow-sm relative ${color === preset ? 'ring-2 ring-white/50' : ''}`}
                                                style={{ backgroundColor: preset }}
                                            />
                                        ))}
                                    </div>
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>
                    </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                    <InputLabel label="Description" />
                    <Input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="What skills does this role develop?"
                    />
                </div>

                {/* Template Builder Section (Refined Composition View) */}
                <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center justify-between">
                        <InputLabel label="Template Contents" />
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant={isSynced ? "primary" : "neutral"}
                                size="sm"
                                onClick={handlePersonalitySync}
                                leftIcon={<FontAwesomeIcon icon={isSynced ? faCheck : faCopy} />}
                                className={`text-[8px] uppercase tracking-[0.15em] font-bold py-1.5 rounded-full w-[90px] justify-center ${isSynced
                                    ? "shadow-[0_0_10px_rgba(226,183,20,0.3)]"
                                    : "opacity-50"
                                    }`}
                            >
                                {isSynced ? "COPIED" : "COPY ALL"}
                            </Button>

                            <div className="bg-sub-alt rounded-lg p-0.5 flex gap-1 ml-2">
                                {(['protocols', 'innerfaces', 'states'] as SelectionTab[]).map(tab => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => {
                                            setActiveTab(tab);
                                            setSearchQuery('');
                                        }}
                                        className={`px-2 py-1 rounded-md text-[10px] font-mono uppercase font-bold transition-all ${activeTab === tab ? 'bg-sub text-text-primary shadow-sm' : 'text-sub hover:text-text-primary'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-sub-alt/30 rounded-xl p-3 border border-white/5 h-[280px] flex flex-col gap-3">
                        {/* Search Input */}
                        <Input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon={faSearch}
                            className="!bg-sub-alt/50"
                        />

                        {/* Scrollable List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            <div className="flex flex-col gap-1">
                                {itemsToRender.length === 0 || (itemsToRender.length === 1 && itemsToRender[0][1].length === 0) ? (
                                    <div className="w-full text-center py-12 text-sub/40 italic text-xs font-mono">
                                        No {activeTab} found
                                    </div>
                                ) : (
                                    itemsToRender.map(([groupName, items]) => {
                                        if (items.length === 0) return null;
                                        return (
                                            <CollapsibleSection
                                                key={groupName}
                                                title={groupName === 'states' ? 'All States' : groupName}
                                                variant="mini"
                                                defaultOpen={true}
                                                className="mb-2"
                                            >
                                                <div className="flex flex-wrap gap-2 pt-1 pb-2">
                                                    {items.map((item: any) => {
                                                        const itemId = item.id.toString();
                                                        const isSelected = (
                                                            (activeTab === 'protocols' && selectedProtocols.has(itemId)) ||
                                                            (activeTab === 'innerfaces' && selectedInnerfaces.has(itemId)) ||
                                                            (activeTab === 'states' && selectedStates.has(itemId))
                                                        );
                                                        const itemColor = item.color || item.themeColor || 'var(--text-primary)';
                                                        const itemLabel = item.title || item.name || '';

                                                        return (
                                                            <TooltipProvider key={itemId} delayDuration={300}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleItem(itemId, activeTab)}
                                                                            className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all font-mono text-[10px] uppercase font-bold tracking-wider ${isSelected
                                                                                ? ''
                                                                                : 'bg-sub-alt border-transparent text-sub hover:border-white/10 hover:bg-sub'
                                                                                }`}
                                                                            style={isSelected ? {
                                                                                backgroundColor: `${itemColor}33`,
                                                                                color: itemColor,
                                                                                boxShadow: `0 4px 8px rgba(0,0,0,0.15)`,
                                                                                borderColor: `${itemColor}44`
                                                                            } : undefined}
                                                                        >
                                                                            <span style={{ color: isSelected ? 'currentColor' : itemColor }} className="text-xs">
                                                                                {renderIcon(item.icon || (activeTab === 'states' ? '🔥' : activeTab === 'innerfaces' ? '🧊' : '📄'))}
                                                                            </span>
                                                                            <span className="truncate max-w-[120px]">
                                                                                {itemLabel.split('.')[0]}
                                                                            </span>
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top">
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span className="font-bold text-[10px] uppercase tracking-wider">{itemLabel}</span>
                                                                            {(item.description || item.hover) && (
                                                                                <span className="text-[10px] opacity-70 font-mono text-center">
                                                                                    {item.description || item.hover}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        );
                                                    })}
                                                </div>
                                            </CollapsibleSection>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Invite Link Section (Edit mode only) */}
                {roleId && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-white/5 mt-2">
                        <InputLabel label="Invite Link" />
                        {inviteLink ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="text"
                                    value={inviteLink}
                                    readOnly
                                    className="text-xs font-mono !bg-sub-alt/50"
                                />
                                <Button
                                    type="button"
                                    variant="neutral"
                                    size="sm"
                                    onClick={handleCopyLink}
                                    leftIcon={<FontAwesomeIcon icon={copied ? faCheck : faCopy} />}
                                    className="shrink-0"
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="neutral"
                                size="sm"
                                onClick={handleGenerateInvite}
                                leftIcon={<FontAwesomeIcon icon={faLink} />}
                                className="self-start text-[10px] uppercase tracking-wider"
                            >
                                Generate Invite Link
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}

