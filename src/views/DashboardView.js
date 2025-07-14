import { BaseView } from './BaseView.js';

export class DashboardView extends BaseView {
  constructor(controller) {
    super(controller);
    this.container = document.getElementById('dashboardPage');
  }

  initialize() {
    // Setup quick actions
    this.setupQuickActions();
  }

  update() {
    this.renderDashboard();
    this.renderQuickActions();
  }

  renderDashboard() {
    const innerfaces = this.dataService.getInnerfacesInOrder();
    const states = this.dataService.getStatesInOrder();
    
    // Render innerfaces
    const innerfacesGrid = document.getElementById('innerfacesGrid');
    if (innerfacesGrid) {
      innerfacesGrid.innerHTML = '';
      
      innerfaces.forEach(innerface => {
        const score = this.dataService.calculateInnerfaceScore(innerface.id);
        const card = this.createInnerfaceCard(innerface, score);
        innerfacesGrid.appendChild(card);
      });
    }
    
    // Render states
    const statesGrid = document.getElementById('statesGrid');
    if (statesGrid) {
      statesGrid.innerHTML = '';
      
      states.forEach(state => {
        const score = this.dataService.calculateStateScore(state.id);
        const card = this.createStateCard(state, score);
        statesGrid.appendChild(card);
      });
    }
    
    // Update stats
    this.updateStats();
  }

