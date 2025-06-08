// ===== ui.js - UI Rendering =====

// 🔧 ДЕБАГ ПЕРЕКЛЮЧАТЕЛЬ: Установите в false чтобы скрыть дебаг логи
window.DEBUG_UI = false;

const UI = {
  // Get innerface level color class
  getScoreClass(score) {
    if (score < 2) return 'score-1';
    if (score < 4) return 'score-2';
    if (score < 6) return 'score-3';
    if (score < 8) return 'score-4';
    return 'score-5';
  },
  
  // Get innerface level color
  getInnerfaceColor(score) {
    if (score < 2) return '#ca4754';
    if (score < 4) return '#e6934a';
    if (score < 6) return '#e2b714';
    if (score < 8) return '#98c379';
    return '#7fb3d3';
  },

  // Get detailed progress color with smoother transitions
  getDetailedProgressColor(score) {
    // Clamp score to 0-10 range
    const clampedScore = Math.max(0, Math.min(10, score));
    
    // Ultra-detailed color gradations with 0.5 step intervals (40 total gradations)
    if (clampedScore < 0.5) return '#b73e4a';      // Dark red
    if (clampedScore < 1) return '#c04550';        // Deep red
    if (clampedScore < 1.5) return '#ca4754';      // Red (original)
    if (clampedScore < 2) return '#d55460';        // Light red
    if (clampedScore < 2.5) return '#df6248';      // Red-orange
    if (clampedScore < 3) return '#e6934a';        // Orange (original)
    if (clampedScore < 3.5) return '#e8a055';      // Light orange
    if (clampedScore < 4) return '#e9ad60';        // Orange-yellow
    if (clampedScore < 4.5) return '#e9ba6b';      // Yellow-orange
    if (clampedScore < 5) return '#e2b714';        // Yellow (original)
    if (clampedScore < 5.5) return '#dfc428';      // Light yellow
    if (clampedScore < 6) return '#dcd13c';        // Yellow-green transition
    if (clampedScore < 6.5) return '#d6d850';      // Yellow-green
    if (clampedScore < 7) return '#c8d968';        // Light green transition
    if (clampedScore < 7.5) return '#b8d370';      // Light green
    if (clampedScore < 8) return '#a8cd74';        // Green transition
    if (clampedScore < 8.5) return '#98c379';      // Green (original)
    if (clampedScore < 9) return '#8cc47e';        // Light green-blue
    if (clampedScore < 9.5) return '#80c583';      // Green-blue transition
    return '#7fb3d3';                              // Blue (original)
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
      '🧖‍♂️': 'fas fa-bath',
      '🌀': 'fas fa-brain',
      '📦': 'fas fa-box',
      '🎧': 'fas fa-headphones',
      '🔁': 'fas fa-arrows-rotate',
      '❤️': 'fas fa-heart',
      '✋': 'fas fa-hand',
      '📖': 'fas fa-book-open',
      '🥗': 'fas fa-utensils',
      '🎯': 'fas fa-bullseye',
      '🤖': 'fas fa-robot',
      '🧾': 'fas fa-file-contract',
      '🎛': 'fas fa-sliders',
      '🌐': 'fas fa-globe',
      '🛏': 'fas fa-bed',
      '💨': 'fas fa-leaf',
      '🥃': 'fas fa-glass-whiskey',
      '📞': 'fas fa-phone',
      '🍖': 'fas fa-drumstick-bite',
      '🎭': 'fas fa-masks-theater',
      '😶': 'fas fa-pause',
      '🧘🏻': 'fas fa-yin-yang',
      '🔋': 'fas fa-battery-full',
      '⚡': 'fas fa-bolt',
      '🏃🏻‍♂️': 'fas fa-person-running',
      '📊': 'fas fa-chart-line',
      '🚄': 'fas fa-gauge-high',
      '👨‍👩‍👧‍👦': 'fas fa-house-user',
      '🧩': 'fas fa-puzzle-piece',
      '🏗': 'fas fa-users-gear'
    };
    
    return emojiMap[emoji] || emoji;
  },

  // Render icon properly - either as FontAwesome or emoji
  renderIcon(emoji, customColor = null) {
    const iconClass = this.emojiToFontAwesome(emoji);
    
    // 🔧 ДЕБАГ: Логируем информацию о цвете только если дебаг включен
    if (window.DEBUG_UI && customColor) {
      console.log(`🎨 RENDER ICON DEBUG:`, {
        emoji,
        iconClass,
        customColor,
        isFontAwesome: iconClass.startsWith('fas '),
        finalColor: customColor || 'var(--text-color)'
      });
    }
    
    // If it's a FontAwesome class, wrap in <i> tag
    if (iconClass.startsWith('fas ')) {
      // Default to text color from CSS variables, use custom color if provided
      const color = customColor || 'var(--text-color)';
      const result = `<i class="${iconClass}" style="color: ${color};"></i>`;
      
      // 🔧 ДЕБАГ: Логируем финальный результат для FontAwesome иконок только если дебаг включен
      if (window.DEBUG_UI && customColor) {
        console.log(`🎨 FONTAWESOME ICON RESULT:`, {
          emoji,
          iconClass,
          customColor,
          finalColor: color,
          html: result
        });
      }
      
      return result;
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
          const yesterday = new Date();
          yesterday.setHours(0, 0, 0, 0); // Начало сегодняшнего дня (00:00:00)
          const yesterdayScore = window.Storage.calculateStateScoreAtDate(state.id, yesterday);
          const scoreClass = this.getInnerfaceColor(score).replace('level-', '');
          const scoreBasedColor = this.getDetailedProgressColor(score); // Детализированный цвет для прогресса
          
          // 🔧 НОВОЕ: Определяем цвет state на основе зависимостей (только для иконки и свечения)
          const dependencyColor = window.Storage.getStateColor(state.id);
          const iconColor = dependencyColor || this.getInnerfaceColor(score); // Цвет для иконки и свечения
          const scoreTextColor = this.getDetailedProgressColor(score); // Цвет для названия и числового значения
          
          const percentage = Math.min((score / 10) * 100, 100);
          
          // Calculate change from yesterday
          const change = score - yesterdayScore;
          let changeIcon = '';
          let changeClass = '';
          if (change > 0) {
            changeIcon = '<i class="fas fa-arrow-up"></i>';
            changeClass = 'increase';
          } else if (change < 0) {
            changeIcon = '<i class="fas fa-arrow-down"></i>';
            changeClass = 'decrease';
          }
          
          // Get number of dependencies (innerfaces or states)
          const innerfaceDeps = state.innerfaceIds || [];
          const stateDeps = state.stateIds || [];
          
          // Create dependency display text
          let dependencyText = '';
          if (innerfaceDeps.length > 0 && stateDeps.length > 0) {
            dependencyText = `Innerfaces: ${innerfaceDeps.length} States: ${stateDeps.length}`;
          } else if (innerfaceDeps.length > 0) {
            dependencyText = `Innerfaces: ${innerfaceDeps.length}`;
          } else if (stateDeps.length > 0) {
            dependencyText = `States: ${stateDeps.length}`;
          } else {
            dependencyText = 'No dependencies';
          }
          
          // 🔧 НОВОЕ: Поддержка отдельного subtext поля
          let displayName, displaySubtext;
          
          // Проверяем есть ли отдельное поле subtext (новый формат)
          if (state.subtext !== undefined) {
            displayName = state.name;
            displaySubtext = state.subtext;
          } else {
            // Старый формат: парсим из name
            const nameParts = state.name.split('. ');
            displayName = nameParts[0];
            displaySubtext = nameParts.length > 1 ? nameParts.slice(1).join('. ') : '';
          }
          
          return `
            <div class="state-card ${scoreClass}" draggable="true" data-state-id="${state.id}" data-glow-color="${iconColor}">
              <div class="state-header">
                <div class="state-info-container">
                  <div class="state-icon" style="color: ${iconColor};">
                    ${this.renderIcon(state.icon, iconColor)}
                  </div>
                  <div class="state-name-container">
                    <div class="state-name" style="color: ${iconColor};">${displayName}</div>
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
              
              <div class="state-score" style="color: ${scoreTextColor};">
                ${score.toFixed(2)}
                ${changeIcon ? `<span class="state-change-arrow ${changeClass}">${changeIcon}</span>` : ''}
                <div class="state-score-yesterday">
                  yesterday: ${yesterdayScore.toFixed(2)}
                </div>
              </div>
              
              <div class="state-bar">
                <div class="state-bar-fill" style="width: ${percentage}%; background-color: ${scoreBasedColor};"></div>
              </div>
              
              <div class="state-details">
                <span>${dependencyText}</span>
              </div>
            </div>
          `;
        }).join('');
        
        // Setup question icon functionality after rendering
        setTimeout(() => this.setupStateQuestionIcons(), 0);
        // Setup drag and drop for states
        setTimeout(() => DragDrop.setupStates(), 0);
        // Setup tooltips for state names that are truncated
        setTimeout(() => this.setupStateNameTooltips(), 0);
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
              <span>Innerfaces: 0</span>
              <span>0%</span>
            </div>
          </div>
        `;
      }
    }
    
    this.renderQuickProtocols();
    this.updateUserStats();
    
    // 🌟 НОВОЕ: Настройка пульсирующих анимаций для карточек states
    this.setupStateCardAnimations();
  },

  renderQuickProtocols() {
    const protocols = window.Storage.getQuickActionsInOrder();
    const container = document.querySelector('.quick-protocols');
    
    if (!container) return;
    
    if (protocols.length === 0) {
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
    
    container.innerHTML = protocols.map(protocol => {
      const icon = this.renderIcon(protocol.icon, protocol.color);
      const hasHover = protocol.hover && protocol.hover.trim();
      
      return `
        <div class="quick-protocol" draggable="true" data-protocol-id="${protocol.id}" ${hasHover ? `data-hover="${protocol.hover}"` : ''}>
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
          <div class="quick-protocol-delete" onclick="event.stopPropagation(); window.Storage.removeFromQuickActions(${protocol.id}); UI.renderQuickProtocols();" title="Remove from quick actions">
            <i class="fas fa-times"></i>
          </div>
        </div>
      `;
    }).join('');
    
    // Setup drag & drop
    DragDrop.setupQuickActions();
    
    // Setup tooltips for quick actions with hover information
    this.setupQuickActionsTooltips();
  },

  // Setup tooltips for quick actions with hover information
  setupQuickActionsTooltips() {
    // Handle truncated protocol names
    const quickProtocolNames = document.querySelectorAll('.quick-protocol-name');
    
    quickProtocolNames.forEach((nameElement, index) => {
      const text = nameElement.textContent.trim();
      const scrollWidth = nameElement.scrollWidth;
      const clientWidth = nameElement.clientWidth;
      const isOverflowing = scrollWidth > clientWidth;
      
      // Get the parent quick-protocol element to check if it has data-hover
      const parentQuickProtocol = nameElement.closest('.quick-protocol');
      const hasHoverInfo = parentQuickProtocol && parentQuickProtocol.hasAttribute('data-hover');
      
      // Only show JavaScript tooltip if text is truncated AND there's no hover info (to avoid conflicts with CSS tooltips)
      if (isOverflowing && !hasHoverInfo) {
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
        // Remove tooltip listeners if text fits or if there's hover info (CSS tooltip will handle it)
        nameElement.removeEventListener('mouseenter', nameElement._boundShowTooltip);
        nameElement.removeEventListener('mouseleave', nameElement._boundHideTooltip);
      }
    });
  },

  // Protocols
  renderProtocols() {
    App.filteredProtocols = window.Storage.getProtocolsInOrder();
    
    // Get all protocols and innerfaces for display
    const innerfaces = window.Storage.getInnerfaces();
    
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
        
        // Search in target innerfaces
        const targetNames = protocol.targets.map(targetId => {
          const innerface = innerfaces.find(s => s.id === targetId);
          return innerface ? innerface.name.toLowerCase() : targetId;
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
      
      // 🔧 ДЕБАГ: Логируем информацию о цвете протокола только если дебаг включен
      if (window.DEBUG_UI) {
        console.log(`🎨 PROTOCOL RENDER DEBUG for ID ${protocol.id}:`, {
          name: protocol.name.split('. ')[0],
          icon: protocol.icon,
          color: protocol.color,
          hasColor: !!protocol.color,
          colorType: typeof protocol.color
        });
      }
      
      const icon = this.renderIcon(protocol.icon, protocol.color);
      
      // Get target innerface names
      const targetNames = protocol.targets.map(targetId => {
        const innerface = innerfaces.find(s => s.id === targetId);
        return innerface ? innerface.name.split('. ')[0] : `Unknown (${targetId})`;
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

  // Innerfaces
  renderInnerfaces() {
    App.filteredInnerfaces = window.Storage.getInnerfacesInOrder();
    
    // Apply current search filter if any
    const searchInput = document.getElementById('innerface-search');
    if (searchInput && searchInput.value.trim()) {
      // Apply filter locally without calling App.filterInnerfaces to avoid recursion
      const allInnerfaces = window.Storage.getInnerfacesInOrder();
      const searchTerm = searchInput.value.toLowerCase();
      App.filteredInnerfaces = allInnerfaces.filter(innerface => 
        innerface.name.toLowerCase().includes(searchTerm) ||
        innerface.hover.toLowerCase().includes(searchTerm)
      );
    }
    
    const innerfaces = App.filteredInnerfaces;
    const startIndex = (App.innerfacesPage - 1) * App.innerfacesPerPage;
    const endIndex = startIndex + App.innerfacesPerPage;
    const pageInnerfaces = innerfaces.slice(startIndex, endIndex);
    
    const container = document.querySelector('.innerfaces-body');
    if (!container) return;
    
    if (pageInnerfaces.length === 0) {
      // Check if search is applied to show appropriate message
      const hasSearchQuery = searchInput && searchInput.value.trim();
      
      let emptyMessage, emptyDescription;
      
      if (hasSearchQuery) {
        emptyMessage = "No innerfaces found";
        emptyDescription = "Try adjusting your search query";
      } else {
        emptyMessage = "No innerfaces yet";
        emptyDescription = "";
      }
      
      container.innerHTML = `
        <div class="innerface-row empty-state">
          <div class="innerface-cell innerface-id-cell">—</div>
          <div class="innerface-cell innerface-name-cell">
            <div class="innerface-content">
              <span class="innerface-icon"><i class="fas fa-chart-bar"></i></span>
              <div class="innerface-name-full">
                <div class="innerface-name-main">${emptyMessage}</div>
                ${emptyDescription ? `<div class="innerface-name-desc" style="font-style: normal;">${emptyDescription}</div>` : ''}
              </div>
            </div>
          </div>
          <div class="innerface-cell innerface-initial-cell">—</div>
          <div class="innerface-cell innerface-current-cell">—</div>
          <div class="innerface-cell innerface-progress-cell">
            <span class="empty-hint">${hasSearchQuery ? '—' : 'Click + to add'}</span>
          </div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = pageInnerfaces.map((innerface, index) => {
      const globalIndex = startIndex + index + 1;
      const icon = this.renderIcon(innerface.icon, innerface.color);
      const current = window.Storage.calculateCurrentScore(innerface.id);
      const initial = innerface.initialScore;
      const progress = current - initial;
      const progressClass = progress > 0 ? 'positive' : progress < 0 ? 'negative' : 'neutral';
      const textColor = this.getDetailedProgressColor(current); // Детализированный цвет для текста
      const progressColor = this.getDetailedProgressColor(current); // Детализированный цвет для прогресса
      
      const hasHover = innerface.hover && innerface.hover.trim();
      
      return `
        <div class="innerface-row" draggable="true" data-innerface-id="${innerface.id}">
          <div class="innerface-cell innerface-id-cell">${globalIndex}</div>
          <div class="innerface-cell innerface-name-cell ${hasHover ? 'has-hover' : ''}" ${hasHover ? `data-hover="${innerface.hover}"` : ''}>
            <div class="innerface-content">
              <span class="innerface-icon">${icon}</span>
              <div class="innerface-name-full">
                <div class="innerface-name-main">${innerface.name.split('. ')[0]}</div>
                ${innerface.name.includes('. ') ? `<div class="innerface-name-desc">${innerface.name.split('. ').slice(1).join('. ')}</div>` : ''}
              </div>
            </div>
            <button class="innerface-settings-btn" onclick="Modals.editInnerface(${innerface.id})" title="Edit innerface">
              <i class="fas fa-cog"></i>
            </button>
            <button class="innerface-history-btn" onclick="App.viewInnerfaceHistory(${innerface.id})" title="View innerface history">
              <i class="fas fa-history"></i>
            </button>
          </div>
          <div class="innerface-cell innerface-initial-cell">${initial.toFixed(2)}</div>
          <div class="innerface-cell innerface-current-cell">
            <span style="color: ${textColor}; font-weight: 600;">${current.toFixed(2)}</span>
            ${(() => {
              const diff = current - initial;
              if (diff > 0.01) {
                return '<span class="innerface-change-arrow increase"><i class="fas fa-arrow-trend-up"></i></span>';
              } else if (diff < -0.01) {
                return '<span class="innerface-change-arrow decrease"><i class="fas fa-arrow-trend-down"></i></span>';
              }
              return '';
            })()}
          </div>
          <div class="innerface-cell innerface-progress-cell">
            <div class="innerface-progress-bar">
              <div class="innerface-progress-fill" style="width: ${Math.max(0, Math.min(100, (current / 10) * 100))}%; background-color: ${progressColor};"></div>
            </div>
            <span class="innerface-progress-percent">${Math.round((current / 10) * 100)}%</span>
          </div>
        </div>
      `;
    }).join('');
  },

  // History
  renderHistory() {
    // 🔧 FIX: Don't automatically reload from storage when filteredHistory is empty
    // This prevents deleted checkins from being restored when UI refreshes
    // Instead, history should be properly managed through App.applyHistoryFilters()
    
    const container = document.querySelector('.history-body');
    const innerfaces = window.Storage.getInnerfaces();
    const protocols = window.Storage.getProtocols();
    
    if (App.filteredHistory.length === 0) {
      // Check if filters are applied to show appropriate message
      const hasActiveFilters = App.historyFilters.time !== 'all' || 
                               App.historyFilters.type !== 'all' || 
                               App.historyFilters.protocol !== 'all' ||
                               App.historyFilters.state !== 'all' ||
                               App.historyFilters.effect !== 'all' ||
                               App.historyFilters.innerface !== 'all';
      
      const searchInput = document.getElementById('history-search');
      const hasSearchQuery = searchInput && searchInput.value.trim();
      
      let emptyMessage, emptyDescription;
      
      if (hasActiveFilters || hasSearchQuery) {
        emptyMessage = "No results found";
        emptyDescription = "Try adjusting your filters or search query";
      } else if (!App.historyInitialized) {
        // First time loading - initialize properly through applyHistoryFilters
        console.log('🔄 FIRST TIME HISTORY LOAD: Initializing through applyHistoryFilters');
        App.historyInitialized = true;
        App.applyHistoryFilters();
        return; // Let applyHistoryFilters handle the rendering
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
        const actionText = checkin.subType === 'protocol' ? 'Reordered protocol' : 'Reordered innerface';
        const actionDesc = `Position: ${checkin.oldPosition} → ${checkin.newPosition}`;
        
        // Get item color
        let itemColor = null;
        if (checkin.subType === 'protocol') {
          const protocol = protocols.find(p => p.id == checkin.itemId);
          itemColor = protocol?.color;
        } else if (checkin.subType === 'innerface') {
          const innerface = innerfaces.find(i => i.id == checkin.itemId);
          itemColor = innerface?.color;
        }
        
        const coloredIcon = this.renderIcon(checkin.itemIcon, itemColor);
        const titleStyle = itemColor ? `style="color: ${itemColor};"` : '';
        
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
                <div class="history-action-main" ${titleStyle}>${coloredIcon} ${checkin.itemName}</div>
                <div class="history-action-desc">${actionDesc}</div>
              </div>
            </div>
            <div class="history-cell history-changes-cell">
              <span class="history-change-tag">Position change</span>
            </div>
            <div class="history-cell history-actions-cell">
              <button class="history-delete-btn" data-checkin-id="${checkin.id}" title="Undo">
                <i class="fas fa-undo"></i>
              </button>
            </div>
          </div>
        `;
      } else if (checkin.type === 'quick_action') {
        // Quick Action operation
        const actionDesc = checkin.subType === 'added' ? 'Added to Quick Actions' : 'Removed from Quick Actions';
        
        // Get protocol color
        const protocol = protocols.find(p => p.id == checkin.protocolId);
        const protocolColor = protocol?.color;
        const coloredIcon = this.renderIcon(checkin.protocolIcon, protocolColor);
        const titleStyle = protocolColor ? `style="color: ${protocolColor};"` : '';
        
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
                <div class="history-action-main" ${titleStyle}>${coloredIcon} ${checkin.protocolName}</div>
                <div class="history-action-desc">${actionDesc}</div>
              </div>
            </div>
            <div class="history-cell history-changes-cell">
              <span class="history-change-tag">Quick Actions updated</span>
            </div>
            <div class="history-cell history-actions-cell">
              <button class="history-delete-btn" data-checkin-id="${checkin.id}" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      } else {
        // Regular protocol check-in
        const protocol = protocols.find(p => p.id == checkin.protocolId);
        const protocolColor = protocol?.color;
        const coloredProtocolIcon = this.renderIcon(checkin.protocolIcon, protocolColor);
        const protocolTitleStyle = protocolColor ? `style="color: ${protocolColor};"` : '';
        
        const changes = Object.entries(checkin.changes).map(([innerfaceId, change]) => {
          const innerface = innerfaces.find(s => s.id == innerfaceId);
          if (!innerface) return '';
          
          const sign = change > 0 ? '+' : '';
          const className = change > 0 ? 'positive' : 'negative';
          const innerfaceColor = innerface.color;
          const coloredInnerfaceIcon = this.renderIcon(innerface.icon, innerfaceColor);
          const changeStyle = innerfaceColor ? `style="border-color: ${innerfaceColor}; color: ${innerfaceColor};"` : '';
          
          return `<span class="history-change-tag ${className}" ${changeStyle}>${coloredInnerfaceIcon} ${sign}${change.toFixed(2)}</span>`;
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
                <div class="history-action-main" ${protocolTitleStyle}>${coloredProtocolIcon} ${checkin.protocolName}</div>
                <div class="history-action-desc">Check-in completed</div>
              </div>
            </div>
            <div class="history-cell history-changes-cell">${changes}</div>
            <div class="history-cell history-actions-cell">
              <button class="history-delete-btn" data-checkin-id="${checkin.id}" title="Delete">
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
    const innerfaces = window.Storage.getInnerfaces();
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
      // For XP calculation, use protocol weight directly, not sum of innerface changes
      const protocol = window.Storage.getProtocolById(checkin.protocolId);
      if (protocol) {
        // Determine action from the changes (+ if positive, - if negative)
        const firstChange = Object.values(checkin.changes)[0];
        const action = firstChange >= 0 ? '+' : '-';
        const xpChange = action === '+' ? protocol.weight : -protocol.weight;
        todayTotalChange += xpChange;
      }
    });
    
    // Calculate current level - priority: states average, then innerfaces average
    let currentLevel = 0;
    
    // 🔧 ИСПРАВЛЕНИЕ: Правильная логика расчета уровня персонажа
    // Если есть хотя бы один state - считаем среднее по states
    // Если нет ни одного state - считаем среднее по innerfaces
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
    } else if (innerfaces.length > 0) {
      // Fallback to innerfaces average (если нет states)
      let totalInnerfaceScore = 0;
      let validInnerfacesCount = 0;
      
      innerfaces.forEach(innerface => {
        const innerfaceScore = window.Storage.calculateCurrentScore(innerface.id);
        if (!isNaN(innerfaceScore)) {
          totalInnerfaceScore += innerfaceScore;
          validInnerfacesCount++;
        }
      });
      
      currentLevel = validInnerfacesCount > 0 ? totalInnerfaceScore / validInnerfacesCount : 0;
    } else {
      currentLevel = 0;
    }
    
    // Update level progress bar with color
    const levelProgressFill = document.getElementById('level-progress-fill');
    const levelPercentage = document.getElementById('level-percentage');
    const progressDigit = document.getElementById('progress-digit');
    if (levelProgressFill && levelPercentage) {
      const percent = Math.min(100, (currentLevel / 10) * 100);
      const color = this.getInnerfaceColor(currentLevel);
      
      levelProgressFill.style.width = percent + '%';
      levelProgressFill.style.backgroundColor = color;
      
      // 🔧 ИСПРАВЛЕНИЕ: Показываем реальный уровень, а не процент
      levelPercentage.textContent = currentLevel.toFixed(2);
      
      // Update progress digit (first digit of level)
      if (progressDigit) {
        const levelFirstDigit = Math.floor(currentLevel).toString();
        progressDigit.textContent = levelFirstDigit;
      }
    }

    // 🔧 ОТЛАДКА: Добавим подробные логи для отладки badge glow эффектов
    console.log('🔍 BADGE GLOW DEBUG: Starting color calculation...', {
      todayCheckinsCount: todayCheckins.length,
      innerfacesCount: innerfaces.length,
      totalCheckinsCount: checkins.length
    });

    // Get colors for stat badges based on most changed innerfaces
    const todayColor = window.Storage.getMostChangedInnerfaceColorToday();
    const monthColor = window.Storage.getMostChangedInnerfaceColorThisMonth();
    
    console.log('🎨 BADGE COLORS CALCULATED:', {
      todayColor,
      monthColor,
      todayColorType: typeof todayColor,
      monthColorType: typeof monthColor
    });
    
    // 🔧 ИСПРАВЛЕНИЕ: Улучшенные селекторы для stat labels
    const todayStatLabel = document.querySelector('[data-stat="checkins-today"] .stat-label') || 
                          document.querySelector('.stat-item:first-child .stat-label');
    const monthStatLabel = document.querySelector('[data-stat="checkins-month"] .stat-label') || 
                          document.querySelector('.stat-item:nth-child(2) .stat-label');
    
    console.log('🔍 STAT LABEL ELEMENTS:', {
      todayStatLabel: !!todayStatLabel,
      monthStatLabel: !!monthStatLabel,
      todayLabelText: todayStatLabel?.textContent,
      monthLabelText: monthStatLabel?.textContent
    });
    
    // Apply colors to today's check-ins badge
    if (todayStatLabel && todayColor) {
      console.log('🎨 APPLYING TODAY GLOW:', { element: todayStatLabel, color: todayColor });
      this.applyInnerGlowToStatLabel(todayStatLabel, todayColor);
    } else if (todayStatLabel) {
      console.log('🚫 REMOVING TODAY GLOW (no color):', { element: todayStatLabel, color: todayColor });
      this.removeInnerGlowFromStatLabel(todayStatLabel);
    } else {
      console.log('🚨 TODAY STAT LABEL NOT FOUND');
    }

    // Update today's checkins
    const checkinsToday = document.getElementById('checkins-today');
    const checkinsTodayDetail = document.getElementById('checkins-today-detail');
    if (checkinsToday && checkinsTodayDetail) {
      checkinsToday.textContent = todayCheckins.length;
      
      // Format XP with trend arrow
      const sign = todayTotalChange >= 0 ? '+' : '';
      let trendArrow = '';
      let cssClass = '';
      
      if (todayTotalChange > 0.01) {
        trendArrow = '<span class="checkin-trend-arrow increase"><i class="fas fa-arrow-trend-up"></i></span>';
        cssClass = 'increase';
      } else if (todayTotalChange < -0.01) {
        trendArrow = '<span class="checkin-trend-arrow decrease"><i class="fas fa-arrow-trend-down"></i></span>';
        cssClass = 'decrease';
      }
      
      // Remove existing trend classes and add new one
      checkinsTodayDetail.className = checkinsTodayDetail.className.replace(/\b(increase|decrease)\b/g, '').trim();
      if (cssClass) {
        checkinsTodayDetail.classList.add(cssClass);
      }
      
      checkinsTodayDetail.innerHTML = `${sign}${todayTotalChange.toFixed(2)} xp ${trendArrow}`;
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

    // Apply colors to month's check-ins badge
    if (monthStatLabel && monthColor) {
      console.log('🎨 APPLYING MONTH GLOW:', { element: monthStatLabel, color: monthColor });
      this.applyInnerGlowToStatLabel(monthStatLabel, monthColor);
    } else if (monthStatLabel) {
      console.log('🚫 REMOVING MONTH GLOW (no color):', { element: monthStatLabel, color: monthColor });
      this.removeInnerGlowFromStatLabel(monthStatLabel);
    } else {
      console.log('🚨 MONTH STAT LABEL NOT FOUND');
    }
    
    // Update month's checkins
    const checkinsMonth = document.getElementById('checkins-month');
    const checkinsMonthDetail = document.getElementById('checkins-month-detail');
    if (checkinsMonth && checkinsMonthDetail) {
      checkinsMonth.textContent = monthCheckins.length;
      
      // Format XP with trend arrow
      const sign = monthTotalChange >= 0 ? '+' : '';
      let trendArrow = '';
      let cssClass = '';
      
      if (monthTotalChange > 0.01) {
        trendArrow = '<span class="checkin-trend-arrow increase"><i class="fas fa-arrow-trend-up"></i></span>';
        cssClass = 'increase';
      } else if (monthTotalChange < -0.01) {
        trendArrow = '<span class="checkin-trend-arrow decrease"><i class="fas fa-arrow-trend-down"></i></span>';
        cssClass = 'decrease';
      }
      
      // Remove existing trend classes and add new one
      checkinsMonthDetail.className = checkinsMonthDetail.className.replace(/\b(increase|decrease)\b/g, '').trim();
      if (cssClass) {
        checkinsMonthDetail.classList.add(cssClass);
      }
      
      checkinsMonthDetail.innerHTML = `${sign}${monthTotalChange.toFixed(2)} xp ${trendArrow}`;
    }
    
    console.log('✅ BADGE GLOW DEBUG COMPLETE');
    
    // 🎨 НОВОЕ: Настройка пульсирующей анимации dashboard при ховере
    this.setupDashboardHoverAnimation(todayColor);
    
    // 🎯 НОВОЕ: Настройка кликабельных бейджей для перехода в History
    this.setupBadgeClicks();
  },

  // Helper function to apply elegant external glow to stat labels
  applyInnerGlowToStatLabel(element, color) {
    // Convert hex color to rgba for the glow effect
    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    // Much more subtle colors with very low opacity - no border changes
    const glowColor = hexToRgba(color, 0.03);
    const glowColorStrong = hexToRgba(color, 0.06);
    
    // Apply subtle external glow with 3 layers for better depth
    element.style.boxShadow = `
      0 0 6px ${glowColor},
      0 0 12px ${hexToRgba(color, 0.02)},
      0 0 18px ${hexToRgba(color, 0.01)}
    `;
    // Don't change border color to avoid visible outline
    element.style.transition = 'all 0.3s ease';
    
    // Add CSS animation for gentle pulsing
    const animationName = `badge-glow-${color.replace('#', '')}`;
    
    // Check if animation doesn't exist yet
    if (!this.createdAnimations) {
      this.createdAnimations = new Set();
    }
    
    if (!this.createdAnimations.has(animationName)) {
      // Create CSS animation keyframes with good animation from previous version
      const style = document.createElement('style');
      style.textContent = `
        @keyframes ${animationName} {
          0%, 100% {
            box-shadow: 
              0 0 6px ${glowColor},
              0 0 12px ${hexToRgba(color, 0.02)},
              0 0 18px ${hexToRgba(color, 0.01)};
          }
          50% {
            box-shadow: 
              0 0 10px ${glowColorStrong},
              0 0 16px ${hexToRgba(color, 0.04)},
              0 0 22px ${hexToRgba(color, 0.02)};
          }
        }
      `;
      document.head.appendChild(style);
      this.createdAnimations.add(animationName);
    }
    
    // Apply the animation
    element.style.animation = `${animationName} 3s ease-in-out infinite`;
  },

  // Helper function to remove glow from stat labels
  removeInnerGlowFromStatLabel(element) {
    element.style.boxShadow = '';
    element.style.borderColor = '';
    element.style.animation = '';
    element.style.transition = 'all 0.3s ease';
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
  },

  // Setup tooltips for state names that are truncated
  setupStateNameTooltips() {
    // Handle truncated state names
    const stateNames = document.querySelectorAll('.state-name');
    
    stateNames.forEach((nameElement, index) => {
      const text = nameElement.textContent.trim();
      const scrollWidth = nameElement.scrollWidth;
      const clientWidth = nameElement.clientWidth;
      const isOverflowing = scrollWidth > clientWidth;
      
      // Get the parent state-card element to check if it has data-hover
      const parentStateCard = nameElement.closest('.state-card');
      const hasHoverInfo = parentStateCard && parentStateCard.hasAttribute('data-hover');
      
      // Only show JavaScript tooltip if text is truncated AND there's no hover info (to avoid conflicts with CSS tooltips)
      if (isOverflowing && !hasHoverInfo) {
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
        // Remove tooltip listeners if text fits or if there's hover info (CSS tooltip will handle it)
        nameElement.removeEventListener('mouseenter', nameElement._boundShowTooltip);
        nameElement.removeEventListener('mouseleave', nameElement._boundHideTooltip);
      }
    });
  },

  // Setup pulsing dashboard hover animation that alternates between dark and color glow
  setupDashboardHoverAnimation(todayColor) {
    const dashboard = document.querySelector('.user-profile-block');
    if (!dashboard) return;
    
    // Remove any existing animation listeners
    dashboard.removeEventListener('mouseenter', dashboard._boundMouseEnter);
    dashboard.removeEventListener('mouseleave', dashboard._boundMouseLeave);
    
    // Helper function to convert hex to rgba
    const hexToRgba = (hex, alpha) => {
      if (!hex) return `rgba(0, 0, 0, ${alpha})`;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    // Create animation name based on color
    const animationName = todayColor ? `dashboard-pulse-${todayColor.replace('#', '')}` : 'dashboard-pulse-dark';
    
    // Create/update CSS animation
    if (todayColor) {
      // Check if animation doesn't exist yet
      if (!this.dashboardAnimations) {
        this.dashboardAnimations = new Set();
      }
      
      if (!this.dashboardAnimations.has(animationName)) {
        const style = document.createElement('style');
        style.id = `dashboard-animation-${todayColor.replace('#', '')}`;
        style.textContent = `
          @keyframes ${animationName} {
            0%, 100% {
              box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
            }
            50% {
              box-shadow: 
                0 8px 30px rgba(0, 0, 0, 0.15),
                0 0 20px ${hexToRgba(todayColor, 0.1)},
                0 0 40px ${hexToRgba(todayColor, 0.05)};
            }
          }
        `;
        document.head.appendChild(style);
        this.dashboardAnimations.add(animationName);
        
        console.log('🎨 DASHBOARD ANIMATION CREATED:', {
          color: todayColor,
          animationName
        });
      }
    }
    
    // Mouse enter handler - preserve CSS transform, only add animation
    dashboard._boundMouseEnter = () => {
      if (todayColor) {
        // Preserve the smooth transform from CSS, only add the pulsing box-shadow animation
        dashboard.style.animation = `${animationName} 2s ease-in-out infinite`;
        console.log('🎨 DASHBOARD HOVER START:', { color: todayColor, animation: animationName });
      }
    };
    
    // Mouse leave handler  
    dashboard._boundMouseLeave = () => {
      dashboard.style.animation = '';
      console.log('🎨 DASHBOARD HOVER END');
    };
    
    // Add event listeners
    dashboard.addEventListener('mouseenter', dashboard._boundMouseEnter);
    dashboard.addEventListener('mouseleave', dashboard._boundMouseLeave);
    
    console.log('🎨 DASHBOARD HOVER ANIMATION SETUP:', {
      todayColor,
      animationName,
      hasColor: !!todayColor
    });
  },

  // Setup clickable badges that navigate to history with appropriate filters
  setupBadgeClicks() {
    const todayBadge = document.querySelector('[data-stat="checkins-today"]');
    const monthBadge = document.querySelector('[data-stat="checkins-month"]');
    
    // Remove existing listeners to prevent duplicates
    if (todayBadge) {
      todayBadge.removeEventListener('click', todayBadge._boundClickHandler);
      todayBadge.style.cursor = 'pointer';
      
      todayBadge._boundClickHandler = () => {
        console.log('🎯 TODAY BADGE CLICKED: Navigating to history with today filter');
        this.navigateToHistoryWithFilter('today');
      };
      
      todayBadge.addEventListener('click', todayBadge._boundClickHandler);
    }
    
    if (monthBadge) {
      monthBadge.removeEventListener('click', monthBadge._boundClickHandler);
      monthBadge.style.cursor = 'pointer';
      
      monthBadge._boundClickHandler = () => {
        console.log('🎯 MONTH BADGE CLICKED: Navigating to history with month filter');
        this.navigateToHistoryWithFilter('month');
      };
      
      monthBadge.addEventListener('click', monthBadge._boundClickHandler);
    }
    
    console.log('🎯 BADGE CLICKS SETUP:', {
      todayBadgeFound: !!todayBadge,
      monthBadgeFound: !!monthBadge
    });
  },

  // Navigate to history page with specific time filter
  navigateToHistoryWithFilter(timeFilter) {
    if (!window.App) return;
    
    // Set up filter before navigation
    window.App.historyFilters = {
      time: timeFilter,
      type: 'all',
      protocol: 'all',
      state: 'all',
      effect: 'all',
      innerface: 'all',
      customDateFrom: '',
      customDateTo: ''
    };
    
    // Clear search input
    const historySearchInput = document.getElementById('history-search');
    if (historySearchInput) {
      historySearchInput.value = '';
    }
    
    // Navigate to history page
    window.App.navigateTo('history');
    
    // Apply the time filter and update UI
    setTimeout(() => {
      window.App.applyHistoryFilters();
      window.App.updateFilterUI();
      window.App.updateFilterIcon();
    }, 100);
    
    // Show toast notification
    const filterLabel = timeFilter === 'today' ? 'today\'s' : 'this month\'s';
    window.App.showToast(`Showing ${filterLabel} check-ins`, 'info');
    
    console.log('🎯 NAVIGATED TO HISTORY:', { timeFilter });
  },

  // 🌟 НОВОЕ: Настройка пульсирующих анимаций для карточек states
  setupStateCardAnimations() {
    const stateCards = document.querySelectorAll('.state-card');
    
    // Helper function to convert hex to rgba
    const hexToRgba = (hex, alpha) => {
      if (!hex) return `rgba(0, 0, 0, ${alpha})`;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    stateCards.forEach(card => {
      const glowColor = card.getAttribute('data-glow-color');
      if (!glowColor || glowColor === 'undefined') return;
      
      // Create animation names based on color
      const weakAnimationName = `state-card-pulse-weak-${glowColor.replace('#', '')}`;
      const strongAnimationName = `state-card-pulse-strong-${glowColor.replace('#', '')}`;
      
      // Check if animations don't exist yet
      if (!this.stateCardAnimations) {
        this.stateCardAnimations = new Set();
      }
      
      // Create weak (always-on) animation
      if (!this.stateCardAnimations.has(weakAnimationName)) {
        const weakStyle = document.createElement('style');
        weakStyle.id = `state-card-weak-animation-${glowColor.replace('#', '')}`;
        weakStyle.textContent = `
          @keyframes ${weakAnimationName} {
            0%, 100% {
              box-shadow: 0 8px 25px ${hexToRgba(glowColor, 0.075)};
            }
            50% {
              box-shadow: 0 8px 25px ${hexToRgba(glowColor, 0.04)};
            }
          }
        `;
        document.head.appendChild(weakStyle);
        this.stateCardAnimations.add(weakAnimationName);
      }
      
      // Create strong (hover) animation
      if (!this.stateCardAnimations.has(strongAnimationName)) {
        const strongStyle = document.createElement('style');
        strongStyle.id = `state-card-strong-animation-${glowColor.replace('#', '')}`;
        strongStyle.textContent = `
          @keyframes ${strongAnimationName} {
            0%, 100% {
              box-shadow: 
                0 8px 25px ${hexToRgba(glowColor, 0.20)},
                0 0 20px ${hexToRgba(glowColor, 0.12)},
                0 0 40px ${hexToRgba(glowColor, 0.06)};
            }
            50% {
              box-shadow: 0 8px 25px ${hexToRgba(glowColor, 0.10)};
            }
          }
        `;
        document.head.appendChild(strongStyle);
        this.stateCardAnimations.add(strongAnimationName);
        
        console.log('🎨 STATE CARD ANIMATIONS CREATED:', {
          color: glowColor,
          weakAnimation: weakAnimationName,
          strongAnimation: strongAnimationName
        });
      }
      
      // Apply weak pulsing animation by default
      card.style.animation = `${weakAnimationName} 6s ease-in-out infinite`;
      
      // Remove existing hover listeners to prevent duplicates
      card.removeEventListener('mouseenter', card._boundStateHoverEnter);
      card.removeEventListener('mouseleave', card._boundStateHoverLeave);
      
      // Create hover handlers
      card._boundStateHoverEnter = () => {
        card.style.animation = `${strongAnimationName} 3s ease-in-out infinite`;
        console.log('🎨 STATE CARD HOVER START:', { color: glowColor, animation: strongAnimationName });
      };
      
      card._boundStateHoverLeave = () => {
        card.style.animation = `${weakAnimationName} 6s ease-in-out infinite`;
        console.log('🎨 STATE CARD HOVER END:', { color: glowColor, animation: weakAnimationName });
      };
      
      // Add hover event listeners
      card.addEventListener('mouseenter', card._boundStateHoverEnter);
      card.addEventListener('mouseleave', card._boundStateHoverLeave);
    });
    
    console.log('🌟 STATE CARD ANIMATIONS SETUP:', {
      cardsCount: stateCards.length,
      animationsCreated: this.stateCardAnimations ? this.stateCardAnimations.size : 0
    });
  }
};

// 🔧 ИСПРАВЛЕНИЕ: Делаем UI объект глобально доступным
window.UI = UI;