// ===== dragdrop.js - Drag & Drop Functionality =====

const DragDrop = {
  /**
   * Create a semi-transparent copy of the dragged element for custom drag image
   * @param {HTMLElement} element - The element to clone
   * @returns {HTMLElement} - The cloned element styled as drag image
   */
  createDragImage(element) {
    const clone = element.cloneNode(true);
    
    // Get the computed styles from the original element
    const computedStyles = window.getComputedStyle(element);
    const originalRect = element.getBoundingClientRect();
    
    // Special handling for table rows (grid elements)
    const isTableRow = element.classList.contains('protocol-row') || element.classList.contains('skill-row');
    
    // For table rows, use exact original dimensions; for cards, keep original size
    const dragWidth = originalRect.width;
    const dragHeight = originalRect.height;
    
    // Apply only the positioning and visual enhancement styles, preserving layout styles
    Object.assign(clone.style, {
      position: 'absolute',
      top: '-1000px',
      left: '-1000px',
      opacity: '0.7',
      transform: 'scale(0.9)',
      pointerEvents: 'none',
      zIndex: '10000',
      // Убираем все свечения и обводки
      boxShadow: 'none',
      border: 'none',
      // Set exact dimensions to match original
      width: dragWidth + 'px',
      height: dragHeight + 'px',
      maxWidth: dragWidth + 'px',
      minWidth: dragWidth + 'px',
      minHeight: dragHeight + 'px',
      overflow: 'hidden',
      // Preserve original layout properties
      display: computedStyles.display,
      gridTemplateColumns: computedStyles.gridTemplateColumns,
      gap: computedStyles.gap,
      alignItems: computedStyles.alignItems,
      padding: computedStyles.padding,
      borderRadius: '8px',
      backgroundColor: 'var(--bg-color)',
      fontSize: computedStyles.fontSize,
      fontFamily: computedStyles.fontFamily
    });
    
    // Remove any hover effects or active states and data attributes
    clone.classList.remove('dragging');
    clone.removeAttribute('data-skill-id');
    clone.removeAttribute('data-protocol-id');
    clone.removeAttribute('data-state-id');
    clone.removeAttribute('draggable');
    clone.querySelectorAll('*').forEach(el => {
      el.style.pointerEvents = 'none';
    });
    
    document.body.appendChild(clone);
    
    // Clean up immediately after drag starts
    setTimeout(() => {
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
    }, 50);
    
    return clone;
  },

  /**
   * Setup common drag event handlers for any draggable element
   * @param {HTMLElement} element - The draggable element
   * @param {string} dataKey - The data attribute to use for transfer
   * @param {string} containerSelector - CSS selector for container elements
   * @param {Function} reorderCallback - Function to call when reordering
   */
  setupDragHandlers(element, dataKey, containerSelector, reorderCallback) {
    // Check if already setup to prevent duplicate listeners
    if (element.dataset.dragSetup === 'true') {
      return;
    }
    
    element.setAttribute('draggable', 'true');
    element.dataset.dragSetup = 'true';
    
    element.addEventListener('dragstart', (e) => {
      element.classList.add('dragging');
      e.dataTransfer.setData('text/plain', element.dataset[dataKey]);
      e.dataTransfer.effectAllowed = 'move';
      
      // Create and set custom drag image
      const dragImage = this.createDragImage(element);
      e.dataTransfer.setDragImage(dragImage, dragImage.offsetWidth / 2, dragImage.offsetHeight / 2);
    });
    
    element.addEventListener('dragend', () => {
      element.classList.remove('dragging');
      // Remove all drag-over classes from container elements
      document.querySelectorAll(containerSelector).forEach(el => el.classList.remove('drag-over'));
    });
    
    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const draggingElement = document.querySelector(`${containerSelector}.dragging`);
      if (draggingElement && draggingElement !== element) {
        element.classList.add('drag-over');
      }
    });
    
    element.addEventListener('dragleave', (e) => {
      // Only remove if not dragging over a child element
      if (!element.contains(e.relatedTarget)) {
        element.classList.remove('drag-over');
      }
    });
    
    element.addEventListener('drop', (e) => {
      e.preventDefault();
      element.classList.remove('drag-over');
      
      const draggedId = e.dataTransfer.getData('text/plain');
      const targetId = element.dataset[dataKey];
      
      if (draggedId !== targetId) {
        reorderCallback(draggedId, targetId);
      }
    });
  },

  setupProtocols() {
    const protocolRows = document.querySelectorAll('.protocol-row');
    
    protocolRows.forEach((row) => {
      this.setupDragHandlers(
        row, 
        'protocolId', 
        '.protocol-row', 
        (draggedId, targetId) => this.reorderProtocols(parseInt(draggedId), parseInt(targetId))
      );
    });
  },

  setupSkills() {
    const skillRows = document.querySelectorAll('.skill-row');
    
    skillRows.forEach((row) => {
      this.setupDragHandlers(
        row, 
        'skillId', 
        '.skill-row', 
        (draggedId, targetId) => this.reorderSkills(draggedId, targetId)
      );
    });
  },

  setupStates() {
    const stateCards = document.querySelectorAll('.state-card');
    
    stateCards.forEach((card) => {
      this.setupDragHandlers(
        card, 
        'stateId', 
        '.state-card', 
        (draggedId, targetId) => this.reorderStates(draggedId, targetId)
      );
    });
  },

  setupQuickActions() {
    const quickProtocols = document.querySelectorAll('.quick-protocol');
    
    quickProtocols.forEach((protocol) => {
      this.setupDragHandlers(
        protocol, 
        'protocolId', 
        '.quick-protocol', 
        (draggedId, targetId) => this.reorderQuickActions(parseInt(draggedId), parseInt(targetId))
      );
    });
  },

  /**
   * Generic reorder function to reduce code duplication
   * @param {Array} items - Current items array
   * @param {*} draggedId - ID of dragged item
   * @param {*} targetId - ID of target item
   * @param {Function} saveOrderFn - Function to save new order
   * @param {Function} updateDisplayFn - Function to update display
   * @param {string} itemType - Type of item for logging
   * @param {string} successMessage - Success toast message
   */
  reorderItems(items, draggedId, targetId, saveOrderFn, updateDisplayFn, itemType, successMessage) {
    const currentOrder = items.map(item => item.id);
    const oldOrder = [...currentOrder];
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Reorder items
      currentOrder.splice(draggedIndex, 1);
      currentOrder.splice(targetIndex, 0, draggedId);
      
      // Get item info for logging (use loose equality to handle type differences)
      const draggedItem = items.find(item => item.id == draggedId);
      
      // Save new order
      saveOrderFn(currentOrder);
      
      // Log the operation
      if (draggedItem) {
        window.Storage.addDragDropOperation(
          itemType,
          draggedId,
          draggedItem.name.split('.')[0],
          draggedItem.icon,
          oldOrder,
          currentOrder
        );
      }
      
      // Update display
      updateDisplayFn();
      
      App.showToast(successMessage, 'success');
    }
  },

  reorderProtocols(draggedId, targetId) {
    this.reorderItems(
      App.filteredProtocols,
      draggedId,
      targetId,
      (order) => window.Storage.setProtocolOrder(order),
      () => {
        App.filteredProtocols = window.Storage.getProtocolsInOrder();
        UI.renderProtocols();
        DragDrop.setupProtocols();
        App.setupTooltips();
      },
      'protocol',
      'Protocol order updated'
    );
  },

  reorderSkills(draggedId, targetId) {
    // Convert to proper types for comparison
    const draggedIdInt = parseInt(draggedId);
    const targetIdInt = parseInt(targetId);
    
    this.reorderItems(
      App.filteredSkills,
      draggedIdInt,
      targetIdInt,
      (order) => window.Storage.setSkillOrder(order),
      () => {
        App.filteredSkills = window.Storage.getSkillsInOrder();
        UI.renderSkills();
        DragDrop.setupSkills();
        App.setupTooltips();
      },
      'skill',
      'Skill order updated'
    );
  },

  reorderStates(draggedId, targetId) {
    // Get fresh states data
    const states = window.Storage.getStatesInOrder();
    
    this.reorderItems(
      states,
      draggedId,
      targetId,
      (order) => window.Storage.setStateOrder(order),
      () => {
        App.states = window.Storage.getStatesInOrder();
        UI.renderDashboard();
        // Re-setup drag and drop after rendering
        setTimeout(() => DragDrop.setupStates(), 0);
      },
      'state',
      'States order updated'
    );
  },

  reorderQuickActions(draggedId, targetId) {
    const quickActions = window.Storage.getQuickActionsInOrder();
    const currentOrder = quickActions.map(q => q.id);
    const oldOrder = [...currentOrder];
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Reorder items
      currentOrder.splice(draggedIndex, 1);
      currentOrder.splice(targetIndex, 0, draggedId);
      
      // Get protocol info for logging
      const draggedProtocol = window.Storage.getProtocols().find(p => p.id === draggedId);
      
      // Save new order
      window.Storage.setQuickActionOrder(currentOrder);
      
      // Log the operation
      if (draggedProtocol) {
        window.Storage.addDragDropOperation(
          'quick_action',
          draggedId,
          draggedProtocol.name.split('.')[0],
          draggedProtocol.icon,
          oldOrder,
          currentOrder
        );
      }
      
      // Re-render and re-setup
      UI.renderQuickProtocols();
      setTimeout(() => this.setupQuickActions(), 0);
      
      App.showToast('Quick Actions order updated', 'success');
    }
  }
}; 