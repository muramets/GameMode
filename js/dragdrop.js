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
    const isTableRow = element.classList.contains('protocol-row') || element.classList.contains('innerface-row');
    
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
    clone.removeAttribute('data-innerface-id');
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

  setupInnerfaces() {
    const innerfaceRows = document.querySelectorAll('.innerface-row');
    
    innerfaceRows.forEach((row) => {
      this.setupDragHandlers(
        row, 
        'innerfaceId', 
        '.innerface-row', 
        (draggedId, targetId) => this.reorderInnerfaces(draggedId, targetId)
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
    console.log(`🔄 REORDER ITEMS DEBUG for ${itemType}:`, {
      itemsCount: items.length,
      draggedId,
      targetId,
      draggedIdType: typeof draggedId,
      targetIdType: typeof targetId,
      itemsStructure: items.map(item => ({ id: item.id, idType: typeof item.id, name: item.name }))
    });
    
    const currentOrder = items.map(item => item.id);
    console.log(`🔄 Current order for ${itemType}:`, currentOrder);
    
    const oldOrder = [...currentOrder];
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);
    
    console.log(`🔄 Index lookup for ${itemType}:`, {
      draggedIndex,
      targetIndex,
      draggedIdInOrder: currentOrder.includes(draggedId),
      targetIdInOrder: currentOrder.includes(targetId)
    });
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Reorder items
      currentOrder.splice(draggedIndex, 1);
      currentOrder.splice(targetIndex, 0, draggedId);
      
      console.log(`🔄 New order for ${itemType}:`, currentOrder);
      
      // Get item info for logging (use loose equality to handle type differences)
      const draggedItem = items.find(item => item.id == draggedId);
      console.log(`🔄 Found dragged item for ${itemType}:`, draggedItem);
      
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
    } else {
      console.error(`🚨 REORDER FAILED for ${itemType}:`, {
        draggedId,
        targetId,
        draggedIndex,
        targetIndex,
        currentOrder
      });
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

  reorderInnerfaces(draggedId, targetId) {
    // Convert to proper types for comparison
    const draggedIdInt = parseInt(draggedId);
    const targetIdInt = parseInt(targetId);
    
    this.reorderItems(
      App.filteredInnerfaces,
      draggedIdInt,
      targetIdInt,
      (order) => window.Storage.setInnerfaceOrder(order),
      () => {
        App.filteredInnerfaces = window.Storage.getInnerfacesInOrder();
        UI.renderInnerfaces();
        DragDrop.setupInnerfaces();
        App.setupTooltips();
      },
      'innerface',
      'Innerface order updated'
    );
  },

  reorderStates(draggedId, targetId) {
    console.log('🔄 DRAG & DROP DEBUG for states:', {
      draggedId,
      targetId,
      draggedIdType: typeof draggedId,
      targetIdType: typeof targetId
    });
    
    // Get fresh states data from storage
    const states = window.Storage.getStatesInOrder();
    console.log('🔄 States data from storage:', {
      statesCount: states.length,
      statesData: states,
      stateIds: states.map(s => ({ id: s.id, type: typeof s.id }))
    });
    
    // Check if state IDs need conversion
    const draggedIdConverted = typeof draggedId === 'string' ? draggedId : draggedId.toString();
    const targetIdConverted = typeof targetId === 'string' ? targetId : targetId.toString();
    
    console.log('🔄 Converted IDs:', {
      originalDraggedId: draggedId,
      convertedDraggedId: draggedIdConverted,
      originalTargetId: targetId,
      convertedTargetId: targetIdConverted
    });
    
    this.reorderItems(
      states,
      draggedIdConverted,
      targetIdConverted,
      (order) => {
        console.log('🔄 Saving new state order:', order);
        // Save the new state order first
        window.Storage.setStateOrder(order);
        // Also update App.states immediately to prevent conflicts
        App.states = window.Storage.getStatesInOrder();
        console.log('🔄 Updated App.states:', App.states.length);
      },
      () => {
        console.log('🔄 Updating display after state reorder...');
        // Update display by re-rendering only the states section of dashboard
        // This prevents full dashboard re-render which might conflict with drag & drop
        UI.renderDashboard();
        // Re-setup drag and drop after a brief delay to ensure DOM is updated
        setTimeout(() => {
          console.log('🔄 Re-setting up states drag & drop...');
          DragDrop.setupStates();
        }, 100);
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