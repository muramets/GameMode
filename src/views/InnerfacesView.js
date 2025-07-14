import { BaseView } from './BaseView.js';

export class InnerfacesView extends BaseView {
  constructor(controller) {
    super(controller);
    this.container = document.getElementById('innerfacesPage');
  }

  update() {
    this.renderInnerfaces();
  }

  renderInnerfaces() {
    const container = document.getElementById('innerfacesManageGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    const innerfaces = this.dataService.getInnerfacesInOrder();
    
    innerfaces.forEach(innerface => {
      const score = this.dataService.calculateInnerfaceScore(innerface.id);
      const card = this.createInnerfaceManageCard(innerface, score);
      container.appendChild(card);
    });
  }

  createInnerfaceManageCard(innerface, score) {
    const card = this.createElement('div', 'card innerface-manage-card');
    card.dataset.innerfaceId = innerface.id;
    
    const header = this.createElement('div', 'card-header');
    const icon = this.createElement('span', 'card-icon', innerface.icon);
    const title = this.createElement('h3', 'card-title', innerface.name);
    
    header.appendChild(icon);
    header.appendChild(title);
    
    const progressBar = this.createProgressBar(score);
    
    const stats = this.createElement('div', 'innerface-stats');
    
    const initialScore = this.createElement('div', 'stat-item');
    initialScore.innerHTML = `
      <span class="stat-label">Initial:</span>
      <span class="stat-value">${this.formatScore(innerface.initialScore)}</span>
    `;
    
    const currentScore = this.createElement('div', 'stat-item');
    currentScore.innerHTML = `
      <span class="stat-label">Current:</span>
      <span class="stat-value">${this.formatScore(score)}</span>
    `;
    
    const change = score - innerface.initialScore;
    const changeClass = change >= 0 ? 'positive' : 'negative';
    const changeEl = this.createElement('div', 'stat-item');
    changeEl.innerHTML = `
      <span class="stat-label">Change:</span>
      <span class="stat-value ${changeClass}">${change >= 0 ? '+' : ''}${this.formatScore(change)}</span>
    `;
    
    stats.appendChild(initialScore);
    stats.appendChild(currentScore);
    stats.appendChild(changeEl);
    
    const actions = this.createElement('div', 'card-actions');
    const editBtn = this.createElement('button', 'btn btn-secondary', 'Edit');
    editBtn.onclick = () => this.showEditInnerfaceModal(innerface);
    
    actions.appendChild(editBtn);
    
    card.appendChild(header);
    card.appendChild(progressBar);
    card.appendChild(stats);
    if (innerface.hover) {
      const hover = this.createElement('div', 'card-hover', innerface.hover);
      card.appendChild(hover);
    }
    card.appendChild(actions);
    
    return card;
  }

  showEditInnerfaceModal(innerface) {
    // This would show a modal for editing the innerface
    this.controller.showToast('Edit innerface modal not implemented yet');
  }
}