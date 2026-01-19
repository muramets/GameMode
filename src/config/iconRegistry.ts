import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
    // Common
    faStar, faHeart, faFlag, faCheck, faBell, faUser, faHome, faCog,
    faTrash, faPen, faSearch, faPlus, faMinus, faEye, faEyeSlash,
    faLink, faCopy, faBookmark,

    // Productivity
    faCalendar, faClock, faFire, faTrophy, faListCheck, faChartLine,
    faRocket, faBolt, faBatteryFull, faLightbulb, faBrain, faBullseye,
    faChartBar, faClipboard, faFolder, faFile, faEnvelope, faInbox,
    faGraduationCap, faBook, faBookOpen, faPenToSquare,

    // Finance
    faCreditCard, faWallet, faCoins, faChartPie, faTag, faStore,
    faSackDollar, faMoneyBill, faReceipt, faPercent, faHandHoldingDollar,

    // Health
    faHeartPulse, faDumbbell, faAppleWhole, faBed, faPersonRunning,
    faDroplet, faSpa, faPersonWalking, faPersonSwimming, faLungs,
    faBowlFood, faPills, faBandage, faWeight, faMoon, faBath,
    faHotTubPerson, faYinYang,

    // Nature
    faTree, faLeaf, faSun, faCloud, faSnowflake, faWind, faMountain,
    faWater, faSeedling, faEarth,

    // Lifestyle
    faMusic, faGamepad, faPlane, faCar, faCamera, faUtensils, faMugHot,
    faWineGlass, faMartiniGlass, faBeerMugEmpty, faFilm, faHeadphones,
    faPalette, faPuzzlePiece, faGuitar, faDice, faBaseball, faFootball,
    faBicycle, faCampground, faUmbrellaBeach, faGift, faCake,
    faComments, faUsers, faUserGroup, faHandshake, faPhone,

    // Tech
    faLaptop, faDesktop, faMobile, faWifi, faCode, faTerminal,
    faDatabase, faServer, faRobot, faGlobe, faLock, faUnlock, faKey,
    faShield, faBug,

    // Misc
    faQuestion, faBan, faSmoking, faHandRock, faShoePrints, faMasksTheater,
    faScaleBalanced, faGavel, faAward, faCrown, faMedal, faCircle
} from '@fortawesome/free-solid-svg-icons';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type IconCategory =
    | 'common'
    | 'productivity'
    | 'finance'
    | 'health'
    | 'nature'
    | 'lifestyle'
    | 'tech';

export interface IconEntry {
    id: string;
    icon: IconDefinition;
    category: IconCategory;
    keywords: string[];
}

export interface CategoryMeta {
    id: IconCategory;
    label: string;
}

// ─────────────────────────────────────────────────────────────
// Category Metadata (for UI tabs)
// ─────────────────────────────────────────────────────────────

export const ICON_CATEGORIES: CategoryMeta[] = [
    { id: 'common', label: 'Common' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'finance', label: 'Finance' },
    { id: 'health', label: 'Health' },
    { id: 'nature', label: 'Nature' },
    { id: 'lifestyle', label: 'Lifestyle' },
    { id: 'tech', label: 'Tech' },
];

// ─────────────────────────────────────────────────────────────
// Icon Registry
// ─────────────────────────────────────────────────────────────

