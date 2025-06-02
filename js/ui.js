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

  // Convert emoji to FontAwesome icon
  emojiToFontAwesome(emoji) {
    const emojiMap = {
      '🧠': 'fas fa-brain',
      '🪝': 'fas fa-record-vinyl',
      '🔹': 'fas fa-dumbbell',
      '🚀': 'fas fa-mug-hot',
      '🎼': 'fas fa-scale-balanced',
      '🌅': 'fas fa-hand-peace',
      '🧍‍♂️': 'fas fa-cloud-arrow-up',
      '🧘‍♂️': 'fas fa-certificate',
      '🚶‍♂️': 'fas fa-person-walking',
      '👟': 'fas fa-person-running',
      '🧖‍♂️': 'fas fa-bath'
    };
    
    return emojiMap[emoji] || emoji;
  },

  // Render icon properly - either as FontAwesome or emoji
  renderIcon(emoji) {
    const iconClass = this.emojiToFontAwesome(emoji);
    // If it's a FontAwesome class, wrap in <i> tag
    if (iconClass.startsWith('fas ')) {
      return `<i class="${iconClass}"></i>`;
    }
    // Otherwise, return the emoji directly
    return iconClass;
  },

  // Dashboard
  renderDashboard() {
    // Render states
    const states = window.Storage.getStatesInOrder();
    const statesContainer = document.querySelector('.states-grid');
    
    if (statesContainer) {
      if (states.length > 0) {
        statesContainer.innerHTML = states.map(state => {
          const score = window.Storage.calculateStateScore(state.id);
          const scoreClass = this.getScoreClass(score);
          const color = this.getSkillColor(score);
          const percentage = Math.round((score / 10) * 100);
          
          // Calculate yesterday's score
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayScore = window.Storage.calculateStateScoreAtDate(state.id, yesterday);
          
          // Calculate change direction and class
          const scoreDiff = score - yesterdayScore;
          let changeClass = 'no-change';
          let changeIcon = '';
          
          if (scoreDiff > 0.01) { // Threshold to avoid tiny changes
            changeClass = 'increase';
            changeIcon = '<i class="fas fa-arrow-up"></i>';
          } else if (scoreDiff < -0.01) {
            changeClass = 'decrease';
            changeIcon = '<i class="fas fa-arrow-down"></i>';
          }
          
          // Get number of dependencies (skills or states)
          const skillDeps = state.skillIds || [];
          const stateDeps = state.stateIds || [];
          
          // Create dependency display text
          let dependencyText = '';
          if (skillDeps.length > 0 && stateDeps.length > 0) {
            dependencyText = `Skills: ${skillDeps.length} States: ${stateDeps.length}`;
          } else if (skillDeps.length > 0) {
            dependencyText = `Skills: ${skillDeps.length}`;
          } else if (stateDeps.length > 0) {
            dependencyText = `States: ${stateDeps.length}`;
          } else {
            dependencyText = 'No dependencies';
          }
          
          // Get legacy name and subtext for backward compatibility
          let displayName, displaySubtext = '';
          
          // Check if state has separate subtext field (new format)
          if (state.subtext !== undefined) {
            displayName = state.name;
            displaySubtext = state.subtext;
          } else {
            // Legacy format: parse from name field
            const nameParts = state.name.split('. ');
            displayName = nameParts[0];
            displaySubtext = nameParts.length > 1 ? nameParts.slice(1).join('. ') : '';
          }
          
          return `
            <div class="state-card ${scoreClass}" draggable="true" data-state-id="${state.id}">
              <div class="state-header">
                <div class="state-info-container">
                  <div class="state-icon" style="color: ${color};">
                    ${this.renderIcon(state.icon)}
                  </div>
                  <div class="state-name-container">
                    <div class="state-name" style="color: ${color};">${displayName}</div>
                    ${displaySubtext ? `<div class="state-subtext">${displaySubtext}</div>` : ''}
                  </div>
                </div>
                <div class="state-controls">
                  <button class="state-question-icon" data-tooltip="${state.hover}" title="Info">
                    <i class="fas fa-question"></i>
                  </button>
                  <button class="state-settings-btn" onclick="Modals.editState('${state.id}')" title="Edit state">
                    <i class="fas fa-cog"></i>
                  </button>
                  <button class="state-history-btn" onclick="App.viewStateHistory('${state.id}')" title="View state history">
                    <i class="fas fa-history"></i>
                  </button>
                </div>
              </div>
              
              <div class="state-score" style="color: ${color};">
                ${score.toFixed(2)}
                ${changeIcon ? `<span class="state-change-arrow ${changeClass}">${changeIcon}</span>` : ''}
                <div class="state-score-yesterday">
                  yesterday: ${yesterdayScore.toFixed(2)}
                </div>
              </div>
              
              <div class="state-bar">
                <div class="state-bar-fill" style="width: ${percentage}%; background-color: ${color};"></div>
              </div>
              
              <div class="state-details">
                <span>${dependencyText}</span>
                <span>${percentage}%</span>
              </div>
            </div>
          `;
        }).join('');
        
        // Setup question icon functionality after rendering
        setTimeout(() => this.setupStateQuestionIcons(), 0);
        // Setup drag and drop for states
        setTimeout(() => DragDrop.setupStates(), 0);
      } else {
        statesContainer.innerHTML = `
          <div class="state-card empty-state">
            <div class="state-header">
              <div class="state-icon" style="color: var(--sub-color);">
                <i class="fas fa-chart-line"></i>
              </div>
              <div class="state-name">No states yet</div>
            </div>
            <div class="state-score">—</div>
            <div class="state-bar">
              <div class="state-bar-fill" style="width: 0%; background-color: var(--sub-color);"></div>
            </div>
            <div class="state-details">
              <span>Skills: 0</span>
              <span>0%</span>
            </div>
          </div>
        `;
      }
    }
    
    this.renderQuickProtocols();
    this.updateUserStats();
  },

  renderQuickProtocols() {
    const protocols = window.Storage.getQuickActionsInOrder();
    const container = document.querySelector('.quick-protocols');
    
    console.log('⚡ renderQuickProtocols DEBUG:', {
      protocols: protocols.length,
      protocolData: protocols,
      containerExists: !!container,
      containerContent: container?.innerHTML?.length || 0
    });
    
    if (!container) return;
    
    if (protocols.length === 0) {
      console.log('⚡ No quick protocols found, showing empty state');
      container.innerHTML = `
        <div class="quick-protocol empty-state">
          <div class="quick-protocol-icon"><i class="fas fa-zap"></i></div>
          <div class="quick-protocol-info">
            <div class="quick-protocol-name">No quick actions</div>
            <div class="quick-protocol-details">Add protocols</div>
          </div>
        </div>
      `;
      return;
    }
    
    console.log('⚡ Rendering', protocols.length, 'quick protocols');
    
    container.innerHTML = protocols.map(protocol => {
      const icon = this.renderIcon(protocol.icon);
      
      return `
        <div class="quick-protocol" draggable="true" data-protocol-id="${protocol.id}" title="${protocol.name}">
          <div class="quick-protocol-icon">${icon}</div>
          <div class="quick-protocol-info">
            <div class="quick-protocol-name">${protocol.name.split('. ')[0]}</div>
            <div class="quick-protocol-details">${protocol.weight}</div>
          </div>
          <div class="quick-protocol-actions">
            <button class="quick-level-btn level-up" onclick="event.stopPropagation(); App.quickCheckin(${protocol.id}, '+')">
              <i class="fas fa-arrow-up"></i>
              <span class="level-text">up</span>
            </button>
            <button class="quick-level-btn level-down" onclick="event.stopPropagation(); App.quickCheckin(${protocol.id}, '-')">
              <i class="fas fa-arrow-down"></i>
              <span class="level-text">down</span>
            </button>
          </div>
          <div class="quick-protocol-delete" onclick="event.stopPropagation(); window.Storage.removeFromQuickActions(${protocol.id}); UI.renderDashboard();" title="Remove from quick actions">
            <i class="fas fa-times"></i>
          </div>
        </div>
      `;
    }).join('');
    
    // Setup drag and drop for quick actions
    setTimeout(() => {
      DragDrop.setupQuickActions();
      this.setupQuickProtocolTooltips();
    }, 0);
  },

  // Setup tooltips for quick protocol names that are truncated
  setupQuickProtocolTooltips() {
    const quickProtocolNames = document.querySelectorAll('.quick-protocol-name');
    
    quickProtocolNames.forEach((nameElement, index) => {
      const text = nameElement.textContent.trim();
      const scrollWidth = nameElement.scrollWidth;
      const clientWidth = nameElement.clientWidth;
      const isOverflowing = scrollWidth > clientWidth;
      
      // Check if text is truncated (scrollWidth > clientWidth means text is overflowing)
      if (isOverflowing) {
        // Remove any existing listeners to prevent duplicates
        nameElement.removeEventListener('mouseenter', nameElement._boundShowTooltip);
        nameElement.removeEventListener('mouseleave', nameElement._boundHideTooltip);
        
        // Bind the functions to maintain proper context
        nameElement._boundShowTooltip = (e) => this.showTooltip(e, text);
        nameElement._boundHideTooltip = () => this.hideTooltip();
        
        // Add new event listeners
        nameElement.addEventListener('mouseenter', nameElement._boundShowTooltip);
        nameElement.addEventListener('mouseleave', nameElement._boundHideTooltip);
      } else {
        // Remove tooltip listeners if text fits
        nameElement.removeEventListener('mouseenter', nameElement._boundShowTooltip);
        nameElement.removeEventListener('mouseleave', nameElement._boundHideTooltip);
      }
    });
  },

  // Protocols
  renderProtocols() {
    App.filteredProtocols = window.Storage.getProtocolsInOrder();
    
    // Get all protocols and skills for display
    const skills = window.Storage.getSkills();
    
    // Apply current search filter if any
    const searchInput = document.getElementById('protocol-search');
    if (searchInput && searchInput.value.trim()) {
      // Apply filter locally without calling App.filterProtocols to avoid recursion
      const allProtocols = window.Storage.getProtocolsInOrder();
      const searchTerm = searchInput.value.toLowerCase();
      
      App.filteredProtocols = allProtocols.filter(protocol => {
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
    
    const protocols = App.filteredProtocols;
    const startIndex = (App.protocolsPage - 1) * App.protocolsPerPage;
    const endIndex = startIndex + App.protocolsPerPage;
    const pageProtocols = protocols.slice(startIndex, endIndex);
    
    const container = document.querySelector('.protocols-body');
    if (!container) return;
    
    if (pageProtocols.length === 0) {
      // Check if search is applied to show appropriate message
      const searchInput = document.getElementById('protocol-search');
      const hasSearchQuery = searchInput && searchInput.value.trim();
      
      let emptyMessage, emptyDescription;
      
      if (hasSearchQuery) {
        emptyMessage = "No protocols found";
        emptyDescription = "Try adjusting your search query";
      } else {
        emptyMessage = "No protocols yet";
        emptyDescription = "";
      }
      
      container.innerHTML = `
        <div class="protocol-row empty-state">
          <div class="protocol-cell protocol-id-cell">—</div>
          <div class="protocol-cell protocol-name-cell">
            <div class="protocol-content">
              <span class="protocol-icon"><i class="fas fa-bullseye"></i></span>
              <div class="protocol-name-full">
                <div class="protocol-name-main">${emptyMessage}</div>
                ${emptyDescription ? `<div class="protocol-name-desc" style="font-style: normal;">${emptyDescription}</div>` : ''}
              </div>
            </div>
          </div>
          <div class="protocol-cell protocol-targets-cell">${hasSearchQuery ? '—' : 'Start by adding your first protocol'}</div>
          <div class="protocol-cell protocol-weight-cell">—</div>
          <div class="protocol-cell protocol-actions-cell">
            <span class="empty-hint">${hasSearchQuery ? '—' : 'Click + to add'}</span>
          </div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = pageProtocols.map((protocol, index) => {
      const globalIndex = startIndex + index + 1;
      const icon = this.renderIcon(protocol.icon);
      
      // Get target skill names
      const targetNames = protocol.targets.map(targetId => {
        const skill = skills.find(s => s.id === targetId);
        return skill ? skill.name.split('. ')[0] : `Unknown (${targetId})`;
      });
      const targetTags = targetNames.map(name => 
        `<span class="protocol-target-tag">${name}</span>`
      ).join('');
      
      const hasHover = protocol.hover && protocol.hover.trim();
      
      return `
        <div class="protocol-row" draggable="true" data-protocol-id="${protocol.id}">
          <div class="protocol-cell protocol-id-cell">${globalIndex}</div>
          <div class="protocol-cell protocol-name-cell ${hasHover ? 'has-hover' : ''}" ${hasHover ? `data-hover="${protocol.hover}"` : ''}>
            <div class="protocol-content">
              <span class="protocol-icon">${icon}</span>
              <div class="protocol-name-full">
                <div class="protocol-name-main">${protocol.name.split('. ')[0]}</div>
                ${protocol.name.includes('. ') ? `<div class="protocol-name-desc">${protocol.name.split('. ').slice(1).join('. ')}</div>` : ''}
              </div>
            </div>
            <button class="protocol-settings-btn" onclick="Modals.editProtocol(${protocol.id})" title="Edit protocol">
              <i class="fas fa-cog"></i>
            </button>
            <button class="protocol-history-btn" onclick="App.viewProtocolHistory(${protocol.id})" title="View protocol history">
              <i class="fas fa-history"></i>
            </button>
          </div>
          <div class="protocol-cell protocol-targets-cell">${targetTags}</div>
          <div class="protocol-cell protocol-weight-cell">
            <span class="protocol-weight">${protocol.weight}</span>
          </div>
          <div class="protocol-cell protocol-actions-cell">
            <div class="protocol-action-buttons">
              <button class="protocol-level-btn level-up" onclick="App.checkin(${protocol.id}, '+')">
                <i class="fas fa-arrow-up"></i>
                <span class="level-text">level up</span>
              </button>
              <button class="protocol-level-btn level-down" onclick="App.checkin(${protocol.id}, '-')">
                <i class="fas fa-arrow-down"></i>
                <span class="level-text">level down</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // Skills
  renderSkills() {
    App.filteredSkills = window.Storage.getSkillsInOrder();
    
    // Apply current search filter if any
    const searchInput = document.getElementById('skill-search');
    if (searchInput && searchInput.value.trim()) {
      // Apply filter locally without calling App.filterSkills to avoid recursion
      const allSkills = window.Storage.getSkillsInOrder();
      const searchTerm = searchInput.value.toLowerCase();
      App.filteredSkills = allSkills.filter(skill => 
        skill.name.toLowerCase().includes(searchTerm) ||
        skill.hover.toLowerCase().includes(searchTerm)
      );
    }
    
    const skills = App.filteredSkills;
    const startIndex = (App.skillsPage - 1) * App.skillsPerPage;
    const endIndex = startIndex + App.skillsPerPage;
    const pageSkills = skills.slice(startIndex, endIndex);
    
    const container = document.querySelector('.skills-body');
    if (!container) return;
    
    if (pageSkills.length === 0) {
      // Check if search is applied to show appropriate message
      const hasSearchQuery = searchInput && searchInput.value.trim();
      
      let emptyMessage, emptyDescription;
      
      if (hasSearchQuery) {
        emptyMessage = "No skills found";
        emptyDescription = "Try adjusting your search query";
      } else {
        emptyMessage = "No skills yet";
        emptyDescription = "";
      }
      
      container.innerHTML = `
        <div class="skill-row empty-state">
          <div class="skill-cell skill-id-cell">—</div>
          <div class="skill-cell skill-name-cell">
            <div class="skill-content">
              <span class="skill-icon"><i class="fas fa-chart-bar"></i></span>
              <div class="skill-name-full">
                <div class="skill-name-main">${emptyMessage}</div>
                ${emptyDescription ? `<div class="skill-name-desc" style="font-style: normal;">${emptyDescription}</div>` : ''}
              </div>
            </div>
          </div>
          <div class="skill-cell skill-initial-cell">—</div>
          <div class="skill-cell skill-current-cell">—</div>
          <div class="skill-cell skill-progress-cell">
            <span class="empty-hint">${hasSearchQuery ? '—' : 'Click + to add'}</span>
          </div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = pageSkills.map((skill, index) => {
      const globalIndex = startIndex + index + 1;
      const icon = this.renderIcon(skill.icon);
      const current = window.Storage.calculateCurrentScore(skill.id);
      const initial = skill.initialScore;
      const progress = current - initial;
      const progressClass = progress > 0 ? 'positive' : progress < 0 ? 'negative' : 'neutral';
      const color = this.getSkillColor(current);
      
      const hasHover = skill.hover && skill.hover.trim();
      
      return `
        <div class="skill-row" draggable="true" data-skill-id="${skill.id}">
          <div class="skill-cell skill-id-cell">${globalIndex}</div>
          <div class="skill-cell skill-name-cell ${hasHover ? 'has-hover' : ''}" ${hasHover ? `data-hover="${skill.hover}"` : ''}>
            <div class="skill-content">
              <span class="skill-icon">${icon}</span>
              <div class="skill-name-full">
                <div class="skill-name-main">${skill.name.split('. ')[0]}</div>
                ${skill.name.includes('. ') ? `<div class="skill-name-desc">${skill.name.split('. ').slice(1).join('. ')}</div>` : ''}
              </div>
            </div>
            <button class="skill-settings-btn" onclick="Modals.editSkill(${skill.id})" title="Edit skill">
              <i class="fas fa-cog"></i>
            </button>
            <button class="skill-history-btn" onclick="App.viewSkillHistory(${skill.id})" title="View skill history">
              <i class="fas fa-history"></i>
            </button>
          </div>
          <div class="skill-cell skill-initial-cell">${initial.toFixed(2)}</div>
          <div class="skill-cell skill-current-cell">
            <span style="color: ${color}; font-weight: 600;">${current.toFixed(2)}</span>
            ${(() => {
              const diff = current - initial;
              if (diff > 0.01) {
                return '<span class="skill-change-arrow increase"><i class="fas fa-arrow-trend-up"></i></span>';
              } else if (diff < -0.01) {
                return '<span class="skill-change-arrow decrease"><i class="fas fa-arrow-trend-down"></i></span>';
              }
              return '';
            })()}
          </div>
          <div class="skill-cell skill-progress-cell">
            <div class="skill-progress-bar">
              <div class="skill-progress-fill" style="width: ${Math.max(0, Math.min(100, (current / 10) * 100))}%; background-color: ${color};"></div>
            </div>
            <span class="skill-progress-percent">${Math.round((current / 10) * 100)}%</span>
          </div>
        </div>
      `;
    }).join('');
  },

  // History
  renderHistory() {
    // Only initialize filtered history on first load (not when filter results are empty)
    if (!App.historyInitialized) {
      App.filteredHistory = window.Storage.getCheckins().reverse();
      App.historyInitialized = true;
    }
    
    const container = document.querySelector('.history-body');
    const skills = window.Storage.getSkills();
    
    if (App.filteredHistory.length === 0) {
      // Check if filters are applied to show appropriate message
      const hasActiveFilters = App.historyFilters.time !== 'all' || 
                               App.historyFilters.type !== 'all' || 
                               App.historyFilters.protocol !== 'all' ||
                               App.historyFilters.state !== 'all' ||
                               App.historyFilters.effect !== 'all' ||
                               App.historyFilters.skill !== 'all';
      
      const searchInput = document.getElementById('history-search');
      const hasSearchQuery = searchInput && searchInput.value.trim();
      
      let emptyMessage, emptyDescription;
      
      if (hasActiveFilters || hasSearchQuery) {
        emptyMessage = "No results found";
        emptyDescription = "Try adjusting your filters or search query";
      } else {
        emptyMessage = "No history yet";
        emptyDescription = "Start with your first protocol check-in!";
      }
      
      container.innerHTML = `
        <div class="history-row empty-state">
          <div class="history-cell history-date-cell">
            <div style="display: flex; flex-direction: column; gap: 0.125rem;">
              <div>—</div>
              <div style="color: var(--sub-color); font-size: 0.7rem;">—</div>
            </div>
          </div>
          <div class="history-cell history-type-cell"><i class="fas fa-clipboard-list"></i></div>
          <div class="history-cell history-action-cell">
            <div class="history-action-full">
              <div class="history-action-main">${emptyMessage}</div>
              <div class="history-action-desc">${emptyDescription}</div>
            </div>
          </div>
          <div class="history-cell history-changes-cell">
            <span class="history-empty-text">—</span>
          </div>
          <div class="history-cell history-actions-cell">—</div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = App.filteredHistory.map(checkin => {
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
                <div class="history-action-main">${this.renderIcon(checkin.itemIcon)} ${checkin.itemName}</div>
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
                <div class="history-action-main">${this.renderIcon(checkin.protocolIcon)} ${checkin.protocolName}</div>
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
          return `<span class="history-change-tag ${className}">${this.renderIcon(skill.icon)} ${sign}${change.toFixed(2)}</span>`;
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
                <div class="history-action-main">${this.renderIcon(checkin.protocolIcon)} ${checkin.protocolName}</div>
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
    const checkins = window.Storage.getCheckins();
    const skills = window.Storage.getSkills();
    const states = window.Storage.getStates();
    
    // Get today's date for filtering
    const today = new Date();
    const todayStr = today.toDateString();
    
    // Get current month and year
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Filter today's checkins
    const todayCheckins = checkins.filter(checkin => {
      const checkinDate = new Date(checkin.timestamp);
      const checkinDateStr = checkinDate.toDateString();
      return checkinDateStr === todayStr && checkin.type === 'protocol';
    });
    
    // Calculate total score changes for today (real sum, not absolute)
    let todayTotalChange = 0;
    todayCheckins.forEach(checkin => {
      // For XP calculation, use protocol weight directly, not sum of skill changes
      const protocol = window.Storage.getProtocolById(checkin.protocolId);
      if (protocol) {
        // Determine action from the changes (+ if positive, - if negative)
        const firstChange = Object.values(checkin.changes)[0];
        const action = firstChange >= 0 ? '+' : '-';
        const xpChange = action === '+' ? protocol.weight : -protocol.weight;
        todayTotalChange += xpChange;
      }
    });
    
    // Calculate current level - priority: states average, then skills average
    let currentLevel = 0;
    
    // 🔧 ИСПРАВЛЕНИЕ: Правильная логика расчета уровня персонажа
    // Если есть хотя бы один state - считаем среднее по states
    // Если нет ни одного state - считаем среднее по skills
    if (states.length > 0) {
      // Use states average (приоритет states если они есть)
      let totalStateScore = 0;
      let validStatesCount = 0;
      
      states.forEach(state => {
        const stateScore = window.Storage.calculateStateScore(state.id);
        if (!isNaN(stateScore)) {
          totalStateScore += stateScore;
          validStatesCount++;
        }
      });
      
      currentLevel = validStatesCount > 0 ? totalStateScore / validStatesCount : 0;
      console.log('📊 Character level calculated from STATES:', {
        statesCount: states.length,
        validStatesCount,
        totalStateScore,
        averageLevel: currentLevel
      });
    } else if (skills.length > 0) {
      // Fallback to skills average (если нет states)
      let totalSkillScore = 0;
      let validSkillsCount = 0;
      
      skills.forEach(skill => {
        const skillScore = window.Storage.calculateCurrentScore(skill.id);
        if (!isNaN(skillScore)) {
          totalSkillScore += skillScore;
          validSkillsCount++;
        }
      });
      
      currentLevel = validSkillsCount > 0 ? totalSkillScore / validSkillsCount : 0;
      console.log('📊 Character level calculated from SKILLS:', {
        skillsCount: skills.length,
        validSkillsCount,
        totalSkillScore,
        averageLevel: currentLevel
      });
    } else {
      console.log('📊 Character level: No states or skills found, defaulting to 0');
      currentLevel = 0;
    }
    
    // Update level progress bar with color
    const levelProgressFill = document.getElementById('level-progress-fill');
    const levelPercentage = document.getElementById('level-percentage');
    const progressDigit = document.getElementById('progress-digit');
    if (levelProgressFill && levelPercentage) {
      const percent = Math.min(100, (currentLevel / 10) * 100);
      const color = this.getSkillColor(currentLevel);
      
      levelProgressFill.style.width = percent + '%';
      levelProgressFill.style.backgroundColor = color;
      levelPercentage.textContent = Math.round(percent) + '%';
      
      // Update progress digit (first digit of percentage)
      if (progressDigit) {
        const roundedPercent = Math.round(percent);
        const firstDigit = roundedPercent.toString().charAt(0);
        progressDigit.textContent = firstDigit;
      }
    }
    
    // Update today's checkins
    const checkinsToday = document.getElementById('checkins-today');
    const checkinsTodayDetail = document.getElementById('checkins-today-detail');
    if (checkinsToday && checkinsTodayDetail) {
      checkinsToday.textContent = todayCheckins.length;
      const sign = todayTotalChange >= 0 ? '+' : '';
      checkinsTodayDetail.textContent = `(${sign}${todayTotalChange.toFixed(2)} xp)`;
    }
    
    // Filter this month's checkins
    const monthCheckins = checkins.filter(checkin => {
      const checkinDate = new Date(checkin.timestamp);
      return checkinDate.getMonth() === currentMonth && 
             checkinDate.getFullYear() === currentYear && 
             checkin.type === 'protocol';
    });
    
    // Calculate total score changes for this month
    let monthTotalChange = 0;
    monthCheckins.forEach(checkin => {
      const protocol = window.Storage.getProtocolById(checkin.protocolId);
      if (protocol && checkin.changes && Object.keys(checkin.changes).length > 0) {
        // Determine action from the changes (+ if positive, - if negative)
        const firstChange = Object.values(checkin.changes)[0];
        const action = firstChange >= 0 ? '+' : '-';
        const xpChange = action === '+' ? protocol.weight : -protocol.weight;
        monthTotalChange += xpChange;
      }
    });
    
    // Update month's checkins
    const checkinsMonth = document.getElementById('checkins-month');
    const checkinsMonthDetail = document.getElementById('checkins-month-detail');
    if (checkinsMonth && checkinsMonthDetail) {
      checkinsMonth.textContent = monthCheckins.length;
      const sign = monthTotalChange >= 0 ? '+' : '';
      checkinsMonthDetail.textContent = `(${sign}${monthTotalChange.toFixed(2)} xp)`;
    }
  },

  // Setup question icon hover functionality
  setupStateQuestionIcons() {
    const questionIcons = document.querySelectorAll('.state-question-icon');
    
    questionIcons.forEach(icon => {
      const tooltip = icon.getAttribute('data-tooltip');
      if (!tooltip) return;
      
      // Remove any existing listeners to prevent duplicates
      icon.removeEventListener('mouseenter', icon._boundShowTooltip);
      icon.removeEventListener('mouseleave', icon._boundHideTooltip);
      
      // Bind the functions to maintain proper context
      icon._boundShowTooltip = (e) => this.showTooltip(e, tooltip);
      icon._boundHideTooltip = () => this.hideTooltip();
      
      // Add new event listeners
      icon.addEventListener('mouseenter', icon._boundShowTooltip);
      icon.addEventListener('mouseleave', icon._boundHideTooltip);
      
      // Also hide tooltip when clicking elsewhere
      icon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hideTooltip();
      });
    });
    
    // Add global click listener to hide tooltips
    document.addEventListener('click', () => this.hideTooltip(), { once: true });
  },

  showTooltip(event, text) {
    // Remove existing tooltip
    this.hideTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'state-tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
      position: absolute;
      background-color: #1e1e1e;
      color: #ffffff;
      padding: 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      max-width: 300px;
      line-height: 1.4;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      z-index: 2000;
      pointer-events: none;
      word-wrap: break-word;
      font-family: 'Roboto Mono', monospace;
      white-space: pre-wrap;
    `;
    
    document.body.appendChild(tooltip);
    
    // Position tooltip
    const rect = event.target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Default position: left of the icon
    let left = rect.left - tooltipRect.width - 10;
    let top = rect.top + (rect.height - tooltipRect.height) / 2;
    
    // Adjust if going off screen
    if (left < 10) {
      left = rect.right + 10;
    }
    if (top < 10) {
      top = 10;
    }
    if (top + tooltipRect.height > window.innerHeight - 10) {
      top = window.innerHeight - tooltipRect.height - 10;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    
    this.currentTooltip = tooltip;
    
    // Auto-hide after 5 seconds
    this.tooltipTimeout = setTimeout(() => {
      this.hideTooltip();
    }, 5000);
  },

  hideTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
    }
    
    // Clear any existing timeout
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = null;
    }
    
    // Remove any orphaned tooltips
    const orphanedTooltips = document.querySelectorAll('.state-tooltip');
    orphanedTooltips.forEach(tooltip => tooltip.remove());
  },
  
  clearQuestionIconTimeouts() {
    // No longer needed, but keeping for compatibility
  }
};

// 🔧 ИСПРАВЛЕНИЕ: Делаем UI объект глобально доступным
window.UI = UI;