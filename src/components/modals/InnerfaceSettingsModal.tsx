import { Modal } from '../ui/molecules/Modal';
import { Input } from '../ui/molecules/Input';
import { Button } from '../ui/atoms/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useInnerfaceForm } from '../../features/innerfaces/hooks/useInnerfaceForm';
import { ColorPicker } from '../ui/molecules/ColorPicker';
import { IconPicker } from '../ui/molecules/IconPicker';
import { EntitySelector } from '../ui/organisms/EntitySelector';
import { renderIcon } from '../../utils/iconMapper';
import { InnerfaceGroupSelector } from '../../features/innerfaces/components/InnerfaceGroupSelector';

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
        isSubmitting,
        isConfirmingDelete,
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
        icon: renderIcon(p.icon),
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
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isSubmitting}
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
                            disabled={isSubmitting}
                            className="text-[10px] uppercase tracking-wider font-bold px-4 py-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            isLoading={isSubmitting}
                            className="font-bold px-6 py-2 rounded-lg text-[10px] uppercase tracking-wider shadow-[0_0_10px_rgba(226,183,20,0.2)]"
                        >
                            {innerfaceId ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </>
            }
        >
            <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto custom-scrollbar px-1">
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

                {/* Category Selector */}
                <div className="flex flex-col gap-1.5">
                    <InputLabel label="Category (Optional)" />
                    <div className="flex items-center gap-3">
                        {/* Live Preview Icon */}
                        <div
                            className={`w-12 h-12 flex items-center justify-center text-xl shrink-0 transition-all duration-300 ${category === 'foundation'
                                ? 'rounded-[30%_70%_70%_30%/30%_30%_70%_70%]' // Squircle for Foundations
                                : category === 'skill'
                                    ? 'rounded-[50%]' // Circle for Skills
                                    : 'rounded-[20%]' // Rounded square for Uncategorized
                                }`}
                            style={{
                                backgroundColor: `${color}33`,
                                color: color,
                                boxShadow: `0 0 15px ${color}15`
                            }}
                        >
                            {renderIcon(icon)}
                        </div>

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

                    <div className="w-[100px] flex flex-col gap-1.5 relative">
                        <InputLabel label="Color" />
                        <ColorPicker
                            color={color}
                            onChange={setColor}
                        />
                    </div>

                    <div className="w-[100px] flex flex-col gap-1.5 relative">
                        <InputLabel label="Icon" />
                        <IconPicker
                            icon={icon}
                            onChange={setIcon}
                            color={color}
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
                        emptyMessage="No actions found"
                        height="h-[300px]"
                    />
                </div>
            </div>
        </Modal>
    );
}
