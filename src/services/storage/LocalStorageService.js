import { STORAGE_KEYS } from '../../config/constants.js';

export class LocalStorageService {
  constructor() {
    this.currentUser = null;
    this.cache = new Map(); // In-memory cache for performance
  }

  setUser(user) {
    this.currentUser = user;
    this.cache.clear(); // Clear cache on user change
  }

  getUserKey(key) {
    if (!this.currentUser) {
      throw new Error('No user set for storage');
    }
    return `${this.currentUser.uid}_${key}`;
  }

  set(key, value) {
    try {
      const userKey = this.getUserKey(key);
      const serialized = JSON.stringify(value);
      localStorage.setItem(userKey, serialized);
      this.cache.set(userKey, value);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      if (error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded();
      }
      return false;
    }
  }

  get(key, defaultValue = null) {
    try {
      const userKey = this.getUserKey(key);
      
      // Check cache first
      if (this.cache.has(userKey)) {
        return this.cache.get(userKey);
      }
      
      const item = localStorage.getItem(userKey);
      if (item === null) return defaultValue;
      
      const parsed = JSON.parse(item);
      this.cache.set(userKey, parsed);
      return parsed;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  remove(key) {
    try {
      const userKey = this.getUserKey(key);
      localStorage.removeItem(userKey);
      this.cache.delete(userKey);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  exists(key) {
    const userKey = this.getUserKey(key);
    return localStorage.getItem(userKey) !== null;
  }

  clear() {
    if (!this.currentUser) return;
    
    const userPrefix = `${this.currentUser.uid}_`;
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(userPrefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    this.cache.clear();
  }

  getSize() {
    let size = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length + key.length;
      }
    }
    return size;
  }

  getUserDataSize() {
    if (!this.currentUser) return 0;
    
    const userPrefix = `${this.currentUser.uid}_`;
    let size = 0;
    
    for (let key in localStorage) {
      if (key.startsWith(userPrefix) && localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length + key.length;
      }
    }
    return size;
  }

  handleQuotaExceeded() {
    console.warn('LocalStorage quota exceeded. Attempting cleanup...');
    // Remove old history entries if needed
    const history = this.get(STORAGE_KEYS.HISTORY, []);
    if (history.length > 1000) {
      const recentHistory = history.slice(-1000);
      this.set(STORAGE_KEYS.HISTORY, recentHistory);
    }
  }

  // Test if localStorage is available
  static isAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
}