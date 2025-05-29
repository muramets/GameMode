// ===== storage.js - Local Storage Management =====

const Storage = {
  // Keys
  KEYS: {
    PROTOCOLS: 'rpg_therapy_protocols',
    SKILLS: 'rpg_therapy_skills',
    STATES: 'rpg_therapy_states',
    CHECKINS: 'rpg_therapy_checkins',
    SETTINGS: 'rpg_therapy_settings'
  },

  // Initialize app data
  init() {
    // Check if data exists
    if (!this.get(this.KEYS.PROTOCOLS)) {
      // First time - set initial data
      this.set(this.KEYS.PROTOCOLS, INITIAL_DATA.protocols);
      this.set(this.KEYS.SKILLS, INITIAL_DATA.skills);
      this.set(this.KEYS.STATES, INITIAL_DATA.states);
      this.set(this.KEYS.CHECKINS, []);
      this.set(this.KEYS.SETTINGS, {
        initialized: new Date().toISOString(),
        version: '1.0'
      });
    }
  },

  // Get data from localStorage
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return null;
    }
  },

  // Set data to localStorage
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error writing to localStorage:', e);
      return false;
    }
  },

  // Get all protocols
  getProtocols() {
    return this.get(this.KEYS.PROTOCOLS) || [];
  },

  // Get all skills
  getSkills() {
    return this.get(this.KEYS.SKILLS) || [];
  },

  // Get skill by ID
  getSkillById(id) {
    const skills = this.getSkills();
    return skills.find(s => s.id === id);
  },

  // Update skill
  updateSkill(id, updates) {
    const skills = this.getSkills();
    const index = skills.findIndex(s => s.id === id);
    if (index !== -1) {
      skills[index] = { ...skills[index], ...updates };
      this.set(this.KEYS.SKILLS, skills);
      return true;
    }
    return false;
  },

  // Get all states
  getStates() {
    return this.get(this.KEYS.STATES) || [];
  },

  // Get all checkins
  getCheckins() {
    return this.get(this.KEYS.CHECKINS) || [];
  },

  // Add checkin
  addCheckin(protocolId) {
    const protocols = this.getProtocols();
    const protocol = protocols.find(p => p.id === protocolId);
    if (!protocol) return false;

    const checkin = {
      id: Date.now(),
      protocolId: protocolId,
      protocolName: protocol.name,
      protocolIcon: protocol.icon,
      timestamp: new Date().toISOString(),
      changes: {}
    };

    // Calculate skill changes
    const changeValue = protocol.action === '+' ? protocol.weight : -protocol.weight;
    
    protocol.targets.forEach(skillId => {
      checkin.changes[skillId] = changeValue;
    });

    // Save checkin
    const checkins = this.getCheckins();
    checkins.push(checkin);
    this.set(this.KEYS.CHECKINS, checkins);

    return checkin;
  },

  // Delete checkin
  deleteCheckin(checkinId) {
    const checkins = this.getCheckins();
    const filtered = checkins.filter(c => c.id !== checkinId);
    this.set(this.KEYS.CHECKINS, filtered);
    return true;
  },

  // Clear all checkins
  clearAllCheckins() {
    this.set(this.KEYS.CHECKINS, []);
    return true;
  },

  // Calculate current skill score
  calculateCurrentScore(skillId) {
    const skill = this.getSkillById(skillId);
    if (!skill) return 0;

    const checkins = this.getCheckins();
    let totalChange = 0;

    checkins.forEach(checkin => {
      if (checkin.changes[skillId]) {
        totalChange += checkin.changes[skillId];
      }
    });

    return Math.max(0, skill.initialScore + totalChange);
  },

  // Calculate state score
  calculateStateScore(stateId) {
    const states = this.getStates();
    const state = states.find(s => s.id === stateId);
    if (!state) return 0;

    let total = 0;
    state.skillIds.forEach(skillId => {
      total += this.calculateCurrentScore(skillId);
    });

    return total / state.skillIds.length;
  },

  // Get skill history
  getSkillHistory(skillId) {
    const checkins = this.getCheckins();
    return checkins.filter(c => c.changes[skillId] !== undefined);
  },

  // Get last update date for skill
  getSkillLastUpdate(skillId) {
    const history = this.getSkillHistory(skillId);
    if (history.length === 0) return null;
    
    return history[history.length - 1].timestamp;
  },

  // Export data
  exportData() {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      protocols: this.getProtocols(),
      skills: this.getSkills(),
      states: this.getStates(),
      checkins: this.getCheckins(),
      settings: this.get(this.KEYS.SETTINGS)
    };
    return data;
  },

  // Import data
  importData(data) {
    try {
      if (data.version !== '1.0') {
        throw new Error('Incompatible version');
      }
      
      this.set(this.KEYS.PROTOCOLS, data.protocols || []);
      this.set(this.KEYS.SKILLS, data.skills || []);
      this.set(this.KEYS.STATES, data.states || []);
      this.set(this.KEYS.CHECKINS, data.checkins || []);
      this.set(this.KEYS.SETTINGS, data.settings || {});
      
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  // Reset to initial data
  reset() {
    localStorage.removeItem(this.KEYS.PROTOCOLS);
    localStorage.removeItem(this.KEYS.SKILLS);
    localStorage.removeItem(this.KEYS.STATES);
    localStorage.removeItem(this.KEYS.CHECKINS);
    localStorage.removeItem(this.KEYS.SETTINGS);
    this.init();
  }
};
