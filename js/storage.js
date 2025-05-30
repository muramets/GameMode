// ===== storage.js - Local Storage Management =====

const Storage = {
  // Keys
  KEYS: {
    PROTOCOLS: 'rpg_therapy_protocols',
    SKILLS: 'rpg_therapy_skills',
    STATES: 'rpg_therapy_states',
    CHECKINS: 'rpg_therapy_checkins',
    SETTINGS: 'rpg_therapy_settings',
    PROTOCOL_ORDER: 'rpg_therapy_protocol_order',
    SKILL_ORDER: 'rpg_therapy_skill_order',
    QUICK_ACTIONS: 'rpg_therapy_quick_actions',
    STATE_ORDER: 'rpg_therapy_state_order',
    QUICK_ACTION_ORDER: 'rpg_therapy_quick_action_order'
  },

  // Initialize app data
  init() {
    // Initialize each key separately if it doesn't exist
    if (!this.get(this.KEYS.PROTOCOLS)) {
      this.set(this.KEYS.PROTOCOLS, INITIAL_DATA.protocols);
    }
    
    if (!this.get(this.KEYS.SKILLS)) {
      this.set(this.KEYS.SKILLS, INITIAL_DATA.skills);
    }
    
    if (!this.get(this.KEYS.STATES)) {
      this.set(this.KEYS.STATES, INITIAL_DATA.states);
    }
    
    if (!this.get(this.KEYS.CHECKINS)) {
      this.set(this.KEYS.CHECKINS, []);
    }
    
    if (!this.get(this.KEYS.QUICK_ACTIONS)) {
      // Set default quick actions only if user has existing protocols
      const existingProtocols = this.get(this.KEYS.PROTOCOLS);
      if (existingProtocols && existingProtocols.length > 0) {
        // Use first 5 available protocol IDs as defaults
        const defaultQuickActions = existingProtocols.slice(0, 5).map(p => p.id);
        this.set(this.KEYS.QUICK_ACTIONS, defaultQuickActions);
      } else {
        this.set(this.KEYS.QUICK_ACTIONS, [1, 2, 7, 8, 10]);
      }
    }
    
    if (!this.get(this.KEYS.SETTINGS)) {
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
    // Find skill by exact ID match, considering both string and number IDs
    const skill = skills.find(s => s.id === id || s.id == id);
    return skill;
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
      type: 'protocol',
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
    this.set(this.KEYS.CHECKINS, checkins);

    return operation;
  },

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

    checkins.forEach((checkin, index) => {
      if (checkin.changes && checkin.type === 'protocol') {
        // Check if this checkin affects our skill
        if (checkin.changes[skillId] !== undefined) {
          totalChange += checkin.changes[skillId];
        }
      }
    });

    return Math.max(0, skill.initialScore + totalChange);
  },

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
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.init();
    return true;
  },

  // Protocol Order Management
  getProtocolOrder() {
    return this.get(this.KEYS.PROTOCOL_ORDER) || [];
  },

  setProtocolOrder(order) {
    return this.set(this.KEYS.PROTOCOL_ORDER, order);
  },

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
  },

  // Skill Order Management
  getSkillOrder() {
    return this.get(this.KEYS.SKILL_ORDER) || [];
  },

  setSkillOrder(order) {
    return this.set(this.KEYS.SKILL_ORDER, order);
  },

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
  },

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
    
    return newSkill;
  },

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
    return skills[index];
  },

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
    
    return true;
  },

  // Migrate all skill IDs to numeric format
  migrateSkillIds() {
    const skills = this.getSkills();
    const protocols = this.getProtocols();
    const states = this.getStates();
    const checkins = this.getCheckins();
    const skillOrder = this.getSkillOrder();
    
    // Check if skills are already numeric but states are still string
    const skillsAreNumeric = skills.every(s => typeof s.id === 'number');
    const statesHaveStringIds = states.some(s => s.skillIds.some(id => typeof id === 'string'));
    
    if (skillsAreNumeric && statesHaveStringIds) {
      return this.fixStateSkillIds();
    }
    
    // Create mapping from old IDs to new IDs
    const idMapping = {};
    const newSkills = skills.map((skill, index) => {
      const newId = index + 1;
      idMapping[skill.id] = newId;
      
      return {
        ...skill,
        id: newId
      };
    });
    
    // Update protocols targets
    const newProtocols = protocols.map(protocol => ({
      ...protocol,
      targets: protocol.targets.map(targetId => idMapping[targetId] || targetId)
    }));
    
    // Update states skillIds
    const newStates = states.map(state => ({
      ...state,
      skillIds: state.skillIds.map(skillId => idMapping[skillId] || skillId)
    }));
    
    // Update checkins
    const newCheckins = checkins.map(checkin => {
      if (checkin.changes && checkin.type === 'protocol') {
        const newChanges = {};
        Object.entries(checkin.changes).forEach(([skillId, value]) => {
          const newSkillId = idMapping[skillId] || skillId;
          newChanges[newSkillId] = value;
        });
        
        return {
          ...checkin,
          changes: newChanges
        };
      }
      return checkin;
    });
    
    // Update skill order
    const newSkillOrder = skillOrder.map(id => idMapping[id] || id);
    
    // Save all updated data
    this.set(this.KEYS.SKILLS, newSkills);
    this.set(this.KEYS.PROTOCOLS, newProtocols);
    this.set(this.KEYS.STATES, newStates);
    this.set(this.KEYS.CHECKINS, newCheckins);
    this.setSkillOrder(newSkillOrder);
    
    return {
      skillsUpdated: newSkills.length,
      protocolsUpdated: newProtocols.length,
      statesUpdated: newStates.length,
      checkinsUpdated: newCheckins.filter(c => c.type === 'protocol').length,
      idMapping: idMapping
    };
  },

  // Fix state skill IDs when skills are numeric but states have string IDs
  fixStateSkillIds() {
    const states = this.getStates();
    const protocols = this.getProtocols();
    const checkins = this.getCheckins();
    
    // Create mapping from original data
    const stringToNumberMapping = {
      "focus": 1,
      "energy": 2, 
      "engagement": 3,
      "body_sync": 4,
      "business_insight": 5,
      "execution_speed": 6,
      "relationship": 7,
      "family": 8,
      "community": 9
    };
    
    // Fix states
    const fixedStates = states.map(state => ({
      ...state,
      skillIds: state.skillIds.map(skillId => 
        typeof skillId === 'string' && stringToNumberMapping[skillId] 
          ? stringToNumberMapping[skillId] 
          : skillId
      )
    }));
    
    // Fix protocols
    const fixedProtocols = protocols.map(protocol => ({
      ...protocol,
      targets: protocol.targets.map(targetId => 
        typeof targetId === 'string' && stringToNumberMapping[targetId] 
          ? stringToNumberMapping[targetId] 
          : targetId
      )
    }));
    
    // Fix checkins
    const fixedCheckins = checkins.map(checkin => {
      if (checkin.changes && checkin.type === 'protocol') {
        const fixedChanges = {};
        Object.entries(checkin.changes).forEach(([skillId, value]) => {
          const newSkillId = typeof skillId === 'string' && stringToNumberMapping[skillId] 
            ? stringToNumberMapping[skillId] 
            : skillId;
          fixedChanges[newSkillId] = value;
        });
        
        return {
          ...checkin,
          changes: fixedChanges
        };
      }
      return checkin;
    });
    
    // Save fixed data
    this.set(this.KEYS.STATES, fixedStates);
    this.set(this.KEYS.PROTOCOLS, fixedProtocols);
    this.set(this.KEYS.CHECKINS, fixedCheckins);
    
    return {
      skillsUpdated: 0,
      protocolsUpdated: fixedProtocols.length,
      statesUpdated: fixedStates.length,
      checkinsUpdated: fixedCheckins.filter(c => c.type === 'protocol').length,
      idMapping: stringToNumberMapping
    };
  },

  // Protocol CRUD operations
  
  // Add new protocol
  addProtocol(protocolData) {
    const protocols = this.getProtocols();
    
    // Generate new ID
    const newId = protocols.length > 0 ? Math.max(...protocols.map(p => p.id)) + 1 : 1;
    
    // Create protocol object
    const newProtocol = {
      id: newId,
      name: protocolData.name,
      icon: protocolData.icon,
      hover: protocolData.hover || '',
      action: protocolData.action,
      weight: protocolData.weight,
      targets: protocolData.targets || []
    };
    
    // Add to protocols array
    protocols.push(newProtocol);
    this.set(this.KEYS.PROTOCOLS, protocols);
    
    return newProtocol;
  },

  // Get protocol by ID
  getProtocolById(id) {
    const protocols = this.getProtocols();
    const protocol = protocols.find(p => p.id === id || p.id == id);
    return protocol;
  },

  // Update protocol completely
  updateProtocolFull(protocolId, protocolData) {
    const protocols = this.getProtocols();
    const index = protocols.findIndex(p => p.id === protocolId);
    
    if (index === -1) return false;
    
    // Update protocol object
    protocols[index] = {
      id: protocolId,
      name: protocolData.name,
      icon: protocolData.icon,
      hover: protocolData.hover || '',
      action: protocolData.action,
      weight: protocolData.weight,
      targets: protocolData.targets || []
    };
    
    this.set(this.KEYS.PROTOCOLS, protocols);
    return protocols[index];
  },

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
    this.set(this.KEYS.CHECKINS, filteredCheckins);
    
    return true;
  },

  // States Management
  addState(stateData) {
    const states = this.getStates();
    
    // Generate new ID
    const maxId = states.length > 0 ? Math.max(...states.map(s => parseInt(s.id.split('_').pop()) || 0)) : 0;
    const newId = `state_${maxId + 1}`;
    
    const newState = {
      id: newId,
      name: stateData.name,
      icon: stateData.icon,
      hover: stateData.hover,
      skillIds: stateData.skillIds || [],
      stateIds: stateData.stateIds || []
    };
    
    states.push(newState);
    this.set(this.KEYS.STATES, states);
    return newState;
  },

  updateState(stateId, stateData) {
    const states = this.getStates();
    const index = states.findIndex(s => s.id === stateId);
    
    if (index === -1) return false;
    
    states[index] = {
      ...states[index],
      name: stateData.name,
      icon: stateData.icon,
      hover: stateData.hover,
      skillIds: stateData.skillIds || [],
      stateIds: stateData.stateIds || []
    };
    
    this.set(this.KEYS.STATES, states);
    return states[index];
  },

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
    return true;
  },

  getStateById(stateId) {
    const states = this.getStates();
    return states.find(s => s.id === stateId);
  },

  // Quick Actions Management
  getQuickActions() {
    const quickActionIds = this.get(this.KEYS.QUICK_ACTIONS) || [];
    const protocols = this.getProtocols();
    
    // Return protocols that are in quick actions, in the correct order
    return quickActionIds.map(id => {
      return protocols.find(p => p.id === id);
    }).filter(Boolean);
  },

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
      this.set(this.KEYS.CHECKINS, checkins);
    }
    
    return true;
  },

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
      this.set(this.KEYS.CHECKINS, checkins);
    }
    
    return true;
  },

  isInQuickActions(protocolId) {
    const quickActions = this.get(this.KEYS.QUICK_ACTIONS) || [];
    return quickActions.includes(protocolId);
  },

  setQuickActions(protocolIds) {
    this.set(this.KEYS.QUICK_ACTIONS, protocolIds);
    return true;
  },

  // States Order Management
  getStateOrder() {
    return this.get(this.KEYS.STATE_ORDER) || [];
  },

  setStateOrder(stateOrder) {
    this.set(this.KEYS.STATE_ORDER, stateOrder);
  },

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
  },

  // Quick Actions Order Management
  getQuickActionOrder() {
    return this.get(this.KEYS.QUICK_ACTION_ORDER) || [];
  },

  setQuickActionOrder(quickActionOrder) {
    this.set(this.KEYS.QUICK_ACTION_ORDER, quickActionOrder);
    // Also update the main quick actions array to match the order
    this.set(this.KEYS.QUICK_ACTIONS, quickActionOrder);
  },

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
};
