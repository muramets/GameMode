import { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faThumbtack, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useMetadataStore } from '../../../stores/metadataStore';
import { useAuth } from '../../../contexts/AuthProvider';
import { renderIcon } from '../../../utils/iconMapper';
import { Input } from '../../../components/ui/molecules/Input';
import { Button } from '../../../components/ui/atoms/Button';
import { Modal } from '../../../components/ui/molecules/Modal';

interface AddQuickActionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddQuickActionModal({ isOpen, onClose }: AddQuickActionModalProps) {
    const { user } = useAuth();
    const { protocols, pinnedProtocolIds, togglePinnedProtocol } = useMetadataStore();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProtocols = useMemo(() => {
        if (!searchQuery.trim()) return protocols;
        return protocols.filter(p =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.group?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [protocols, searchQuery]);

    const handleTogglePin = (protocolId: string | number) => {
        if (!user?.uid) return;
        togglePinnedProtocol(user.uid, protocolId.toString());
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Quick Action"
        >
            <div className="flex flex-col h-[60vh]">
                <p className="text-sm text-sub font-mono -mt-2 mb-4">Pin your most used protocols for quick access.</p>

                {/* Search */}
                <div className="sticky top-0 z-10 bg-bg-primary pt-1 pb-3">
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search protocols..."
                        icon={faSearch}
                        fullWidth
                        autoFocus
                    />
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 space-y-2 custom-scrollbar pr-1 pb-2">
                    {filteredProtocols.length === 0 ? (
                        <div className="py-12 text-center text-sub/50 font-mono text-xs italic">
                            No protocols found matching "{searchQuery}"
                        </div>
                    ) : (
                        filteredProtocols.map(protocol => {
                            const isPinned = pinnedProtocolIds.includes(protocol.id.toString());
                            const baseColor = protocol.color || '#98c379';

                            return (
                                <div
                                    key={protocol.id}
                                    className={`flex items-center justify-between p-3 rounded-xl transition-all group border ${isPinned
                                        ? 'bg-sub-alt/30 border-main/20'
                                        : 'hover:bg-sub-alt border-transparent'
                                        }`}
                                >
                                    {/* Left: Icon + Info */}
                                    <div className="flex items-center gap-4 min-w-0">
                                        {/* Icon Box */}
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-sm"
                                            style={{
                                                backgroundColor: `${baseColor}15`,
                                                color: baseColor
                                            }}
                                        >
                                            <span className="flex items-center justify-center opacity-90 text-sm">
                                                {renderIcon(protocol.icon)}
                                            </span>
                                        </div>

                                        {/* Text Info */}
                                        <div className="flex flex-col min-w-0 gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold font-mono text-sm tracking-tight ${isPinned ? 'text-main' : 'text-text-primary'}`}>
                                                    {protocol.title}
                                                </span>
                                                {protocol.group && (
                                                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-sub font-mono font-bold">
                                                        {protocol.group}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-sub truncate font-mono">
                                                {protocol.description || protocol.hover || "No description"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Action Button */}
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleTogglePin(protocol.id)}
                                        variant="primary"
                                        className={`min-w-[80px] h-[32px] text-[10px] uppercase font-bold tracking-wider transition-all duration-200 focus:ring-0 ${!isPinned && 'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'
                                            }`}
                                        leftIcon={<FontAwesomeIcon icon={isPinned ? faCheck : faThumbtack} />}
                                    >
                                        {isPinned ? 'Added' : 'Add'}
                                    </Button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer - Moved inside to control spacing/separator interaction */}
                <div className="w-full pt-4 mt-2 border-t border-white/5 text-xs text-sub text-center font-mono">
                    Selected actions will appear on your dashboard.
                </div>
            </div>
        </Modal>
    );
}
