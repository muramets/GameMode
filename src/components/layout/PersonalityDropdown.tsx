import React, { useState } from 'react';
import { usePersonalityStore } from '../../stores/personalityStore';
import { useAuth } from '../../contexts/AuthProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faPlus, faCheck } from '@fortawesome/free-solid-svg-icons';
import { getMappedIcon } from '../../utils/iconMapper';
import { PersonalitySettingsModal } from '../modals/PersonalitySettingsModal';

export function PersonalityDropdown() {
    const { user } = useAuth();
    const { personalities, activePersonalityId, switchPersonality } = usePersonalityStore();
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [editingPersonalityId, setEditingPersonalityId] = useState<string | null>(null);

    const activePersonality = personalities.find(p => p.id === activePersonalityId);

    const handleEdit = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setEditingPersonalityId(id);
        setIsSettingsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingPersonalityId(null);
        setIsSettingsModalOpen(true);
    };

    return (
        <>
            <div className="relative group z-50 font-mono lowercase">
                {/* Trigger Button - Exact MonkeyType Account Button Replica */}
                <button
                    className="grid grid-flow-col items-center gap-[0.33em] outline-none leading-none transition-colors duration-150 text-[1rem]"
                    style={{ color: 'var(--sub-color)' }}
                >
                    <div
                        className="flex items-center justify-center transition-colors duration-150 group-hover:text-[var(--text-color)]"
                        style={{ width: '1.4em', height: '1.4em' }}
                    >
                        {/* Avatar / Icon */}
                        {activePersonality?.avatar ? (
                            <img
                                src={activePersonality.avatar}
                                alt="avatar"
                                className="rounded-full object-cover"
                                style={{ width: '1.1em', height: '1.1em' }}
                            />
                        ) : (() => {
                            const iconDef = getMappedIcon(activePersonality?.icon || 'user');
                            return iconDef ? (
                                <FontAwesomeIcon icon={iconDef} style={{ fontSize: '1em' }} />
                            ) : (
                                <span style={{ fontSize: '1em' }}>{activePersonality?.icon || '👤'}</span>
                            );
                        })()}
                    </div>

                    <span className="mt-[0.1em] transition-colors duration-150 group-hover:text-[var(--text-color)]" style={{ fontSize: '0.75em' }}>
                        {(activePersonality?.name || 'loading...').toLowerCase()}
                    </span>

                    {/* Personality Count Badge (Styled as Level Badge) */}
                    <div
                        className="flex items-center justify-center transition-colors duration-150 group-hover:bg-[var(--text-color)]"
                        style={{
                            fontSize: '0.65em',
                            lineHeight: '0.65em',
                            padding: '0.3em 0.45em',
                            borderRadius: '4px',
                            backgroundColor: 'var(--sub-color)',
                            color: 'var(--bg-color)',
                            alignSelf: 'center',
                            width: 'max-content'
                        }}
                    >
                        {personalities.length}
                    </div>
                </button>

                {/* Dropdown Menu - Exact MonkeyType Replica */}
                <div className="absolute top-[calc(100%+0.5rem)] right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 min-w-[23ch] z-[100] text-[0.75rem]">
                    <div
                        className="flex flex-col rounded-[0.5rem] overflow-hidden"
                        style={{
                            backgroundColor: 'var(--sub-alt-color)',
                            boxShadow: '0 0 0 0.5em var(--bg-color)',
                            gap: '0.25em'
                        }}
                    >
                        {/* Personalities List */}
                        {personalities.map((p, index) => {
                            const isActive = p.id === activePersonalityId;
                            const iconDef = getMappedIcon(p.icon || 'user');

                            return (
                                <div
                                    key={p.id}
                                    onClick={() => switchPersonality(user?.uid || '', p.id)}
                                    className={`
                                        group/item relative flex items-center justify-start text-left cursor-pointer transition-colors duration-100 leading-none
                                        text-[var(--text-color)] hover:text-[var(--bg-color)] hover:bg-[var(--text-color)]
                                        ${index === 0 ? 'rounded-t-[0.5rem]' : ''}
                                    `}
                                    style={{ padding: '0.5em 0' }}
                                >
                                    {/* Icon */}
                                    <div
                                        className="w-[1em] h-[1em] flex items-center justify-center shrink-0 transition-colors opacity-80 group-hover/item:opacity-100"
                                        style={{
                                            color: 'inherit',
                                            marginLeft: '0.9em',
                                            marginRight: '0.7em'
                                        }}
                                    >
                                        {iconDef ? (
                                            <FontAwesomeIcon icon={iconDef} className="text-[1em]" />
                                        ) : (
                                            <span className="text-[1em] leading-none">{p.icon || '👤'}</span>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="flex-1 truncate pt-[0.1em] mr-4">
                                        {p.name.toLowerCase()}
                                    </div>

                                    {/* Settings Gear - Visible on Hover (Before Checkmark) */}
                                    <button
                                        onClick={(e) => handleEdit(e, p.id)}
                                        className="opacity-0 group-hover/item:opacity-100 transition-all ml-1 shrink-0 hover:!text-[var(--main-color)]"
                                        style={{ color: 'var(--bg-color)' }}
                                    >
                                        <FontAwesomeIcon icon={faCog} className="text-[0.8em]" />
                                    </button>

                                    {/* Active Checkmark Indicator (Last) */}
                                    {isActive && (
                                        <div
                                            className="flex items-center justify-center shrink-0"
                                            style={{
                                                marginLeft: '0.5em',
                                                marginRight: '0.9em' // Matching standard margin for symmetry
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faCheck} className="text-[0.7em]" />
                                        </div>
                                    )}
                                    {!isActive && <div style={{ marginRight: '0.9em' }} />} {/* Spacer for alignment if needed, or just let it be flex */}
                                </div>
                            );
                        })}

                        {/* Separator */}
                        <div
                            className="h-[1px] mx-0 opacity-10 shrink-0"
                            style={{ backgroundColor: 'var(--sub-color)' }}
                        />

                        {/* Create New - Treated as just another item */}
                        <button
                            onClick={handleCreate}
                            className="group flex items-center justify-start text-left w-full leading-none text-[var(--text-color)] hover:text-[var(--bg-color)] hover:bg-[var(--text-color)] rounded-b-[0.5rem]"
                            style={{ padding: '0.5em 0' }}
                        >
                            <div
                                className="w-[1em] h-[1em] flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100"
                                style={{
                                    marginLeft: '0.9em',
                                    marginRight: '0.7em'
                                }}
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-[1em]" />
                            </div>
                            <span className="truncate pt-[0.1em]">create new</span>
                        </button>
                    </div>
                </div>
            </div>

            <PersonalitySettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                personalityId={editingPersonalityId}
            />
        </>
    );
}
