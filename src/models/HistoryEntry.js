export class HistoryEntry {
  constructor(data = {}) {
    this.id = data.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = data.type || 'protocol'; // protocol, drag_drop, quick_action, manual_edit
    this.timestamp = data.timestamp || new Date().toISOString();
    this.protocolId = data.protocolId || null;
    this.protocolName = data.protocolName || '';
    this.changes = data.changes || {}; // { innerfaceId: changeAmount }
    this.metadata = data.metadata || {}; // Additional data based on type
  }

  validate() {
    const errors = [];
    const validTypes = ['protocol', 'drag_drop', 'quick_action', 'manual_edit'];
    
    if (!validTypes.includes(this.type)) {
      errors.push(`Type must be one of: ${validTypes.join(', ')}`);
    }
    
    if (!this.timestamp) {
      errors.push('Timestamp is required');
    }
    
    if (this.type === 'protocol' && !this.protocolId) {
      errors.push('Protocol ID is required for protocol type');
    }
    
    if (!this.changes || typeof this.changes !== 'object') {
      errors.push('Changes must be an object');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getTotalChange() {
    return Object.values(this.changes).reduce((sum, change) => sum + change, 0);
  }

  getAffectedInnerfaces() {
    return Object.keys(this.changes).map(id => parseInt(id) || id);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      timestamp: this.timestamp,
      protocolId: this.protocolId,
      protocolName: this.protocolName,
      changes: this.changes,
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    return new HistoryEntry(json);
  }
}