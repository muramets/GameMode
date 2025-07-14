import { STORAGE_KEYS } from '../config/constants.js';
import { Protocol } from '../models/Protocol.js';
import { Innerface } from '../models/Innerface.js';
import { State } from '../models/State.js';
import { HistoryEntry } from '../models/HistoryEntry.js';
import { QuickAction } from '../models/QuickAction.js';

export class DataService {
  constructor(localStorageService, syncService) {
    this.localStorage = localStorageService;
    this.syncService = syncService;
    this.cache = {
      protocols: null,
      innerfaces: null,
      states: null,
      history: null,
      quickActions: null,
      scores: new Map() // Cache calculated scores
    };
  }

  // Initialize data with defaults if needed
  async initialize(initialData = null) {
    const hasData = this.localStorage.exists(STORAGE_KEYS.PROTOCOLS);
    
    if (!hasData && initialData) {
      // First time setup
      this.localStorage.set(STORAGE_KEYS.PROTOCOLS, initialData.protocols || []);
      this.localStorage.set(STORAGE_KEYS.INNERFACES, initialData.innerfaces || []);
      this.localStorage.set(STORAGE_KEYS.STATES, initialData.states || []);
      this.localStorage.set(STORAGE_KEYS.HISTORY, []);
      this.localStorage.set(STORAGE_KEYS.QUICK_ACTIONS, []);
      
      // Initialize orders
      this.localStorage.set(STORAGE_KEYS.PROTOCOL_ORDER, initialData.protocols?.map(p => p.id) || []);
      this.localStorage.set(STORAGE_KEYS.INNERFACE_ORDER, initialData.innerfaces?.map(i => i.id) || []);
      this.localStorage.set(STORAGE_KEYS.STATE_ORDER, initialData.states?.map(s => s.id) || []);
      this.localStorage.set(STORAGE_KEYS.QUICK_ACTION_ORDER, []);
    }
    
    // Load data into cache
    this.refreshCache();
  }

  refreshCache() {
    this.cache.protocols = null;
    this.cache.innerfaces = null;
    this.cache.states = null;
    this.cache.history = null;
    this.cache.quickActions = null;
    this.cache.scores.clear();
  }

  // Protocols
  getProtocols() {
    if (!this.cache.protocols) {
      const protocols = this.localStorage.get(STORAGE_KEYS.PROTOCOLS, []);
      this.cache.protocols = protocols.map(p => new Protocol(p));
    }
    return this.cache.protocols;
  }

  getProtocolsInOrder() {
    const protocols = this.getProtocols();
    const order = this.localStorage.get(STORAGE_KEYS.PROTOCOL_ORDER, []);
    
    const protocolMap = new Map(protocols.map(p => [p.id, p]));
    const ordered = [];
    
    // Add protocols in order
    order.forEach(id => {
      const protocol = protocolMap.get(id);
      if (protocol) {
        ordered.push(protocol);
        protocolMap.delete(id);
      }
    });
    
    // Add any remaining protocols
    protocolMap.forEach(protocol => ordered.push(protocol));
    
    return ordered;
  }

  getProtocolById(id) {
    return this.getProtocols().find(p => p.id === id);
  }

  async addProtocol(protocol) {
    const protocols = this.getProtocols();
    protocols.push(protocol);
    this.localStorage.set(STORAGE_KEYS.PROTOCOLS, protocols.map(p => p.toJSON()));
    this.cache.protocols = null;
    
    // Update order
    const order = this.localStorage.get(STORAGE_KEYS.PROTOCOL_ORDER, []);
    order.push(protocol.id);
    this.localStorage.set(STORAGE_KEYS.PROTOCOL_ORDER, order);
    
    // Queue sync
    await this.syncService.queueChange('update_protocol', protocol.toJSON());
  }

  async updateProtocol(id, updates) {
    const protocols = this.getProtocols();
    const index = protocols.findIndex(p => p.id === id);
    
    if (index !== -1) {
      const updated = new Protocol({ ...protocols[index].toJSON(), ...updates });
      protocols[index] = updated;
      this.localStorage.set(STORAGE_KEYS.PROTOCOLS, protocols.map(p => p.toJSON()));
      this.cache.protocols = null;
      
      await this.syncService.queueChange('update_protocol', updated.toJSON());
    }
  }

  async deleteProtocol(id) {
    const protocols = this.getProtocols().filter(p => p.id !== id);
    this.localStorage.set(STORAGE_KEYS.PROTOCOLS, protocols.map(p => p.toJSON()));
    this.cache.protocols = null;
    
    // Update order
    const order = this.localStorage.get(STORAGE_KEYS.PROTOCOL_ORDER, []).filter(pid => pid !== id);
    this.localStorage.set(STORAGE_KEYS.PROTOCOL_ORDER, order);
    
    await this.syncService.queueChange('delete_protocol', { id });
  }

  // Innerfaces
  getInnerfaces() {
    if (!this.cache.innerfaces) {
      const innerfaces = this.localStorage.get(STORAGE_KEYS.INNERFACES, []);
      this.cache.innerfaces = innerfaces.map(i => new Innerface(i));
    }
    return this.cache.innerfaces;
  }

  getInnerfacesInOrder() {
    const innerfaces = this.getInnerfaces();
    const order = this.localStorage.get(STORAGE_KEYS.INNERFACE_ORDER, []);
    
    const innerfaceMap = new Map(innerfaces.map(i => [i.id, i]));
    const ordered = [];
    
    order.forEach(id => {
      const innerface = innerfaceMap.get(id);
      if (innerface) {
        ordered.push(innerface);
        innerfaceMap.delete(id);
      }
    });
    
    innerfaceMap.forEach(innerface => ordered.push(innerface));
    
    return ordered;
  }