  createInnerfaceCard(innerface, score) {
    const card = this.createElement('div', 'card innerface-card');
    card.dataset.innerfaceId = innerface.id;
    
    const header = this.createElement('div', 'card-header');
    const icon = this.createElement('span', 'card-icon', innerface.icon);
    const title = this.createElement('h3', 'card-title', innerface.name.split('.')[0]);
    
    header.appendChild(icon);
    header.appendChild(title);
    
    const progressBar = this.createProgressBar(score);
    
    const hover = this.createElement('div', 'card-hover', innerface.hover);
    
    card.appendChild(header);
    card.appendChild(progressBar);
    if (innerface.hover) {
      card.appendChild(hover);
    }
    
    // Make it draggable for quick actions
    card.draggable = true;
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('innerfaceId', innerface.id.toString());
      e.dataTransfer.effectAllowed = 'copy';
    });
    
    return card;
  }

  createStateCard(state, score) {
    const card = this.createElement('div', 'card state-card');
    card.dataset.stateId = state.id;
    
    const header = this.createElement('div', 'card-header');
    const icon = this.createElement('span', 'card-icon', state.icon);
    const title = this.createElement('h3', 'card-title', state.name.split('.')[0]);
    
    header.appendChild(icon);
    header.appendChild(title);
    
    const progressBar = this.createProgressBar(score);
    
    const components = this.createElement('div', 'state-components');
    
    // Show innerfaces
    state.innerfaceIds.forEach(id => {
      const innerface = this.dataService.getInnerfaceById(id);
      if (innerface) {
        const tag = this.createElement('span', 'component-tag', innerface.icon);
        components.appendChild(tag);
      }
    });
    
    // Show nested states
    state.stateIds.forEach(id => {
      const nestedState = this.dataService.getStateById(id);
      if (nestedState) {
        const tag = this.createElement('span', 'component-tag state-tag', nestedState.icon);
        components.appendChild(tag);
      }
    });
    
    card.appendChild(header);
    card.appendChild(progressBar);
    card.appendChild(components);
    
    if (state.hover) {
      const hover = this.createElement('div', 'card-hover', state.hover);
      card.appendChild(hover);
    }
    
    return card;
  }

  updateStats() {
    const history = this.dataService.getHistory();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayActions = history.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    }).length;
    
    const totalActions = history.length;
    
    const todayActionsEl = document.getElementById('todayActions');
    if (todayActionsEl) {
      todayActionsEl.textContent = todayActions;
    }
    
    const totalActionsEl = document.getElementById('totalActions');
    if (totalActionsEl) {
      totalActionsEl.textContent = totalActions;
    }
    
    // Calculate average level
    const innerfaces = this.dataService.getInnerfaces();
    const totalScore = innerfaces.reduce((sum, innerface) => {
      return sum + this.dataService.calculateInnerfaceScore(innerface.id);
    }, 0);
    const avgLevel = Math.floor(totalScore / innerfaces.length);
    
    const avgLevelEl = document.getElementById('avgLevel');
    if (avgLevelEl) {
      avgLevelEl.textContent = avgLevel;
    }
  }

  setupQuickActions() {
    const container = document.getElementById('quickActionsContainer');
    if (!container) return;
    
    // Setup drop zone
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      container.classList.add('drag-over');
    });
    
    container.addEventListener('dragleave', () => {
      container.classList.remove('drag-over');
    });
    
    container.addEventListener('drop', (e) => {
      e.preventDefault();
      container.classList.remove('drag-over');
      
      const innerfaceId = parseInt(e.dataTransfer.getData('innerfaceId'));
      if (innerfaceId) {
        this.addQuickAction(innerfaceId);
      }
    });
  }

  addQuickAction(innerfaceId) {
    const quickActions = this.dataService.getQuickActions();
    const exists = quickActions.some(qa => qa.innerfaceId === innerfaceId);
    
    if (!exists) {
      quickActions.push({
        innerfaceId,
        action: 'increase',
        value: 0.1
      });
      
      this.dataService.setQuickActions(quickActions);
      this.renderQuickActions();
      this.controller.showToast('Quick action added');
    }
  }

  renderQuickActions() {
    const container = document.getElementById('quickActionsGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    const quickActions = this.dataService.getQuickActions();
    const order = this.dataService.localStorage.get('quickActionOrder', []);
    
    // Sort by order
    const orderedActions = [...quickActions].sort((a, b) => {
      const indexA = order.indexOf(a.innerfaceId);
      const indexB = order.indexOf(b.innerfaceId);
      return indexA - indexB;
    });
    
    orderedActions.forEach(qa => {
      const innerface = this.dataService.getInnerfaceById(qa.innerfaceId);
      if (!innerface) return;
      
      const actionEl = this.createElement('div', 'quick-action');
      actionEl.dataset.innerfaceId = qa.innerfaceId;
      
      const icon = this.createElement('span', 'quick-action-icon', innerface.icon);
      const name = this.createElement('span', 'quick-action-name', innerface.name.split('.')[0]);
      
      const controls = this.createElement('div', 'quick-action-controls');
      
      const decreaseBtn = this.createElement('button', 'quick-action-btn decrease', '-');
      decreaseBtn.onclick = () => this.handleQuickAction(qa.innerfaceId, 'decrease', qa.value);
      
      const increaseBtn = this.createElement('button', 'quick-action-btn increase', '+');
      increaseBtn.onclick = () => this.handleQuickAction(qa.innerfaceId, 'increase', qa.value);
      
      const removeBtn = this.createElement('button', 'quick-action-remove', '×');
      removeBtn.onclick = () => this.removeQuickAction(qa.innerfaceId);
      
      controls.appendChild(decreaseBtn);
      controls.appendChild(increaseBtn);
      
      actionEl.appendChild(icon);
      actionEl.appendChild(name);
      actionEl.appendChild(controls);
      actionEl.appendChild(removeBtn);
      
      container.appendChild(actionEl);
    });
    
    // Add placeholder if empty
    if (quickActions.length === 0) {
      const placeholder = this.createElement('div', 'quick-actions-placeholder', 
        'Drag innerfaces here for quick access'
      );
      container.appendChild(placeholder);
    }
  }

  async handleQuickAction(innerfaceId, action, value) {
    const change = action === 'decrease' ? -value : value;
    
    const entry = {
      type: 'quick_action',
      changes: { [innerfaceId]: change },
      metadata: { action, value }
    };
    
    await this.dataService.addHistoryEntry(entry);
    this.update();
    
    const innerface = this.dataService.getInnerfaceById(innerfaceId);
    this.controller.showToast(`${innerface.icon} ${action === 'increase' ? '+' : '-'}${value}`);
  }

  removeQuickAction(innerfaceId) {
    const quickActions = this.dataService.getQuickActions()
      .filter(qa => qa.innerfaceId !== innerfaceId);
    
    this.dataService.setQuickActions(quickActions);
    this.renderQuickActions();
  }
}