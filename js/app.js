// ===== app.js - Main Application Logic =====

const App = {
  currentPage: 'dashboard',
  protocolsPage: 1,
  protocolsPerPage: 30,
  filteredProtocols: [],
  skillsPage: 1,
  skillsPerPage: 30,
  filteredSkills: [],
  filteredHistory: [],
  states: [],

  init() {
    // Initialize storage
    Storage.init();
    
    // Initialize data
    this.states = Storage.getStatesInOrder();
    
    // Setup navigation
    this.setupNavigation();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize modals
    Modals.init();
    
    // Render initial page
    this.renderPage('dashboard');
    
    // Setup navigation indicator
    this.updateNavIndicator();
  },

  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
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
          this.filteredHistory = [];
          
          // Clear search input
          const historySearchInput = document.getElementById('history-search');
          if (historySearchInput) {
            historySearchInput.value = '';
          }
          
          this.showToast('History cleared', 'success');
          this.renderPage('history');
        }
      });
    }

    // Protocol search
    const searchInput = document.getElementById('protocol-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterProtocols(e.target.value);
      });
    }

    // Skill search
    const skillSearchInput = document.getElementById('skill-search');
    if (skillSearchInput) {
      skillSearchInput.addEventListener('input', (e) => {
        this.filterSkills(e.target.value);
      });
    }

    // History search
    const historySearchInput = document.getElementById('history-search');
    if (historySearchInput) {
      historySearchInput.addEventListener('input', (e) => {
        this.filterHistory(e.target.value);
      });
    }

    // Pagination buttons
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.protocolsPage > 1) {
          this.protocolsPage--;
          UI.renderProtocols();
          this.updatePagination();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(this.filteredProtocols.length / this.protocolsPerPage);
        if (this.protocolsPage < totalPages) {
          this.protocolsPage++;
          UI.renderProtocols();
          this.updatePagination();
        }
      });
    }

    // Skills pagination buttons
    const skillsPrevBtn = document.getElementById('skills-prev-page');
    const skillsNextBtn = document.getElementById('skills-next-page');
    
    if (skillsPrevBtn) {
      skillsPrevBtn.addEventListener('click', () => {
        if (this.skillsPage > 1) {
          this.skillsPage--;
          UI.renderSkills();
          this.updateSkillsPagination();
        }
      });
    }

    if (skillsNextBtn) {
      skillsNextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(this.filteredSkills.length / this.skillsPerPage);
        if (this.skillsPage < totalPages) {
          this.skillsPage++;
          UI.renderSkills();
          this.updateSkillsPagination();
        }
      });
    }

    // Setup tooltip positioning
    this.setupTooltips();

    // Settings dropdown
    this.setupSettingsDropdown();
  },

  setupTooltips() {
    let tooltipTimeout = null;
    let currentTooltipElement = null;

    // Clear any existing tooltip
    const clearCurrentTooltip = () => {
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      if (currentTooltipElement) {
        currentTooltipElement.classList.remove('show-tooltip');
        currentTooltipElement = null;
      }
    };

    // Add tooltip handlers to protocol and skill name cells
    this.setupTooltipRowHandlers(clearCurrentTooltip, (element) => {
      currentTooltipElement = element;
      tooltipTimeout = setTimeout(() => {
        if (currentTooltipElement === element) {
          element.classList.add('show-tooltip');
        }
      }, 1000);
    });
  },

  setupTooltipRowHandlers(clearTooltip, startTooltip) {
    // Handle protocol name cells
    document.querySelectorAll('.protocol-name-cell[data-hover]').forEach(cell => {
      cell.addEventListener('mouseenter', () => {
        clearTooltip();
        startTooltip(cell);
      });
      
      cell.addEventListener('mouseleave', () => {
        clearTooltip();
      });
    });

    // Handle skill name cells
    document.querySelectorAll('.skill-name-cell[data-hover]').forEach(cell => {
      cell.addEventListener('mouseenter', () => {
        clearTooltip();
        startTooltip(cell);
      });
      
      cell.addEventListener('mouseleave', () => {
        clearTooltip();
      });
    });
  },

  navigateTo(page) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Update pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('active', p.id === page);
    });
    
    this.currentPage = page;
    this.renderPage(page);
    this.updateNavIndicator();
  },

  updateNavIndicator() {
    const activeItem = document.querySelector('.nav-item.active');
    const indicator = document.querySelector('.nav-indicator');
    
    if (activeItem && indicator) {
      const rect = activeItem.getBoundingClientRect();
      const containerRect = activeItem.parentElement.getBoundingClientRect();
      
      indicator.style.left = (rect.left - containerRect.left) + 'px';
      indicator.style.width = rect.width + 'px';
    }
  },

  renderPage(page) {
    switch(page) {
      case 'dashboard':
        UI.renderDashboard();
        break;
      case 'protocols':
        UI.renderProtocols();
        this.setupTooltips();
        break;
      case 'skills':
        UI.renderSkills();
        this.setupTooltips();
        break;
      case 'history':
        // Initialize filtered history if not already set
        if (this.filteredHistory.length === 0) {
          this.filteredHistory = Storage.getCheckins().reverse();
        }
        UI.renderHistory();
        break;
    }
  },

  // Actions
  checkin(protocolId) {
    const checkin = Storage.addCheckin(protocolId);
    if (checkin) {
      this.showToast('Check-in successful!', 'success');
      this.renderPage(this.currentPage);
      // Update user stats if on dashboard
      if (this.currentPage === 'dashboard') {
        UI.updateUserStats();
      }
    }
  },

  quickCheckin(protocolId) {
    this.checkin(protocolId);
  },

  deleteCheckin(checkinId) {
    if (confirm('Delete this check-in?')) {
      const checkins = Storage.getCheckins();
      const checkin = checkins.find(c => c.id === checkinId);
      
      Storage.deleteCheckin(checkinId);
      
      // If it was a drag & drop operation, refresh the affected page
      if (checkin && checkin.type === 'drag_drop') {
        if (checkin.subType === 'protocol') {
          this.filteredProtocols = Storage.getProtocolsInOrder();
          if (this.currentPage === 'protocols') {
            UI.renderProtocols();
          }
          this.showToast('Protocol order reverted', 'success');
        } else if (checkin.subType === 'skill') {
          this.filteredSkills = Storage.getSkillsInOrder();
          if (this.currentPage === 'skills') {
            UI.renderSkills();
          }
          this.showToast('Skill order reverted', 'success');
        }
      } else {
        this.showToast('Check-in deleted', 'success');
      }
      
      // Reset history filter to show all items
      this.filteredHistory = [];
      UI.renderHistory();
      
      // Update user stats if on dashboard
      if (this.currentPage === 'dashboard') {
        UI.updateUserStats();
      }
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
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  filterProtocols(query) {
    const allProtocols = Storage.getProtocolsInOrder();
    const skills = Storage.getSkills();
    
    if (!query.trim()) {
      this.filteredProtocols = allProtocols;
    } else {
      const searchTerm = query.toLowerCase();
      this.filteredProtocols = allProtocols.filter(protocol => {
        // Search in protocol name
        if (protocol.name.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search in target skills
        const targetNames = protocol.targets.map(targetId => {
          const skill = skills.find(s => s.id === targetId);
          return skill ? skill.name.toLowerCase() : targetId;
        });
        
        return targetNames.some(name => name.includes(searchTerm));
      });
    }
    
    // Reset to first page when filtering
    this.protocolsPage = 1;
    UI.renderProtocols();
    this.setupTooltips();
  },

  updatePagination() {
    const totalProtocols = this.filteredProtocols.length;
    const totalPages = Math.ceil(totalProtocols / this.protocolsPerPage);
    
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (currentPageSpan) currentPageSpan.textContent = this.protocolsPage;
    if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
    
    if (prevBtn) {
      prevBtn.disabled = this.protocolsPage <= 1;
    }
    
    if (nextBtn) {
      nextBtn.disabled = this.protocolsPage >= totalPages;
    }
  },

  updateSkillsPagination() {
    const totalSkills = this.filteredSkills.length;
    const totalPages = Math.ceil(totalSkills / this.skillsPerPage);
    
    const currentPageSpan = document.getElementById('skills-current-page');
    const totalPagesSpan = document.getElementById('skills-total-pages');
    const skillsPrevBtn = document.getElementById('skills-prev-page');
    const skillsNextBtn = document.getElementById('skills-next-page');
    
    if (currentPageSpan) currentPageSpan.textContent = this.skillsPage;
    if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
    
    if (skillsPrevBtn) {
      skillsPrevBtn.disabled = this.skillsPage <= 1;
    }
    
    if (skillsNextBtn) {
      skillsNextBtn.disabled = this.skillsPage >= totalPages;
    }
  },

  filterSkills(query) {
    const allSkills = Storage.getSkillsInOrder();
    
    if (!query.trim()) {
      this.filteredSkills = allSkills;
    } else {
      const searchTerm = query.toLowerCase();
      this.filteredSkills = allSkills.filter(skill => {
        // Search in skill name
        if (skill.name.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search in skill description
        const description = skill.hover ? skill.hover.toLowerCase() : '';
        return description.includes(searchTerm);
      });
    }
    
    // Reset to first page when filtering
    this.skillsPage = 1;
    UI.renderSkills();
    this.setupTooltips();
  },

  filterHistory(query) {
    const allHistory = Storage.getCheckins().reverse();
    const skills = Storage.getSkills();
    
    if (!query.trim()) {
      this.filteredHistory = allHistory;
    } else {
      const searchTerm = query.toLowerCase();
      this.filteredHistory = allHistory.filter(checkin => {
        // Search in protocol name
        if (checkin.protocolName && checkin.protocolName.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search in item name (for drag & drop operations)
        if (checkin.itemName && checkin.itemName.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search in operation type
        if (checkin.type === 'drag_drop') {
          const actionText = checkin.subType === 'protocol' ? 'reordered protocol' : 'reordered skill';
          if (actionText.includes(searchTerm)) {
            return true;
          }
        }
        
        // Search in quick action operations
        if (checkin.type === 'quick_action') {
          const actionText = checkin.subType === 'added' ? 'added to quick actions' : 'removed from quick actions';
          if (actionText.includes(searchTerm)) {
            return true;
          }
        }
        
        // Search in affected skill names
        if (checkin.changes) {
          const affectedSkills = Object.keys(checkin.changes).map(skillId => {
            const skill = skills.find(s => s.id == skillId);
            return skill ? skill.name.toLowerCase() : '';
          });
          
          if (affectedSkills.some(skillName => skillName.includes(searchTerm))) {
            return true;
          }
        }
        
        return false;
      });
    }
    
    UI.renderHistory();
  },

  // Setup settings dropdown
  setupSettingsDropdown() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const migrateBtn = document.getElementById('migrate-ids-btn');
    
    if (settingsBtn && settingsMenu) {
      // Toggle dropdown on button click
      settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsMenu.classList.toggle('active');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
          settingsMenu.classList.remove('active');
        }
      });
      
      // Migrate IDs button
      if (migrateBtn) {
        migrateBtn.addEventListener('click', () => {
          settingsMenu.classList.remove('active');
          this.migrateSkillIds();
        });
      }
    }
  },

  // Migrate skill IDs to numeric format
  migrateSkillIds() {
    if (!confirm('This will migrate all skill IDs to numeric format (1, 2, 3...). This is irreversible. Continue?')) {
      return;
    }
    
    try {
      const result = Storage.migrateSkillIds();
      
      // Clear filtered data to force refresh
      this.filteredSkills = [];
      this.filteredProtocols = [];
      
      // Refresh current page
      this.renderPage(this.currentPage);
      
      // Show success message
      this.showToast(`Successfully migrated ${result.skillsUpdated} skills, updated ${result.protocolsUpdated} protocols and ${result.checkinsUpdated} check-ins`, 'success');
      
      console.log('Migration result:', result);
    } catch (error) {
      console.error('Migration failed:', error);
      this.showToast('Migration failed: ' + error.message, 'error');
    }
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
// Handle window resize for nav indicator
window.addEventListener('resize', () => {
  App.updateNavIndicator();
});


