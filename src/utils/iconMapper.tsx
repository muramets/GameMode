import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBrain, faRecordVinyl, faDumbbell, faMugHot, faScaleBalanced,
    faHandPeace, faPersonWalking, faPersonRunning, faBath, faBox,
    faHeadphones, faArrowsRotate, faHeart, faHand, faBookOpen,
    faBullseye, faRobot, faSliders,
    faGlobe, faBed, faLeaf, faGlassWhiskey, faPhone, faDrumstickBite,
    faMasksTheater, faPause, faYinYang, faBatteryFull, faBolt,
    faChartLine, faGaugeHigh, faHouseUser, faPuzzlePiece, faUsersGear,
    faQuestion, faUser, faFilm, faMusic, faLock, faRocket, faBook,
    faPerson, faMartiniGlass, faWineGlass, faBeerMugEmpty, faBan,
    faSpa, faHotTubPerson, faBowlFood, faLaptopCode, faReceipt,
    faSmoking, faPersonSwimming, faSackDollar, faMoneyBill, faCoins,
    faPenToSquare, faHandRock, faShoePrints, faCog
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
    'movie': faFilm,
    'music': faMusic,
    'lock': faLock,
    'rocket': faRocket,
    'reading': faBook,
    'alcohol': faMartiniGlass,
    'ban': faBan,
    'sauna': faHotTubPerson,
    'salad': faBowlFood,
    'code': faLaptopCode,
    'receipt': faReceipt,
    'weed': faSmoking,
    'swim': faPersonSwimming,
    'money': faSackDollar,
    'write': faPenToSquare,
    'rock-on': faHandRock,
    'step': faShoePrints,

    // Legacy Emojis (Mapping to FA)
    '🧠': faBrain,
    '🪝': faRecordVinyl,
    '🔹': faDumbbell,
    '🚀': faRocket,
    '🎼': faMusic,
    '🌅': faHandPeace,
    '🧍‍♂️': faPerson,
    '🧍': faPerson,
    '🧘‍♂️': faSpa,
    '🧘': faSpa,
    '🚶‍♂️': faPersonWalking,
    '🚶': faPersonWalking,
    '👟': faPersonRunning,
    '🏃': faPersonRunning,
    '🏃‍♂️': faPersonRunning,
    '🏃🏻‍♂️': faPersonRunning,
    '🏃🏻‍♂': faPersonRunning,
    '🧖‍♂️': faHotTubPerson,
    '🧖': faHotTubPerson,
    '🌀': faBrain,
    '📦': faBox,
    '🎧': faHeadphones,
    '🔁': faArrowsRotate,
    '❤️': faHeart,
    '🩷': faHeart,
    '✋': faHand,
    '🚫': faBan,
    '📖': faBook,
    '📘': faBook,
    '📚': faBook,
    '📕': faBook,
    '📔': faBook,
    '📗': faBook,
    '📙': faBook,
    '🥗': faBowlFood,
    '🎯': faBullseye,
    '🤖': faRobot,
    '💻': faLaptopCode,
    '🧾': faReceipt,
    '🎛': faSliders,
    '🌐': faGlobe,
    '🛏': faBed,
    '💨': faSmoking,
    '🥃': faGlassWhiskey, // or faMartiniGlass
    '🍹': faMartiniGlass,
    '🍷': faWineGlass,
    '🍸': faMartiniGlass,
    '🥂': faWineGlass,
    '🍻': faBeerMugEmpty,
    '📞': faPhone,
    '🍖': faDrumstickBite,
    '🎭': faMasksTheater,
    '😶': faPause,
    '⏸️': faPause,
    '⏸︎': faPause,
    '🧘🏻': faSpa,
    '🔋': faBatteryFull,
    '⚡': faBolt,
    '📊': faChartLine,
    '🚄': faGaugeHigh,
    '👨‍👩‍👧‍👦': faHouseUser,
    '🧩': faPuzzlePiece,
    '🏗': faUsersGear,
    'user': faUser,
    '🎥': faFilm,
    '🎹': faMusic,
    '🔒': faLock,
    '🏋': faDumbbell,
    '🏊': faPersonSwimming,
    '🤽': faPersonSwimming,
    '💵': faMoneyBill,
    '💸': faMoneyBill,
    '💰': faSackDollar,
    'coins': faCoins,
    'memo': faPenToSquare,
    '📝': faPenToSquare,
    '🤘': faHandRock,
    'gear': faCog,
    'settings': faCog
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


export function getMappedIcon(iconStr: string) {
    return EMOJI_MAP[iconStr];
}

export const ICON_PRESETS = [
    'brain', 'physical', 'recovery', 'work',
    'learning', 'substances', 'energy', 'engagement', 'body-sync',
    'strategic', 'execution', 'relationship', 'family', 'community',
    'harmony', 'meditation',
    'movie', 'music', 'lock', 'rocket', 'reading', 'alcohol',
    'ban', 'sauna', 'salad', 'code', 'receipt', 'weed',
    'swim', 'money', 'write', 'rock-on'
];
