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
