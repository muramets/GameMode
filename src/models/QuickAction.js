export class QuickAction {
  constructor(data = {}) {
    this.innerfaceId = data.innerfaceId;
    this.action = data.action || 'increase'; // increase, decrease, set
    this.value = data.value || 0.1;
  }

  validate() {
    const errors = [];
    const validActions = ['increase', 'decrease', 'set'];
    
    if (!this.innerfaceId) {
      errors.push('Innerface ID is required');
    }
    
    if (!validActions.includes(this.action)) {
      errors.push(`Action must be one of: ${validActions.join(', ')}`);
    }
    
    if (typeof this.value !== 'number' || isNaN(this.value)) {
      errors.push('Value must be a number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      innerfaceId: this.innerfaceId,
      action: this.action,
      value: this.value
    };
  }

  static fromJSON(json) {
    return new QuickAction(json);
  }
}