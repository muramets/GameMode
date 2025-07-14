import { BaseView } from './BaseView.js';
import { UI_CONFIG } from '../config/constants.js';

export class ProtocolsView extends BaseView {
  constructor(controller) {
    super(controller);
    this.container = document.getElementById('protocolsPage');
    this.currentPage = 1;
    this.filteredProtocols = [];
    this.searchQuery = '';
    this.selectedGroups = new Set(['all']);
  }

  initialize() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Search
    this.setupSearch('protocolSearch', (query) => {
      this.searchQuery = query;
      this.filterProtocols();
    });
    
    // Group filters
    const groupFilters = document.querySelectorAll('[data-protocol-group]');
    groupFilters.forEach(filter => {
      filter.addEventListener('click', () => {
        const group = filter.dataset.protocolGroup;
        this.toggleGroupFilter(group);
        filter.classList.toggle('active');
      });
    });
    
    // Add protocol button
    const addBtn = document.getElementById('addProtocolBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddProtocolModal());
    }
  }

  update() {
    this.filterProtocols();
    this.renderProtocols();
  }

  filterProtocols() {
    const allProtocols = this.dataService.getProtocolsInOrder();
    
    this.filteredProtocols = allProtocols.filter(protocol => {
      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const matchesSearch = 
          protocol.name.toLowerCase().includes(query) ||
          protocol.hover.toLowerCase().includes(query) ||
          protocol.icon.includes(query);
        
        if (!matchesSearch) return false;
      }
      
      // Group filter
      if (!this.selectedGroups.has('all')) {
        const protocolGroup = this.getProtocolGroup(protocol);
        if (!this.selectedGroups.has(protocolGroup)) return false;
      }
      
      return true;
    });
    
    // Reset to page 1 after filtering
    this.currentPage = 1;
  }

  getProtocolGroup(protocol) {
    // Determine group based on targets
    const targetNames = protocol.targets.map(id => {
      const innerface = this.dataService.getInnerfaceById(id);
      return innerface ? innerface.name.toLowerCase() : '';
    });
    
    if (targetNames.some(name => name.includes('body') || name.includes('physical'))) {
      return 'physical';
    }
    if (targetNames.some(name => name.includes('focus') || name.includes('energy'))) {
      return 'mental';
    }
    if (targetNames.some(name => name.includes('relationship') || name.includes('family'))) {
      return 'social';
    }
    if (targetNames.some(name => name.includes('business') || name.includes('execution'))) {
      return 'professional';
    }
    
    return 'other';
  }

  toggleGroupFilter(group) {
    if (group === 'all') {
      this.selectedGroups.clear();
      this.selectedGroups.add('all');
      // Deactivate other filters
      document.querySelectorAll('[data-protocol-group]:not([data-protocol-group="all"])').forEach(f => {
        f.classList.remove('active');
      });
    } else {
      this.selectedGroups.delete('all');
      document.querySelector('[data-protocol-group="all"]')?.classList.remove('active');
      
      if (this.selectedGroups.has(group)) {
        this.selectedGroups.delete(group);
        if (this.selectedGroups.size === 0) {
          this.selectedGroups.add('all');
          document.querySelector('[data-protocol-group="all"]')?.classList.add('active');
        }
      } else {
        this.selectedGroups.add(group);
      }
    }
    
    this.filterProtocols();
    this.renderProtocols();
  }

  renderProtocols() {
    const container = document.getElementById('protocolsGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Pagination
    const startIndex = (this.currentPage - 1) * UI_CONFIG.ITEMS_PER_PAGE;
    const endIndex = startIndex + UI_CONFIG.ITEMS_PER_PAGE;
    const pageProtocols = this.filteredProtocols.slice(startIndex, endIndex);
    
    if (pageProtocols.length === 0) {
      container.appendChild(this.showEmptyState('No protocols found', '📋'));
      return;
    }
    
    pageProtocols.forEach(protocol => {
      const card = this.createProtocolCard(protocol);
      container.appendChild(card);
    });
    
    // Update pagination
    this.setupPagination(
      this.filteredProtocols.length,
      UI_CONFIG.ITEMS_PER_PAGE,
      this.currentPage,
      'protocolsPagination',
      (page) => {
        this.currentPage = page;
        this.renderProtocols();
      }
    );
  }

  createProtocolCard(protocol) {
    const card = this.createElement('div', 'card protocol-card');
    card.dataset.protocolId = protocol.id;
    
    const header = this.createElement('div', 'card-header');
    const icon = this.createElement('span', 'card-icon', protocol.icon);
    const title = this.createElement('h3', 'card-title', protocol.name.split('.')[0]);
    
    header.appendChild(icon);
    header.appendChild(title);
    
    const description = this.createElement('p', 'card-description', 
      protocol.name.split('.').slice(1).join('.').trim()
    );
    
    const meta = this.createElement('div', 'protocol-meta');
    
    const actionBadge = this.createElement('span', 
      `action-badge ${protocol.action === '+' ? 'positive' : 'negative'}`,
      protocol.action
    );
    
    const weightBadge = this.createElement('span', 'weight-badge', 
      `${(protocol.weight * 100).toFixed(0)}%`
    );
    
    const targets = this.createElement('div', 'protocol-targets');
    protocol.targets.forEach(targetId => {
      const innerface = this.dataService.getInnerfaceById(targetId);
      if (innerface) {
        const target = this.createElement('span', 'target-badge', innerface.icon);
        target.title = innerface.name;
        targets.appendChild(target);
      }
    });
    
    meta.appendChild(actionBadge);
    meta.appendChild(weightBadge);
    meta.appendChild(targets);
    
    const actions = this.createElement('div', 'card-actions');
    const useBtn = this.createElement('button', 'btn btn-primary', 'Use');
    useBtn.dataset.protocolId = protocol.id;
    
    const editBtn = this.createElement('button', 'btn btn-secondary', 'Edit');
    editBtn.onclick = () => this.showEditProtocolModal(protocol);
    
    actions.appendChild(useBtn);
    actions.appendChild(editBtn);
    
    card.appendChild(header);
    if (description.textContent) {
      card.appendChild(description);
    }
    card.appendChild(meta);
    card.appendChild(actions);
    
    if (protocol.hover) {
      const hover = this.createElement('div', 'card-hover', protocol.hover);
      card.appendChild(hover);
    }
    
    // Make draggable
    card.draggable = true;
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('protocolId', protocol.id.toString());
      e.dataTransfer.effectAllowed = 'move';
    });
    
    return card;
  }

  showAddProtocolModal() {
    // This would show a modal for adding a new protocol
    // For now, just show a toast
    this.controller.showToast('Add protocol modal not implemented yet');
  }

  showEditProtocolModal(protocol) {
    // This would show a modal for editing the protocol
    // For now, just show a toast
    this.controller.showToast('Edit protocol modal not implemented yet');
  }
}