import {
    faDumbbell,
    faBrain,
    faBath,
    faMugHot,
    faBookOpen,
    faLeaf,
    faCircle
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export const GROUP_CONFIG: Record<string, { icon: IconDefinition; color: string }> = {
    Physical: { icon: faDumbbell, color: 'var(--correct-color)' },
    Mental: { icon: faBrain, color: 'var(--error-color)' },
    Recovery: { icon: faBath, color: '#7fb3d3' },
    Work: { icon: faMugHot, color: 'var(--main-color)' },
    Learning: { icon: faBookOpen, color: 'var(--main-color)' },
    Substances: { icon: faLeaf, color: 'var(--error-color)' },
    ungrouped: { icon: faCircle, color: 'var(--sub-color)' },
};

export const PRESET_COLORS = [
    '#e2b714', // Yellow (Focus)
    '#ca4754', // Red (Mental)
    '#98c379', // Green (Physical)
    '#7fb3d3', // Blue (Business)
    '#e6934a', // Orange (Energy)
    '#c678dd', // Purple
    '#d19a66', // Light Orange
    '#56b6c2', // Cyan
    '#d1d0c5', // Gray
    '#abb2bf', // Light Gray
    '#e06c75', // Light Red
    '#be5046', // Dark Red
    '#61afef', // Sky Blue
    '#b4babe', // Gray Blue
    '#81bf91', // Pale Green
];
