import { SYNC_CONFIG, STORAGE_KEYS } from '../../config/constants.js';

export class SyncService {
  constructor(localStorageService, apiClient) {
    this.localStorage = localStorageService;
    this.apiClient = apiClient;
    this.syncInProgress = false;
    this.syncQueue = [];
    this.retryCount = 0;
    this.isOnline = navigator.onLine;
    this.lastSyncTime = null;
    this.syncInterval = null;
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  handleOnline() {
    this.isOnline = true;
    console.log('🌐 Connection restored. Starting sync...');
    this.syncPendingChanges();
  }

  handleOffline() {
    this.isOnline = false;
    console.log('📵 Connection lost. Working offline...');
  }

  async queueChange(type, data) {
    const change = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date().toISOString(),
      retries: 0
    };
    
    this.syncQueue.push(change);
    this.saveSyncQueue();
    
    if (this.isOnline) {
      await this.processSyncQueue();
    }
  }

  saveSyncQueue() {
    this.localStorage.set(STORAGE_KEYS.PENDING_SYNC, this.syncQueue);
  }

  loadSyncQueue() {
    this.syncQueue = this.localStorage.get(STORAGE_KEYS.PENDING_SYNC, []);
  }

  async processSyncQueue() {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      const processedIds = [];
      
      for (const change of this.syncQueue) {
        try {
          await this.processChange(change);
          processedIds.push(change.id);
        } catch (error) {
          console.error(`Failed to process change ${change.id}:`, error);
          change.retries++;
          
          if (change.retries >= SYNC_CONFIG.MAX_RETRIES) {
            console.error(`Change ${change.id} exceeded max retries. Removing from queue.`);
            processedIds.push(change.id);
          }
        }
      }
      
      // Remove processed changes
      this.syncQueue = this.syncQueue.filter(c => !processedIds.includes(c.id));
      this.saveSyncQueue();
      
    } finally {
      this.syncInProgress = false;
    }
  }

  async processChange(change) {
    switch (change.type) {
      case 'full_sync':
        await this.apiClient.saveUserData(change.data);
        break;
      case 'add_history':
        await this.apiClient.addHistoryEntry(change.data);
        break;
      case 'update_protocol':
        await this.apiClient.updateProtocol(change.data);
        break;
      case 'update_innerface':
        await this.apiClient.updateInnerface(change.data);
        break;
      case 'update_state':
        await this.apiClient.updateState(change.data);
        break;
      default:
        console.warn(`Unknown change type: ${change.type}`);
    }
  }

  async syncWithServer() {
    if (this.syncInProgress || !this.isOnline) {
      return { success: false, reason: this.syncInProgress ? 'sync_in_progress' : 'offline' };
    }
    
    this.syncInProgress = true;
    
    try {
      // Process any pending changes first
      await this.processSyncQueue();
      
      // Get local data
      const localData = this.getAllLocalData();
      
      // Get server data
      const serverData = await this.apiClient.getUserData();
      
      // Merge data (server wins for conflicts)
      const mergedData = this.mergeData(localData, serverData);
      
      // Save merged data locally
      this.saveAllLocalData(mergedData);
      
      // Update last sync time
      this.lastSyncTime = new Date().toISOString();
      this.localStorage.set(STORAGE_KEYS.LAST_SYNC, this.lastSyncTime);
      
      return { success: true, data: mergedData };
      
    } catch (error) {
      console.error('Sync failed:', error);
      this.retryCount++;
      
      if (this.retryCount < SYNC_CONFIG.MAX_RETRIES) {
        setTimeout(() => this.syncWithServer(), SYNC_CONFIG.RETRY_DELAY);
      }
      
      return { success: false, error };
      
    } finally {
      this.syncInProgress = false;
    }
  }

  getAllLocalData() {
    return {
      protocols: this.localStorage.get(STORAGE_KEYS.PROTOCOLS, []),
      innerfaces: this.localStorage.get(STORAGE_KEYS.INNERFACES, []),
      states: this.localStorage.get(STORAGE_KEYS.STATES, []),
      history: this.localStorage.get(STORAGE_KEYS.HISTORY, []),
      quickActions: this.localStorage.get(STORAGE_KEYS.QUICK_ACTIONS, []),
      protocolOrder: this.localStorage.get(STORAGE_KEYS.PROTOCOL_ORDER, []),
      innerfaceOrder: this.localStorage.get(STORAGE_KEYS.INNERFACE_ORDER, []),
      stateOrder: this.localStorage.get(STORAGE_KEYS.STATE_ORDER, []),
      quickActionOrder: this.localStorage.get(STORAGE_KEYS.QUICK_ACTION_ORDER, [])
    };
  }

  saveAllLocalData(data) {
    this.localStorage.set(STORAGE_KEYS.PROTOCOLS, data.protocols || []);
    this.localStorage.set(STORAGE_KEYS.INNERFACES, data.innerfaces || []);
    this.localStorage.set(STORAGE_KEYS.STATES, data.states || []);
    this.localStorage.set(STORAGE_KEYS.HISTORY, data.history || []);
    this.localStorage.set(STORAGE_KEYS.QUICK_ACTIONS, data.quickActions || []);
    this.localStorage.set(STORAGE_KEYS.PROTOCOL_ORDER, data.protocolOrder || []);
    this.localStorage.set(STORAGE_KEYS.INNERFACE_ORDER, data.innerfaceOrder || []);
    this.localStorage.set(STORAGE_KEYS.STATE_ORDER, data.stateOrder || []);
    this.localStorage.set(STORAGE_KEYS.QUICK_ACTION_ORDER, data.quickActionOrder || []);
  }

  mergeData(localData, serverData) {
    // For now, server data wins for main entities
    // History is merged by combining and deduplicating
    const mergedHistory = this.mergeHistory(
      localData.history || [], 
      serverData.history || []
    );
    
    return {
      protocols: serverData.protocols || localData.protocols || [],
      innerfaces: serverData.innerfaces || localData.innerfaces || [],
      states: serverData.states || localData.states || [],
      history: mergedHistory,
      quickActions: serverData.quickActions || localData.quickActions || [],
      protocolOrder: serverData.protocolOrder || localData.protocolOrder || [],
      innerfaceOrder: serverData.innerfaceOrder || localData.innerfaceOrder || [],
      stateOrder: serverData.stateOrder || localData.stateOrder || [],
      quickActionOrder: serverData.quickActionOrder || localData.quickActionOrder || []
    };
  }

  mergeHistory(localHistory, serverHistory) {
    const historyMap = new Map();
    
    // Add server history first (higher priority)
    serverHistory.forEach(entry => {
      historyMap.set(entry.id, entry);
    });
    
    // Add local history (won't override server entries)
    localHistory.forEach(entry => {
      if (!historyMap.has(entry.id)) {
        historyMap.set(entry.id, entry);
      }
    });
    
    // Sort by timestamp
    return Array.from(historyMap.values())
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  async syncPendingChanges() {
    this.loadSyncQueue();
    if (this.syncQueue.length > 0) {
      console.log(`📤 Syncing ${this.syncQueue.length} pending changes...`);
      await this.processSyncQueue();
    }
    await this.syncWithServer();
  }

  startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncWithServer();
      }
    }, SYNC_CONFIG.AUTO_SYNC_INTERVAL);
  }

  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async performIntegrityCheck() {
    // Implement data integrity checks here
    console.log('🔍 Performing data integrity check...');
    
    const data = this.getAllLocalData();
    let hasIssues = false;
    
    // Check for orphaned references, duplicate IDs, etc.
    // ... implementation ...
    
    return hasIssues;
  }
}