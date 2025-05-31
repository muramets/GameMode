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
  historyFilters: {
    time: 'all',
    type: 'all', 
    effect: 'all',
    customDateFrom: '',
    customDateTo: ''
  },

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

    // History filters
    this.setupHistoryFilters();

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
        // Setup filters after rendering
        setTimeout(() => {
          this.setupHistoryFilters();
        }, 0);
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
    // Just trigger the main filter function which handles both search and filters
    this.applyHistoryFilters();
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
  },

  // Setup history filters
  setupHistoryFilters() {
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    const customDateRange = document.getElementById('filter-custom-date-range');
    const dateFromInput = document.getElementById('filter-date-from');
    const dateToInput = document.getElementById('filter-date-to');
    
    filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const filterType = e.target.dataset.filter;
        const filterValue = e.target.dataset.value;
        
        // Handle "all" checkboxes
        if (filterValue === 'all') {
          if (e.target.checked) {
            // Uncheck other options in the same group
            const groupCheckboxes = document.querySelectorAll(`[data-filter="${filterType}"]`);
            groupCheckboxes.forEach(cb => {
              if (cb !== e.target) {
                cb.checked = false;
              }
            });
            this.historyFilters[filterType] = 'all';
            
            // Hide custom date range if time filter is set to all
            if (filterType === 'time' && customDateRange) {
              customDateRange.style.display = 'none';
            }
          } else {
            // Prevent unchecking "all" if it's the only one checked
            e.target.checked = true;
          }
        } else {
          // If specific option is checked, uncheck "all" and all other options in the same group
          if (e.target.checked) {
            const groupCheckboxes = document.querySelectorAll(`[data-filter="${filterType}"]`);
            
            // Uncheck all other options in the same group
            groupCheckboxes.forEach(cb => {
              if (cb !== e.target) {
                cb.checked = false;
              }
            });
            
            this.historyFilters[filterType] = filterValue;
            
            // Show/hide custom date range for time filter
            if (filterType === 'time' && customDateRange) {
              if (filterValue === 'custom') {
                customDateRange.style.display = 'block';
                // Set default dates if empty
                const today = new Date();
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (!dateFromInput.value) {
                  dateFromInput.value = weekAgo.toISOString().split('T')[0];
                  this.historyFilters.customDateFrom = dateFromInput.value;
                }
                if (!dateToInput.value) {
                  dateToInput.value = today.toISOString().split('T')[0];
                  this.historyFilters.customDateTo = dateToInput.value;
                }
              } else {
                customDateRange.style.display = 'none';
              }
            }
          } else {
            // If unchecking and no other options are checked, check "all"
            const groupCheckboxes = document.querySelectorAll(`[data-filter="${filterType}"]`);
            const hasChecked = Array.from(groupCheckboxes).some(cb => cb.checked && cb.dataset.value !== 'all');
            
            if (!hasChecked) {
              const allCheckbox = document.querySelector(`[data-filter="${filterType}"][data-value="all"]`);
              if (allCheckbox) {
                allCheckbox.checked = true;
                this.historyFilters[filterType] = 'all';
                
                // Hide custom date range when reverting to all
                if (filterType === 'time' && customDateRange) {
                  customDateRange.style.display = 'none';
                }
              }
            }
          }
        }
        
        this.updateFilterIcon();
        this.applyHistoryFilters();
      });
    });
    
    // Handle custom date inputs
    if (dateFromInput) {
      dateFromInput.addEventListener('change', (e) => {
        this.historyFilters.customDateFrom = e.target.value;
        this.applyHistoryFilters();
      });
    }
    
    if (dateToInput) {
      dateToInput.addEventListener('change', (e) => {
        this.historyFilters.customDateTo = e.target.value;
        this.applyHistoryFilters();
      });
    }
    
    this.updateFilterIcon();
  },

  // Update filter icon active state
  updateFilterIcon() {
    const filterIcon = document.getElementById('history-filters-icon');
    if (!filterIcon) return;
    
    // Check only the main filter values (time, type, effect), ignore custom date fields
    const hasActiveFilters = this.historyFilters.time !== 'all' || 
                             this.historyFilters.type !== 'all' || 
                             this.historyFilters.effect !== 'all';
    
    if (hasActiveFilters) {
      filterIcon.classList.add('active');
    } else {
      filterIcon.classList.remove('active');
    }
  },

  // Apply history filters
  applyHistoryFilters() {
    const searchInput = document.getElementById('history-search');
    const searchQuery = searchInput ? searchInput.value : '';
    
    // Start with all history
    const allHistory = Storage.getCheckins().reverse();
    const skills = Storage.getSkills();
    
    this.filteredHistory = allHistory.filter(checkin => {
      // Search filter
      if (searchQuery.trim()) {
        const searchTerm = searchQuery.toLowerCase();
        let matchesSearch = false;
        
        // Search in protocol name
        if (checkin.protocolName && checkin.protocolName.toLowerCase().includes(searchTerm)) {
          matchesSearch = true;
        }
        
        // Search in item name (for drag & drop operations)
        if (checkin.itemName && checkin.itemName.toLowerCase().includes(searchTerm)) {
          matchesSearch = true;
        }
        
        // Search in operation type
        if (checkin.type === 'drag_drop') {
          const actionText = checkin.subType === 'protocol' ? 'reordered protocol' : 'reordered skill';
          if (actionText.includes(searchTerm)) {
            matchesSearch = true;
          }
        }
        
        // Search in quick action operations
        if (checkin.type === 'quick_action') {
          const actionText = checkin.subType === 'added' ? 'added to quick actions' : 'removed from quick actions';
          if (actionText.includes(searchTerm)) {
            matchesSearch = true;
          }
        }
        
        // Search in affected skill names
        if (checkin.changes) {
          const affectedSkills = Object.keys(checkin.changes).map(skillId => {
            const skill = skills.find(s => s.id == skillId);
            return skill ? skill.name.toLowerCase() : '';
          });
          
          if (affectedSkills.some(skillName => skillName.includes(searchTerm))) {
            matchesSearch = true;
          }
        }
        
        if (!matchesSearch) {
          return false;
        }
      }
      
      // Time filter
      if (this.historyFilters.time !== 'all') {
        const checkinDate = new Date(checkin.timestamp);
        const now = new Date();
        
        switch (this.historyFilters.time) {
          case 'today':
            if (checkinDate.toDateString() !== now.toDateString()) {
              return false;
            }
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (checkinDate < weekAgo) {
              return false;
            }
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (checkinDate < monthAgo) {
              return false;
            }
            break;
          case 'custom':
            if (this.historyFilters.customDateFrom && this.historyFilters.customDateTo) {
              // Parse checkin timestamp and extract date string in YYYY-MM-DD format using UTC
              const checkinDateTime = new Date(checkin.timestamp);
              const checkinDateString = checkinDateTime.getUTCFullYear() + '-' + 
                String(checkinDateTime.getUTCMonth() + 1).padStart(2, '0') + '-' + 
                String(checkinDateTime.getUTCDate()).padStart(2, '0');
              
              // Compare date strings directly
              if (checkinDateString < this.historyFilters.customDateFrom || checkinDateString > this.historyFilters.customDateTo) {
                return false;
              }
            }
            break;
        }
      }
      
      // Type filter
      if (this.historyFilters.type !== 'all') {
        switch (this.historyFilters.type) {
          case 'protocol':
            if (checkin.type !== 'protocol') {
              return false;
            }
            break;
          case 'manual':
            if (checkin.type === 'protocol') {
              return false;
            }
            break;
        }
      }
      
      // Effect filter
      if (this.historyFilters.effect !== 'all') {
        if (!checkin.changes) return false;
        
        const changes = Object.values(checkin.changes);
        const hasPositive = changes.some(change => change > 0);
        const hasNegative = changes.some(change => change < 0);
        
        switch (this.historyFilters.effect) {
          case 'positive':
            if (!hasPositive) {
              return false;
            }
            break;
          case 'negative':
            if (!hasNegative) {
              return false;
            }
            break;
        }
      }
      
      return true;
    });
    
    UI.renderHistory();
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


