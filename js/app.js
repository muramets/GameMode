// ===== app.js - Main Application Logic =====

const App = {
  currentPage: 'dashboard',

  init() {
    // Initialize storage
    Storage.init();
    
    // Setup navigation
    this.setupNavigation();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Render initial page
    this.renderPage('dashboard');
  },

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const page = e.currentTarget.dataset.page;
        this.navigateTo(page);
      });
    });
  },

  setupEventListeners() {
    // Clear history button
    const clearBtn = document.getElementById('clear-history');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
          Storage.clearAllCheckins();
          this.showToast('History cleared', 'success');
          this.renderPage('history');
        }
      });
    }
  },

  navigateTo(page) {
    // Update nav
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });
    
    // Update pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('active', p.id === page);
    });
    
    this.currentPage = page;
    this.renderPage(page);
  },

  renderPage(page) {
    switch(page) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'protocols':
        this.renderProtocols();
        break;
      case 'skills':
        this.renderSkills();
        break;
      case 'history':
        this.renderHistory();
        break;
    }
  },

  // Get skill level color class
  getScoreClass(score) {
    if (score < 2) return 'score-1';
    if (score < 4) return 'score-2';
    if (score < 6) return 'score-3';
    if (score < 8) return 'score-4';
    return 'score-5';
  },
  
  // Get skill level color
  getSkillColor(score) {
    if (score < 2) return '#ca4754';
    if (score < 4) return '#e6934a';
    if (score < 6) return '#e2b714';
    if (score < 8) return '#98c379';
    return '#7fb3d3';
  },

  // Dashboard
  renderDashboard() {
    // Render states
    const statesGrid = document.querySelector('.states-grid');
    const states = Storage.getStates();
    
    statesGrid.innerHTML = states.map(state => {
      const score = Storage.calculateStateScore(state.id);
      const scoreClass = this.getScoreClass(score);
      const color = this.getSkillColor(score);
      const percent = Math.min(100, (score / 10) * 100);
      
      return `
        <div class="state-card">
          <div class="state-header">
            <span class="state-icon">${state.icon}</span>
            <span class="state-name">${state.name.split('.')[0]}</span>
          </div>
          <div class="state-hover">${state.hover}</div>
          <div class="state-score ${scoreClass}">${score.toFixed(2)}</div>
          <div class="state-bar">
            <div class="state-bar-fill" style="width: ${percent}%; background-color: ${color}"></div>
          </div>
          <div class="state-details">
            <span>Skills: ${state.skillIds.length}</span>
            <span>${percent.toFixed(0)}%</span>
          </div>
        </div>
      `;
    }).join('');
    
    // Render quick protocols (top 5 most used)
    const quickProtocols = document.querySelector('.quick-protocols');
    const protocols = Storage.getProtocols().slice(0, 5);
    
    quickProtocols.innerHTML = protocols.map(protocol => {
      return `
        <button class="quick-protocol" onclick="App.quickCheckin(${protocol.id})">
          <span class="quick-protocol-icon">${protocol.icon}</span>
          <div class="quick-protocol-info">
            <span class="quick-protocol-name">${protocol.name.split('.')[0]}</span>
            <span class="quick-protocol-details">${protocol.action}${protocol.weight}</span>
          </div>
        </button>
      `;
    }).join('');
  },

  // Protocols
  renderProtocols() {
    const protocolsList = document.querySelector('.protocols-list');
    const protocols = Storage.getProtocols();
    const skills = Storage.getSkills();
    
    protocolsList.innerHTML = protocols.map(protocol => {
      const targetNames = protocol.targets.map(targetId => {
        const skill = skills.find(s => s.id === targetId);
        return skill ? `${skill.icon} ${skill.name.split('.')[0]}` : targetId;
      });
      
      return `
        <div class="protocol-item">
          <span class="protocol-icon">${protocol.icon}</span>
          <div class="protocol-info">
            <div class="protocol-name">${protocol.name}</div>
            ${protocol.hover ? `<div class="protocol-hover">${protocol.hover}</div>` : ''}
            <div class="protocol-targets">
              ${targetNames.map(name => `<span class="protocol-target">${name}</span>`).join('')}
            </div>
          </div>
          <div class="protocol-action">
            <button class="btn-checkin" onclick="App.checkin(${protocol.id})">
              <i class="fas fa-check"></i>
              Check In
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  // Skills
  renderSkills() {
    const tableBody = document.querySelector('.skills-table .table-body');
    const skills = Storage.getSkills();
    
    tableBody.innerHTML = skills.map(skill => {
      const current = Storage.calculateCurrentScore(skill.id);
      const scoreClass = this.getScoreClass(current);
      const color = this.getSkillColor(current);
      const percent = Math.min(100, (current / 10) * 100);
      const lastUpdate = Storage.getSkillLastUpdate(skill.id);
      const dateStr = lastUpdate ? new Date(lastUpdate).toLocaleDateString() : 'Never';
      
      return `
        <div class="skill-row">
          <div class="skill-name">
            <span>${skill.icon}</span>
            <span>${skill.name}</span>
          </div>
          <div class="skill-score">${skill.initialScore.toFixed(2)}</div>
          <div class="skill-score ${scoreClass}">${current.toFixed(2)}</div>
          <div class="skill-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percent}%; background-color: ${color}"></div>
            </div>
            <span style="color: var(--sub-color)">${percent.toFixed(0)}%</span>
          </div>
          <div class="skill-date">${dateStr}</div>
        </div>
      `;
    }).join('');
  },

  // History
  renderHistory() {
    const historyList = document.querySelector('.history-list');
    const checkins = Storage.getCheckins().reverse();
    const skills = Storage.getSkills();
    
    if (checkins.length === 0) {
      historyList.innerHTML = '<div class="text-dim" style="text-align: center; padding: 2rem;">No check-ins yet. Start with a protocol!</div>';
      return;
    }
    
    historyList.innerHTML = checkins.map(checkin => {
      const date = new Date(checkin.timestamp);
      const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      
      const changes = Object.entries(checkin.changes).map(([skillId, change]) => {
        const skill = skills.find(s => s.id === skillId);
        if (!skill) return '';
        
        const sign = change > 0 ? '+' : '';
        const className = change > 0 ? 'change-positive' : 'change-negative';
        return `<span class="${className}">${skill.icon} ${sign}${change.toFixed(2)}</span>`;
      }).join('');
      
      return `
        <div class="history-item">
          <div class="history-info">
            <div class="history-date">${dateStr}</div>
            <div class="history-protocol">${checkin.protocolIcon} ${checkin.protocolName}</div>
            <div class="history-changes">${changes}</div>
          </div>
          <button class="btn btn-danger" onclick="App.deleteCheckin(${checkin.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');
  },

  // Actions
  checkin(protocolId) {
    const checkin = Storage.addCheckin(protocolId);
    if (checkin) {
      this.showToast('Check-in successful!', 'success');
      this.renderPage(this.currentPage);
    }
  },

  quickCheckin(protocolId) {
    this.checkin(protocolId);
  },

  deleteCheckin(checkinId) {
    if (confirm('Delete this check-in?')) {
      Storage.deleteCheckin(checkinId);
      this.showToast('Check-in deleted', 'success');
      this.renderHistory();
    }
  },

  // Toast notifications
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
