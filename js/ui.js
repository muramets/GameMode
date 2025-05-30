// ===== ui.js - UI Rendering =====

const UI = {
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
    // Update user stats
    this.updateUserStats();
    
    // Render states using ordered states
    const statesGrid = document.querySelector('.states-grid');
    const states = Storage.getStatesInOrder();
    
    if (!statesGrid) {
      console.error('❌ ERROR: .states-grid element not found');
      return;
    }
    
    statesGrid.innerHTML = states.map(state => {
      const score = Storage.calculateStateScore(state.id);
      const scoreClass = this.getScoreClass(score);
      const color = this.getSkillColor(score);
      const percent = Math.min(100, (score / 10) * 100);
      
      return `
        <div class="state-card" data-state-id="${state.id}" draggable="true">
          <div class="state-header">
            <span class="state-icon">${state.icon}</span>
            <span class="state-name">${state.name.split('.')[0]}</span>
            <button class="state-settings-btn" onclick="Modals.editState('${state.id}')" title="Edit state">
              <i class="fas fa-cog"></i>
            </button>
          </div>
          <div class="state-hover">${state.hover}</div>
          <div class="state-score ${scoreClass}">${score.toFixed(2)}</div>
          <div class="state-bar">
            <div class="state-bar-fill" style="width: ${percent}%; background-color: ${color}"></div>
          </div>
          <div class="state-details">
            <span>Skills: ${state.skillIds ? state.skillIds.length : 0}${state.stateIds && state.stateIds.length > 0 ? `, States: ${state.stateIds.length}` : ''}</span>
            <span>${percent.toFixed(0)}%</span>
          </div>
        </div>
      `;
    }).join('');
    
    // Render quick protocols from ordered quick actions
    this.renderQuickProtocols();
    
    // Setup drag & drop after rendering
    DragDrop.setupStates();
    DragDrop.setupQuickActions();
  },

  renderQuickProtocols() {
    const quickProtocols = document.querySelector('.quick-protocols');
    const protocols = Storage.getQuickActionsInOrder();
    
    if (!quickProtocols) {
      console.error('❌ ERROR: .quick-protocols element not found');
      return;
    }
    
    quickProtocols.innerHTML = protocols.map(protocol => {
      return `
        <div class="quick-protocol" data-protocol-id="${protocol.id}" onclick="App.quickCheckin(${protocol.id})" draggable="true">
          <span class="quick-protocol-icon">${protocol.icon}</span>
          <div class="quick-protocol-info">
            <span class="quick-protocol-name">${protocol.name.split('.')[0]}</span>
            <span class="quick-protocol-details">${protocol.action}${protocol.weight}</span>
          </div>
          <div class="quick-protocol-delete" onclick="event.stopPropagation(); Storage.removeFromQuickActions(${protocol.id}); UI.renderDashboard();" title="Remove from quick actions">
            <i class="fas fa-trash"></i>
          </div>
        </div>
      `;
    }).join('');
  },

  // Protocols
  renderProtocols() {
    // Initialize filtered protocols if empty
    if (App.filteredProtocols.length === 0) {
      App.filteredProtocols = Storage.getProtocolsInOrder();
    }

    const protocolsBody = document.querySelector('.protocols-body');
    const skills = Storage.getSkills();
    
    // Calculate pagination
    const startIndex = (App.protocolsPage - 1) * App.protocolsPerPage;
    const endIndex = startIndex + App.protocolsPerPage;
    const protocolsToShow = App.filteredProtocols.slice(startIndex, endIndex);
    
    protocolsBody.innerHTML = protocolsToShow.map((protocol, index) => {
      const targetNames = protocol.targets.map(targetId => {
        const skill = skills.find(s => s.id === targetId);
        return skill ? skill.name.split('.')[0] : targetId;
      });
      
      const globalIndex = startIndex + index + 1;
      const nameParts = protocol.name.split('. ');
      const mainName = nameParts[0];
      const shortDesc = nameParts.slice(1).join('. ');
      
      const weightClass = protocol.action === '+' ? 'positive' : 'negative';
      
      return `
        <div class="protocol-row" draggable="true" data-protocol-id="${protocol.id}">
          <div class="protocol-cell protocol-number">${globalIndex}</div>
          <div class="protocol-cell protocol-name-cell" ${protocol.hover ? `data-hover="${protocol.hover}"` : ''}>
            <span class="protocol-icon">${protocol.icon}</span>
            <span class="protocol-name-full">
              <span class="protocol-name-main">${mainName}.</span>
              ${shortDesc ? `<span class="protocol-name-desc">${shortDesc}</span>` : ''}
            </span>
            <button class="skill-settings-btn" onclick="Modals.editProtocol('${protocol.id}')">
              <i class="fas fa-cog"></i>
            </button>
          </div>
          <div class="protocol-cell protocol-targets-cell">
            ${targetNames.map(name => `<span class="protocol-target-tag">${name}</span>`).join('')}
          </div>
          <div class="protocol-cell protocol-weight ${weightClass}">${protocol.action}${protocol.weight}</div>
          <div class="protocol-cell protocol-action-cell">
            <button class="protocol-checkin-btn" onclick="App.checkin(${protocol.id})" title="Check-in">
              <i class="fas fa-check"></i>
              check-in
            </button>
          </div>
        </div>
      `;
    }).join('');

    App.updatePagination();
    DragDrop.setupProtocols();
  },

  // Skills
  renderSkills() {
    // Initialize filtered skills if empty
    if (App.filteredSkills.length === 0) {
      App.filteredSkills = Storage.getSkillsInOrder();
    }

    const skillsBody = document.querySelector('.skills-body');
    
    // Calculate pagination
    const startIndex = (App.skillsPage - 1) * App.skillsPerPage;
    const endIndex = startIndex + App.skillsPerPage;
    const skillsToShow = App.filteredSkills.slice(startIndex, endIndex);
    
    skillsBody.innerHTML = skillsToShow.map((skill, index) => {
      const current = Storage.calculateCurrentScore(skill.id);
      const currentScoreClass = this.getScoreClass(current);
      const color = this.getSkillColor(current);
      const percent = Math.min(100, (current / 10) * 100);
      
      const globalIndex = startIndex + index + 1;
      const nameParts = skill.name.split('. ');
      const mainName = nameParts[0];
      const shortDesc = nameParts.slice(1).join('. ');
      
      return `
        <div class="skill-row" draggable="true" data-skill-id="${skill.id}">
          <div class="skill-cell skill-number">${globalIndex}</div>
          <div class="skill-cell skill-name-cell" data-hover="${skill.name}">
            <div class="skill-name-full">
              <div class="skill-name-main">${skill.icon} ${mainName}</div>
              ${shortDesc ? `<div class="skill-name-desc">${shortDesc}</div>` : ''}
            </div>
            <button class="skill-settings-btn" data-skill-id="${skill.id}" title="Settings" onclick="Modals.editSkill('${skill.id}')">
              <i class="fas fa-cog"></i>
            </button>
          </div>
          <div class="skill-cell skill-score-cell">${skill.initialScore.toFixed(2)}</div>
          <div class="skill-cell skill-score-cell ${currentScoreClass}">${current.toFixed(2)}</div>
          <div class="skill-cell skill-progress-cell">
            <div class="skill-progress-bar">
              <div class="skill-progress-fill" style="width: ${percent}%; background-color: ${color};"></div>
            </div>
            <span class="skill-progress-percent">${Math.round(percent)}%</span>
          </div>
        </div>
      `;
    }).join('');

    App.updateSkillsPagination();
    DragDrop.setupSkills();
  },

  // History
  renderHistory() {
    // Initialize filtered history if empty and no search is active
    const historySearchInput = document.getElementById('history-search');
    const hasSearchQuery = historySearchInput && historySearchInput.value.trim() !== '';
    
    if (App.filteredHistory.length === 0 && !hasSearchQuery) {
      App.filteredHistory = Storage.getCheckins().reverse();
    }

    const historyBody = document.querySelector('.history-body');
    const checkins = App.filteredHistory;
    const skills = Storage.getSkills();
    
    if (checkins.length === 0) {
      const message = hasSearchQuery 
        ? '<div class="text-dim" style="text-align: center; padding: 2rem; grid-column: 1 / -1;">No check-ins found matching your search.</div>'
        : '<div class="text-dim" style="text-align: center; padding: 2rem; grid-column: 1 / -1;">No check-ins yet. Start with a protocol!</div>';
      historyBody.innerHTML = message;
      return;
    }
    
    historyBody.innerHTML = checkins.map(checkin => {
      const date = new Date(checkin.timestamp);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      if (checkin.type === 'drag_drop') {
        // Drag & Drop operation
        const actionText = checkin.subType === 'protocol' ? 'Reordered protocol' : 'Reordered skill';
        const actionDesc = `Position: ${checkin.oldPosition} → ${checkin.newPosition}`;
        
        return `
          <div class="history-row">
            <div class="history-cell history-date-cell">
              <div style="display: flex; flex-direction: column; gap: 0.125rem;">
                <div>${dateStr}</div>
                <div style="color: var(--sub-color); font-size: 0.7rem;">${timeStr}</div>
              </div>
            </div>
            <div class="history-cell history-type-cell">reorder</div>
            <div class="history-cell history-action-cell">
              <div class="history-action-full">
                <div class="history-action-main">${checkin.itemIcon} ${checkin.itemName}</div>
                <div class="history-action-desc">${actionDesc}</div>
              </div>
            </div>
            <div class="history-cell history-changes-cell">
              <span class="history-change-tag">Position change</span>
            </div>
            <div class="history-cell history-actions-cell">
              <button class="history-delete-btn" onclick="App.deleteCheckin(${checkin.id})" title="Undo">
                <i class="fas fa-undo"></i>
              </button>
            </div>
          </div>
        `;
      } else if (checkin.type === 'quick_action') {
        // Quick Action operation
        const actionDesc = checkin.subType === 'added' ? 'Added to Quick Actions' : 'Removed from Quick Actions';
        
        return `
          <div class="history-row">
            <div class="history-cell history-date-cell">
              <div style="display: flex; flex-direction: column; gap: 0.125rem;">
                <div>${dateStr}</div>
                <div style="color: var(--sub-color); font-size: 0.7rem;">${timeStr}</div>
              </div>
            </div>
            <div class="history-cell history-type-cell">quick action</div>
            <div class="history-cell history-action-cell">
              <div class="history-action-full">
                <div class="history-action-main">${checkin.protocolIcon} ${checkin.protocolName}</div>
                <div class="history-action-desc">${actionDesc}</div>
              </div>
            </div>
            <div class="history-cell history-changes-cell">
              <span class="history-change-tag">Quick Actions updated</span>
            </div>
            <div class="history-cell history-actions-cell">
              <button class="history-delete-btn" onclick="App.deleteCheckin(${checkin.id})" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      } else {
        // Regular protocol check-in
        const changes = Object.entries(checkin.changes).map(([skillId, change]) => {
          const skill = skills.find(s => s.id == skillId);
          if (!skill) return '';
          
          const sign = change > 0 ? '+' : '';
          const className = change > 0 ? 'positive' : 'negative';
          return `<span class="history-change-tag ${className}">${skill.icon} ${sign}${change.toFixed(2)}</span>`;
        }).join('');
        
        return `
          <div class="history-row">
            <div class="history-cell history-date-cell">
              <div style="display: flex; flex-direction: column; gap: 0.125rem;">
                <div>${dateStr}</div>
                <div style="color: var(--sub-color); font-size: 0.7rem;">${timeStr}</div>
              </div>
            </div>
            <div class="history-cell history-type-cell">protocol</div>
            <div class="history-cell history-action-cell">
              <div class="history-action-full">
                <div class="history-action-main">${checkin.protocolIcon} ${checkin.protocolName}</div>
                <div class="history-action-desc">Check-in completed</div>
              </div>
            </div>
            <div class="history-cell history-changes-cell">${changes}</div>
            <div class="history-cell history-actions-cell">
              <button class="history-delete-btn" onclick="App.deleteCheckin(${checkin.id})" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      }
    }).join('');
  },

  // Update user statistics in dashboard
  updateUserStats() {
    const checkins = Storage.getCheckins();
    const skills = Storage.getSkills();
    const states = Storage.getStates();
    
    // Get today's date for filtering
    const today = new Date();
    const todayStr = today.toDateString();
    
    // Get current month and year
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Filter today's checkins
    const todayCheckins = checkins.filter(checkin => {
      const checkinDate = new Date(checkin.timestamp);
      return checkinDate.toDateString() === todayStr && checkin.type === 'protocol';
    });
    
    // Filter this month's checkins
    const monthCheckins = checkins.filter(checkin => {
      const checkinDate = new Date(checkin.timestamp);
      return checkinDate.getMonth() === currentMonth && 
             checkinDate.getFullYear() === currentYear && 
             checkin.type === 'protocol';
    });
    
    // Calculate total score changes for today
    let todayTotalChange = 0;
    todayCheckins.forEach(checkin => {
      Object.values(checkin.changes).forEach(change => {
        todayTotalChange += Math.abs(change);
      });
    });
    
    // Calculate total score changes for this month
    let monthTotalChange = 0;
    monthCheckins.forEach(checkin => {
      Object.values(checkin.changes).forEach(change => {
        monthTotalChange += change;
      });
    });
    
    // Calculate average state score (same as states are calculated)
    let totalStateScore = 0;
    states.forEach(state => {
      const stateScore = Storage.calculateStateScore(state.id);
      totalStateScore += stateScore;
    });
    const averageStateScore = states.length > 0 ? (totalStateScore / states.length) : 0;
    
    // Update level progress bar with color
    const levelProgressFill = document.getElementById('level-progress-fill');
    const levelPercentage = document.getElementById('level-percentage');
    if (levelProgressFill && levelPercentage) {
      const percent = Math.min(100, (averageStateScore / 10) * 100);
      const color = this.getSkillColor(averageStateScore);
      
      levelProgressFill.style.width = percent + '%';
      levelProgressFill.style.backgroundColor = color;
      levelPercentage.textContent = Math.round(percent) + '%';
    }
    
    // Update today's checkins
    const checkinsToday = document.getElementById('checkins-today');
    const checkinsTodayDetail = document.getElementById('checkins-today-detail');
    if (checkinsToday && checkinsTodayDetail) {
      checkinsToday.textContent = todayCheckins.length;
      checkinsTodayDetail.textContent = `(+${todayTotalChange.toFixed(2)} total boost)`;
    }
    
    // Update month's checkins
    const checkinsMonth = document.getElementById('checkins-month');
    const checkinsMonthDetail = document.getElementById('checkins-month-detail');
    if (checkinsMonth && checkinsMonthDetail) {
      checkinsMonth.textContent = monthCheckins.length;
      const sign = monthTotalChange >= 0 ? '+' : '';
      checkinsMonthDetail.textContent = `(${sign}${monthTotalChange.toFixed(2)} net change)`;
    }
  }
};