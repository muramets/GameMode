// ===== dragdrop.js - Drag & Drop Functionality =====

const DragDrop = {
  // Initialize pagination timer
  paginationTimer: null,
  
  // 🔧 НОВОЕ: Состояние для cross-page drag операций
  crossPageDrag: {
    isActive: false,
    protocolId: null,
    protocol: null, // Объект протокола
    originalGlobalIndex: null // Исходная позиция в глобальном списке
  },
  
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
    
    element.addEventListener('dragend', (e) => {
      // Remove dragging class from the element
      element.classList.remove('dragging');
      
      // Remove all drag-over classes from container elements
      document.querySelectorAll(containerSelector).forEach(el => el.classList.remove('drag-over'));
      // Clear pagination timer on dragend
      if (this.paginationTimer) {
        clearTimeout(this.paginationTimer);
        this.paginationTimer = null;
      }
      
      // Clear drag-hover classes from pagination buttons
      document.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.classList.remove('drag-hover');
      });
      
      // 🔧 НОВОЕ: Очищаем cross-page drag состояние при обычном завершении
      if (this.crossPageDrag.isActive && !e.target.classList.contains('cross-page-ghost')) {
        // Если это не ghost элемент, но cross-page активен, значит операция была отменена
        this.clearCrossPageDrag();
      }
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
    console.log('🔧 DragDrop.setupProtocols() called');
    
    const protocolRows = document.querySelectorAll('.protocol-row');
    console.log(`🔧 Found ${protocolRows.length} protocol rows`);
    
    protocolRows.forEach((row) => {
      this.setupDragHandlers(
        row, 
        'protocolId', 
        '.protocol-row', 
        (draggedId, targetId) => this.reorderProtocols(parseInt(draggedId), parseInt(targetId))
      );
    });
    
    // 🔧 НОВОЕ: Настраиваем drag&drop навигацию между страницами
    console.log('🔧 About to call setupPaginationDragNavigation()');
    try {
      this.setupPaginationDragNavigation();
      console.log('🔧 setupPaginationDragNavigation() completed successfully');
    } catch (error) {
      console.error('🔧 Error in setupPaginationDragNavigation():', error);
    }
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
        // 🔧 ИСПРАВЛЕНИЕ: Применяем фильтры БЕЗ сброса страницы
        App.applyProtocolGroupFilters(false);
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
  },

  // 🔧 НОВОЕ: Настройка навигации между страницами во время drag&drop
  setupPaginationDragNavigation() {
    console.log('🔧 Setting up pagination drag navigation...');
    
    // Проверяем, на какой странице мы находимся
    const currentPage = document.getElementById('current-page');
    console.log('🔧 Current page element:', currentPage);
    console.log('🔧 Current page content:', currentPage ? currentPage.textContent : 'not found');
    
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    console.log('🔧 Found pagination buttons:', { 
      prevBtn: !!prevBtn, 
      nextBtn: !!nextBtn,
      prevDisabled: prevBtn?.disabled,
      nextDisabled: nextBtn?.disabled
    });
    
    // Дополнительная проверка: ищем все элементы с ID, содержащим 'page'
    const allPageElements = document.querySelectorAll('[id*="page"]');
    console.log('🔧 All elements with "page" in ID:', Array.from(allPageElements).map(el => el.id));
    
    // Проверяем, есть ли элементы пагинации вообще
    const protocolsContainer = document.querySelector('.protocols-container, #protocols-container, .protocols, #protocols');
    console.log('🔧 Protocols container found:', !!protocolsContainer);
    
    if (!prevBtn && !nextBtn) {
      console.log('🔧 No pagination buttons found, skipping setup');
      return;
    }
    
    // Очищаем предыдущие обработчики, если они есть
    if (prevBtn) {
      // Удаляем старые обработчики, если они существуют
      if (prevBtn._dragEnterHandler) {
        prevBtn.removeEventListener('dragenter', prevBtn._dragEnterHandler);
      }
      if (prevBtn._dragLeaveHandler) {
        prevBtn.removeEventListener('dragleave', prevBtn._dragLeaveHandler);
      }
      if (prevBtn._dragOverHandler) {
        prevBtn.removeEventListener('dragover', prevBtn._dragOverHandler);
      }
    }
    
    if (nextBtn) {
      // Удаляем старые обработчики, если они существуют
      if (nextBtn._dragEnterHandler) {
        nextBtn.removeEventListener('dragenter', nextBtn._dragEnterHandler);
      }
      if (nextBtn._dragLeaveHandler) {
        nextBtn.removeEventListener('dragleave', nextBtn._dragLeaveHandler);
      }
      if (nextBtn._dragOverHandler) {
        nextBtn.removeEventListener('dragover', nextBtn._dragOverHandler);
      }
    }

    // Добавляем новые обработчики (даже для disabled кнопок)
    if (prevBtn) {
      console.log('🔧 Adding drag handlers to prev button (disabled:', prevBtn.disabled, ')');
      
      // Создаем обработчики и сохраняем их для последующего удаления
      prevBtn._dragEnterHandler = (e) => this.handlePaginationDragEnter(e, 'prev');
      prevBtn._dragLeaveHandler = (e) => this.handlePaginationDragLeave(e);
      prevBtn._dragOverHandler = (e) => this.handlePaginationDragOver(e);
      
      prevBtn.addEventListener('dragenter', prevBtn._dragEnterHandler);
      prevBtn.addEventListener('dragleave', prevBtn._dragLeaveHandler);
      prevBtn.addEventListener('dragover', prevBtn._dragOverHandler);
    }
    
    if (nextBtn) {
      console.log('🔧 Adding drag handlers to next button (disabled:', nextBtn.disabled, ')');
      
      // Создаем обработчики и сохраняем их для последующего удаления
      nextBtn._dragEnterHandler = (e) => this.handlePaginationDragEnter(e, 'next');
      nextBtn._dragLeaveHandler = (e) => this.handlePaginationDragLeave(e);
      nextBtn._dragOverHandler = (e) => this.handlePaginationDragOver(e);
      
      nextBtn.addEventListener('dragenter', nextBtn._dragEnterHandler);
      nextBtn.addEventListener('dragleave', nextBtn._dragLeaveHandler);
      nextBtn.addEventListener('dragover', nextBtn._dragOverHandler);
    }
  },

  // Обработчик dragenter для кнопок пагинации
  handlePaginationDragEnter(e, direction) {
    console.log('🔧 Pagination drag enter:', direction, e.target);
    e.preventDefault();
    
    // Проверяем, что идет drag operation с протоколом
    const draggingProtocol = document.querySelector('.protocol-row.dragging');
    console.log('🔧 Dragging protocol found:', !!draggingProtocol);
    
    if (!draggingProtocol) {
      return;
    }
    
    console.log('🔧 Adding drag-hover class to button');
    e.target.classList.add('drag-hover');
    
    // Устанавливаем таймер для переключения страницы только если его еще нет
    if (this.paginationTimer) {
      console.log('🔧 Timer already exists, clearing it');
      clearTimeout(this.paginationTimer);
    }
    
    console.log('🔧 Setting pagination timer for direction:', direction);
    this.paginationTimer = setTimeout(() => {
      console.log('🔧 Timer fired! Direction:', direction, 'Current page:', App.protocolsPage);
      
      // Проверяем, что протокол все еще перетаскивается
      if (!document.querySelector('.protocol-row.dragging')) {
        console.log('🔧 No dragging protocol found, aborting navigation');
        return;
      }
      
      // 🔧 НОВОЕ: Сохраняем состояние drag операции
      this.saveCrossPageDragState(draggingProtocol);
      
      const totalPages = Math.ceil(App.filteredProtocols.length / App.protocolsPerPage);
      console.log('🔧 Page check:', { currentPage: App.protocolsPage, totalPages, direction });
      
      // Дополнительная проверка: не переключаемся на ту же страницу
      let shouldNavigate = false;
      let newPage = App.protocolsPage;
      
      if (direction === 'prev' && App.protocolsPage > 1) {
        newPage = App.protocolsPage - 1;
        shouldNavigate = true;
      } else if (direction === 'next' && App.protocolsPage < totalPages) {
        newPage = App.protocolsPage + 1;
        shouldNavigate = true;
      }
      
      if (shouldNavigate) {
        console.log(`🔄 Moving to ${direction === 'prev' ? 'previous' : 'next'} page (${newPage})...`);
        App.protocolsPage = newPage;
        UI.renderProtocols();
        DragDrop.setupProtocols();
        
        // 🔧 НОВОЕ: Восстанавливаем drag состояние на новой странице
        setTimeout(() => {
          this.restoreCrossPageDragState();
        }, 100);
        
        App.setupTooltips();
        App.updatePagination();
        console.log('✅ Moved to page', App.protocolsPage);
      } else {
        console.log('🚫 Navigation not possible:', { direction, currentPage: App.protocolsPage, totalPages });
      }
      
      // Очищаем таймер после выполнения
      this.paginationTimer = null;
    }, 800); // 800ms задержка для переключения страницы
  },

  // Обработчик dragleave для кнопок пагинации  
  handlePaginationDragLeave(e) {
    console.log('🔧 Pagination drag leave:', e.target);
    
    // Проверяем, что мы действительно покидаем кнопку, а не переходим к дочернему элементу
    const rect = e.target.getBoundingClientRect();
    const isStillInside = e.clientX >= rect.left && e.clientX <= rect.right &&
                          e.clientY >= rect.top && e.clientY <= rect.bottom;
    
    if (!isStillInside) {
      e.target.classList.remove('drag-hover');
      
      // Отменяем таймер, если курсор действительно ушел с кнопки
      if (this.paginationTimer) {
        console.log('🔧 Clearing pagination timer on leave');
        clearTimeout(this.paginationTimer);
        this.paginationTimer = null;
      }
    }
  },

  // Обработчик dragover для кнопок пагинации
  handlePaginationDragOver(e) {
    // Уменьшаем количество логов для dragover, так как он вызывается очень часто
    if (Math.random() < 0.01) { // Логируем только 1% вызовов
      console.log('🔧 Pagination drag over:', e.target);
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  },

  // 🔧 НОВОЕ: Сохраняем состояние drag операции для cross-page перемещения
  saveCrossPageDragState(draggingElement) {
    const protocolId = parseInt(draggingElement.dataset.protocolId);
    const protocol = App.filteredProtocols.find(p => p.id === protocolId);
    
    if (!protocol) {
      console.log('🔧 Protocol not found for cross-page drag');
      return;
    }
    
    this.crossPageDrag.isActive = true;
    this.crossPageDrag.protocolId = protocolId;
    this.crossPageDrag.protocol = protocol;
    this.crossPageDrag.originalGlobalIndex = App.filteredProtocols.findIndex(p => p.id === protocolId);
    
    console.log('🔧 Cross-page drag state saved:', {
      protocolId,
      protocolName: protocol.name,
      originalGlobalIndex: this.crossPageDrag.originalGlobalIndex
    });
  },

  // 🔧 НОВОЕ: Восстанавливаем состояние drag операции после переключения страницы
  restoreCrossPageDragState() {
    if (!this.crossPageDrag.isActive) {
      return;
    }
    
    console.log('🔧 Restoring cross-page drag state...');
    
    // Настраиваем обработчики для drop на новой странице
    this.setupCrossPageDropHandlers();
  },

   
  // 🔧 НОВОЕ: Настраиваем drop обработчики для новой страницы
  setupCrossPageDropHandlers() {
    const protocolRows = document.querySelectorAll('.protocol-row:not(.cross-page-ghost)');
    
    protocolRows.forEach(row => {
      // Удаляем существующие обработчики если есть
      row.removeEventListener('dragover', this.handleCrossPageDragOver);
      row.removeEventListener('dragleave', this.handleCrossPageDragLeave);
      row.removeEventListener('drop', this.handleCrossPageDrop);
      
      // Добавляем новые обработчики
      row.addEventListener('dragover', (e) => this.handleCrossPageDragOver(e));
      row.addEventListener('dragleave', (e) => this.handleCrossPageDragLeave(e));
      row.addEventListener('drop', (e) => this.handleCrossPageDrop(e, row));
    });
  },
   
  // 🔧 НОВОЕ: Обработчик dragover для cross-page операций
  handleCrossPageDragOver(e) {
    if (!this.crossPageDrag.isActive) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Убираем подсветку с других элементов
    document.querySelectorAll('.protocol-row.drag-over').forEach(row => {
      if (row !== e.currentTarget) {
        row.classList.remove('drag-over');
      }
    });
    
    // Добавляем визуальную подсветку
    const target = e.currentTarget;
    if (!target.classList.contains('cross-page-ghost')) {
      target.classList.add('drag-over');
    }
  },
   
  // 🔧 НОВОЕ: Обработчик dragleave для cross-page операций
  handleCrossPageDragLeave(e) {
    if (!this.crossPageDrag.isActive) return;
    
    // Проверяем, что мы действительно покидаем элемент
    const rect = e.currentTarget.getBoundingClientRect();
    const isStillInside = e.clientX >= rect.left && e.clientX <= rect.right &&
                          e.clientY >= rect.top && e.clientY <= rect.bottom;
    
    if (!isStillInside) {
      e.currentTarget.classList.remove('drag-over');
    }
  },
   
  // 🔧 НОВОЕ: Обработчик drop для cross-page операций
  handleCrossPageDrop(e, targetRow) {
    e.preventDefault();
    
    if (!this.crossPageDrag.isActive) return;
    
    const targetProtocolId = parseInt(targetRow.dataset.protocolId);
    const draggedProtocolId = this.crossPageDrag.protocolId;
    
    console.log('�� Cross-page drop:', {
      draggedProtocolId,
      targetProtocolId,
      originalGlobalIndex: this.crossPageDrag.originalGlobalIndex
    });
    
    // Вычисляем новую позицию
    const targetGlobalIndex = App.filteredProtocols.findIndex(p => p.id === targetProtocolId);
    const currentGlobalIndex = this.crossPageDrag.originalGlobalIndex;
    
    if (targetGlobalIndex !== -1 && currentGlobalIndex !== -1 && targetGlobalIndex !== currentGlobalIndex) {
      // Выполняем перестановку в глобальном списке
      this.reorderProtocols(draggedProtocolId, targetProtocolId);
    }
    
    // Очищаем состояние
    this.clearCrossPageDrag();
  },
   
  // 🔧 НОВОЕ: Очищаем состояние cross-page drag операции
  clearCrossPageDrag() {
    // Убираем drag-over классы
    document.querySelectorAll('.protocol-row.drag-over').forEach(row => {
      row.classList.remove('drag-over');
    });
    
    // Очищаем состояние
    this.crossPageDrag = {
      isActive: false,
      protocolId: null,
      protocol: null,
      originalGlobalIndex: null
    };
    
    console.log('🔧 Cross-page drag state cleared');
  }
}; 