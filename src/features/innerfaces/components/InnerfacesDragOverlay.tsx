import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import { InnerfaceCard } from './InnerfaceCard';
import { getGroupConfig } from '../../../constants/common';
import { getIcon } from '../../../config/iconRegistry';
import { CATEGORY_CONFIG } from '../constants';
import type { Innerface } from '../types';

export const InnerfacesDragOverlay = React.memo(({
    innerface,
    groupName,
    categoryName,
    groupsMetadata = {},
    isValidDrop = true
}: {
    innerface?: Innerface | null,
    groupName?: string | null,
    categoryName?: string | null,
    groupsMetadata?: Record<string, { icon: string; color?: string }>;
    isValidDrop?: boolean;
}) => {
    if (categoryName) {
        // Safe cast as we know the keys match the type
        const config = CATEGORY_CONFIG[categoryName as keyof typeof CATEGORY_CONFIG];
        if (!config) return null;
        const Icon = config.icon;
        return (
            <div className="w-full opacity-90 cursor-grabbing pointer-events-none p-4 bg-bg-secondary rounded-xl border border-white/5 shadow-2xl flex items-center gap-3">
                <Icon className={`w-6 h-6 text-sub`} />
                <span className="text-lg font-bold text-text-primary capitalize">{config.label}</span>
            </div>
        );
    }

    if (groupName) {
        const staticConfig = getGroupConfig(groupName);
        const storeMeta = groupsMetadata[groupName];

        let icon = getIcon(staticConfig.icon);
        let color = staticConfig.color;

        if (storeMeta) {
            if (storeMeta.icon) {
                const mapped = getIcon(storeMeta.icon);
                if (mapped) icon = mapped;
            }
            if (storeMeta.color) color = storeMeta.color;
        }

        return (
            <div className="w-full opacity-90 cursor-grabbing pointer-events-none p-4 bg-bg-secondary rounded-xl border border-white/5 shadow-2xl flex items-center gap-3">
                <FontAwesomeIcon icon={icon} style={{ color }} className="text-lg opacity-80" />
                <span className="text-lg font-bold text-text-primary lowercase">{groupName}</span>
            </div>
        )
    }

    if (!innerface) return null;
    return (
        <div className={`w-full h-full shadow-2xl z-50 transition-transform duration-200 pointer-events-none ${!isValidDrop ? 'scale-95' : 'opacity-90 cursor-grabbing'}`}>
            <InnerfaceCard innerface={innerface} forceHover={true} />
            {!isValidDrop && (
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