  getInnerfaceById(id) {
    return this.getInnerfaces().find(i => i.id === id);
  }

  calculateInnerfaceScore(innerfaceId) {
    const cacheKey = `innerface_${innerfaceId}`;
    if (this.cache.scores.has(cacheKey)) {
      return this.cache.scores.get(cacheKey);
    }
    
    const innerface = this.getInnerfaceById(innerfaceId);
    if (!innerface) return 0;
    
    const history = this.getHistory();
    const totalChange = history
      .filter(entry => entry.changes && entry.changes[innerfaceId])
      .reduce((sum, entry) => sum + (entry.changes[innerfaceId] || 0), 0);
    
    const score = Math.max(0, Math.min(10, innerface.initialScore + totalChange));
    this.cache.scores.set(cacheKey, score);
    
    return score;
  }

  // States
  getStates() {
    if (!this.cache.states) {
      const states = this.localStorage.get(STORAGE_KEYS.STATES, []);
      this.cache.states = states.map(s => new State(s));
    }
    return this.cache.states;
  }

  getStatesInOrder() {
    const states = this.getStates();
    const order = this.localStorage.get(STORAGE_KEYS.STATE_ORDER, []);
    
    const stateMap = new Map(states.map(s => [s.id, s]));
    const ordered = [];
    
    order.forEach(id => {
      const state = stateMap.get(id);
      if (state) {
        ordered.push(state);
        stateMap.delete(id);
      }
    });
    
    stateMap.forEach(state => ordered.push(state));
    
    return ordered;
  }

  getStateById(id) {
    return this.getStates().find(s => s.id === id);
  }

  calculateStateScore(stateId) {
    const cacheKey = `state_${stateId}`;
    if (this.cache.scores.has(cacheKey)) {
      return this.cache.scores.get(cacheKey);
    }
    
    const state = this.getStateById(stateId);
    if (!state) return 0;
    
    const scores = [];
    
    // Add innerface scores
    state.innerfaceIds.forEach(id => {
      scores.push(this.calculateInnerfaceScore(id));
    });
    
    // Add nested state scores (recursive)
    state.stateIds.forEach(id => {
      scores.push(this.calculateStateScore(id));
    });
    
    const score = scores.length > 0 
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
      : 0;
      
    this.cache.scores.set(cacheKey, score);
    
    return score;
  }

  // History
  getHistory() {
    if (!this.cache.history) {
      const history = this.localStorage.get(STORAGE_KEYS.HISTORY, []);
      this.cache.history = history.map(h => new HistoryEntry(h));
    }
    return this.cache.history;
  }

  async addHistoryEntry(entry) {
    const history = this.getHistory();
    history.push(entry);
    this.localStorage.set(STORAGE_KEYS.HISTORY, history.map(h => h.toJSON()));
    this.cache.history = null;
    this.cache.scores.clear(); // Clear score cache
    
    await this.syncService.queueChange('add_history', entry.toJSON());
  }

  async deleteHistoryEntry(id) {
    const history = this.getHistory().filter(h => h.id !== id);
    this.localStorage.set(STORAGE_KEYS.HISTORY, history.map(h => h.toJSON()));
    this.cache.history = null;
    this.cache.scores.clear();
    
    await this.syncService.queueChange('delete_history', { id });
  }

  // Quick Actions
  getQuickActions() {
    if (!this.cache.quickActions) {
      const quickActions = this.localStorage.get(STORAGE_KEYS.QUICK_ACTIONS, []);
      this.cache.quickActions = quickActions.map(qa => new QuickAction(qa));
    }
    return this.cache.quickActions;
  }

  async setQuickActions(quickActions) {
    this.localStorage.set(STORAGE_KEYS.QUICK_ACTIONS, quickActions);
    this.cache.quickActions = null;
    
    await this.syncService.queueChange('update_quick_actions', quickActions);
  }

  // Orders
  setProtocolOrder(order) {
    this.localStorage.set(STORAGE_KEYS.PROTOCOL_ORDER, order);
  }

  setInnerfaceOrder(order) {
    this.localStorage.set(STORAGE_KEYS.INNERFACE_ORDER, order);
  }

  setStateOrder(order) {
    this.localStorage.set(STORAGE_KEYS.STATE_ORDER, order);
  }

  setQuickActionOrder(order) {
    this.localStorage.set(STORAGE_KEYS.QUICK_ACTION_ORDER, order);
  }

  // Get all data
  getAllData() {
    return {
      protocols: this.getProtocols().map(p => p.toJSON()),
      innerfaces: this.getInnerfaces().map(i => i.toJSON()),
      states: this.getStates().map(s => s.toJSON()),
      history: this.getHistory().map(h => h.toJSON()),
      quickActions: this.getQuickActions().map(qa => qa.toJSON()),
      protocolOrder: this.localStorage.get(STORAGE_KEYS.PROTOCOL_ORDER, []),
      innerfaceOrder: this.localStorage.get(STORAGE_KEYS.INNERFACE_ORDER, []),
      stateOrder: this.localStorage.get(STORAGE_KEYS.STATE_ORDER, []),
      quickActionOrder: this.localStorage.get(STORAGE_KEYS.QUICK_ACTION_ORDER, [])
    };
  }

  // Clear all data
  async clearAll() {
    this.localStorage.clear();
    this.refreshCache();
    await this.syncService.queueChange('clear_all', {});
  }
}