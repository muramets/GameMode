import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBrain, faRecordVinyl, faDumbbell, faMugHot, faScaleBalanced,
    faHandPeace, faPersonWalking, faPersonRunning, faBath, faBox,
    faHeadphones, faArrowsRotate, faHeart, faHand, faBookOpen,
    faUtensils, faBullseye, faRobot, faFileContract, faSliders,
    faGlobe, faBed, faLeaf, faGlassWhiskey, faPhone, faDrumstickBite,
    faMasksTheater, faPause, faYinYang, faBatteryFull, faBolt,
    faChartLine, faGaugeHigh, faHouseUser, faPuzzlePiece, faUsersGear,
    faQuestion
} from '@fortawesome/free-solid-svg-icons';

const EMOJI_MAP: Record<string, any> = {
    // Descriptive Names (Preferred)
    'brain': faBrain,
    'physical': faDumbbell,
    'mental': faBrain,
    'recovery': faBath,
    'work': faMugHot,
    'learning': faBookOpen,
    'substances': faLeaf,
    'energy': faBatteryFull,
    'engagement': faBolt,
    'body-sync': faPersonRunning,
    'strategic': faChartLine,
    'execution': faGaugeHigh,
    'relationship': faHeart,
    'family': faHouseUser,
    'community': faPuzzlePiece,
    'harmony': faScaleBalanced,
    'meditation': faYinYang,
    'warm-up': faPersonRunning,
    'focus': faBrain,

    // Legacy Emojis (Mapping to FA)
    '🧠': faBrain,
    '🪝': faRecordVinyl,
    '🔹': faDumbbell,
    '🚀': faMugHot,
    '🎼': faScaleBalanced,
    '🌅': faHandPeace,
    '🧍‍♂️': faPersonRunning,
    '🧘‍♂️': faYinYang,
    '🚶‍♂️': faPersonWalking,
    '👟': faPersonRunning,
    '🧖‍♂️': faBath,
    '🌀': faBrain,
    '📦': faBox,
    '🎧': faHeadphones,
    '🔁': faArrowsRotate,
    '❤️': faHeart,
    '✋': faHand,
    '📖': faBookOpen,
    '🥗': faUtensils,
    '🎯': faBullseye,
    '🤖': faRobot,
    '🧾': faFileContract,
    '🎛': faSliders,
    '🌐': faGlobe,
    '🛏': faBed,
    '💨': faLeaf,
    '🥃': faGlassWhiskey,
    '📞': faPhone,
    '🍖': faDrumstickBite,
    '🎭': faMasksTheater,
    '😶': faPause,
    '🧘🏻': faYinYang,
    '🔋': faBatteryFull,
    '⚡': faBolt,
    '🏃🏻‍♂️': faPersonRunning,
    '📊': faChartLine,
    '🚄': faGaugeHigh,
    '👨‍👩‍👧‍👦': faHouseUser,
    '🧩': faPuzzlePiece,
    '🏗': faUsersGear
};

export function renderIcon(iconStr: string, className?: string) {
    // Check if it's a mapped emoji
    const faIcon = EMOJI_MAP[iconStr];

    if (faIcon) {
        return <FontAwesomeIcon icon={faIcon} className={className} />;
    }

    // Fallback: render as text (emoji)
    return <span className={className}>{iconStr}</span>;
}

export function getIconDefinition(iconStr: string) {
    return EMOJI_MAP[iconStr] || faQuestion;
}
