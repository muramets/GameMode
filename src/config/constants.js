// Application constants
export const APP_VERSION = '2.0.0';
export const APP_NAME = 'GameMode';

// Storage keys
export const STORAGE_KEYS = {
  PROTOCOLS: 'protocols',
  INNERFACES: 'innerfaces', 
  STATES: 'states',
  HISTORY: 'history',
  QUICK_ACTIONS: 'quickActions',
  QUICK_ACTION_ORDER: 'quickActionOrder',
  PROTOCOL_ORDER: 'protocolOrder',
  INNERFACE_ORDER: 'innerfaceOrder',
  STATE_ORDER: 'stateOrder',
  LAST_SYNC: 'lastSync',
  PENDING_SYNC: 'pendingSync',
  USER_PREFERENCES: 'userPreferences'
};

// Sync settings
export const SYNC_CONFIG = {
  AUTO_SYNC_INTERVAL: 2 * 60 * 1000, // 2 minutes
  RETRY_DELAY: 5000, // 5 seconds
  MAX_RETRIES: 3,
  INTEGRITY_CHECK_INTERVAL: 4 // Every 4th sync
};

// UI settings
export const UI_CONFIG = {
  ITEMS_PER_PAGE: 30,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 300
};

// Protocol settings
export const PROTOCOL_CONFIG = {
  MIN_WEIGHT: 0.01,
  MAX_WEIGHT: 1.0,
  DEFAULT_WEIGHT: 0.1,
  MAX_TARGETS: 3
};

// Score settings
export const SCORE_CONFIG = {
  MIN_SCORE: 0,
  MAX_SCORE: 10,
  DEFAULT_INITIAL_SCORE: 5
};

// Export/Import settings
export const EXPORT_CONFIG = {
  FILE_VERSION: '2.0',
  FILE_EXTENSION: '.gamemode.json'
};