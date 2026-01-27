import React, { useState } from 'react';
import { useDndMonitor } from '@dnd-kit/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical, faBan } from '@fortawesome/free-solid-svg-icons';
import { ProtocolRow } from './ProtocolRow';
import type { Protocol } from '../types';
import type { Innerface } from '../../innerfaces/types';

const noOp = () => { };

export const ProtocolsDragOverlay = React.memo(({
    activeProtocol,
    activeGroup,
    innerfaces
}: {
    activeProtocol: Protocol | null,
    activeGroup: string | null,
    innerfaces: Innerface[]
}) => {
    const [isInvalid, setIsInvalid] = useState(false);

    useDndMonitor({
        onDragStart: () => setIsInvalid(false),
        onDragEnd: () => setIsInvalid(false),
        onDragCancel: () => setIsInvalid(false),
    });

    if (activeGroup) {
        return (
            <div className="w-full bg-bg-primary/90 p-4 rounded-lg border border-sub/20 shadow-2xl scale-105 cursor-grabbing z-50">
                <div className="flex items-center gap-3 text-2xl font-bold text-text-primary">
                    <FontAwesomeIcon icon={faGripVertical} className="text-sm text-text-primary mr-2" />
                    <span>{activeGroup}</span>
                </div>
            </div>
        );
    }

    if (!activeProtocol) return null;

    return (
        <div
            className={`w-full shadow-2xl z-50 transition-transform duration-200 pointer-events-none ${isInvalid ? 'scale-95' : 'opacity-90'}`}
            style={{ cursor: 'grabbing !important' }}
        >
            <ProtocolRow
                protocol={activeProtocol}
                innerfaces={innerfaces}
                onLevelUp={noOp}
                onLevelDown={noOp}
                onEdit={noOp}
                isDisabled={true}
                isOverlay={true}
                isGrabbing={true}
            />
            {isInvalid && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/10" />
                    <div
                        className="relative z-10 bg-bg-primary/90 rounded-full w-12 h-12 flex items-center justify-center animate-in zoom-in duration-200"
                        style={{
                            color: 'var(--error-color)',
                            borderColor: 'color-mix(in srgb, var(--error-color) 20%, transparent)',
                            borderWidth: '1px',
                            boxShadow: '0 0 20px color-mix(in srgb, var(--error-color) 30%, transparent)'
                        }}
                    >
                        <FontAwesomeIcon icon={faBan} className="text-xl" />
                    </div>
                </div>
            )}
        </div>
    );
});
