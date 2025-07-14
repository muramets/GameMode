import { BaseView } from './BaseView.js';
import { UI_CONFIG } from '../config/constants.js';

export class HistoryView extends BaseView {
  constructor(controller) {
    super(controller);
    this.container = document.getElementById('historyPage');
    this.currentPage = 1;
    this.filteredHistory = [];
    this.filters = {
      time: 'all',
      type: 'all',
      protocol: 'all',
      innerface: 'all',
      effect: 'all'
    };
  }

  initialize() {
    this.setupFilters();
  }

  setupFilters() {
    // Time filter
    const timeFilter = document.getElementById('historyTimeFilter');
    if (timeFilter) {
      timeFilter.addEventListener('change', (e) => {
        this.filters.time = e.target.value;
        this.filterHistory();
      });
    }
    
    // Type filter
    const typeFilter = document.getElementById('historyTypeFilter');
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        this.filters.type = e.target.value;
        this.filterHistory();
      });
    }
    
    // Other filters would be similar...
  }

  update() {
    this.updateFilterOptions();
    this.filterHistory();
    this.renderHistory();
  }

  updateFilterOptions() {
    // Update protocol filter options
    const protocolFilter = document.getElementById('historyProtocolFilter');
    if (protocolFilter) {
      const currentValue = protocolFilter.value;
      protocolFilter.innerHTML = '<option value="all">All Protocols</option>';
      
      const protocols = this.dataService.getProtocols();
      protocols.forEach(protocol => {
        const option = document.createElement('option');
        option.value = protocol.id;
        option.textContent = `${protocol.icon} ${protocol.name}`;
        protocolFilter.appendChild(option);
      });
      
      protocolFilter.value = currentValue;
    }
    
    // Update innerface filter options
    const innerfaceFilter = document.getElementById('historyInnerfaceFilter');
    if (innerfaceFilter) {
      const currentValue = innerfaceFilter.value;
      innerfaceFilter.innerHTML = '<option value="all">All Innerfaces</option>';
      
      const innerfaces = this.dataService.getInnerfaces();
      innerfaces.forEach(innerface => {
        const option = document.createElement('option');
        option.value = innerface.id;
        option.textContent = `${innerface.icon} ${innerface.name}`;
        innerfaceFilter.appendChild(option);
      });
      
      innerfaceFilter.value = currentValue;
    }
  }

  filterHistory() {
    const allHistory = this.dataService.getHistory();
    
    this.filteredHistory = allHistory.filter(entry => {
      // Time filter
      if (this.filters.time !== 'all') {
        const entryDate = new Date(entry.timestamp);
        const now = new Date();
        
        switch (this.filters.time) {
          case 'today':
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (entryDate < today) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (entryDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (entryDate < monthAgo) return false;
            break;
        }
      }
      
      // Type filter
      if (this.filters.type !== 'all' && entry.type !== this.filters.type) {
        return false;
      }
      
      // Protocol filter
      if (this.filters.protocol !== 'all' && entry.protocolId != this.filters.protocol) {
        return false;
      }
      
      // Innerface filter
      if (this.filters.innerface !== 'all') {
        const affectedInnerfaces = entry.getAffectedInnerfaces();
        if (!affectedInnerfaces.includes(parseInt(this.filters.innerface))) {
          return false;
        }
      }
      
      // Effect filter
      if (this.filters.effect !== 'all') {
        const totalChange = entry.getTotalChange();
        if (this.filters.effect === 'positive' && totalChange <= 0) return false;
        if (this.filters.effect === 'negative' && totalChange >= 0) return false;
      }
      
      return true;
    });
    
    // Sort by timestamp descending
    this.filteredHistory.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    // Reset to page 1
    this.currentPage = 1;
  }

  renderHistory() {
    const container = document.getElementById('historyList');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Stats
    this.updateHistoryStats();
    
    // Pagination
    const startIndex = (this.currentPage - 1) * UI_CONFIG.ITEMS_PER_PAGE;
    const endIndex = startIndex + UI_CONFIG.ITEMS_PER_PAGE;
    const pageHistory = this.filteredHistory.slice(startIndex, endIndex);
    
    if (pageHistory.length === 0) {
      container.appendChild(this.showEmptyState('No history entries found', '📚'));
      return;
    }
    
    // Group by date
    const groupedHistory = this.groupHistoryByDate(pageHistory);
    
    Object.entries(groupedHistory).forEach(([date, entries]) => {
      const dateHeader = this.createElement('div', 'history-date-header', date);
      container.appendChild(dateHeader);
      
      entries.forEach(entry => {
        const item = this.createHistoryItem(entry);
        container.appendChild(item);
      });
    });
    
    // Pagination
    this.setupPagination(
      this.filteredHistory.length,
      UI_CONFIG.ITEMS_PER_PAGE,
      this.currentPage,
      'historyPagination',
      (page) => {
        this.currentPage = page;
        this.renderHistory();
      }
    );
  }

  groupHistoryByDate(entries) {
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      entryDate.setHours(0, 0, 0, 0);
      
      let dateKey;
      if (entryDate.getTime() === today.getTime()) {
        dateKey = 'Today';
      } else if (entryDate.getTime() === yesterday.getTime()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = entryDate.toLocaleDateString();
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });
    
    return groups;
  }

  createHistoryItem(entry) {
    const item = this.createElement('div', 'history-item');
    item.dataset.historyId = entry.id;
    
    const time = this.createElement('span', 'history-time', 
      new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    
    const icon = this.createElement('span', 'history-icon');
    const title = this.createElement('span', 'history-title');
    
    switch (entry.type) {
      case 'protocol':
        const protocol = this.dataService.getProtocolById(entry.protocolId);
        icon.textContent = protocol ? protocol.icon : '📝';
        title.textContent = entry.protocolName || (protocol ? protocol.name : 'Unknown Protocol');
        break;
      case 'quick_action':
        icon.textContent = '⚡';
        title.textContent = 'Quick Action';
        break;
      case 'manual_edit':
        icon.textContent = '✏️';
        title.textContent = 'Manual Edit';
        break;
      default:
        icon.textContent = '❓';
        title.textContent = entry.type;
    }
    
    const changes = this.createElement('div', 'history-changes');
    Object.entries(entry.changes).forEach(([innerfaceId, change]) => {
      const innerface = this.dataService.getInnerfaceById(parseInt(innerfaceId));
      if (innerface) {
        const changeEl = this.createElement('span', 
          `change-badge ${change >= 0 ? 'positive' : 'negative'}`
        );
        changeEl.innerHTML = `${innerface.icon} ${change >= 0 ? '+' : ''}${change.toFixed(2)}`;
        changes.appendChild(changeEl);
      }
    });
    
    const deleteBtn = this.createElement('button', 'history-delete', '×');
    deleteBtn.onclick = () => this.deleteHistoryEntry(entry.id);
    
    item.appendChild(time);
    item.appendChild(icon);
    item.appendChild(title);
    item.appendChild(changes);
    item.appendChild(deleteBtn);
    
    return item;
  }

  updateHistoryStats() {
    const totalEntries = this.filteredHistory.length;
    
    const statsEl = document.getElementById('historyStats');
    if (statsEl) {
      statsEl.textContent = `${totalEntries} entries`;
    }
  }

  async deleteHistoryEntry(id) {
    if (confirm('Are you sure you want to delete this history entry?')) {
      await this.dataService.deleteHistoryEntry(id);
      this.update();
      this.controller.showToast('History entry deleted');
    }
  }
}