export const ICON_REGISTRY: IconEntry[] = [
    // ── Common ──
    { id: 'star', icon: faStar, category: 'common', keywords: ['favorite', 'rate'] },
    { id: 'heart', icon: faHeart, category: 'common', keywords: ['love', 'like'] },
    { id: 'flag', icon: faFlag, category: 'common', keywords: ['mark', 'goal'] },
    { id: 'check', icon: faCheck, category: 'common', keywords: ['done', 'complete'] },
    { id: 'bell', icon: faBell, category: 'common', keywords: ['notification', 'alert'] },
    { id: 'user', icon: faUser, category: 'common', keywords: ['person', 'profile'] },
    { id: 'home', icon: faHome, category: 'common', keywords: ['house', 'main'] },
    { id: 'cog', icon: faCog, category: 'common', keywords: ['settings', 'gear'] },
    { id: 'trash', icon: faTrash, category: 'common', keywords: ['delete', 'remove'] },
    { id: 'pen', icon: faPen, category: 'common', keywords: ['edit', 'write'] },
    { id: 'search', icon: faSearch, category: 'common', keywords: ['find', 'lookup'] },
    { id: 'plus', icon: faPlus, category: 'common', keywords: ['add', 'new'] },
    { id: 'minus', icon: faMinus, category: 'common', keywords: ['remove', 'subtract'] },
    { id: 'eye', icon: faEye, category: 'common', keywords: ['view', 'visible'] },
    { id: 'eye-slash', icon: faEyeSlash, category: 'common', keywords: ['hide', 'invisible'] },
    { id: 'link', icon: faLink, category: 'common', keywords: ['url', 'chain'] },
    { id: 'copy', icon: faCopy, category: 'common', keywords: ['duplicate', 'clipboard'] },
    { id: 'bookmark', icon: faBookmark, category: 'common', keywords: ['save', 'mark'] },
    { id: 'circle', icon: faCircle, category: 'common', keywords: ['dot', 'bullet'] },
    { id: 'ban', icon: faBan, category: 'common', keywords: ['prohibit', 'stop', 'no'] },

    // ── Productivity ──
    { id: 'calendar', icon: faCalendar, category: 'productivity', keywords: ['date', 'schedule'] },
    { id: 'clock', icon: faClock, category: 'productivity', keywords: ['time', 'timer'] },
    { id: 'fire', icon: faFire, category: 'productivity', keywords: ['hot', 'streak', 'trending'] },
    { id: 'trophy', icon: faTrophy, category: 'productivity', keywords: ['win', 'achievement'] },
    { id: 'list-check', icon: faListCheck, category: 'productivity', keywords: ['todo', 'tasks'] },
    { id: 'chart-line', icon: faChartLine, category: 'productivity', keywords: ['graph', 'analytics', 'growth'] },
    { id: 'rocket', icon: faRocket, category: 'productivity', keywords: ['launch', 'fast', 'startup'] },
    { id: 'bolt', icon: faBolt, category: 'productivity', keywords: ['energy', 'power', 'flash'] },
    { id: 'battery-full', icon: faBatteryFull, category: 'productivity', keywords: ['power', 'charge'] },
    { id: 'lightbulb', icon: faLightbulb, category: 'productivity', keywords: ['idea', 'insight'] },
    { id: 'brain', icon: faBrain, category: 'productivity', keywords: ['think', 'mind', 'mental'] },
    { id: 'bullseye', icon: faBullseye, category: 'productivity', keywords: ['target', 'goal', 'focus'] },
    { id: 'chart-bar', icon: faChartBar, category: 'productivity', keywords: ['stats', 'metrics'] },
    { id: 'clipboard', icon: faClipboard, category: 'productivity', keywords: ['paste', 'notes'] },
    { id: 'folder', icon: faFolder, category: 'productivity', keywords: ['directory', 'organize'] },
    { id: 'file', icon: faFile, category: 'productivity', keywords: ['document', 'page'] },
    { id: 'envelope', icon: faEnvelope, category: 'productivity', keywords: ['email', 'mail', 'message'] },
    { id: 'inbox', icon: faInbox, category: 'productivity', keywords: ['messages', 'queue'] },
    { id: 'graduation-cap', icon: faGraduationCap, category: 'productivity', keywords: ['education', 'learn', 'school'] },
    { id: 'book', icon: faBook, category: 'productivity', keywords: ['read', 'learning'] },
    { id: 'book-open', icon: faBookOpen, category: 'productivity', keywords: ['reading', 'study'] },
    { id: 'pen-to-square', icon: faPenToSquare, category: 'productivity', keywords: ['edit', 'write', 'compose'] },

    // ── Finance ──
    { id: 'credit-card', icon: faCreditCard, category: 'finance', keywords: ['payment', 'card'] },
    { id: 'wallet', icon: faWallet, category: 'finance', keywords: ['money', 'cash'] },
    { id: 'coins', icon: faCoins, category: 'finance', keywords: ['money', 'currency'] },
    { id: 'chart-pie', icon: faChartPie, category: 'finance', keywords: ['budget', 'allocation'] },
    { id: 'tag', icon: faTag, category: 'finance', keywords: ['price', 'label', 'discount'] },
    { id: 'store', icon: faStore, category: 'finance', keywords: ['shop', 'market'] },
    { id: 'sack-dollar', icon: faSackDollar, category: 'finance', keywords: ['money', 'savings'] },
    { id: 'money-bill', icon: faMoneyBill, category: 'finance', keywords: ['cash', 'payment'] },
    { id: 'receipt', icon: faReceipt, category: 'finance', keywords: ['invoice', 'bill'] },
    { id: 'percent', icon: faPercent, category: 'finance', keywords: ['discount', 'rate'] },
    { id: 'hand-holding-dollar', icon: faHandHoldingDollar, category: 'finance', keywords: ['donate', 'pay'] },

    // ── Health ──
    { id: 'heart-pulse', icon: faHeartPulse, category: 'health', keywords: ['heartbeat', 'cardio'] },
    { id: 'dumbbell', icon: faDumbbell, category: 'health', keywords: ['gym', 'workout', 'exercise'] },
    { id: 'apple', icon: faAppleWhole, category: 'health', keywords: ['fruit', 'nutrition', 'diet'] },
    { id: 'bed', icon: faBed, category: 'health', keywords: ['sleep', 'rest'] },
    { id: 'person-running', icon: faPersonRunning, category: 'health', keywords: ['run', 'jog', 'cardio'] },
    { id: 'droplet', icon: faDroplet, category: 'health', keywords: ['water', 'hydration'] },
    { id: 'spa', icon: faSpa, category: 'health', keywords: ['relax', 'meditation', 'wellness'] },
    { id: 'person-walking', icon: faPersonWalking, category: 'health', keywords: ['walk', 'steps'] },
    { id: 'person-swimming', icon: faPersonSwimming, category: 'health', keywords: ['swim', 'pool'] },
    { id: 'lungs', icon: faLungs, category: 'health', keywords: ['breathing', 'respiratory'] },
    { id: 'bowl-food', icon: faBowlFood, category: 'health', keywords: ['meal', 'eat', 'nutrition'] },
    { id: 'pills', icon: faPills, category: 'health', keywords: ['medicine', 'medication'] },
    { id: 'bandage', icon: faBandage, category: 'health', keywords: ['injury', 'healing'] },
    { id: 'weight', icon: faWeight, category: 'health', keywords: ['scale', 'mass'] },
    { id: 'moon', icon: faMoon, category: 'health', keywords: ['night', 'sleep'] },
    { id: 'bath', icon: faBath, category: 'health', keywords: ['shower', 'clean', 'relax'] },
    { id: 'hot-tub', icon: faHotTubPerson, category: 'health', keywords: ['sauna', 'relax', 'spa'] },
    { id: 'yin-yang', icon: faYinYang, category: 'health', keywords: ['balance', 'harmony', 'meditation'] },

    // ── Nature ──
    { id: 'tree', icon: faTree, category: 'nature', keywords: ['forest', 'plant'] },
    { id: 'leaf', icon: faLeaf, category: 'nature', keywords: ['plant', 'eco', 'green'] },
    { id: 'sun', icon: faSun, category: 'nature', keywords: ['day', 'bright', 'weather'] },
    { id: 'cloud', icon: faCloud, category: 'nature', keywords: ['weather', 'sky'] },
    { id: 'snowflake', icon: faSnowflake, category: 'nature', keywords: ['winter', 'cold'] },
    { id: 'wind', icon: faWind, category: 'nature', keywords: ['air', 'breeze'] },
    { id: 'mountain', icon: faMountain, category: 'nature', keywords: ['hiking', 'peak'] },
    { id: 'water', icon: faWater, category: 'nature', keywords: ['ocean', 'wave'] },
    { id: 'seedling', icon: faSeedling, category: 'nature', keywords: ['grow', 'plant', 'eco'] },
    { id: 'earth', icon: faEarth, category: 'nature', keywords: ['globe', 'world', 'planet'] },

    // ── Lifestyle ──
    { id: 'music', icon: faMusic, category: 'lifestyle', keywords: ['audio', 'song'] },
    { id: 'gamepad', icon: faGamepad, category: 'lifestyle', keywords: ['game', 'play', 'console'] },
    { id: 'plane', icon: faPlane, category: 'lifestyle', keywords: ['travel', 'flight'] },
    { id: 'car', icon: faCar, category: 'lifestyle', keywords: ['drive', 'vehicle'] },
    { id: 'camera', icon: faCamera, category: 'lifestyle', keywords: ['photo', 'picture'] },
    { id: 'utensils', icon: faUtensils, category: 'lifestyle', keywords: ['food', 'restaurant', 'eat'] },
    { id: 'mug-hot', icon: faMugHot, category: 'lifestyle', keywords: ['coffee', 'tea', 'drink'] },
    { id: 'wine-glass', icon: faWineGlass, category: 'lifestyle', keywords: ['wine', 'alcohol', 'drink'] },
    { id: 'martini-glass', icon: faMartiniGlass, category: 'lifestyle', keywords: ['cocktail', 'alcohol', 'drink'] },
    { id: 'beer-mug', icon: faBeerMugEmpty, category: 'lifestyle', keywords: ['beer', 'alcohol', 'drink'] },
    { id: 'film', icon: faFilm, category: 'lifestyle', keywords: ['movie', 'video', 'cinema'] },
    { id: 'headphones', icon: faHeadphones, category: 'lifestyle', keywords: ['audio', 'listen', 'music'] },
    { id: 'palette', icon: faPalette, category: 'lifestyle', keywords: ['art', 'paint', 'design'] },
    { id: 'puzzle-piece', icon: faPuzzlePiece, category: 'lifestyle', keywords: ['game', 'solve'] },
    { id: 'guitar', icon: faGuitar, category: 'lifestyle', keywords: ['music', 'instrument'] },
    { id: 'dice', icon: faDice, category: 'lifestyle', keywords: ['game', 'random', 'luck'] },
    { id: 'baseball', icon: faBaseball, category: 'lifestyle', keywords: ['sport', 'ball'] },
    { id: 'football', icon: faFootball, category: 'lifestyle', keywords: ['sport', 'ball'] },
    { id: 'bicycle', icon: faBicycle, category: 'lifestyle', keywords: ['bike', 'cycling'] },
    { id: 'campground', icon: faCampground, category: 'lifestyle', keywords: ['camping', 'outdoor', 'tent'] },
    { id: 'umbrella-beach', icon: faUmbrellaBeach, category: 'lifestyle', keywords: ['beach', 'vacation'] },
    { id: 'gift', icon: faGift, category: 'lifestyle', keywords: ['present', 'surprise'] },
    { id: 'cake', icon: faCake, category: 'lifestyle', keywords: ['birthday', 'celebration'] },
    { id: 'comments', icon: faComments, category: 'lifestyle', keywords: ['chat', 'talk', 'conversation'] },
    { id: 'users', icon: faUsers, category: 'lifestyle', keywords: ['people', 'group', 'team'] },
    { id: 'user-group', icon: faUserGroup, category: 'lifestyle', keywords: ['team', 'community'] },
    { id: 'handshake', icon: faHandshake, category: 'lifestyle', keywords: ['deal', 'agreement'] },
    { id: 'phone', icon: faPhone, category: 'lifestyle', keywords: ['call', 'contact'] },

    // ── Tech ──
    { id: 'laptop', icon: faLaptop, category: 'tech', keywords: ['computer', 'work'] },
    { id: 'desktop', icon: faDesktop, category: 'tech', keywords: ['computer', 'monitor'] },
    { id: 'mobile', icon: faMobile, category: 'tech', keywords: ['phone', 'smartphone'] },
    { id: 'wifi', icon: faWifi, category: 'tech', keywords: ['internet', 'network'] },
    { id: 'code', icon: faCode, category: 'tech', keywords: ['programming', 'dev'] },
    { id: 'terminal', icon: faTerminal, category: 'tech', keywords: ['console', 'cli', 'command'] },
    { id: 'database', icon: faDatabase, category: 'tech', keywords: ['data', 'storage'] },
    { id: 'server', icon: faServer, category: 'tech', keywords: ['host', 'backend'] },
    { id: 'robot', icon: faRobot, category: 'tech', keywords: ['ai', 'automation', 'bot'] },
    { id: 'globe', icon: faGlobe, category: 'tech', keywords: ['web', 'internet', 'world'] },
    { id: 'lock', icon: faLock, category: 'tech', keywords: ['security', 'private'] },
    { id: 'unlock', icon: faUnlock, category: 'tech', keywords: ['open', 'access'] },
    { id: 'key', icon: faKey, category: 'tech', keywords: ['password', 'access'] },
    { id: 'shield', icon: faShield, category: 'tech', keywords: ['security', 'protect'] },
    { id: 'bug', icon: faBug, category: 'tech', keywords: ['error', 'issue', 'debug'] },

    // ── Misc (previously scattered) ──
    { id: 'question', icon: faQuestion, category: 'common', keywords: ['help', 'unknown'] },
    { id: 'smoking', icon: faSmoking, category: 'lifestyle', keywords: ['cigarette', 'tobacco'] },
    { id: 'hand-rock', icon: faHandRock, category: 'lifestyle', keywords: ['rock', 'gesture'] },
    { id: 'shoe-prints', icon: faShoePrints, category: 'health', keywords: ['steps', 'walk', 'footprints'] },
    { id: 'masks-theater', icon: faMasksTheater, category: 'lifestyle', keywords: ['drama', 'acting', 'theater'] },
    { id: 'scale-balanced', icon: faScaleBalanced, category: 'common', keywords: ['justice', 'balance', 'law'] },
    { id: 'gavel', icon: faGavel, category: 'common', keywords: ['law', 'judge', 'court'] },
    { id: 'award', icon: faAward, category: 'productivity', keywords: ['achievement', 'prize'] },
    { id: 'crown', icon: faCrown, category: 'productivity', keywords: ['king', 'leader', 'best'] },
    { id: 'medal', icon: faMedal, category: 'productivity', keywords: ['achievement', 'award'] },
];

// ─────────────────────────────────────────────────────────────
// Lookup Map (for O(1) access by ID)
// ─────────────────────────────────────────────────────────────

const iconMap = new Map<string, IconDefinition>();
ICON_REGISTRY.forEach(entry => {
    iconMap.set(entry.id, entry.icon);
});

/**
 * Get FontAwesome icon definition by ID.
 * Returns faQuestion as fallback if not found.
 */
export function getIcon(id: string): IconDefinition {
    return iconMap.get(id) ?? faQuestion;
}

/**
 * Get icons filtered by category.
 */
export function getIconsByCategory(category: IconCategory): IconEntry[] {
    return ICON_REGISTRY.filter(entry => entry.category === category);
}

/**
 * Search icons by ID or keywords.
 */
export function searchIcons(query: string): IconEntry[] {
    const q = query.toLowerCase().trim();
    if (!q) return ICON_REGISTRY;

    return ICON_REGISTRY.filter(entry =>
        entry.id.includes(q) ||
        entry.keywords.some(kw => kw.includes(q))
    );
}
