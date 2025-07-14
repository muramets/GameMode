import { BaseView } from './BaseView.js';

export class StatesView extends BaseView {
  constructor(controller) {
    super(controller);
    this.container = document.getElementById('statesPage');
  }

  update() {
    this.renderStates();
  }

  renderStates() {
    const container = document.getElementById('statesManageGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    const states = this.dataService.getStatesInOrder();
    
    states.forEach(state => {
      const score = this.dataService.calculateStateScore(state.id);
      const card = this.createStateManageCard(state, score);
      container.appendChild(card);
    });
    
    // Add button
    const addBtn = this.createElement('div', 'card add-state-card');
    addBtn.innerHTML = `
      <div class="add-icon">+</div>
      <p>Add New State</p>
    `;
    addBtn.onclick = () => this.showAddStateModal();
    container.appendChild(addBtn);
  }

  createStateManageCard(state, score) {
    const card = this.createElement('div', 'card state-manage-card');
    card.dataset.stateId = state.id;
    
    const header = this.createElement('div', 'card-header');
    const icon = this.createElement('span', 'card-icon', state.icon);
    const title = this.createElement('h3', 'card-title', state.name);
    
    header.appendChild(icon);
    header.appendChild(title);
    
    const progressBar = this.createProgressBar(score);
    
    const components = this.createElement('div', 'state-components-list');
    
    // Innerfaces section
    if (state.innerfaceIds.length > 0) {
      const innerfacesSection = this.createElement('div', 'components-section');
      const innerfacesLabel = this.createElement('h4', 'section-label', 'Innerfaces:');
      innerfacesSection.appendChild(innerfacesLabel);
      
      const innerfacesList = this.createElement('div', 'components-list');
      state.innerfaceIds.forEach(id => {
        const innerface = this.dataService.getInnerfaceById(id);
        if (innerface) {
          const item = this.createElement('div', 'component-item');
          item.innerHTML = `
            <span class="component-icon">${innerface.icon}</span>
            <span class="component-name">${innerface.name.split('.')[0]}</span>
            <span class="component-score">${this.formatScore(this.dataService.calculateInnerfaceScore(id))}</span>
          `;
          innerfacesList.appendChild(item);
        }
      });
      innerfacesSection.appendChild(innerfacesList);
      components.appendChild(innerfacesSection);
    }
    
    // Nested states section
    if (state.stateIds.length > 0) {
      const statesSection = this.createElement('div', 'components-section');
      const statesLabel = this.createElement('h4', 'section-label', 'Sub-states:');
      statesSection.appendChild(statesLabel);
      
      const statesList = this.createElement('div', 'components-list');
      state.stateIds.forEach(id => {
        const nestedState = this.dataService.getStateById(id);
        if (nestedState) {
          const item = this.createElement('div', 'component-item');
          item.innerHTML = `
            <span class="component-icon">${nestedState.icon}</span>
            <span class="component-name">${nestedState.name.split('.')[0]}</span>
            <span class="component-score">${this.formatScore(this.dataService.calculateStateScore(id))}</span>
          `;
          statesList.appendChild(item);
        }
      });
      statesSection.appendChild(statesList);
      components.appendChild(statesSection);
    }
    
    const actions = this.createElement('div', 'card-actions');
    const editBtn = this.createElement('button', 'btn btn-secondary', 'Edit');
    editBtn.onclick = () => this.showEditStateModal(state);
    
    const deleteBtn = this.createElement('button', 'btn btn-danger', 'Delete');
    deleteBtn.onclick = () => this.confirmDeleteState(state);
    
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    card.appendChild(header);
    card.appendChild(progressBar);
    card.appendChild(components);
    if (state.hover) {
      const hover = this.createElement('div', 'card-hover', state.hover);
      card.appendChild(hover);
    }
    card.appendChild(actions);
    
    return card;
  }

  showAddStateModal() {
    this.controller.showToast('Add state modal not implemented yet');
  }

  showEditStateModal(state) {
    this.controller.showToast('Edit state modal not implemented yet');
  }

  confirmDeleteState(state) {
    if (confirm(`Are you sure you want to delete "${state.name}"?`)) {
      // Delete state
      this.controller.showToast('Delete functionality not implemented yet');
    }
  }
}