import {
    faDumbbell,
    faBrain,
    faBath,
    faMugHot,
    faBookOpen,
    faLeaf,
    faCircle
} from '@fortawesome/free-solid-svg-icons';

export const GROUP_CONFIG: Record<string, { icon: any; color: string }> = {
    Physical: { icon: faDumbbell, color: '#98c379' },
    Mental: { icon: faBrain, color: '#ca4754' },
    Recovery: { icon: faBath, color: '#7fb3d3' },
    Work: { icon: faMugHot, color: '#e2b714' },
    Learning: { icon: faBookOpen, color: '#e2b714' },
    Substances: { icon: faLeaf, color: '#ca4754' },
    ungrouped: { icon: faCircle, color: '#666666' },
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
