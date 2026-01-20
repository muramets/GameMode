import { Modal } from '../ui/molecules/Modal';
import { Input } from '../ui/molecules/Input';
import { Button } from '../ui/atoms/Button';
import { ConfirmButton } from '../ui/molecules/ConfirmButton';

import { useInnerfaceForm } from '../../features/innerfaces/hooks/useInnerfaceForm';
import { ColorPicker } from '../ui/molecules/ColorPicker';
import { IconPicker } from '../ui/molecules/IconPicker';
import { EntitySelector } from '../ui/organisms/EntitySelector';
import { AppIcon } from '../ui/atoms/AppIcon';
import { InnerfaceGroupSelector } from '../../features/innerfaces/components/InnerfaceGroupSelector';
import { PowerIcon } from '../../features/innerfaces/components/PowerIcon';

interface InnerfaceSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    innerfaceId?: number | string | null;
}

const InputLabel = ({ label }: { label: string }) => (
    <label className="text-[10px] text-main font-mono font-bold uppercase tracking-[0.2em] opacity-90 px-1">
        {label}
    </label>
);

export function InnerfaceSettingsModal({ isOpen, onClose, innerfaceId }: InnerfaceSettingsModalProps) {
    const {
        formState,
        uiState,
        data,
        handlers,
    } = useInnerfaceForm({ innerfaceId, onClose, isOpen });

    const {
        name, setName,
        description, setDescription,
        group, setGroup,
        initialScore, setInitialScore,
        color, setColor,
        icon, setIcon,
        hover, setHover,
        protocolIds,
        category, setCategory
    } = formState;

    const {
        isCoachMode
    } = uiState;

    const { availableGroups, protocols, groupsMetadata } = data;
    const { handleSubmit, handleDelete, toggleProtocol, updateGroupMetadata } = handlers;



    // Prepare items for EntitySelector (Actions/Protocols)
    const protocolItems = protocols.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        group: p.group || 'ungrouped',
        icon: <AppIcon id={p.icon} />,
        color: p.color
    }));

    const protocolIdsSet = new Set(protocolIds);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={innerfaceId ? 'Edit Power' : 'New Power'}
            onSubmit={handleSubmit}
            footer={
                <>
                    {innerfaceId && !isCoachMode ? (
                        <ConfirmButton
                            onConfirm={handleDelete}
                        />
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
            <div
                className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto custom-scrollbar overscroll-contain px-1"
                style={{ transform: 'translateZ(0)', willChange: 'transform' }}
            >
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

                {/* Color & Icon Selectors */}
                <div className="flex gap-4">
                    <div className="flex-1 flex flex-col gap-1.5 relative">
                        <InputLabel label="Color" />
                        <ColorPicker
                            color={color}
                            onChange={setColor}
                            width="w-full"
                        />
                    </div>

                    <div className="flex-1 flex flex-col gap-1.5 relative">
                        <InputLabel label="Icon" />
                        <IconPicker
                            icon={icon}
                            onChange={setIcon}
                            color={color}
                            width="w-full"
                        />
                    </div>
                </div>

                {/* Category Selector */}
                <div className="flex flex-col gap-1.5">
                    <InputLabel label="Category (Optional)" />
                    <div className="flex items-center gap-3">
                        {/* Live Preview Icon */}
                        <PowerIcon
                            icon={icon}
                            color={color}
                            category={category}
                            size="w-12 h-12 text-xl"
                        />

                        {/* Category Buttons */}
                        <div className="flex-1 bg-sub-alt rounded-lg p-1 flex gap-1">
                            <button
                                type="button"
                                onClick={() => setCategory(null)}
                                className={`flex-1 px-3 py-2 rounded-md text-xs font-mono uppercase font-bold transition-all ${category === null
                                    ? 'bg-sub text-text-primary shadow-sm'
                                    : 'text-sub hover:text-text-primary'
                                    }`}
                            >
                                None
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategory('skill')}
                                className={`flex-1 px-3 py-2 rounded-md text-xs font-mono uppercase font-bold transition-all ${category === 'skill'
                                    ? 'bg-sub text-text-primary shadow-sm'
                                    : 'text-sub hover:text-text-primary'
                                    }`}
                            >
                                Skill
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategory('foundation')}
                                className={`flex-1 px-3 py-2 rounded-md text-xs font-mono uppercase font-bold transition-all ${category === 'foundation'
                                    ? 'bg-sub text-text-primary shadow-sm'
                                    : 'text-sub hover:text-text-primary'
                                    }`}
                            >
                                Foundation
                            </button>
                        </div>
                    </div>
                </div>

                <InnerfaceGroupSelector
                    group={group}
                    setGroup={setGroup}
                    availableGroups={availableGroups}
                    groupsMetadata={groupsMetadata}
                    onUpdateMetadata={updateGroupMetadata}

                />

                <div className="flex gap-4">
                    <div className="w-32 flex flex-col gap-1.5">
                        <InputLabel label="Base Level" />
                        <Input
                            type="number"
                            value={initialScore}
                            onChange={e => setInitialScore(e.target.value)}
                            onBlur={() => {
                                const num = parseFloat(initialScore.toString());
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

                <div className="flex flex-col gap-2">
                    <InputLabel label="Composition (Actions)" />
                    <EntitySelector
                        items={protocolItems}
                        selectedIds={protocolIdsSet}
                        onToggle={toggleProtocol}
                        searchPlaceholder="Search actions..."
                        emptyMessage="Created actions will be visible here"
                        height="h-[300px]"
                    />
                </div>
            </div>
        </Modal>
    );
}
