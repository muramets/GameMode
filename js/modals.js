// ===== modals.js - Modal Functionality =====

const Modals = {
  currentInnerfaceId: null,
  currentProtocolId: null,
  currentStateId: null,

  init() {
    console.log('🔧 Modals.init() called - initializing modal handlers');
    this.setupAddInnerfaceModal();
    this.setupAddProtocolModal();
    this.setupAddStateModal();
    this.setupQuickActionModal();
    this.setupColorPickers();
    
    // 🔧 Ensure delete buttons have event listeners
    this.setupDeleteButtonListeners();
    
    console.log('✅ All modal handlers initialized');
    
    // 🐛 DEBUG: Check if delete buttons exist
    console.log('🐛 DELETE BUTTONS DEBUG:');
    console.log('  - delete-innerface-btn:', document.getElementById('delete-innerface-btn'));
    console.log('  - delete-protocol-btn:', document.getElementById('delete-protocol-btn'));
    console.log('  - delete-state-btn:', document.getElementById('delete-state-btn'));
  },

  setupAddInnerfaceModal() {
    console.log('🔧 Setting up add innerface modal');
    const addInnerfaceBtn = document.getElementById('add-innerface-btn');
    const modal = document.getElementById('add-innerface-modal');
    const modalContent = modal.querySelector('.modal-content');
    const form = document.getElementById('add-innerface-form');
    
    console.log('🔧 Add innerface elements:', { addInnerfaceBtn, modal, form });
    
    if (!addInnerfaceBtn || !modal || !form) {
      console.error('❌ Missing elements for innerface modal:', { addInnerfaceBtn, modal, form });
      return;
    }
    
    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      this.currentInnerfaceId = null;
      form.reset();
      
      // Reset modal to "Add" mode
      document.getElementById('innerface-modal-title').textContent = 'Add New Innerface';
      document.getElementById('submit-innerface-btn').textContent = 'Add Innerface';
      const deleteBtn = document.getElementById('delete-innerface-btn');
      if (deleteBtn) {
        deleteBtn.style.display = 'none';
      }
    };
    
    // Open modal button
    addInnerfaceBtn.addEventListener('click', () => {
      this.openInnerfaceModal();
    });
    
    // Close modal when clicking the X
    const closeBtn = document.getElementById('close-innerface-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancel-innerface-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', closeModal);
    }
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
    
    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const innerfaceData = {
        name: formData.get('innerface-name'),
        description: formData.get('innerface-description'),
        icon: formData.get('innerface-emoji'),
        hover: formData.get('innerface-hover'),
        initialScore: parseFloat(formData.get('innerface-initial-score')),
        color: formData.get('innerface-color') || '#7fb3d3' // Default blue color
      };
      
      // 🐛 DEBUG: Detailed logging for production debugging
      console.log('🐛 INNERFACE FORM SUBMISSION DEBUG:');
      console.log('📋 Raw form data:', {
        'innerface-name': formData.get('innerface-name'),
        'innerface-description': formData.get('innerface-description'), 
        'innerface-emoji': formData.get('innerface-emoji'),
        'innerface-hover': formData.get('innerface-hover'),
        'innerface-initial-score': formData.get('innerface-initial-score'),
        'innerface-color': formData.get('innerface-color')
      });
      console.log('📊 Processed innerface data:', innerfaceData);
      console.log('🔍 Validation checks:');
      console.log('  - name:', innerfaceData.name, '(truthy:', !!innerfaceData.name, ')');
      console.log('  - icon:', innerfaceData.icon, '(truthy:', !!innerfaceData.icon, ')');
      console.log('  - initialScore:', innerfaceData.initialScore, '(type:', typeof innerfaceData.initialScore, ')');
      console.log('  - initialScore >= 0:', innerfaceData.initialScore >= 0);
      console.log('  - initialScore <= 10:', innerfaceData.initialScore <= 10);
      console.log('  - isNaN(initialScore):', isNaN(innerfaceData.initialScore));
      
      // Validate data
      if (!innerfaceData.name || !innerfaceData.icon || innerfaceData.initialScore < 0 || innerfaceData.initialScore > 10) {
        console.log('❌ VALIDATION FAILED - reasons:');
        if (!innerfaceData.name) console.log('  - Missing name');
        if (!innerfaceData.icon) console.log('  - Missing icon');
        if (innerfaceData.initialScore < 0) console.log('  - Score too low:', innerfaceData.initialScore);
        if (innerfaceData.initialScore > 10) console.log('  - Score too high:', innerfaceData.initialScore);
        if (isNaN(innerfaceData.initialScore)) console.log('  - Score is NaN');
        
        App.showToast('Please fill all required fields and ensure score is between 0-10', 'error');
        return;
      }
      
      console.log('✅ VALIDATION PASSED - proceeding with submission');
      
      if (this.currentInnerfaceId) {
        // Edit mode
        const updatedInnerface = window.Storage.updateInnerfaceFull(this.currentInnerfaceId, innerfaceData);
        if (updatedInnerface) {
          App.showToast('Innerface updated successfully!', 'success');
          
          // Update filtered innerfaces
          App.filteredInnerfaces = window.Storage.getInnerfacesInOrder();
          if (App.currentPage === 'innerfaces') {
            UI.renderInnerfaces();
            DragDrop.setupInnerfaces();
            App.setupTooltips();
          }
          
          // 🔄 Sync with backend after successful update
          console.log('🔄 Triggering sync after innerface update...');
          window.Storage.syncWithBackend().catch(error => {
            console.error('❌ Sync failed after innerface update:', error);
            App.showToast('⚠️ Innerface saved locally but sync failed', 'warning');
          });
          
          closeModal();
        } else {
          App.showToast('Failed to update innerface', 'error');
        }
      } else {
        // Add mode
        const newInnerface = window.Storage.addInnerface(innerfaceData);
        if (newInnerface) {
          App.showToast('Innerface added successfully!', 'success');
          
          // Update filtered innerfaces
          App.filteredInnerfaces = window.Storage.getInnerfacesInOrder();
          if (App.currentPage === 'innerfaces') {
            UI.renderInnerfaces();
            DragDrop.setupInnerfaces();
            App.setupTooltips();
          }
          
          // 🔄 Sync with backend after successful add
          console.log('🔄 Triggering sync after innerface add...');
          window.Storage.syncWithBackend().catch(error => {
            console.error('❌ Sync failed after innerface add:', error);
            App.showToast('⚠️ Innerface saved locally but sync failed', 'warning');
          });
          
          closeModal();
        } else {
          App.showToast('Failed to add innerface', 'error');
        }
      }
    });
    
    // 🔧 Delete button event listener is now handled by setupDeleteButtonListeners()
  },

  openInnerfaceModal() {
    console.log('🔧 openInnerfaceModal() called');
    const modal = document.getElementById('add-innerface-modal');
    console.log('🔧 Modal element:', modal);
    if (modal) {
      console.log('🔧 Adding active class to modal');
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Initialize color picker
      this.initializeColorPickersOnModalOpen('innerface');
      
      // Focus on first input
      const firstInput = document.getElementById('innerface-name');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    } else {
      console.error('❌ Modal element not found!');
    }
  },

  editInnerface(innerfaceId) {
    // Convert string ID to number if needed for comparison
    const searchId = typeof innerfaceId === 'string' ? parseInt(innerfaceId) || innerfaceId : innerfaceId;
    
    const innerface = window.Storage.getInnerfaceById(searchId);
    if (!innerface) {
      App.showToast('Innerface not found', 'error');
      return;
    }
    
    this.currentInnerfaceId = searchId;
    
    // Parse name and description
    const nameParts = innerface.name.split('. ');
    const name = nameParts[0];
    const description = nameParts.slice(1).join('. ');
    
    // Populate form
    document.getElementById('innerface-name').value = name;
    document.getElementById('innerface-description').value = description;
    document.getElementById('innerface-emoji').value = innerface.icon;
    document.getElementById('innerface-hover').value = innerface.hover || '';
    document.getElementById('innerface-initial-score').value = innerface.initialScore;
    
    // Load saved color
    if (innerface.color) {
      this.loadSavedColor('innerface', innerface.color);
    }
    
    // Update modal for edit mode
    document.getElementById('innerface-modal-title').textContent = 'Edit Innerface';
    document.getElementById('submit-innerface-btn').textContent = 'Update Innerface';
    const deleteBtn = document.getElementById('delete-innerface-btn');
    if (deleteBtn) {
      deleteBtn.style.display = 'flex';
    }
    
    this.openInnerfaceModal();
  },

  deleteCurrentInnerface(innerfaceId) {
    console.log('🗑️ deleteCurrentInnerface called with ID:', innerfaceId);
    
    // Get innerface info for logging
    const innerface = window.Storage.getInnerfaceById(innerfaceId);
    if (innerface) {
      console.log('🗑️ Innerface found:', innerface.name);
    } else {
      console.error('❌ Innerface not found with ID:', innerfaceId);
      App.showToast('Innerface not found', 'error');
      return;
    }
    
    console.log('🗑️ Deleting innerface directly without confirmation...');
    
    const success = window.Storage.deleteInnerface(innerfaceId);
    console.log('🗑️ Storage.deleteInnerface result:', success);
    
    if (success) {
      App.showToast('Innerface deleted successfully', 'success');
      
      // Close modal
      const modal = document.getElementById('add-innerface-modal');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        console.log('🗑️ Modal closed');
      }
      
      // Reset current innerface ID
      this.currentInnerfaceId = null;
      
      // Update filtered innerfaces
      App.filteredInnerfaces = window.Storage.getInnerfacesInOrder();
      if (App.currentPage === 'innerfaces') {
        UI.renderInnerfaces();
        DragDrop.setupInnerfaces();
        App.setupTooltips();
        console.log('🗑️ Innerfaces page refreshed');
      }
      
      // 🔄 Sync with backend after successful deletion
      console.log('🔄 Triggering sync after innerface deletion...');
      window.Storage.syncWithBackend().catch(error => {
        console.error('❌ Sync failed after innerface deletion:', error);
        App.showToast('⚠️ Innerface deleted locally but sync failed', 'warning');
      });
    } else {
      App.showToast('Failed to delete innerface', 'error');
    }
  },

  // Protocol Modal Methods
  setupAddProtocolModal() {
    const addProtocolBtn = document.getElementById('add-protocol-btn');
    const modal = document.getElementById('add-protocol-modal');
    const form = document.getElementById('add-protocol-form');
    
    if (!addProtocolBtn || !modal || !form) return;
    
    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      this.currentProtocolId = null;
      this.resetProtocolTargets();
      form.reset();
      
      // Reset modal to "Add" mode
      document.getElementById('protocol-modal-title').textContent = 'Add New Protocol';
      document.getElementById('submit-protocol-btn').textContent = 'Add Protocol';
      const deleteBtn = document.getElementById('delete-protocol-btn');
      if (deleteBtn) {
        deleteBtn.style.display = 'none';
      }
    };
    
    // Open modal button
    addProtocolBtn.addEventListener('click', () => {
      this.openProtocolModal();
    });
    
    // Close modal when clicking the X
    const closeBtn = document.getElementById('close-protocol-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancel-protocol-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', closeModal);
    }
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
    
    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      
      // 🔧 НОВОЕ: Получаем выбранные innerfaces из grid'а вместо selectedTargets массива
      const selectedInnerfaceIds = this.getSelectedProtocolInnerfaces();
      
      const protocolData = {
        name: formData.get('protocol-name'),
        description: formData.get('protocol-description'),
        icon: formData.get('protocol-emoji'),
        hover: formData.get('protocol-hover'),
        weight: parseFloat(formData.get('protocol-weight')),
        targets: selectedInnerfaceIds,
        color: formData.get('protocol-color') || '#7fb3d3' // Default blue color
      };
      
      // 🐛 DEBUG: Detailed logging for production debugging
      console.log('🐛 PROTOCOL FORM SUBMISSION DEBUG:');
      console.log('📋 Raw form data:', {
        'protocol-name': formData.get('protocol-name'),
        'protocol-description': formData.get('protocol-description'), 
        'protocol-emoji': formData.get('protocol-emoji'),
        'protocol-hover': formData.get('protocol-hover'),
        'protocol-weight': formData.get('protocol-weight')
      });
      console.log('📊 Processed protocol data:', protocolData);
      console.log('🔍 Validation checks:');
      console.log('  - name:', protocolData.name, '(truthy:', !!protocolData.name, ')');
      console.log('  - icon:', protocolData.icon, '(truthy:', !!protocolData.icon, ')');
      console.log('  - weight:', protocolData.weight, '(type:', typeof protocolData.weight, ')');
      console.log('  - weight >= 0:', protocolData.weight >= 0);
      console.log('  - weight <= 1:', protocolData.weight <= 1);
      console.log('  - isNaN(weight):', isNaN(protocolData.weight));
      console.log('  - selectedInnerfaces:', selectedInnerfaceIds);
      
      // Validate data
      if (!protocolData.name || !protocolData.icon || protocolData.weight < 0 || protocolData.weight > 1) {
        console.log('❌ PROTOCOL VALIDATION FAILED - reasons:');
        if (!protocolData.name) console.log('  - Missing name');
        if (!protocolData.icon) console.log('  - Missing icon');
        if (protocolData.weight < 0) console.log('  - Weight too low:', protocolData.weight);
        if (protocolData.weight > 1) console.log('  - Weight too high:', protocolData.weight);
        if (isNaN(protocolData.weight)) console.log('  - Weight is NaN');
        
        App.showToast('Please fill all required fields and ensure weight is between 0-1', 'error');
        return;
      }
      
      console.log('✅ PROTOCOL VALIDATION PASSED - proceeding with submission');
      
      if (this.currentProtocolId) {
        // Edit mode
        const updatedProtocol = window.Storage.updateProtocolFull(this.currentProtocolId, protocolData);
        if (updatedProtocol) {
          App.showToast('Protocol updated successfully!', 'success');
          
          // Update filtered protocols
          App.filteredProtocols = window.Storage.getProtocolsInOrder();
          if (App.currentPage === 'protocols') {
            UI.renderProtocols();
            DragDrop.setupProtocols();
            App.setupTooltips();
          }
          
          // Update history in real-time if we're on the history page or need to refresh it
          if (App.currentPage === 'history') {
            // Reset history filter to refresh data and re-apply current filters
            App.filteredHistory = [];
            App.applyHistoryFilters();
          } else {
            // If not on history page, just reset the history data for next visit
            App.filteredHistory = [];
          }
          
          // 🔄 Sync with backend after successful update
          console.log('🔄 Triggering sync after protocol update...');
          window.Storage.syncWithBackend().catch(error => {
            console.error('❌ Sync failed after protocol update:', error);
            App.showToast('⚠️ Protocol saved locally but sync failed', 'warning');
          });
          
          closeModal();
        } else {
          App.showToast('Failed to update protocol', 'error');
        }
      } else {
        // Add mode
        const newProtocol = window.Storage.addProtocol(protocolData);
        if (newProtocol) {
          App.showToast('Protocol added successfully!', 'success');
          
          // Update filtered protocols
          App.filteredProtocols = window.Storage.getProtocolsInOrder();
          if (App.currentPage === 'protocols') {
            UI.renderProtocols();
            DragDrop.setupProtocols();
            App.setupTooltips();
          }
          
          // Update history in real-time if we're on the history page or need to refresh it
          if (App.currentPage === 'history') {
            // Reset history filter to refresh data and re-apply current filters
            App.filteredHistory = [];
            App.applyHistoryFilters();
          } else {
            // If not on history page, just reset the history data for next visit
            App.filteredHistory = [];
          }
          
          // 🔄 Sync with backend after successful add
          console.log('🔄 Triggering sync after protocol add...');
          window.Storage.syncWithBackend().catch(error => {
            console.error('❌ Sync failed after protocol add:', error);
            App.showToast('⚠️ Protocol saved locally but sync failed', 'warning');
          });
          
          closeModal();
        } else {
          App.showToast('Failed to add protocol', 'error');
        }
      }
    });
  },

  // 🔧 НОВОЕ: Функции для работы с grid интерфейсом протокола
  resetProtocolTargets() {
    // Сбрасываем выбор во всех innerface items
    const grid = document.getElementById('protocol-innerfaces-grid');
    if (grid) {
      const allItems = grid.querySelectorAll('.dependency-item');
      allItems.forEach(item => {
        item.classList.remove('selected');
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.checked = false;
        }
      });
    }
  },

  populateProtocolInnerfaces() {
    // Check if Storage is available and methods exist
    if (!window.Storage || typeof window.Storage.getInnerfaces !== 'function') {
      console.warn('Storage not available yet, retrying...');
      setTimeout(() => this.populateProtocolInnerfaces(), 100);
      return;
    }

    // Populate innerfaces grid
    const innerfacesGrid = document.getElementById('protocol-innerfaces-grid');
    const innerfaces = window.Storage.getInnerfaces();
    
    if (innerfacesGrid) {
      innerfacesGrid.innerHTML = innerfaces.map(innerface => {
        const nameParts = innerface.name.split('. ');
        const mainName = nameParts[0];
        
        return `
          <div class="dependency-item" data-type="innerface" data-id="${innerface.id}">
            <input type="checkbox" value="${innerface.id}" data-type="innerface" style="display: none;">
            <div class="dependency-item-info">
              <span class="dependency-item-icon">${innerface.icon}</span>
              <div class="dependency-item-name">${mainName}</div>
            </div>
          </div>
        `;
      }).join('');
      
      // Add click handlers
      innerfacesGrid.querySelectorAll('.dependency-item').forEach(item => {
        item.addEventListener('click', (e) => {
          this.toggleProtocolInnerface(item);
        });
      });
    }
  },

  toggleProtocolInnerface(item) {
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    
    // Проверяем лимит на 3 выбранных innerfaces
    const selectedCount = this.getSelectedProtocolInnerfaces().length;
    
    if (!checkbox.checked && selectedCount >= 3) {
      App.showToast('Maximum 3 innerfaces can be selected', 'warning');
      return;
    }
    
    checkbox.checked = !checkbox.checked;
    
    if (checkbox.checked) {
      item.classList.add('selected');
      // Добавляем анимацию при выборе
      item.classList.add('just-selected');
      setTimeout(() => {
        item.classList.remove('just-selected');
      }, 500);
    } else {
      item.classList.remove('selected');
    }
    
    // Обновляем состояние disabled для остальных элементов
    this.updateProtocolInnerfaceStates();
  },

  updateProtocolInnerfaceStates() {
    const grid = document.getElementById('protocol-innerfaces-grid');
    if (!grid) return;
    
    const selectedCount = this.getSelectedProtocolInnerfaces().length;
    const allItems = grid.querySelectorAll('.dependency-item');
    
    allItems.forEach(item => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      const isSelected = checkbox && checkbox.checked;
      
      if (!isSelected && selectedCount >= 3) {
        item.classList.add('disabled');
      } else {
        item.classList.remove('disabled');
      }
    });
  },

  getSelectedProtocolInnerfaces() {
    // Получаем ID выбранных innerfaces из grid'а
    const checkboxes = document.querySelectorAll('#protocol-innerfaces-grid input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => parseInt(cb.value));
  },

  setSelectedProtocolInnerfaces(innerfaceIds) {
    // Устанавливаем выбранные innerfaces в grid
    if (!Array.isArray(innerfaceIds)) return;
    
    innerfaceIds.forEach(innerfaceId => {
      const item = document.querySelector(`#protocol-innerfaces-grid .dependency-item[data-id="${innerfaceId}"]`);
      const checkbox = item?.querySelector('input[type="checkbox"]');
      if (checkbox && item) {
        checkbox.checked = true;
        item.classList.add('selected');
      }
    });
    
    // Обновляем состояние disabled элементов
    this.updateProtocolInnerfaceStates();
  },

  openProtocolModal() {
    const modal = document.getElementById('add-protocol-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      this.resetProtocolTargets();
      this.populateProtocolInnerfaces();
      
      // Initialize color picker
      this.initializeColorPickersOnModalOpen('protocol');
      
      // Focus on first input
      const firstInput = document.getElementById('protocol-name');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  },

  editProtocol(protocolId) {
    // Convert string ID to number if needed for comparison
    const searchId = typeof protocolId === 'string' ? parseInt(protocolId) || protocolId : protocolId;
    
    const protocol = window.Storage.getProtocolById(searchId);
    if (!protocol) {
      App.showToast('Protocol not found', 'error');
      return;
    }
    
    this.currentProtocolId = searchId;
    
    // Parse name and description
    const nameParts = protocol.name.split('. ');
    const name = nameParts[0];
    const description = nameParts.slice(1).join('. ');
    
    // Populate form
    document.getElementById('protocol-name').value = name;
    document.getElementById('protocol-description').value = description;
    document.getElementById('protocol-emoji').value = protocol.icon;
    document.getElementById('protocol-hover').value = protocol.hover || '';
    document.getElementById('protocol-weight').value = protocol.weight;
    
    // Load saved color
    if (protocol.color) {
      this.loadSavedColor('protocol', protocol.color);
    }
    
    // Update modal for edit mode
    document.getElementById('protocol-modal-title').textContent = 'Edit Protocol';
    document.getElementById('submit-protocol-btn').textContent = 'Update Protocol';
    const deleteBtn = document.getElementById('delete-protocol-btn');
    if (deleteBtn) {
      deleteBtn.style.display = 'flex';
    }
    
    // Open modal first
    this.openProtocolModal();
    
    // 🔧 НОВОЕ: Загружаем выбранные innerfaces в grid после открытия модалки
    setTimeout(() => {
      if (protocol.targets && protocol.targets.length > 0) {
        this.setSelectedProtocolInnerfaces(protocol.targets);
      }
    }, 100);
  },

  deleteCurrentProtocol(protocolId) {
    console.log('🗑️ deleteCurrentProtocol called with ID:', protocolId);
    console.log('🗑️ Deleting protocol directly without confirmation...');
    
    const success = window.Storage.deleteProtocol(protocolId);
    console.log('🗑️ Storage.deleteProtocol result:', success);
    
    if (success) {
      App.showToast('Protocol deleted successfully', 'success');
      
      // Close modal
      const modal = document.getElementById('add-protocol-modal');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
      
      // Update filtered protocols
      App.filteredProtocols = window.Storage.getProtocolsInOrder();
      if (App.currentPage === 'protocols') {
        UI.renderProtocols();
        DragDrop.setupProtocols();
        App.setupTooltips();
      }
    } else {
      App.showToast('Failed to delete protocol', 'error');
    }
  },

  setupAddStateModal() {
    const modal = document.getElementById('add-state-modal');
    const modalContent = modal.querySelector('.modal-content');
    const form = document.getElementById('add-state-form');
    
    if (!modal || !form) return;
    
    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      this.currentStateId = null;
      form.reset();
      
      // Reset modal to "Add" mode
      document.getElementById('state-modal-title').textContent = 'Add New State';
      document.getElementById('submit-state-btn').textContent = 'Add State';
      const deleteBtn = document.getElementById('delete-state-btn');
      if (deleteBtn) {
        deleteBtn.style.display = 'none';
      }
      
      // Reset tabs
      this.resetStateTabs();
    };
    
    // Close modal handlers
    const closeBtn = document.getElementById('close-state-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }
    
    const cancelBtn = document.getElementById('cancel-state-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }
    
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', closeModal);
    }
    
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
    
    // Tab switching
    const innerfacesTab = document.getElementById('innerfaces-tab');
    const statesTab = document.getElementById('states-tab');
    const innerfacesPanel = document.getElementById('innerfaces-panel');
    const statesPanel = document.getElementById('states-panel');
    
    if (innerfacesTab && statesTab && innerfacesPanel && statesPanel) {
      innerfacesTab.addEventListener('click', () => {
        innerfacesTab.classList.add('active');
        statesTab.classList.remove('active');
        innerfacesPanel.classList.add('active');
        statesPanel.classList.remove('active');
      });
      
      statesTab.addEventListener('click', () => {
        statesTab.classList.add('active');
        innerfacesTab.classList.remove('active');
        statesPanel.classList.add('active');
        innerfacesPanel.classList.remove('active');
      });
    }
    
    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const selectedInnerfaces = this.getSelectedDependencies('innerfaces');
      const selectedStates = this.getSelectedDependencies('states');
      
      const stateData = {
        name: formData.get('state-name'),
        subtext: formData.get('state-subtext') || '',
        icon: formData.get('state-emoji'),
        hover: formData.get('state-hover'),
        innerfaceIds: selectedInnerfaces,
        stateIds: selectedStates
      };
      
      // Validate data
      if (!stateData.name || !stateData.icon || !stateData.hover) {
        App.showToast('Please fill all required fields', 'error');
        return;
      }
      
      if (selectedInnerfaces.length === 0 && selectedStates.length === 0) {
        App.showToast('Please select at least one innerface or state dependency', 'error');
        return;
      }
      
      if (this.currentStateId) {
        // Edit mode
        const updatedState = window.Storage.updateState(this.currentStateId, stateData);
        if (updatedState) {
          App.showToast('State updated successfully!', 'success');
          this.refreshStatesView();
          closeModal();
        } else {
          App.showToast('Failed to update state', 'error');
        }
      } else {
        // Add mode
        const newState = window.Storage.addState(stateData);
        if (newState) {
          App.showToast('State added successfully!', 'success');
          this.refreshStatesView();
          closeModal();
        } else {
          App.showToast('Failed to add state', 'error');
        }
      }
    });
  },

  openStateModal() {
    const modal = document.getElementById('add-state-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Populate dependencies
      this.populateStateDependencies();
      
      // Focus on first input
      const firstInput = document.getElementById('state-name');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  },

  editState(stateId) {
    const state = window.Storage.getStateById(stateId);
    if (!state) {
      App.showToast('State not found', 'error');
      return;
    }
    
    this.currentStateId = stateId;
    
    // Parse name and subtext
    let name, subtext = '';
    
    // Check if state has separate subtext field (new format)
    if (state.subtext !== undefined) {
      name = state.name;
      subtext = state.subtext;
    } else {
      // Legacy format: parse from name field
      const nameParts = state.name.split('. ');
      name = nameParts[0];
      subtext = nameParts.length > 1 ? nameParts.slice(1).join('. ') : '';
    }
    
    // Populate form
    document.getElementById('state-name').value = name;
    document.getElementById('state-subtext').value = subtext;
    document.getElementById('state-emoji').value = state.icon;
    document.getElementById('state-hover').value = state.hover || '';
    
    // Update modal for edit mode
    document.getElementById('state-modal-title').textContent = 'Edit State';
    document.getElementById('submit-state-btn').textContent = 'Update State';
    const deleteBtn = document.getElementById('delete-state-btn');
    if (deleteBtn) {
      deleteBtn.style.display = 'flex';
    }
    
    this.openStateModal();
    
    // Set selected dependencies after modal opens
    setTimeout(() => {
      this.setSelectedDependencies(state.innerfaceIds, state.stateIds);
    }, 100);
  },

  deleteCurrentState(stateId) {
    console.log('🗑️ deleteCurrentState called with ID:', stateId);
    console.log('🗑️ Deleting state directly without confirmation...');
    
    const success = window.Storage.deleteState(stateId);
    console.log('🗑️ Storage.deleteState result:', success);
    
    if (success) {
      App.showToast('State deleted successfully', 'success');
      
      // Close modal
      const modal = document.getElementById('add-state-modal');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
      
      this.refreshStatesView();
    } else {
      App.showToast('Failed to delete state', 'error');
    }
  },

  populateStateDependencies() {
    // Check if Storage is available and methods exist
    if (!window.Storage || typeof window.Storage.getInnerfaces !== 'function') {
      console.warn('Storage not available yet, retrying...');
      setTimeout(() => this.populateStateDependencies(), 100);
      return;
    }

    // Populate innerfaces grid
    const innerfacesGrid = document.getElementById('innerfaces-dependency-grid');
    const innerfaces = window.Storage.getInnerfaces();
    
    if (innerfacesGrid) {
      innerfacesGrid.innerHTML = innerfaces.map(innerface => {
        const nameParts = innerface.name.split('. ');
        const mainName = nameParts[0];
        
        return `
          <div class="dependency-item" data-type="innerface" data-id="${innerface.id}">
            <input type="checkbox" value="${innerface.id}" data-type="innerface" style="display: none;">
            <div class="dependency-item-info">
              <span class="dependency-item-icon">${innerface.icon}</span>
              <div class="dependency-item-name">${mainName}</div>
            </div>
          </div>
        `;
      }).join('');
      
      // Add click handlers
      innerfacesGrid.querySelectorAll('.dependency-item').forEach(item => {
        item.addEventListener('click', (e) => {
          this.toggleDependencyItem(item);
        });
      });
    }
    
    // Populate states grid (excluding current state if editing)
    const statesGrid = document.getElementById('states-dependency-grid');
    const states = window.Storage.getStates().filter(s => s.id !== this.currentStateId);
    
    if (statesGrid) {
      statesGrid.innerHTML = states.map(state => {
        // Get display name for dependency list
        let displayName;
        
        // Check if state has separate subtext field (new format)
        if (state.subtext !== undefined) {
          displayName = state.name;
        } else {
          // Legacy format: parse from name field
          const nameParts = state.name.split('. ');
          displayName = nameParts[0];
        }
        
        return `
          <div class="dependency-item" data-type="state" data-id="${state.id}">
            <input type="checkbox" value="${state.id}" data-type="state" style="display: none;">
            <div class="dependency-item-info">
              <span class="dependency-item-icon">${state.icon}</span>
              <div class="dependency-item-name">${displayName}</div>
            </div>
          </div>
        `;
      }).join('');
      
      // Add click handlers
      statesGrid.querySelectorAll('.dependency-item').forEach(item => {
        item.addEventListener('click', (e) => {
          this.toggleDependencyItem(item);
        });
      });
    }
  },

  getSelectedDependencies(type) {
    // Map plural form to singular for data attributes
    const dataType = type === 'innerfaces' ? 'innerface' : type === 'states' ? 'state' : type;
    
    const checkboxes = document.querySelectorAll(`input[type="checkbox"][data-type="${dataType}"]:checked`);
    const result = Array.from(checkboxes).map(cb => cb.value);
    return result;
  },

  setSelectedDependencies(innerfaceIds, stateIds) {
    // Set innerfaces
    if (innerfaceIds) {
      innerfaceIds.forEach(innerfaceId => {
        const item = document.querySelector(`.dependency-item[data-type="innerface"][data-id="${innerfaceId}"]`);
        const checkbox = item?.querySelector('input[type="checkbox"]');
        if (checkbox && item) {
          checkbox.checked = true;
          item.classList.add('selected');
        }
      });
    }
    
    // Set states
    if (stateIds) {
      stateIds.forEach(stateId => {
        const item = document.querySelector(`.dependency-item[data-type="state"][data-id="${stateId}"]`);
        const checkbox = item?.querySelector('input[type="checkbox"]');
        if (checkbox && item) {
          checkbox.checked = true;
          item.classList.add('selected');
        }
      });
    }
  },

  resetStateTabs() {
    const innerfacesTab = document.getElementById('innerfaces-tab');
    const statesTab = document.getElementById('states-tab');
    const innerfacesPanel = document.getElementById('innerfaces-panel');
    const statesPanel = document.getElementById('states-panel');
    
    if (innerfacesTab && statesTab && innerfacesPanel && statesPanel) {
      innerfacesTab.classList.add('active');
      statesTab.classList.remove('active');
      innerfacesPanel.classList.add('active');
      statesPanel.classList.remove('active');
    }
  },

  refreshStatesView() {
    if (App.currentPage === 'dashboard') {
      // Update only the states section, not the whole dashboard
      const states = window.Storage.getStatesInOrder();
      const statesContainer = document.querySelector('.states-grid');
      
      if (statesContainer) {
        // Re-render only the states grid
        UI.renderDashboard(); // Actually, for states we do need full dashboard refresh for now
      }
    }
  },

  toggleDependencyItem(item) {
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (checkbox) {
      checkbox.checked = !checkbox.checked;
      
      if (checkbox.checked) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    }
  },

  // Quick Action Modal functionality
  setupQuickActionModal() {
    const modal = document.getElementById('quick-action-modal');
    const searchInput = document.getElementById('quick-action-search');
    
    if (!modal || !searchInput) return;
    
    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      searchInput.value = '';
      this.renderQuickActionProtocols();
    };
    
    // Close modal when clicking the X
    const closeBtn = document.getElementById('close-quick-action-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', closeModal);
    }
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
    
    // Search functionality
    searchInput.addEventListener('input', (e) => {
      this.renderQuickActionProtocols(e.target.value);
    });
  },

  openQuickActionModal() {
    const modal = document.getElementById('quick-action-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      this.renderQuickActionProtocols();
      
      // Don't auto-focus search input anymore
    }
  },

  renderQuickActionProtocols(searchTerm = '') {
    const container = document.getElementById('quick-action-protocols-body');
    const emptyState = document.getElementById('quick-action-empty-state');
    const table = document.querySelector('.quick-action-protocols-table');
    
    if (!container) return;
    
    // 🔧 ИСПРАВЛЕНИЕ: Используем тот же порядок, что и на странице протоколов
    const protocols = window.Storage.getProtocolsInOrder();
    const currentQuickActions = window.Storage.getQuickActions();
    const innerfaces = window.Storage.getInnerfaces();
    
    // 🔧 ИСПРАВЛЕНИЕ: Правильная фильтрация - currentQuickActions содержит ID, а не объекты
    let availableProtocols = protocols.filter(protocol => 
      !currentQuickActions.includes(protocol.id)
    );
    
    // Keep track of available protocols before search for better empty state detection
    const availableProtocolsBeforeSearch = [...availableProtocols];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      availableProtocols = availableProtocols.filter(protocol => {
        // Search in protocol name only
        return protocol.name.toLowerCase().includes(search);
      });
    }
    
    if (availableProtocols.length === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'block';
      
      // Determine the reason for empty state
      let emptyTitle, emptyDescription, emptyIcon;
      
      if (protocols.length === 0) {
        // No protocols exist at all
        emptyIcon = 'fas fa-bullseye';
        emptyTitle = 'No protocols created yet';
        emptyDescription = 'Create your first protocol on the Protocols page to add it to Quick Actions.';
      } else if (availableProtocolsBeforeSearch.length === 0) {
        // All protocols are already in quick actions
        emptyIcon = 'fas fa-check-circle';
        emptyTitle = 'All protocols already added';
        emptyDescription = '';
      } else if (searchTerm && availableProtocolsBeforeSearch.length > 0) {
        // Search returned no results but there were protocols available
        emptyIcon = 'fas fa-search';
        emptyTitle = 'No protocols found';
        emptyDescription = 'Try adjusting your search query or check if the protocol is already in Quick Actions.';
      } else {
        // Fallback case
        emptyIcon = 'fas fa-question-circle';
        emptyTitle = 'No available protocols';
        emptyDescription = 'All available protocols may already be in Quick Actions.';
      }
      
      // Update empty state with appropriate message
      emptyState.innerHTML = `
        <i class="${emptyIcon}" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.4; color: var(--sub-color);"></i>
        <div style="font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-color);">${emptyTitle}</div>
        <div style="font-size: 0.9rem; color: var(--sub-color); max-width: 400px; margin: 0 auto; line-height: 1.4;">${emptyDescription}</div>
      `;
      
      return;
    }
    
    table.style.display = 'block';
    emptyState.style.display = 'none';
    
    container.innerHTML = availableProtocols.map((protocol, index) => {
      // Get target innerface names
      const targetNames = protocol.targets.map(targetId => {
        const innerface = innerfaces.find(s => s.id === targetId);
        return innerface ? innerface.name.split('. ')[0] : `Unknown (${targetId})`;
      });
      
      // Format protocol name with main and description parts
      const nameParts = protocol.name.split('. ');
      const mainName = nameParts[0];
      const shortDesc = nameParts.slice(1).join('. ');
      
      return `
        <div class="quick-action-protocol-row" data-protocol-id="${protocol.id}">
          <div class="quick-action-protocol-number">${index + 1}</div>
          <div class="quick-action-protocol-info">
            <span class="quick-action-protocol-emoji">${protocol.icon}</span>
            <div class="quick-action-protocol-name-full">
              <div class="quick-action-protocol-name-main">${mainName}.</div>
              ${shortDesc ? `<div class="quick-action-protocol-name-desc">${shortDesc}</div>` : ''}
            </div>
          </div>
          <div class="quick-action-targets">
            ${targetNames.map(name => `<span class="quick-action-target-tag">${name}</span>`).join('')}
          </div>
          <div class="quick-action-protocol-weight">${protocol.weight}</div>
        </div>
      `;
    }).join('');
    
    // Add click handlers
    container.querySelectorAll('.quick-action-protocol-row').forEach(row => {
      row.addEventListener('click', (e) => {
        const protocolId = parseInt(row.dataset.protocolId);
        this.addToQuickActions(protocolId);
      });
    });
  },

  addToQuickActions(protocolId) {
    const protocol = window.Storage.getProtocolById(protocolId);
    if (!protocol) {
      App.showToast('Protocol not found', 'error');
      return;
    }
    
    const success = window.Storage.addToQuickActions(protocolId);
    if (success) {
      App.showToast(`"${protocol.name}" added to Quick Actions!`, 'success');
      
      // Close modal
      const modal = document.getElementById('quick-action-modal');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
      
      // Refresh dashboard if we're on it
      if (App.currentPage === 'dashboard') {
        UI.renderQuickProtocols();
      }
    } else {
      App.showToast('Failed to add protocol to Quick Actions', 'error');
    }
  },

  setupDeleteButtonListeners() {
    console.log('🔧 Setting up delete button event listeners...');
    
    // Setup innerface delete button
    const innerfaceBtn = document.getElementById('delete-innerface-btn');
    if (innerfaceBtn) {
      // Remove existing listeners
      innerfaceBtn.replaceWith(innerfaceBtn.cloneNode(true));
      const newInnerfaceBtn = document.getElementById('delete-innerface-btn');
      
      newInnerfaceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🗑️ Innerface delete clicked, currentInnerfaceId:', this.currentInnerfaceId);
        if (this.currentInnerfaceId) {
          this.deleteCurrentInnerface(this.currentInnerfaceId);
        } else {
          console.warn('⚠️ No innerface ID set for deletion');
        }
      });
      
      console.log('✅ Innerface delete button listener attached');
    } else {
      console.warn('⚠️ Innerface delete button not found');
    }
    
    // Setup protocol delete button
    const protocolBtn = document.getElementById('delete-protocol-btn');
    if (protocolBtn) {
      // Remove existing listeners
      protocolBtn.replaceWith(protocolBtn.cloneNode(true));
      const newProtocolBtn = document.getElementById('delete-protocol-btn');
      
      newProtocolBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🗑️ Protocol delete clicked, currentProtocolId:', this.currentProtocolId);
        if (this.currentProtocolId) {
          this.deleteCurrentProtocol(this.currentProtocolId);
        } else {
          console.warn('⚠️ No protocol ID set for deletion');
        }
      });
      
      console.log('✅ Protocol delete button listener attached');
    } else {
      console.warn('⚠️ Protocol delete button not found');
    }
    
    // Setup state delete button
    const stateBtn = document.getElementById('delete-state-btn');
    if (stateBtn) {
      // Remove existing listeners
      stateBtn.replaceWith(stateBtn.cloneNode(true));
      const newStateBtn = document.getElementById('delete-state-btn');
      
      newStateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🗑️ State delete clicked, currentStateId:', this.currentStateId);
        if (this.currentStateId) {
          this.deleteCurrentState(this.currentStateId);
        } else {
          console.warn('⚠️ No state ID set for deletion');
        }
      });
      
      console.log('✅ State delete button listener attached');
    } else {
      console.warn('⚠️ State delete button not found');
    }
    
    // Setup Clear All History button WITHOUT CONFIRMATION  
    const clearHistoryBtn = document.getElementById('clear-history');
    if (clearHistoryBtn) {
      // Remove existing listeners
      clearHistoryBtn.replaceWith(clearHistoryBtn.cloneNode(true));
      const newClearHistoryBtn = document.getElementById('clear-history');
      
      newClearHistoryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🗑️ Clear All History clicked - direct deletion without confirmation');
        
        window.Storage.clearAllCheckins();
        App.filteredHistory = [];
        App.historyInitialized = false;
        
        // Clear search input
        const historySearchInput = document.getElementById('history-search');
        if (historySearchInput) {
          historySearchInput.value = '';
        }
        
        App.showToast('History cleared', 'success');
        App.renderPage('history');
      });
      
      console.log('✅ Clear All History button listener attached (no confirmation)');
    } else {
      console.warn('⚠️ Clear All History button not found');
    }
    
    // Setup individual history delete buttons (with delegation) - NO RECURSIVE CALL
    this.setupHistoryDeleteDelegation();
    
    console.log('🔧 Delete button listeners setup complete');
  },

  setupHistoryDeleteDelegation() {
    console.log('🔧 Setting up history delete button delegation...');
    
    // Use document-level delegation to avoid DOM manipulation issues
    // Remove any existing delegation listeners first
    if (this.historyDelegationHandler) {
      document.removeEventListener('click', this.historyDelegationHandler);
    }
    
    // Create new delegation handler
    this.historyDelegationHandler = (e) => {
      const deleteBtn = e.target.closest('.history-delete-btn');
      if (deleteBtn) {
        // Make sure we're clicking inside the history section
        const historyBody = deleteBtn.closest('.history-body');
        if (!historyBody) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // Get checkin ID from data attribute
        const checkinId = deleteBtn.dataset.checkinId;
        
        console.log('🗑️ History item delete clicked, checkinId:', checkinId);
        
        if (checkinId) {
          console.log('🗑️ Deleting history item:', checkinId);
          
          const checkins = window.Storage.getCheckins();
          const checkin = checkins.find(c => c.id == checkinId);
          
          // Delete the checkin
          window.Storage.deleteCheckin(checkinId);
          
          // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ УДАЛЕНИЯ ЧЕКИНА
          // Это обеспечивает что удаленные чекины не появятся снова при обновлении страницы
          if (!window.Storage.syncInProgress) {
            console.log('🚀 SCHEDULING BACKGROUND SYNC: Individual checkin deleted');
            setTimeout(() => {
              if (!window.Storage.syncInProgress) {
                window.Storage.syncWithBackend().catch(error => {
                  console.warn('⚠️ Background sync after checkin deletion failed:', error);
                });
              } else {
                console.log('🚫 BACKGROUND SYNC SKIPPED: Another sync already in progress (checkin delete)');
              }
            }, 300);
          } else {
            console.log('🚫 SYNC IN PROGRESS: Marking for sync instead');
            window.Storage.markForSync();
          }
          
          // Handle different types of checkins for appropriate toast messages
          if (checkin && checkin.type === 'drag_drop') {
            if (checkin.subType === 'protocol') {
              App.filteredProtocols = window.Storage.getProtocolsInOrder();
              if (App.currentPage === 'protocols') {
                UI.renderProtocols();
              }
              App.showToast('Protocol order reverted', 'success');
            } else if (checkin.subType === 'innerface') {
              App.filteredInnerfaces = window.Storage.getInnerfacesInOrder();
              if (App.currentPage === 'innerfaces') {
                UI.renderInnerfaces();
                DragDrop.setupInnerfaces();
              }
              App.showToast('Innerface order reverted', 'success');
            }
          } else {
            App.showToast('Check-in deleted', 'success');
          }
          
          // Refresh history WITHOUT manipulating DOM structure
          App.filteredHistory = [];
          App.historyInitialized = false;
          
          if (App.currentPage === 'history') {
            // Apply filters to refresh history display
            App.applyHistoryFilters();
          }
          
          // Update user stats if on dashboard
          if (App.currentPage === 'dashboard') {
            UI.updateUserStats();
          }
        } else {
          console.error('❌ Could not extract checkin ID from delete button');
        }
      }
    };
    
    // Add the delegation listener to document
    document.addEventListener('click', this.historyDelegationHandler);
    
    console.log('✅ History delete button delegation setup complete');
  },

  // 🐛 DEBUG FUNCTIONS FOR TROUBLESHOOTING
  debugDeleteButtons() {
    console.log('🐛 DELETE BUTTONS DEBUG:');
    console.log('  - delete-innerface-btn:', document.getElementById('delete-innerface-btn'));
    console.log('  - delete-protocol-btn:', document.getElementById('delete-protocol-btn'));
    console.log('  - delete-state-btn:', document.getElementById('delete-state-btn'));
    
    console.log('🐛 CURRENT IDS:');
    console.log('  - currentInnerfaceId:', this.currentInnerfaceId);
    console.log('  - currentProtocolId:', this.currentProtocolId);
    console.log('  - currentStateId:', this.currentStateId);
    
    // Check for event listeners
    const innerfaceBtn = document.getElementById('delete-innerface-btn');
    const protocolBtn = document.getElementById('delete-protocol-btn');
    const stateBtn = document.getElementById('delete-state-btn');
    
    console.log('🐛 BUTTON EVENT LISTENERS:');
    console.log('  - innerface button click listeners:', innerfaceBtn ? innerfaceBtn.onclick : 'null');
    console.log('  - protocol button click listeners:', protocolBtn ? protocolBtn.onclick : 'null');
    console.log('  - state button click listeners:', stateBtn ? stateBtn.onclick : 'null');
  },

  debugDataIntegrity() {
    console.log('🐛 DATA INTEGRITY DEBUG:');
    
    const protocols = window.Storage.getProtocols();
    const innerfaces = window.Storage.getInnerfaces();
    const states = window.Storage.getStates();
    
    console.log('📊 Data counts:', {
      protocols: protocols.length,
      innerfaces: innerfaces.length,
      states: states.length
    });
    
    // Check for duplicate IDs
    const protocolIds = protocols.map(p => p.id);
    const innerfaceIds = innerfaces.map(s => s.id);
    const stateIds = states.map(s => s.id);
    
    const duplicateProtocols = protocolIds.filter((id, index) => protocolIds.indexOf(id) !== index);
    const duplicateInnerfaces = innerfaceIds.filter((id, index) => innerfaceIds.indexOf(id) !== index);
    const duplicateStates = stateIds.filter((id, index) => stateIds.indexOf(id) !== index);
    
    console.log('🔍 DUPLICATE IDS FOUND:');
    console.log('  - duplicate protocol IDs:', duplicateProtocols);
    console.log('  - duplicate innerface IDs:', duplicateInnerfaces);
    console.log('  - duplicate state IDs:', duplicateStates);
    
    // Check for undefined/null values
    const protocolsWithIssues = protocols.filter(p => !p || !p.id || p.id === undefined || p.id === null);
    const innerfacesWithIssues = innerfaces.filter(s => !s || !s.id || s.id === undefined || s.id === null);
    const statesWithIssues = states.filter(s => !s || !s.id || s.id === undefined || s.id === null);
    
    console.log('⚠️ ITEMS WITH ISSUES:');
    console.log('  - protocols with null/undefined IDs:', protocolsWithIssues);
    console.log('  - innerfaces with null/undefined IDs:', innerfacesWithIssues);
    console.log('  - states with null/undefined IDs:', statesWithIssues);
    
    return {
      duplicateProtocols,
      duplicateInnerfaces,
      duplicateStates,
      protocolsWithIssues,
      innerfacesWithIssues,
      statesWithIssues
    };
  },

  debugDeletedArrays() {
    console.log('🐛 DELETED ARRAYS DEBUG:');
    
    const deletedProtocols = JSON.parse(localStorage.getItem('deletedProtocols') || '[]');
    const deletedInnerfaces = JSON.parse(localStorage.getItem('deletedInnerfaces') || '[]');
    const deletedStates = JSON.parse(localStorage.getItem('deletedStates') || '[]');
    const deletedCheckins = JSON.parse(localStorage.getItem('deletedCheckins') || '[]');
    const deletedQuickActions = JSON.parse(localStorage.getItem('deletedQuickActions') || '[]');
    
    console.log('📋 DELETED ARRAYS:');
    console.log('  - deletedProtocols:', deletedProtocols);
    console.log('  - deletedInnerfaces:', deletedInnerfaces);
    console.log('  - deletedStates:', deletedStates);
    console.log('  - deletedCheckins length:', deletedCheckins.length);
    console.log('  - deletedQuickActions:', deletedQuickActions);
    
    // Check for undefined values
    const undefinedInProtocols = deletedProtocols.filter(id => id === undefined || id === null).length;
    const undefinedInInnerfaces = deletedInnerfaces.filter(id => id === undefined || id === null).length;
    const undefinedInStates = deletedStates.filter(id => id === undefined || id === null).length;
    const undefinedInCheckins = deletedCheckins.filter(id => id === undefined || id === null).length;
    const undefinedInQuickActions = deletedQuickActions.filter(id => id === undefined || id === null).length;
    
    console.log('⚠️ UNDEFINED VALUES COUNT:');
    console.log('  - in deletedProtocols:', undefinedInProtocols);
    console.log('  - in deletedInnerfaces:', undefinedInInnerfaces);
    console.log('  - in deletedStates:', undefinedInStates);
    console.log('  - in deletedCheckins:', undefinedInCheckins);
    console.log('  - in deletedQuickActions:', undefinedInQuickActions);
    
    return {
      deletedProtocols,
      deletedInnerfaces,
      deletedStates,
      undefinedCounts: {
        protocols: undefinedInProtocols,
        innerfaces: undefinedInInnerfaces,
        states: undefinedInStates,
        checkins: undefinedInCheckins,
        quickActions: undefinedInQuickActions
      }
    };
  },

  fixDeletedArrays() {
    console.log('🔧 FIXING DELETED ARRAYS...');
    
    const arrays = ['deletedProtocols', 'deletedInnerfaces', 'deletedStates', 'deletedCheckins', 'deletedQuickActions'];
    
    arrays.forEach(arrayName => {
      const currentArray = JSON.parse(localStorage.getItem(arrayName) || '[]');
      const cleanedArray = currentArray.filter(id => id !== undefined && id !== null);
      
      if (cleanedArray.length !== currentArray.length) {
        console.log(`🧹 Cleaned ${arrayName}: ${currentArray.length} → ${cleanedArray.length}`);
        localStorage.setItem(arrayName, JSON.stringify(cleanedArray));
      } else {
        console.log(`✅ ${arrayName} already clean`);
      }
    });
    
    console.log('✅ DELETED ARRAYS CLEANUP COMPLETE');
  },

  testDeleteButtons() {
    console.log('🧪 Testing delete buttons...');
    
    // Test if buttons can be found and have event listeners
    const innerfaceBtn = document.getElementById('delete-innerface-btn');
    const protocolBtn = document.getElementById('delete-protocol-btn');
    const stateBtn = document.getElementById('delete-state-btn');
    
    console.log('🔍 BUTTON EXISTENCE:');
    console.log('  - innerface delete button:', !!innerfaceBtn);
    console.log('  - protocol delete button:', !!protocolBtn);
    console.log('  - state delete button:', !!stateBtn);
    
    // Try to manually trigger click events (for testing)
    if (innerfaceBtn) {
      console.log('🖱️ Innerface button is clickable:', !innerfaceBtn.disabled);
    }
    if (protocolBtn) {
      console.log('🖱️ Protocol button is clickable:', !protocolBtn.disabled);
    }
    if (stateBtn) {
      console.log('🖱️ State button is clickable:', !stateBtn.disabled);
    }
  },

  // ===== COLOR PICKER FUNCTIONALITY =====
  setupColorPickers() {
    // Setup innerface color picker
    this.setupColorPickerForModal('innerface');
    // Setup protocol color picker  
    this.setupColorPickerForModal('protocol');
  },

  setupColorPickerForModal(type) {
    const emojiInput = document.getElementById(`${type}-emoji`);
    const colorGroup = document.getElementById(`${type}-color-group`);
    const colorInput = document.getElementById(`${type}-color`);
    const colorOptions = colorGroup?.querySelectorAll('.color-option');

    if (!emojiInput || !colorGroup || !colorInput || !colorOptions) return;

    // Watch emoji input for FontAwesome conversion
    emojiInput.addEventListener('input', () => {
      this.toggleColorPickerVisibility(type);
    });

    // Handle color option clicks
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        const color = option.dataset.color;
        this.selectColor(type, color);
      });
    });
  },

  toggleColorPickerVisibility(type) {
    const emojiInput = document.getElementById(`${type}-emoji`);
    const colorGroup = document.getElementById(`${type}-color-group`);
    
    if (!emojiInput || !colorGroup) return;

    const emoji = emojiInput.value.trim();
    const iconClass = UI.emojiToFontAwesome(emoji);
    
    // Show color picker only if emoji converts to FontAwesome
    if (iconClass.startsWith('fas ')) {
      colorGroup.style.display = 'block';
      setTimeout(() => {
        colorGroup.classList.add('show');
      }, 10);
    } else {
      colorGroup.classList.remove('show');
      setTimeout(() => {
        if (!colorGroup.classList.contains('show')) {
          colorGroup.style.display = 'none';
        }
      }, 300);
    }
  },

  selectColor(type, color) {
    const colorInput = document.getElementById(`${type}-color`);
    const colorOptions = document.querySelectorAll(`#${type}-color-group .color-option`);
    
    if (!colorInput || !colorOptions) return;

    // Update hidden input
    colorInput.value = color;

    // Update visual selection
    colorOptions.forEach(option => {
      if (option.dataset.color === color) {
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
      }
    });
  },

  loadSavedColor(type, color) {
    if (!color) color = '#7fb3d3'; // Default blue
    
    // Set the hidden input value
    const colorInput = document.getElementById(`${type}-color`);
    if (colorInput) {
      colorInput.value = color;
    }

    // Update visual selection
    this.selectColor(type, color);
  },

  // Update existing openInnerfaceModal and openProtocolModal functions
  initializeColorPickersOnModalOpen(type) {
    // Show color picker if current emoji is FontAwesome
    setTimeout(() => {
      this.toggleColorPickerVisibility(type);
      // Set default color selection
      const colorInput = document.getElementById(`${type}-color`);
      const currentColor = colorInput?.value || '#7fb3d3';
      this.selectColor(type, currentColor);
    }, 100);
  }
}; 

// 🌐 GLOBAL EXPORT: Make Modals available globally for cross-module access
window.Modals = Modals; 