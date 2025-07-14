import { PROTOCOL_CONFIG } from '../config/constants.js';

export class Protocol {
  constructor(data = {}) {
    this.id = data.id || Date.now();
    this.name = data.name || '';
    this.icon = data.icon || '📝';
    this.hover = data.hover || '';
    this.action = data.action || '+';
    this.weight = data.weight || PROTOCOL_CONFIG.DEFAULT_WEIGHT;
    this.targets = data.targets || [];
    this.group = data.group || null;
  }

  validate() {
    const errors = [];
    
    if (!this.name.trim()) {
      errors.push('Protocol name is required');
    }
    
    if (!['+', '-'].includes(this.action)) {
      errors.push('Action must be + or -');
    }
    
    if (this.weight < PROTOCOL_CONFIG.MIN_WEIGHT || this.weight > PROTOCOL_CONFIG.MAX_WEIGHT) {
      errors.push(`Weight must be between ${PROTOCOL_CONFIG.MIN_WEIGHT} and ${PROTOCOL_CONFIG.MAX_WEIGHT}`);
    }
    
    if (!Array.isArray(this.targets) || this.targets.length === 0) {
      errors.push('At least one target is required');
    }
    
    if (this.targets.length > PROTOCOL_CONFIG.MAX_TARGETS) {
      errors.push(`Maximum ${PROTOCOL_CONFIG.MAX_TARGETS} targets allowed`);
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
      action: this.action,
      weight: this.weight,
      targets: this.targets,
      group: this.group
    };
  }

  static fromJSON(json) {
    return new Protocol(json);
  }
}