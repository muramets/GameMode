import { SCORE_CONFIG } from '../config/constants.js';

export class Innerface {
  constructor(data = {}) {
    this.id = data.id || Date.now();
    this.name = data.name || '';
    this.icon = data.icon || '⭐';
    this.hover = data.hover || '';
    this.initialScore = data.initialScore || SCORE_CONFIG.DEFAULT_INITIAL_SCORE;
  }

  validate() {
    const errors = [];
    
    if (!this.name.trim()) {
      errors.push('Innerface name is required');
    }
    
    if (this.initialScore < SCORE_CONFIG.MIN_SCORE || this.initialScore > SCORE_CONFIG.MAX_SCORE) {
      errors.push(`Initial score must be between ${SCORE_CONFIG.MIN_SCORE} and ${SCORE_CONFIG.MAX_SCORE}`);
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
      initialScore: this.initialScore
    };
  }

  static fromJSON(json) {
    return new Innerface(json);
  }
}