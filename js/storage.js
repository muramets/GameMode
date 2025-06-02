// ===== storage.js - Local Storage Management =====

class Storage {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingSync = new Set();
    this.lastSyncTime = null;
    this.currentUser = null;
    
    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingChanges();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }
  
  // Set current user for data scoping
  setUser(user) {
    const wasUserChange = this.currentUser && user && this.currentUser.uid !== user.uid;
    this.currentUser = user;
    this.lastSyncTime = null; // Reset sync time when user changes
    
    // Check for legacy data on first user set or user change
    if (wasUserChange || !this.hasBeenInitialized()) {
      this.checkAndMigrateLegacyData();
    }
  }
  
  // Check if user has been initialized (has any data)
  hasBeenInitialized() {
    return this.get(this.KEYS.PROTOCOLS) !== null || 
           this.get(this.KEYS.SKILLS) !== null || 
           this.get(this.KEYS.STATES) !== null;
  }
  
  // Check for legacy data and migrate if needed (one-time operation per user)
  checkAndMigrateLegacyData() {
    if (!this.currentUser) return;
    
    // Only migrate legacy data for the original user
    if (this.currentUser.email !== 'muramets007@gmail.com') {
      return;
    }
    
    // Check if this user has a legacy migration marker
    const legacyMigrationKey = `legacy_migrated_${this.currentUser.uid}`;
    const hasBeenMigrated = localStorage.getItem(legacyMigrationKey);
    
    if (hasBeenMigrated) return; // Already migrated
    
    // Check for legacy data (data without user prefix)
    const allLegacyKeys = [
      this.KEYS.PROTOCOLS, this.KEYS.SKILLS, this.KEYS.STATES, this.KEYS.HISTORY,
      this.KEYS.QUICK_ACTIONS, this.KEYS.QUICK_ACTION_ORDER, 
      this.KEYS.PROTOCOL_ORDER, this.KEYS.SKILL_ORDER, this.KEYS.STATE_ORDER,
      this.KEYS.SKILL_MIGRATION
    ];
    let foundLegacyData = false;
    
    allLegacyKeys.forEach(key => {
      const legacyData = localStorage.getItem(key); // without user prefix
      const currentData = this.get(key); // with user prefix
      
      // Check if we should migrate
      let shouldMigrate = false;
      
      if (legacyData && !currentData) {
        shouldMigrate = true;
      } else if (legacyData && currentData) {
        // Check if current data is just default/empty
        try {
          const parsedLegacy = JSON.parse(legacyData);
          const parsedCurrent = currentData;
          
          if (Array.isArray(parsedLegacy) && Array.isArray(parsedCurrent)) {
            // For main data arrays, check if current is empty or matches INITIAL_DATA
            if (parsedCurrent.length === 0 && parsedLegacy.length > 0) {
              shouldMigrate = true;
            } else if (key === this.KEYS.PROTOCOLS && this.isDefaultProtocols(parsedCurrent) && parsedLegacy.length > 0) {
              shouldMigrate = true;
            } else if (key === this.KEYS.SKILLS && this.isDefaultSkills(parsedCurrent) && parsedLegacy.length > 0) {
              shouldMigrate = true;
            } else if (key === this.KEYS.STATES && this.isDefaultStates(parsedCurrent) && parsedLegacy.length > 0) {
              shouldMigrate = true;
            }
          }
        } catch (e) {
          console.warn(`Error comparing data for ${key}:`, e);
        }
      }
      
      if (shouldMigrate) {
        try {
          const parsedData = JSON.parse(legacyData);
          
          // For arrays, check if they have content
          if (Array.isArray(parsedData)) {
            if (parsedData.length > 0) {
              console.log(`Migrating legacy ${key} data for user ${this.currentUser.uid}`);
              this.set(key, parsedData);
              foundLegacyData = true;
            }
          } else if (parsedData !== null && parsedData !== undefined) {
            // For non-arrays (booleans, etc.)
            console.log(`Migrating legacy ${key} data for user ${this.currentUser.uid}`);
            this.set(key, parsedData);
            foundLegacyData = true;
          }
        } catch (e) {
          console.warn(`Failed to migrate legacy ${key}:`, e);
        }
      }
    });
    
    // Mark as migrated to prevent future attempts
    localStorage.setItem(legacyMigrationKey, 'true');
    
    if (foundLegacyData) {
      console.log(`Legacy data migration completed for user ${this.currentUser.uid}`);
    }
  }
  
  // Get user-specific key
  getUserKey(key) {
    if (!this.currentUser) return key;
    return `${this.currentUser.uid}_${key}`;
  }

  // Keys
  KEYS = {
    PROTOCOLS: 'protocols',
    SKILLS: 'skills',
    STATES: 'states',
    HISTORY: 'history',
    QUICK_ACTIONS: 'quickActions',
    QUICK_ACTION_ORDER: 'quickActionOrder',
    PROTOCOL_ORDER: 'protocolOrder',
    SKILL_ORDER: 'skillOrder',
    STATE_ORDER: 'stateOrder',
    SKILL_MIGRATION: 'skillMigration'
  };

  // Initialize app data
  init() {
    console.log('🔧 STORAGE INIT:', {
      user: this.currentUser?.email,
      userId: this.currentUser?.uid
    });
    
    if (this.currentUser) {
      this.checkAndMigrateLegacyData();
    }
    
    // Initialize each key separately if it doesn't exist
    if (!this.get(this.KEYS.PROTOCOLS)) {
      // Only load default data for the original developer, others start with empty arrays
      const isDevUser = this.currentUser && this.currentUser.email === 'muramets007@gmail.com';
      this.set(this.KEYS.PROTOCOLS, isDevUser ? INITIAL_DATA.protocols : []);
    } else {
      // Check if existing data is just empty
      const existingProtocols = this.get(this.KEYS.PROTOCOLS);
      if (Array.isArray(existingProtocols) && existingProtocols.length === 0) {
        // For dev user only, load defaults if they have empty data
        const isDevUser = this.currentUser && this.currentUser.email === 'muramets007@gmail.com';
        if (isDevUser) {
          this.set(this.KEYS.PROTOCOLS, INITIAL_DATA.protocols);
        }
        // Other users keep empty arrays - sync will load their server data
      }
      // If user has custom data (length > 0), keep it as is
    }
    
    if (!this.get(this.KEYS.SKILLS)) {
      // Only load default data for the original developer, others start with empty arrays
      const isDevUser = this.currentUser && this.currentUser.email === 'muramets007@gmail.com';
      this.set(this.KEYS.SKILLS, isDevUser ? INITIAL_DATA.skills : []);
    } else {
      const existingSkills = this.get(this.KEYS.SKILLS);
      if (Array.isArray(existingSkills) && existingSkills.length === 0) {
        // For dev user only, load defaults if they have empty data
        const isDevUser = this.currentUser && this.currentUser.email === 'muramets007@gmail.com';
        if (isDevUser) {
          this.set(this.KEYS.SKILLS, INITIAL_DATA.skills);
        }
        // Other users keep empty arrays - sync will load their server data
      }
    }
    
    if (!this.get(this.KEYS.STATES)) {
      // Only load default data for the original developer, others start with empty arrays
      const isDevUser = this.currentUser && this.currentUser.email === 'muramets007@gmail.com';
      this.set(this.KEYS.STATES, isDevUser ? INITIAL_DATA.states : []);
    } else {
      const existingStates = this.get(this.KEYS.STATES);
      if (Array.isArray(existingStates) && existingStates.length === 0) {
        // For dev user only, load defaults if they have empty data
        const isDevUser = this.currentUser && this.currentUser.email === 'muramets007@gmail.com';
        if (isDevUser) {
          this.set(this.KEYS.STATES, INITIAL_DATA.states);
        }
        // Other users keep empty arrays - sync will load their server data
      }
    }
    
    if (!this.get(this.KEYS.HISTORY)) {
      this.set(this.KEYS.HISTORY, []);
    }
    
    if (!this.get(this.KEYS.QUICK_ACTIONS)) {
      // Set default quick actions only if user has existing protocols
      const existingProtocols = this.get(this.KEYS.PROTOCOLS);
      if (existingProtocols && existingProtocols.length > 0) {
        // Use first 5 available protocol IDs as defaults
        const defaultQuickActions = existingProtocols.slice(0, 5).map(p => p.id);
        this.set(this.KEYS.QUICK_ACTIONS, defaultQuickActions);
        this.set(this.KEYS.QUICK_ACTION_ORDER, defaultQuickActions);
      } else {
        // For users without protocols, set empty quick actions
        this.set(this.KEYS.QUICK_ACTIONS, []);
        this.set(this.KEYS.QUICK_ACTION_ORDER, []);
      }
    }
    
    // Initialize quick action order if missing
    if (!this.get(this.KEYS.QUICK_ACTION_ORDER)) {
      const quickActions = this.get(this.KEYS.QUICK_ACTIONS) || [];
      this.set(this.KEYS.QUICK_ACTION_ORDER, quickActions);
    }
    
    // Initialize other order keys if missing
    if (!this.get(this.KEYS.PROTOCOL_ORDER)) {
      this.set(this.KEYS.PROTOCOL_ORDER, []);
    }
    
    if (!this.get(this.KEYS.SKILL_ORDER)) {
      this.set(this.KEYS.SKILL_ORDER, []);
    }
    
    if (!this.get(this.KEYS.STATE_ORDER)) {
      this.set(this.KEYS.STATE_ORDER, []);
    }
    
    if (!this.get(this.KEYS.SKILL_MIGRATION)) {
      this.set(this.KEYS.SKILL_MIGRATION, false);
    }
  }

  // Get data from localStorage
  get(key) {
    try {
      const data = localStorage.getItem(this.getUserKey(key));
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return null;
    }
  }

  // Set data to localStorage
  set(key, value) {
    try {
      localStorage.setItem(this.getUserKey(key), JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error writing to localStorage:', e);
      return false;
    }
  }

  // Get all protocols
  getProtocols() {
    try {
      const protocols = this.get(this.KEYS.PROTOCOLS);
      return Array.isArray(protocols) ? protocols : [];
    } catch (error) {
      console.warn('Error getting protocols:', error);
      return [];
    }
  }

  // Get all skills
  getSkills() {
    try {
      const skills = this.get(this.KEYS.SKILLS);
      return Array.isArray(skills) ? skills : [];
    } catch (error) {
      console.warn('Error getting skills:', error);
      return [];
    }
  }

  // Get skill by ID
  getSkillById(id) {
    try {
      const skills = this.getSkills();
      // Find skill by exact ID match, considering both string and number IDs
      const skill = skills.find(s => s.id === id || s.id == id);
      return skill;
    } catch (error) {
      console.warn('Error getting skill by ID:', error);
      return null;
    }
  }

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
  }

  // Get all states
  getStates() {
    try {
      const states = this.get(this.KEYS.STATES);
      return Array.isArray(states) ? states : [];
    } catch (error) {
      console.warn('Error getting states:', error);
      return [];
    }
  }

  // Get all checkins
  getCheckins() {
    try {
      const checkins = this.get(this.KEYS.HISTORY);
      return Array.isArray(checkins) ? checkins : [];
    } catch (error) {
      console.warn('Error getting checkins:', error);
      return [];
    }
  }

  // Add checkin
  addCheckin(protocolId, action = '+') {
    const protocols = this.getProtocols();
    const protocol = protocols.find(p => p.id === protocolId);
    if (!protocol) return false;

    const checkin = {
      id: Date.now(),
      type: 'protocol',
      protocolId: protocolId,
      protocolName: protocol.name,
      protocolIcon: protocol.icon,
      timestamp: new Date().toISOString(),
      action: action, // Save the original action ('+' or '-')
      changes: {}
    };

    // Calculate skill changes only if protocol has targets
    if (protocol.targets && protocol.targets.length > 0) {
      const changeValue = action === '+' ? protocol.weight : -protocol.weight;
      
      protocol.targets.forEach(skillId => {
        checkin.changes[skillId] = changeValue;
      });
    }

    // Save checkin
    const checkins = this.getCheckins();
    checkins.push(checkin);
    this.set(this.KEYS.HISTORY, checkins);

    return checkin;
  }

  // Recalculate protocol history when targets change
  recalculateProtocolHistory(protocolId, oldTargets, newTargets) {
    const checkins = this.getCheckins();
    const protocol = this.getProtocolById(protocolId);
    if (!protocol) return false;

    let hasChanges = false;

    checkins.forEach(checkin => {
      if (checkin.type === 'protocol' && checkin.protocolId === protocolId) {
        // Use the saved action if available, otherwise try to determine from changes
        let originalAction = '+'; // default
        
        if (checkin.action) {
          // Use the explicitly saved action (new format)
          originalAction = checkin.action;
        } else if (checkin.changes && Object.keys(checkin.changes).length > 0) {
          // Fallback: try to determine action from existing changes (legacy format)
          const firstChange = Object.values(checkin.changes)[0];
          originalAction = firstChange >= 0 ? '+' : '-';
        }
        
        // Get the current weight for this protocol
        const changeValue = originalAction === '+' ? protocol.weight : -protocol.weight;
        
        // Remove old target effects
        if (oldTargets && oldTargets.length > 0) {
          oldTargets.forEach(skillId => {
            if (checkin.changes[skillId] !== undefined) {
              delete checkin.changes[skillId];
              hasChanges = true;
            }
          });
        }

        // Add new target effects with the current protocol weight
        if (newTargets && newTargets.length > 0) {
          newTargets.forEach(skillId => {
            checkin.changes[skillId] = changeValue;
            hasChanges = true;
          });
        }
      }
    });

    if (hasChanges) {
      this.set(this.KEYS.HISTORY, checkins);
    }

    return hasChanges;
  }

  // Add drag & drop operation to history
  addDragDropOperation(type, itemId, itemName, itemIcon, oldOrder, newOrder) {
    const oldPosition = oldOrder.indexOf(itemId) + 1;
    const newPosition = newOrder.indexOf(itemId) + 1;
    
    const operation = {
      id: Date.now(),
      type: 'drag_drop',
      subType: type, // 'protocol' or 'skill'
      itemId: itemId,
      itemName: itemName,
      itemIcon: itemIcon,
      timestamp: new Date().toISOString(),
      oldPosition: oldPosition,
      newPosition: newPosition,
      oldOrder: oldOrder,
      newOrder: newOrder,
      changes: {}
    };

    const checkins = this.getCheckins();
    checkins.push(operation);
    this.set(this.KEYS.HISTORY, checkins);

    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ DRAG & DROP
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after drag & drop failed:', error);
    });

    return operation;
  }

  // Delete checkin
  deleteCheckin(checkinId) {
    const checkins = this.getCheckins();
    const checkin = checkins.find(c => c.id === checkinId);
    
    // If it's a drag & drop operation, revert the specific change
    if (checkin && checkin.type === 'drag_drop') {
      if (checkin.subType === 'protocol') {
        const currentOrder = [...this.getProtocolOrder()];
        
        // Find where the item is now
        const currentIndex = currentOrder.indexOf(checkin.itemId);
        if (currentIndex !== -1) {
          // Remove the item from current position
          currentOrder.splice(currentIndex, 1);
          
          // Calculate where to put it back
          // We need to find the correct position considering other items may have moved
          let targetPosition = checkin.oldPosition - 1; // Convert to 0-based index
          
          // Count how many items that were originally before the target position are still there
          let actualPosition = 0;
          for (let i = 0; i < checkin.oldOrder.length && actualPosition < targetPosition; i++) {
            const originalItemId = checkin.oldOrder[i];
            if (originalItemId !== checkin.itemId && currentOrder.includes(originalItemId)) {
              const currentPos = currentOrder.indexOf(originalItemId);
              if (currentPos >= actualPosition) {
                actualPosition++;
              }
            }
          }
          
          // Insert at the calculated position
          currentOrder.splice(Math.min(actualPosition, currentOrder.length), 0, checkin.itemId);
          this.setProtocolOrder(currentOrder);
        }
      } else if (checkin.subType === 'skill') {
        const currentOrder = [...this.getSkillOrder()];
        
        // Find where the item is now
        const currentIndex = currentOrder.indexOf(checkin.itemId);
        if (currentIndex !== -1) {
          // Remove the item from current position
          currentOrder.splice(currentIndex, 1);
          
          // Calculate where to put it back
          let targetPosition = checkin.oldPosition - 1; // Convert to 0-based index
          
          // Count how many items that were originally before the target position are still there
          let actualPosition = 0;
          for (let i = 0; i < checkin.oldOrder.length && actualPosition < targetPosition; i++) {
            const originalItemId = checkin.oldOrder[i];
            if (originalItemId !== checkin.itemId && currentOrder.includes(originalItemId)) {
              const currentPos = currentOrder.indexOf(originalItemId);
              if (currentPos >= actualPosition) {
                actualPosition++;
              }
            }
          }
          
          // Insert at the calculated position
          currentOrder.splice(Math.min(actualPosition, currentOrder.length), 0, checkin.itemId);
          this.setSkillOrder(currentOrder);
        }
      }
    }
    
    const filtered = checkins.filter(c => c.id !== checkinId);
    this.set(this.KEYS.HISTORY, filtered);
    return true;
  }

  // Clear all checkins
  clearAllCheckins() {
    this.set(this.KEYS.HISTORY, []);
    return true;
  }

  // Calculate current skill score
  calculateCurrentScore(skillId) {
    const skill = this.getSkillById(skillId);
    if (!skill) return 0;

    const checkins = this.getCheckins();
    let totalChange = 0;

    checkins.forEach((checkin, index) => {
      if (checkin.changes && checkin.type === 'protocol') {
        // Check if this checkin affects our skill
        if (checkin.changes[skillId] !== undefined) {
          totalChange += checkin.changes[skillId];
        }
      }
    });

    return Math.max(0, skill.initialScore + totalChange);
  }

  // Calculate state score
  calculateStateScore(stateId, visitedStates = new Set()) {
    const states = this.getStates();
    const state = states.find(s => s.id === stateId);
    if (!state) return 0;

    // Prevent circular dependencies
    if (visitedStates.has(stateId)) {
      console.warn(`Circular dependency detected for state: ${stateId}`);
      return 0;
    }
    visitedStates.add(stateId);

    let total = 0;
    let count = 0;

    // Calculate contribution from skills
    if (state.skillIds && state.skillIds.length > 0) {
      state.skillIds.forEach(skillId => {
        total += this.calculateCurrentScore(skillId);
        count++;
      });
    }

    // Calculate contribution from other states
    if (state.stateIds && state.stateIds.length > 0) {
      state.stateIds.forEach(dependentStateId => {
        total += this.calculateStateScore(dependentStateId, new Set(visitedStates));
        count++;
      });
    }

    return count > 0 ? total / count : 0;
  }

  // Calculate skill score at specific date
  calculateCurrentScoreAtDate(skillId, targetDate) {
    const skill = this.getSkillById(skillId);
    if (!skill) return 0;

    const checkins = this.getCheckins();
    let totalChange = 0;

    // Get target date as string for comparison
    const targetDateStr = new Date(targetDate).toDateString();

    checkins.forEach((checkin, index) => {
      if (checkin.changes && checkin.type === 'protocol') {
        // Check if this checkin affects our skill and happened before/on target date
        const checkinDate = new Date(checkin.timestamp);
        const checkinDateStr = checkinDate.toDateString();
        
        if (checkinDateStr <= targetDateStr && checkin.changes[skillId] !== undefined) {
          totalChange += checkin.changes[skillId];
        }
      }
    });

    return Math.max(0, skill.initialScore + totalChange);
  }

  // Calculate state score at specific date
  calculateStateScoreAtDate(stateId, targetDate, visitedStates = new Set()) {
    const states = this.getStates();
    const state = states.find(s => s.id === stateId);
    if (!state) return 0;

    // Prevent circular dependencies
    if (visitedStates.has(stateId)) {
      console.warn(`Circular dependency detected for state: ${stateId}`);
      return 0;
    }
    visitedStates.add(stateId);

    let total = 0;
    let count = 0;

    // Calculate contribution from skills
    if (state.skillIds && state.skillIds.length > 0) {
      state.skillIds.forEach(skillId => {
        total += this.calculateCurrentScoreAtDate(skillId, targetDate);
        count++;
      });
    }

    // Calculate contribution from other states
    if (state.stateIds && state.stateIds.length > 0) {
      state.stateIds.forEach(dependentStateId => {
        total += this.calculateStateScoreAtDate(dependentStateId, targetDate, new Set(visitedStates));
        count++;
      });
    }

    return count > 0 ? total / count : 0;
  }

  // Get skill history
  getSkillHistory(skillId) {
    const checkins = this.getCheckins();
    return checkins.filter(c => c.changes[skillId] !== undefined);
  }

  // Get last update date for skill
  getSkillLastUpdate(skillId) {
    const history = this.getSkillHistory(skillId);
    if (history.length === 0) return null;
    
    return history[history.length - 1].timestamp;
  }

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
  }

  // Import data
  importData(data) {
    try {
      if (data.version !== '1.0') {
        throw new Error('Incompatible version');
      }
      
      this.set(this.KEYS.PROTOCOLS, data.protocols || []);
      this.set(this.KEYS.SKILLS, data.skills || []);
      this.set(this.KEYS.STATES, data.states || []);
      this.set(this.KEYS.HISTORY, data.checkins || []);
      this.set(this.KEYS.SETTINGS, data.settings || {});
      
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  // Reset to initial data
  reset() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(this.getUserKey(key));
    });
    this.init();
    return true;
  }

  // Protocol Order Management
  getProtocolOrder() {
    return this.get(this.KEYS.PROTOCOL_ORDER) || [];
  }

  setProtocolOrder(order) {
    return this.set(this.KEYS.PROTOCOL_ORDER, order);
  }

  getProtocolsInOrder() {
    const protocols = this.getProtocols();
    const customOrder = this.getProtocolOrder();
    
    if (customOrder.length === 0) {
      return protocols;
    }
    
    // Sort by custom order, then by original order for new items
    const ordered = [];
    const used = new Set();
    
    // Add items in custom order
    customOrder.forEach(id => {
      // Convert ID to number for comparison
      const targetId = typeof id === 'string' ? parseInt(id) : id;
      const protocol = protocols.find(p => p.id === targetId);
      if (protocol) {
        ordered.push(protocol);
        used.add(protocol.id);
      }
    });
    
    // Add any new items not in custom order
    protocols.forEach(protocol => {
      if (!used.has(protocol.id)) {
        ordered.push(protocol);
      }
    });
    
    return ordered;
  }

  // Skill Order Management
  getSkillOrder() {
    return this.get(this.KEYS.SKILL_ORDER) || [];
  }

  setSkillOrder(order) {
    return this.set(this.KEYS.SKILL_ORDER, order);
  }

  getSkillsInOrder() {
    const skills = this.getSkills();
    const customOrder = this.getSkillOrder();
    
    if (customOrder.length === 0) {
      return skills;
    }
    
    // Sort by custom order, then by original order for new items
    const ordered = [];
    const used = new Set();
    
    // Add items in custom order
    customOrder.forEach(id => {
      // Find skill by exact ID match (no conversion)
      const skill = skills.find(s => s.id === id);
      if (skill) {
        ordered.push(skill);
        used.add(skill.id);
      }
    });
    
    // Add any new items not in custom order
    skills.forEach(skill => {
      if (!used.has(skill.id)) {
        ordered.push(skill);
      }
    });
    
    return ordered;
  }

  // Add new skill
  addSkill(skillData) {
    const skills = this.getSkills();
    
    // Generate new ID - only consider numeric IDs for max calculation
    const numericIds = skills.map(s => s.id).filter(id => typeof id === 'number');
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
    const newId = maxId + 1;
    
    // Create new skill object
    const newSkill = {
      id: newId,
      name: skillData.name + (skillData.description ? '. ' + skillData.description : ''),
      icon: skillData.icon,
      hover: skillData.hover || '',
      initialScore: skillData.initialScore
    };
    
    // Add to skills array
    skills.push(newSkill);
    this.set(this.KEYS.SKILLS, skills);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ СОЗДАНИЯ НАВЫКА
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after skill creation failed:', error);
    });
    
    return newSkill;
  }

  // Update skill completely
  updateSkillFull(skillId, skillData) {
    const skills = this.getSkills();
    const index = skills.findIndex(s => s.id === skillId);
    
    if (index === -1) return false;
    
    // Update skill object
    skills[index] = {
      id: skillId,
      name: skillData.name + (skillData.description ? '. ' + skillData.description : ''),
      icon: skillData.icon,
      hover: skillData.hover || '',
      initialScore: skillData.initialScore
    };
    
    this.set(this.KEYS.SKILLS, skills);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ ОБНОВЛЕНИЯ НАВЫКА
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after skill update failed:', error);
    });
    
    return skills[index];
  }

  // Delete skill
  deleteSkill(skillId) {
    const skills = this.getSkills();
    const filteredSkills = skills.filter(s => s.id !== skillId);
    
    if (filteredSkills.length === skills.length) {
      return false; // Skill not found
    }
    
    // Remove from skills
    this.set(this.KEYS.SKILLS, filteredSkills);
    
    // Remove from custom order
    const customOrder = this.getSkillOrder();
    const filteredOrder = customOrder.filter(id => id !== skillId);
    this.setSkillOrder(filteredOrder);
    
    // Note: We're not removing checkins/history related to this skill
    // This preserves historical data integrity
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ УДАЛЕНИЯ НАВЫКА
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after skill deletion failed:', error);
    });
    
    return true;
  }

  // Protocol CRUD operations
  
  // Add new protocol
  addProtocol(protocolData) {
    const protocols = this.getProtocols();
    
    // Generate new ID
    const newId = protocols.length > 0 ? Math.max(...protocols.map(p => p.id)) + 1 : 1;
    
    // Create protocol object
    const newProtocol = {
      id: newId,
      name: protocolData.name + (protocolData.description ? '. ' + protocolData.description : ''),
      icon: protocolData.icon,
      hover: protocolData.hover || '',
      weight: protocolData.weight,
      targets: protocolData.targets || []
    };
    
    // Add to protocols array
    protocols.push(newProtocol);
    this.set(this.KEYS.PROTOCOLS, protocols);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ СОЗДАНИЯ ПРОТОКОЛА
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after protocol creation failed:', error);
    });
    
    return newProtocol;
  }

  // Get protocol by ID
  getProtocolById(id) {
    const protocols = this.getProtocols();
    const protocol = protocols.find(p => p.id === id || p.id == id);
    return protocol;
  }

  // Update protocol completely
  updateProtocolFull(protocolId, protocolData) {
    const protocols = this.getProtocols();
    const index = protocols.findIndex(p => p.id === protocolId);
    
    if (index === -1) return false;
    
    // Store old values for comparison
    const oldProtocol = protocols[index];
    const oldTargets = oldProtocol.targets || [];
    const newTargets = protocolData.targets || [];
    
    // Update protocol object
    protocols[index] = {
      id: protocolId,
      name: protocolData.name + (protocolData.description ? '. ' + protocolData.description : ''),
      icon: protocolData.icon,
      hover: protocolData.hover || '',
      weight: protocolData.weight,
      targets: newTargets
    };
    
    this.set(this.KEYS.PROTOCOLS, protocols);
    
    // Check if targets changed or weight changed and recalculate history if needed
    const targetsChanged = !this.arraysEqual(oldTargets, newTargets);
    const weightChanged = oldProtocol.weight !== protocolData.weight;
    
    let wasRecalculated = false;
    if (targetsChanged || weightChanged) {
      wasRecalculated = this.recalculateProtocolHistory(protocolId, oldTargets, newTargets);
      if (wasRecalculated && window.App) {
        if (targetsChanged && weightChanged) {
          window.App.showToast('Protocol targets and weight updated retroactively', 'info');
        } else if (targetsChanged) {
          window.App.showToast('Protocol targets updated retroactively', 'info');
        } else {
          window.App.showToast('Protocol weight updated retroactively', 'info');
        }
      }
    }

    // 🚀 КРИТИЧНО: АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ ОБНОВЛЕНИЯ ПРОТОКОЛА
    // Особенно важно когда произошел пересчет истории!
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after protocol update failed:', error);
    });
    
    return protocols[index];
  }

  // Helper function to compare arrays
  arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
  }

  // Delete protocol
  deleteProtocol(protocolId) {
    const protocols = this.getProtocols();
    const filteredProtocols = protocols.filter(p => p.id !== protocolId);
    
    if (filteredProtocols.length === protocols.length) {
      return false; // Protocol not found
    }
    
    // Remove from protocols
    this.set(this.KEYS.PROTOCOLS, filteredProtocols);
    
    // Remove from custom order
    const customOrder = this.getProtocolOrder();
    const filteredOrder = customOrder.filter(id => id !== protocolId);
    this.setProtocolOrder(filteredOrder);
    
    // Remove all related checkins
    const checkins = this.getCheckins();
    const filteredCheckins = checkins.filter(c => {
      if (c.type === 'protocol' && c.protocolId === protocolId) {
        return false;
      }
      return true;
    });
    this.set(this.KEYS.HISTORY, filteredCheckins);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ УДАЛЕНИЯ ПРОТОКОЛА
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after protocol deletion failed:', error);
    });
    
    return true;
  }

  // States Management
  addState(stateData) {
    const states = this.getStates();
    
    // Generate new ID
    const maxId = states.length > 0 ? Math.max(...states.map(s => parseInt(s.id.split('_').pop()) || 0)) : 0;
    const newId = `state_${maxId + 1}`;
    
    const newState = {
      id: newId,
      name: stateData.name,
      subtext: stateData.subtext || '',
      icon: stateData.icon,
      hover: stateData.hover,
      skillIds: stateData.skillIds || [],
      stateIds: stateData.stateIds || []
    };
    
    states.push(newState);
    this.set(this.KEYS.STATES, states);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ СОЗДАНИЯ СОСТОЯНИЯ
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after state creation failed:', error);
    });
    
    return newState;
  }

  updateState(stateId, stateData) {
    const states = this.getStates();
    const index = states.findIndex(s => s.id === stateId);
    
    if (index === -1) return false;
    
    states[index] = {
      ...states[index],
      name: stateData.name,
      subtext: stateData.subtext || '',
      icon: stateData.icon,
      hover: stateData.hover,
      skillIds: stateData.skillIds || [],
      stateIds: stateData.stateIds || []
    };
    
    this.set(this.KEYS.STATES, states);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ ОБНОВЛЕНИЯ СОСТОЯНИЯ
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after state update failed:', error);
    });
    
    return states[index];
  }

  deleteState(stateId) {
    const states = this.getStates();
    const filtered = states.filter(s => s.id !== stateId);
    
    // Remove references to this state from other states
    filtered.forEach(state => {
      if (state.stateIds && state.stateIds.includes(stateId)) {
        state.stateIds = state.stateIds.filter(id => id !== stateId);
      }
    });
    
    this.set(this.KEYS.STATES, filtered);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ УДАЛЕНИЯ СОСТОЯНИЯ
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after state deletion failed:', error);
    });
    
    return true;
  }

  getStateById(stateId) {
    const states = this.getStates();
    return states.find(s => s.id === stateId);
  }

  // Quick Actions Management
  getQuickActions() {
    const quickActionIds = this.get(this.KEYS.QUICK_ACTIONS) || [];
    const protocols = this.getProtocols();
    
    // Return protocols that are in quick actions, in the correct order
    return quickActionIds.map(id => {
      return protocols.find(p => p.id === id);
    }).filter(Boolean);
  }

  addToQuickActions(protocolId) {
    const quickActions = this.get(this.KEYS.QUICK_ACTIONS) || [];
    
    // Check if already in quick actions
    if (quickActions.includes(protocolId)) {
      return false;
    }
    
    // Add new one at the end
    quickActions.push(protocolId);
    
    // Also update the order array
    const quickActionOrder = this.getQuickActionOrder();
    quickActionOrder.push(protocolId);
    this.set(this.KEYS.QUICK_ACTION_ORDER, quickActionOrder);
    
    this.set(this.KEYS.QUICK_ACTIONS, quickActions);
    
    // Add to history log  
    const protocol = this.getProtocolById(protocolId);
    if (protocol) {
      const checkins = this.getCheckins();
      const checkin = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: 'quick_action',
        subType: 'added',
        protocolId: protocolId,
        protocolName: protocol.name,
        protocolIcon: protocol.icon
      };
      checkins.push(checkin);
      this.set(this.KEYS.HISTORY, checkins);
    }
    
    return true;
  }

  removeFromQuickActions(protocolId) {
    const quickActions = this.get(this.KEYS.QUICK_ACTIONS) || [];
    
    // Get protocol info for logging before removal
    const protocol = this.getProtocolById(protocolId);
    
    // Remove protocol from quick actions
    const updatedQuickActions = quickActions.filter(id => id !== protocolId);
    
    // Also remove from quick action order
    const quickActionOrder = this.getQuickActionOrder();
    const updatedOrder = quickActionOrder.filter(id => id !== protocolId);
    this.set(this.KEYS.QUICK_ACTION_ORDER, updatedOrder);
    
    // Save updated quick actions
    this.set(this.KEYS.QUICK_ACTIONS, updatedQuickActions);
    
    // Add to history log
    if (protocol) {
      const checkins = this.getCheckins();
      const checkin = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: 'quick_action',
        subType: 'removed',
        protocolId: protocolId,
        protocolName: protocol.name,
        protocolIcon: protocol.icon
      };
      checkins.push(checkin);
      this.set(this.KEYS.HISTORY, checkins);
    }
    
    return true;
  }

  isInQuickActions(protocolId) {
    const quickActions = this.get(this.KEYS.QUICK_ACTIONS) || [];
    return quickActions.includes(protocolId);
  }

  setQuickActions(protocolIds) {
    this.set(this.KEYS.QUICK_ACTIONS, protocolIds);
    return true;
  }

  // States Order Management
  getStateOrder() {
    return this.get(this.KEYS.STATE_ORDER) || [];
  }

  setStateOrder(stateOrder) {
    this.set(this.KEYS.STATE_ORDER, stateOrder);
  }

  getStatesInOrder() {
    const states = this.getStates();
    const customOrder = this.getStateOrder();
    
    if (customOrder.length === 0) {
      // Return original order if no custom order is set
      return states;
    }
    
    // Create a map for quick lookup
    const stateMap = new Map(states.map(s => [s.id, s]));
    
    // Start with states in custom order
    const orderedStates = customOrder
      .map(id => stateMap.get(id))
      .filter(Boolean);
    
    // Add any states not in custom order at the end
    const statesInOrder = new Set(customOrder);
    const remainingStates = states.filter(s => !statesInOrder.has(s.id));
    
    return [...orderedStates, ...remainingStates];
  }

  // Quick Actions Order Management
  getQuickActionOrder() {
    return this.get(this.KEYS.QUICK_ACTION_ORDER) || [];
  }

  setQuickActionOrder(quickActionOrder) {
    this.set(this.KEYS.QUICK_ACTION_ORDER, quickActionOrder);
    // Also update the main quick actions array to match the order
    this.set(this.KEYS.QUICK_ACTIONS, quickActionOrder);
  }

  getQuickActionsInOrder() {
    const quickActionIds = this.get(this.KEYS.QUICK_ACTIONS) || [];
    const customOrder = this.getQuickActionOrder();
    const protocols = this.getProtocols();
    
    // Use custom order if available, otherwise use stored quick actions order
    const orderToUse = customOrder.length > 0 ? customOrder : quickActionIds;
    
    // Return protocols that are in quick actions, in the correct order
    return orderToUse.map(id => {
      return protocols.find(p => p.id === id);
    }).filter(Boolean);
  }

  // Sync with Firebase backend
  async syncWithBackend() {
    if (!this.isOnline || !this.currentUser) {
      console.log('🚫 SYNC SKIPPED:', {
        isOnline: this.isOnline,
        hasUser: !!this.currentUser,
        userEmail: this.currentUser?.email
      });
      return;
    }
    
    console.log('🔄 SYNC STARTED:', {
      user: this.currentUser.email,
      userId: this.currentUser.uid,
      backendUrl: BACKEND_URL
    });
    
    try {
      const userData = {
        protocols: this.get(this.KEYS.PROTOCOLS),
        skills: this.get(this.KEYS.SKILLS),
        states: this.get(this.KEYS.STATES),
        history: this.get(this.KEYS.HISTORY),
        quickActions: this.get(this.KEYS.QUICK_ACTIONS)
      };
      
      console.log('📤 SYNC DATA TO SEND:', {
        protocolsCount: userData.protocols?.length || 0,
        skillsCount: userData.skills?.length || 0,
        statesCount: userData.states?.length || 0,
        historyCount: userData.history?.length || 0,
        quickActionsCount: userData.quickActions?.length || 0,
        userData: userData
      });
      
      const token = await this.currentUser.getIdToken();
      console.log('🔑 AUTH TOKEN OBTAINED:', {
        tokenLength: token?.length || 0,
        tokenStart: token?.substring(0, 20) + '...'
      });
      
      const syncUrl = `${BACKEND_URL}/api/sync`;
      console.log('🌐 SYNC REQUEST:', {
        url: syncUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      const response = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(userData)
      });
      
      console.log('📡 SYNC RESPONSE:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        const serverData = await response.json();
        console.log('📥 SYNC RESPONSE DATA:', serverData);
        
        this.lastSyncTime = new Date().toISOString();
        
        // Update local data with server data using true merge strategy
        if (serverData.data) {
          let mergeResults = {};
          let hasUpdates = false;
          
          Object.keys(serverData.data).forEach(key => {
            if (serverData.data[key]) {
              const currentData = this.get(this.KEYS[key.toUpperCase()]);
              const serverArray = serverData.data[key];
              const localArray = currentData || [];
              
              const hasLocalData = Array.isArray(localArray) && localArray.length > 0;
              const hasServerData = Array.isArray(serverArray) && serverArray.length > 0;
              
              let mergedData = [];
              let mergeAction = '';
              
              // Определяем стратегию мержа в зависимости от типа данных
              const isHistory = key === 'history';
              
              if (!hasLocalData && !hasServerData) {
                mergedData = [];
                mergeAction = 'both_empty';
              } else if (!hasLocalData && hasServerData) {
                mergedData = [...serverArray];
                mergeAction = 'loaded_from_server';
                hasUpdates = true;
              } else if (hasLocalData && !hasServerData) {
                mergedData = [...localArray];
                mergeAction = 'keeping_local_will_upload';
                // Mark for upload since server doesn't have our data
                this.markForSync();
              } else {
                // Оба массива содержат данные - выполняем умную стратегию
                if (isHistory) {
                    console.log('🔄 USING SERVER-FIRST STRATEGY FOR HISTORY');
                    
                    // История - сервер имеет пересчитанные значения, доверяем ему больше
                    // ИСПРАВЛЕНИЕ: Начинаем с серверных данных как основы
                    console.log(`📊 HISTORY SYNC DEBUG:`, {
                        localCount: localArray.length,
                        serverCount: serverArray.length,
                        localIds: localArray.map(item => item.id),
                        serverIds: serverArray.map(item => item.id),
                        missingFromLocal: serverArray.filter(s => !localArray.find(l => l.id === s.id)).map(item => item.id),
                        missingFromServer: localArray.filter(l => !serverArray.find(s => s.id === l.id)).map(item => item.id),
                        timestamp: new Date().toISOString()
                    });
                    
                    mergedData = [...serverArray];
                    
                    // Добавляем локальные элементы, которых нет на сервере
                    for (const item of localArray) {
                        const existsOnServer = mergedData.find(m => m.id === item.id);
                        if (!existsOnServer) {
                            console.log(`📋 History item ${item.id} found only locally, adding to server data`);
                            mergedData.push(item);
                        } else {
                            console.log(`📋 History item ${item.id} exists in both, keeping server version (more recent)`);
                        }
                    }
                    
                    console.log('🔄 HISTORY MERGE STRATEGY: Server-first merge, added', localArray.filter(l => !serverArray.find(s => s.id === l.id)).length, 'local-only items');
                    
                } else {
                    console.log('🔄 USING SMART MERGE STRATEGY FOR DATA');
                    
                    // Для всех остальных данных - умная стратегия:
                    // 1. Локальные элементы остаются (если есть конфликт)
                    // 2. Серверные элементы добавляются (если их нет локально)
                    
                    // Сначала добавляем все локальные элементы
                    mergedData = [...localArray];
                    
                    // Затем добавляем серверные элементы, которых нет локально
                    for (const item of serverArray) {
                        const existsLocally = mergedData.find(m => m.id === item.id);
                        if (existsLocally) {
                            console.log(`📋 ${key} item ${item.id} exists in both local and server, keeping local version`);
                        } else {
                            console.log(`📋 ${key} item ${item.id} found only on server, adding to local`);
                            mergedData.push(item);
                        }
                    }
                }
                
                // Определяем действие мержа для статистики
                const originalLocalCount = localArray.length;
                const originalServerCount = serverArray.length;
                const mergedCount = mergedData.length;
                
                if (mergedCount > originalLocalCount) {
                  mergeAction = `merged_gained_${mergedCount - originalLocalCount}_items`;
                  hasUpdates = true;
                } else if (mergedCount === originalLocalCount) {
                  mergeAction = 'no_new_items_found';
                } else {
                  mergeAction = `merged_deduplicated_${originalLocalCount - mergedCount}_items`;
                  hasUpdates = true;
                }
                
                // If merged data differs from server, mark for sync
                if (!this.arraysEqual(mergedData, serverArray)) {
                  this.markForSync();
                }
              }
              
              mergeResults[key] = { 
                action: mergeAction, 
                localCount: localArray.length, 
                serverCount: serverArray.length,
                mergedCount: mergedData.length
              };
              
              console.log(`🔄 SYNC MERGE ${key}:`, {
                localItems: localArray.length,
                serverItems: serverArray.length,
                mergedItems: mergedData.length,
                action: mergeAction
              });
              
              // Save merged data
              this.set(this.KEYS[key.toUpperCase()], mergedData);
            }
          });
          
          // Log merge summary
          console.log('📊 MERGE RESULTS:', mergeResults);
          
          // Show user-friendly notification about merge results
          if (hasUpdates && window.App) {
            const updates = Object.entries(mergeResults)
              .filter(([key, result]) => result.action.includes('gained') || result.action.includes('loaded'))
              .map(([key, result]) => `${key}: +${result.mergedCount - Math.min(result.localCount, result.serverCount)} items`);
            
            if (updates.length > 0) {
              window.App.showToast(`Sync: ${updates.join(', ')}`, 'success');
            }
          }
        }
        
        console.log('✅ SYNC COMPLETED SUCCESSFULLY');
        
        // Update UI after successful sync
        if (window.App && window.App.renderPage) {
          console.log('🖥️ Refreshing UI after sync...');
          
          // Force update user stats first (important for dashboard)
          if (window.UI && window.UI.updateUserStats) {
            console.log('📊 Updating user stats after sync...');
            window.UI.updateUserStats();
          }
          
          // Use the correct renderPage method to refresh current view
          const currentPage = window.App.currentPage;
          console.log('Current page:', currentPage);
          
          if (currentPage) {
            window.App.renderPage(currentPage);
            console.log(`📄 ${currentPage} page refreshed via renderPage`);
            
            // Additional update for dashboard page to ensure stats are current
            if (currentPage === 'dashboard' && window.UI && window.UI.updateUserStats) {
              setTimeout(() => {
                window.UI.updateUserStats();
                console.log('📊 Dashboard stats double-checked after sync');
              }, 100);
            }
          } else {
            // Fallback to dashboard if no current page
            window.App.renderPage('dashboard');
            console.log('📄 Dashboard page rendered as fallback');
          }
        } else {
          // Last resort fallback
          console.log('🔄 App.renderPage not available, reloading page...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        console.error('❌ SYNC FAILED - Server Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          user: this.currentUser?.email,
          isNewUser: !this.lastSyncTime
        });
        
        // Special handling for 500 errors with new users
        if (response.status === 500 && !this.lastSyncTime) {
          console.log('🆕 This might be a new user - server may need to initialize user data');
          console.log('📝 Server error details:', errorData);
          console.log('🔄 Trying to send minimal initial data...');
          
          // Try sending minimal data for new user initialization
          try {
            const minimalData = {
              protocols: [],
              skills: [],
              states: [],
              history: [],
              quickActions: []
            };
            
            const retryResponse = await fetch(`${BACKEND_URL}/api/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              },
              body: JSON.stringify(minimalData)
            });
            
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              console.log('✅ Minimal data initialization successful:', retryData);
              return retryData;
            } else {
              const retryErrorText = await retryResponse.text();
              let retryErrorData;
              try {
                retryErrorData = JSON.parse(retryErrorText);
              } catch {
                retryErrorData = { error: retryErrorText };
              }
              console.log('❌ Failed to initialize new user:', retryErrorData);
            }
          } catch (initError) {
            console.error('❌ Error during new user initialization:', initError);
          }
        }
        
        throw new Error(`Server responded with ${response.status}: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('❌ SYNC FAILED - Network/Code Error:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      this.markForSync();
      throw error;
    }
  }

  // Mark data for sync when online
  markForSync() {
    this.pendingSync.add(Date.now());
  }

  // Force upload local data to server (used when local data is more complete)
  async forceUploadToServer() {
    if (!this.isOnline || !this.currentUser) {
      console.log('🚫 FORCE UPLOAD SKIPPED: offline or no user');
      return false;
    }
    
    console.log('🚀 FORCE UPLOAD: Sending local data to server...');
    
    try {
      const localData = {
        protocols: this.get(this.KEYS.PROTOCOLS) || [],
        skills: this.get(this.KEYS.SKILLS) || [],
        states: this.get(this.KEYS.STATES) || [],
        history: this.get(this.KEYS.HISTORY) || [],
        quickActions: this.get(this.KEYS.QUICK_ACTIONS) || []
      };
      
      console.log('📤 FORCE UPLOAD DATA:', {
        protocols: localData.protocols.length,
        skills: localData.skills.length,
        states: localData.states.length,
        history: localData.history.length,
        quickActions: localData.quickActions.length
      });
      
      const token = await this.currentUser.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(localData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ FORCE UPLOAD SUCCESSFUL:', result);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ FORCE UPLOAD FAILED:', response.status, response.statusText, errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ FORCE UPLOAD ERROR:', error);
      return false;
    }
  }

  // Sync pending changes when coming online
  async syncPendingChanges() {
    if (this.pendingSync.size > 0) {
      // Try to upload local data first if we have pending changes
      const uploadSuccess = await this.forceUploadToServer();
      if (uploadSuccess) {
        this.pendingSync.clear();
        console.log('✅ Pending changes uploaded to server');
      } else {
        console.warn('⚠️ Failed to upload pending changes, will retry later');
      }
    }
  }

  // Helper methods to check if data is default
  isDefaultProtocols(protocols) {
    if (!Array.isArray(protocols)) return false;
    return protocols.length === INITIAL_DATA.protocols.length && 
           protocols.every((p, i) => p.id === INITIAL_DATA.protocols[i].id);
  }

  isDefaultSkills(skills) {
    if (!Array.isArray(skills)) return false;
    return skills.length === INITIAL_DATA.skills.length && 
           skills.every((s, i) => s.id === INITIAL_DATA.skills[i].id);
  }

  isDefaultStates(states) {
    if (!Array.isArray(states)) return false;
    return states.length === INITIAL_DATA.states.length && 
           states.every((s, i) => s.id === INITIAL_DATA.states[i].id);
  }

  // Intelligently merge two data arrays, combining unique items from both sources
  mergeDataArrays(localArray, serverArray, dataType) {
    console.log(`🔀 MERGING ${dataType}:`, {
      local: localArray.length,
      server: serverArray.length,
      dataTypeCheck: dataType === 'history',
      dataTypeValue: dataType,
      dataTypeType: typeof dataType
    });
    
    // Create a map to track unique items by ID
    const mergedMap = new Map();
    
    // For history, we need special handling since items might be updated (recalculated)
    if (dataType === 'history') {
      console.log('🔄 USING SERVER-FIRST STRATEGY FOR HISTORY');
      // Add all server items first for history (server has latest recalculated data)
      serverArray.forEach(item => {
        if (item && item.id !== undefined) {
          mergedMap.set(item.id, { ...item, source: 'server' });
        }
      });
      
      // Only add local items that don't exist on server
      let addedFromLocal = 0;
      localArray.forEach(item => {
        if (item && item.id !== undefined) {
          if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, { ...item, source: 'local' });
            addedFromLocal++;
          } else {
            // For history, prefer server version (it has recalculated data)
            console.log(`📋 History item ${item.id} exists in both, keeping server version (more recent)`);
          }
        }
      });
      
      console.log(`🔄 HISTORY MERGE STRATEGY: Server-first merge, added ${addedFromLocal} local-only items`);
    } else {
      console.log('🔄 USING LOCAL-FIRST STRATEGY FOR NON-HISTORY DATA');
      // For other data types, use the original local-first strategy
      // Add all local items first (preserving local version in case of conflicts)
      localArray.forEach(item => {
        if (item && item.id !== undefined) {
          mergedMap.set(item.id, { ...item, source: 'local' });
        }
      });
      
      // Add server items, but only if they don't exist locally
      let addedFromServer = 0;
      let duplicatesSkipped = 0;
      
      serverArray.forEach(item => {
        if (item && item.id !== undefined) {
          if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, { ...item, source: 'server' });
            addedFromServer++;
          } else {
            duplicatesSkipped++;
            // Item exists in both - keeping local version for non-history data
            console.log(`📋 ${dataType} item ${item.id} exists in both local and server, keeping local version`);
          }
        }
      });
    }
    
    // Convert map back to array and remove source tracking
    const mergedArray = Array.from(mergedMap.values()).map(item => {
      const { source, ...itemWithoutSource } = item;
      return itemWithoutSource;
    });
    
    // Sort by ID for consistency (if items have numeric IDs)
    if (mergedArray.length > 0 && typeof mergedArray[0].id === 'number') {
      mergedArray.sort((a, b) => a.id - b.id);
    }
    
    console.log(`✅ MERGE ${dataType} COMPLETE:`, {
      localItems: localArray.length,
      serverItems: serverArray.length,
      mergedItems: mergedArray.length,
      strategy: dataType === 'history' ? 'server-first' : 'local-first',
      netGain: mergedArray.length - localArray.length
    });
    
    return mergedArray;
  }
}

// Create global instance
window.Storage = new Storage();

