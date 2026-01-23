import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
    // Common
    faStar, faHeart, faFlag, faCheck, faBell, faUser, faHome, faCog,
    faTrash, faPen, faSearch, faPlus, faMinus, faEye, faEyeSlash,
    faLink, faCopy, faBookmark, faCircle, faBan, faScaleBalanced, faGavel, faQuestion,

    // Productivity
    faCalendar, faClock, faFire, faTrophy, faListCheck, faChartLine,
    faRocket, faBolt, faBatteryFull, faLightbulb, faBrain, faBullseye,
    faChartBar, faClipboard, faFolder, faFile, faEnvelope, faInbox,
    faBook, faBookOpen, faPenToSquare, faAward, faCrown, faMedal,

    // Finance
    faCreditCard, faWallet, faCoins, faChartPie, faTag, faStore,
    faSackDollar, faMoneyBill, faReceipt, faPercent, faHandHoldingDollar,

    // Health
    faHeartPulse, faDumbbell, faAppleWhole, faBed, faPersonRunning,
    faDroplet, faSpa, faPersonWalking, faPersonSwimming, faLungs,
    faBowlFood, faPills, faBandage, faWeight, faMoon, faBath,
    faHotTubPerson, faYinYang, faShoePrints,

    // Nature
    faTree, faLeaf, faSun, faCloud, faSnowflake, faWind, faMountain,
    faWater, faSeedling, faEarth,

    // Lifestyle
    faGamepad, faPalette, faPuzzlePiece, faDice, faBaseball, faFootball,
    faGift, faCake, faSmoking, faHandRock, faMasksTheater,

    // Social
    faComments, faUsers, faUserGroup, faShareNodes, faThumbsUp, faThumbsDown,
    faMessage, faHandshake, faPhone,

    // Tech (Gadgets & Security)
    faMobile, faWifi, faRobot, faGlobe, faLock, faUnlock, faKey,
    faShield, faMagnet,

    // Categories Imports
    // Travel
    faPlane, faMap, faLocationDot, faSuitcase, faPassport, faHotel, faTrain,
    faBus, faShip, faAnchor, faCar, faBicycle, faCampground, faUmbrellaBeach,

    // Food
    faUtensils, faMugHot, faWineGlass, faMartiniGlass, faBeerMugEmpty,
    faBurger, faPizzaSlice, faIceCream, faCookie, faBacon, faFish, faWheatAwn,

    // Education
    faGraduationCap, faSchool, faChalkboardUser,

    // Tools
    faWrench, faHammer, faScrewdriverWrench, faPaintRoller, faBrush, faCameraRetro,
    faBox, faTruck,

    // Media (YouTube / Music Producer)
    faClapperboard, faFilm, faVideo, faSliders, faMicrophone, faBroadcastTower,
    faRecordVinyl, faMusic, faHeadphones, faDrum, faGuitar, faVolumeHigh, faCamera,

    // Development (Coder)
    faCode, faCodeFork, faTerminal, faKeyboard, faMicrochip, faNetworkWired,
    faDiagramProject, faBug, faLaptop, faDesktop, faDatabase, faServer,

    // Arrows
    faArrowRight, faArrowLeft, faArrowUp, faArrowDown, faRotate, faShuffle,
    faRepeat, faAnglesRight, faAnglesLeft
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
    | 'social'
    | 'tech'
    | 'travel'
    | 'food'
    | 'education'
    | 'media'
    | 'development'
    | 'tools'
    | 'arrows';

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
    { id: 'media', label: 'Media' },
    { id: 'development', label: 'Dev' },
    { id: 'finance', label: 'Finance' },
    { id: 'health', label: 'Health' },
    { id: 'nature', label: 'Nature' },
    { id: 'lifestyle', label: 'Lifestyle' },
    { id: 'social', label: 'Social' },
    { id: 'travel', label: 'Travel' },
    { id: 'food', label: 'Food' },
    { id: 'education', label: 'Education' },
    { id: 'tech', label: 'Tech' },
    { id: 'tools', label: 'Tools' },
    { id: 'arrows', label: 'Arrows' },
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
    { id: 'question', icon: faQuestion, category: 'common', keywords: ['help', 'unknown'] },
    { id: 'scale-balanced', icon: faScaleBalanced, category: 'common', keywords: ['justice', 'balance', 'law'] },
    { id: 'gavel', icon: faGavel, category: 'common', keywords: ['law', 'judge', 'court'] },

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
    { id: 'book', icon: faBook, category: 'productivity', keywords: ['read', 'learning'] },
    { id: 'book-open', icon: faBookOpen, category: 'productivity', keywords: ['reading', 'study'] },
    { id: 'pen-to-square', icon: faPenToSquare, category: 'productivity', keywords: ['edit', 'write', 'compose'] },
    { id: 'award', icon: faAward, category: 'productivity', keywords: ['achievement', 'prize'] },
    { id: 'crown', icon: faCrown, category: 'productivity', keywords: ['king', 'leader', 'best'] },
    { id: 'medal', icon: faMedal, category: 'productivity', keywords: ['achievement', 'award'] },

    // ── Media (New) ──
    { id: 'clapperboard', icon: faClapperboard, category: 'media', keywords: ['movie', 'film', 'video', 'youtube'] },
    { id: 'film', icon: faFilm, category: 'media', keywords: ['movie', 'video', 'cinema'] },
    { id: 'video', icon: faVideo, category: 'media', keywords: ['record', 'camera', 'youtube'] },
    { id: 'sliders', icon: faSliders, category: 'media', keywords: ['settings', 'mix', 'audio', 'music'] },
    { id: 'microphone', icon: faMicrophone, category: 'media', keywords: ['audio', 'record', 'voice'] },
    { id: 'broadcast-tower', icon: faBroadcastTower, category: 'media', keywords: ['radio', 'signal', 'stream'] },
    { id: 'record-vinyl', icon: faRecordVinyl, category: 'media', keywords: ['music', 'dj', 'album'] },
    { id: 'music', icon: faMusic, category: 'media', keywords: ['audio', 'song'] },
    { id: 'headphones', icon: faHeadphones, category: 'media', keywords: ['audio', 'listen', 'music'] },
    { id: 'drum', icon: faDrum, category: 'media', keywords: ['music', 'instrument', 'beat'] },
    { id: 'guitar', icon: faGuitar, category: 'media', keywords: ['music', 'instrument', 'string'] },
    { id: 'volume-high', icon: faVolumeHigh, category: 'media', keywords: ['sound', 'audio', 'loud'] },
    { id: 'camera', icon: faCamera, category: 'media', keywords: ['photo', 'picture', 'video'] },

    // ── Development (New) ──
    { id: 'code', icon: faCode, category: 'development', keywords: ['programming', 'dev', 'html'] },
    { id: 'code-fork', icon: faCodeFork, category: 'development', keywords: ['git', 'branch', 'version'] },
    { id: 'terminal', icon: faTerminal, category: 'development', keywords: ['console', 'cli', 'command'] },
    { id: 'keyboard', icon: faKeyboard, category: 'development', keywords: ['type', 'input', 'computer'] },
    { id: 'microchip', icon: faMicrochip, category: 'development', keywords: ['cpu', 'processor', 'hardware'] },
    { id: 'network-wired', icon: faNetworkWired, category: 'development', keywords: ['ethernet', 'connection', 'internet'] },
    { id: 'diagram-project', icon: faDiagramProject, category: 'development', keywords: ['chart', 'graph', 'plan'] },
    { id: 'bug', icon: faBug, category: 'development', keywords: ['error', 'issue', 'debug'] },
    { id: 'laptop', icon: faLaptop, category: 'development', keywords: ['computer', 'work'] },
    { id: 'desktop', icon: faDesktop, category: 'development', keywords: ['computer', 'monitor'] },
    { id: 'database', icon: faDatabase, category: 'development', keywords: ['data', 'storage', 'sql'] },
    { id: 'server', icon: faServer, category: 'development', keywords: ['host', 'backend'] },

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
    { id: 'shoe-prints', icon: faShoePrints, category: 'health', keywords: ['steps', 'walk', 'footprints'] },

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

    // ── Travel ──
    { id: 'plane', icon: faPlane, category: 'travel', keywords: ['fly', 'flight', 'airport'] },
    { id: 'map', icon: faMap, category: 'travel', keywords: ['location', 'directions'] },
    { id: 'location-dot', icon: faLocationDot, category: 'travel', keywords: ['pin', 'place', 'marker'] },
    { id: 'suitcase', icon: faSuitcase, category: 'travel', keywords: ['baggage', 'luggage', 'trip'] },
    { id: 'passport', icon: faPassport, category: 'travel', keywords: ['id', 'border', 'document'] },
    { id: 'hotel', icon: faHotel, category: 'travel', keywords: ['stay', 'room', 'bed'] },
    { id: 'train', icon: faTrain, category: 'travel', keywords: ['rail', 'transport'] },
    { id: 'bus', icon: faBus, category: 'travel', keywords: ['public', 'transport'] },
    { id: 'ship', icon: faShip, category: 'travel', keywords: ['boat', 'sea', 'cruise'] },
    { id: 'anchor', icon: faAnchor, category: 'travel', keywords: ['port', 'nautical'] },
    { id: 'car', icon: faCar, category: 'travel', keywords: ['drive', 'vehicle'] },
    { id: 'bicycle', icon: faBicycle, category: 'travel', keywords: ['bike', 'cycling'] },
    { id: 'campground', icon: faCampground, category: 'travel', keywords: ['camping', 'outdoor', 'tent'] },
    { id: 'umbrella-beach', icon: faUmbrellaBeach, category: 'travel', keywords: ['beach', 'vacation'] },

    // ── Food ──
    { id: 'utensils', icon: faUtensils, category: 'food', keywords: ['restaurant', 'eat', 'dinner'] },
    { id: 'mug-hot', icon: faMugHot, category: 'food', keywords: ['coffee', 'tea', 'drink'] },
    { id: 'wine-glass', icon: faWineGlass, category: 'food', keywords: ['wine', 'alcohol', 'drink'] },
    { id: 'martini-glass', icon: faMartiniGlass, category: 'food', keywords: ['cocktail', 'alcohol', 'drink'] },
    { id: 'beer-mug', icon: faBeerMugEmpty, category: 'food', keywords: ['beer', 'alcohol', 'drink'] },
    { id: 'burger', icon: faBurger, category: 'food', keywords: ['fastfood', 'sandwich'] },
    { id: 'pizza', icon: faPizzaSlice, category: 'food', keywords: ['fastfood', 'italian'] },
    { id: 'ice-cream', icon: faIceCream, category: 'food', keywords: ['dessert', 'sweet'] },
    { id: 'cookie', icon: faCookie, category: 'food', keywords: ['dessert', 'sweet', 'biscuit'] },
    { id: 'bacon', icon: faBacon, category: 'food', keywords: ['breakfast', 'meat'] },
    { id: 'fish', icon: faFish, category: 'food', keywords: ['seafood', 'meat'] },
    { id: 'wheat', icon: faWheatAwn, category: 'food', keywords: ['grain', 'bread', 'farm'] },

    // ── Education ──
    { id: 'graduation-cap', icon: faGraduationCap, category: 'education', keywords: ['education', 'learn', 'degree'] },
    { id: 'school', icon: faSchool, category: 'education', keywords: ['building', 'students'] },
    { id: 'chalkboard-user', icon: faChalkboardUser, category: 'education', keywords: ['teacher', 'class', 'present'] },

    // ── Lifestyle ──
    { id: 'gamepad', icon: faGamepad, category: 'lifestyle', keywords: ['game', 'play', 'console'] },
    { id: 'palette', icon: faPalette, category: 'lifestyle', keywords: ['art', 'paint', 'design'] },
    { id: 'puzzle-piece', icon: faPuzzlePiece, category: 'lifestyle', keywords: ['game', 'solve'] },
    { id: 'dice', icon: faDice, category: 'lifestyle', keywords: ['game', 'random', 'luck'] },
    { id: 'baseball', icon: faBaseball, category: 'lifestyle', keywords: ['sport', 'ball'] },
    { id: 'football', icon: faFootball, category: 'lifestyle', keywords: ['sport', 'ball'] },
    { id: 'gift', icon: faGift, category: 'lifestyle', keywords: ['present', 'surprise'] },
    { id: 'cake', icon: faCake, category: 'lifestyle', keywords: ['birthday', 'celebration'] },
    { id: 'smoking', icon: faSmoking, category: 'lifestyle', keywords: ['cigarette', 'tobacco'] },
    { id: 'hand-rock', icon: faHandRock, category: 'lifestyle', keywords: ['rock', 'gesture'] },
    { id: 'masks-theater', icon: faMasksTheater, category: 'lifestyle', keywords: ['drama', 'acting', 'theater'] },

    // ── Social ──
    { id: 'comments', icon: faComments, category: 'social', keywords: ['chat', 'talk', 'conversation'] },
    { id: 'users', icon: faUsers, category: 'social', keywords: ['people', 'group', 'team'] },
    { id: 'user-group', icon: faUserGroup, category: 'social', keywords: ['team', 'community'] },
    { id: 'share', icon: faShareNodes, category: 'social', keywords: ['network', 'connect'] },
    { id: 'thumbs-up', icon: faThumbsUp, category: 'social', keywords: ['like', 'approve', 'yes'] },
    { id: 'thumbs-down', icon: faThumbsDown, category: 'social', keywords: ['dislike', 'disapprove', 'no'] },
    { id: 'message', icon: faMessage, category: 'social', keywords: ['sms', 'chat', 'text'] },
    { id: 'handshake', icon: faHandshake, category: 'social', keywords: ['deal', 'agreement'] },
    { id: 'phone', icon: faPhone, category: 'social', keywords: ['call', 'contact'] },

    // ── Tech ──
    { id: 'mobile', icon: faMobile, category: 'tech', keywords: ['phone', 'smartphone'] },
    { id: 'wifi', icon: faWifi, category: 'tech', keywords: ['internet', 'network'] },
    { id: 'robot', icon: faRobot, category: 'tech', keywords: ['ai', 'automation', 'bot'] },
    { id: 'globe', icon: faGlobe, category: 'tech', keywords: ['web', 'internet', 'world'] },
    { id: 'lock', icon: faLock, category: 'tech', keywords: ['security', 'private'] },
    { id: 'unlock', icon: faUnlock, category: 'tech', keywords: ['open', 'access'] },
    { id: 'key', icon: faKey, category: 'tech', keywords: ['password', 'access'] },
    { id: 'shield', icon: faShield, category: 'tech', keywords: ['security', 'protect'] },
    { id: 'magnet', icon: faMagnet, category: 'tech', keywords: ['attract', 'physics'] },

    // ── Tools ──
    { id: 'wrench', icon: faWrench, category: 'tools', keywords: ['fix', 'repair', 'settings'] },
    { id: 'hammer', icon: faHammer, category: 'tools', keywords: ['build', 'construct'] },
    { id: 'screwdriver', icon: faScrewdriverWrench, category: 'tools', keywords: ['fix', 'repair'] },
    { id: 'paint-roller', icon: faPaintRoller, category: 'tools', keywords: ['paint', 'color'] },
    { id: 'brush', icon: faBrush, category: 'tools', keywords: ['paint', 'art'] },
    { id: 'camera-retro', icon: faCameraRetro, category: 'tools', keywords: ['photo', 'pic'] },
    { id: 'box', icon: faBox, category: 'tools', keywords: ['package', 'ship'] },
    { id: 'truck', icon: faTruck, category: 'tools', keywords: ['deliver', 'ship'] },

    // ── Arrows ──
    { id: 'arrow-right', icon: faArrowRight, category: 'arrows', keywords: ['next', 'direction'] },
    { id: 'arrow-left', icon: faArrowLeft, category: 'arrows', keywords: ['back', 'direction'] },
    { id: 'arrow-up', icon: faArrowUp, category: 'arrows', keywords: ['top', 'direction'] },
    { id: 'arrow-down', icon: faArrowDown, category: 'arrows', keywords: ['bottom', 'direction'] },
    { id: 'rotate', icon: faRotate, category: 'arrows', keywords: ['spin', 'turn'] },
    { id: 'shuffle', icon: faShuffle, category: 'arrows', keywords: ['random', 'mix'] },
    { id: 'repeat', icon: faRepeat, category: 'arrows', keywords: ['loop', 'cycle'] },
    { id: 'double-right', icon: faAnglesRight, category: 'arrows', keywords: ['fast', 'forward'] },
    { id: 'double-left', icon: faAnglesLeft, category: 'arrows', keywords: ['fast', 'backward'] },
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
