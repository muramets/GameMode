export class State {
  constructor(data = {}) {
    this.id = data.id || `state_${Date.now()}`;
    this.name = data.name || '';
    this.icon = data.icon || '🎯';
    this.hover = data.hover || '';
    this.innerfaceIds = data.innerfaceIds || [];
    this.stateIds = data.stateIds || [];
  }

  validate() {
    const errors = [];
    
    if (!this.name.trim()) {
      errors.push('State name is required');
    }
    
    if (!Array.isArray(this.innerfaceIds)) {
      errors.push('Innerface IDs must be an array');
    }
    
    if (!Array.isArray(this.stateIds)) {
      errors.push('State IDs must be an array');
    }
    
    if (this.innerfaceIds.length === 0 && this.stateIds.length === 0) {
      errors.push('State must have at least one innerface or sub-state');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      icon: this.icon,
      hover: this.hover,
      innerfaceIds: this.innerfaceIds,
      stateIds: this.stateIds
    };
  }

  static fromJSON(json) {
    return new State(json);
  }
}