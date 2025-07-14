export class BaseView {
  constructor(controller) {
    this.controller = controller;
    this.dataService = controller.getDataService();
    this.container = null;
    this.initialized = false;
  }

  getContainer() {
    if (!this.container) {
      throw new Error('Container not set for view');
    }
    return this.container;
  }

  render() {
    if (!this.initialized) {
      this.initialize();
      this.initialized = true;
    }
    this.update();
  }

  initialize() {
    // Override in subclasses
  }

  update() {
    // Override in subclasses
  }

  createElement(tag, className, content = '') {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (content) {
      element.innerHTML = content;
    }
    return element;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes === 0) {
          return 'just now';
        }
        return `${diffMinutes}m ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  formatScore(score) {
    return score.toFixed(2);
  }

  createProgressBar(score, maxScore = 10) {
    const percentage = (score / maxScore) * 100;
    const level = Math.floor(score);
    
    const progressBar = this.createElement('div', 'progress-bar');
    const fill = this.createElement('div', 'progress-fill');
    fill.style.width = `${percentage}%`;
    
    const levelText = this.createElement('span', 'progress-level', `Lv.${level}`);
    const scoreText = this.createElement('span', 'progress-score', this.formatScore(score));
    
    progressBar.appendChild(fill);
    progressBar.appendChild(levelText);
    progressBar.appendChild(scoreText);
    
    return progressBar;
  }

  setupSearch(inputId, searchCallback) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    let debounceTimer;
    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchCallback(e.target.value);
      }, 300);
    });
  }

  setupPagination(totalItems, itemsPerPage, currentPage, containerId, changeCallback) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const container = document.getElementById(containerId);
    if (!container || totalPages <= 1) return;
    
    container.innerHTML = '';
    
    // Previous button
    if (currentPage > 1) {
      const prevBtn = this.createElement('button', 'pagination-btn', '← Previous');
      prevBtn.onclick = () => changeCallback(currentPage - 1);
      container.appendChild(prevBtn);
    }
    
    // Page numbers
    const pageNumbers = this.createElement('div', 'pagination-numbers');
    
    // Always show first page
    if (currentPage > 3) {
      const firstPage = this.createElement('button', 'pagination-page', '1');
      firstPage.onclick = () => changeCallback(1);
      pageNumbers.appendChild(firstPage);
      
      if (currentPage > 4) {
        pageNumbers.appendChild(this.createElement('span', 'pagination-dots', '...'));
      }
    }
    
    // Show pages around current
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      const pageBtn = this.createElement('button', 
        i === currentPage ? 'pagination-page active' : 'pagination-page', 
        i.toString()
      );
      pageBtn.onclick = () => changeCallback(i);
      pageNumbers.appendChild(pageBtn);
    }
    
    // Always show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pageNumbers.appendChild(this.createElement('span', 'pagination-dots', '...'));
      }
      
      const lastPage = this.createElement('button', 'pagination-page', totalPages.toString());
      lastPage.onclick = () => changeCallback(totalPages);
      pageNumbers.appendChild(lastPage);
    }
    
    container.appendChild(pageNumbers);
    
    // Next button
    if (currentPage < totalPages) {
      const nextBtn = this.createElement('button', 'pagination-btn', 'Next →');
      nextBtn.onclick = () => changeCallback(currentPage + 1);
      container.appendChild(nextBtn);
    }
  }

  showEmptyState(message, icon = '📭') {
    return this.createElement('div', 'empty-state', `
      <div class="empty-icon">${icon}</div>
      <p>${message}</p>
    `);
  }

  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }
}