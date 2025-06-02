// ===== modals.js - Modal Functionality =====

const Modals = {
  currentSkillId: null,
  currentProtocolId: null,
  currentStateId: null,
  selectedTargets: [null, null, null], // Array for 3 targets

  init() {
    console.log('🔧 Modals.init() called - initializing modal handlers');
    this.setupAddSkillModal();
    this.setupAddProtocolModal();
    this.setupAddStateModal();
    this.setupQuickActionModal();
    console.log('✅ All modal handlers initialized');
  },

  setupAddSkillModal() {
    console.log('🔧 Setting up add skill modal');
    const addSkillBtn = document.getElementById('add-skill-btn');
    const modal = document.getElementById('add-skill-modal');
    const modalContent = modal.querySelector('.modal-content');
    const form = document.getElementById('add-skill-form');
    
    console.log('🔧 Add skill elements:', { addSkillBtn, modal, form });
    
    if (!addSkillBtn || !modal || !form) {
      console.error('❌ Missing elements for skill modal:', { addSkillBtn, modal, form });
      return;
    }
    
    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      this.currentSkillId = null;
      form.reset();
      
      // Reset modal to "Add" mode
      document.getElementById('skill-modal-title').textContent = 'Add New Skill';
      document.getElementById('submit-skill-btn').textContent = 'Add Skill';
      const deleteBtn = document.getElementById('delete-skill-btn');
      if (deleteBtn) {
        deleteBtn.style.display = 'none';
      }
    };
    
    // Open modal button
    addSkillBtn.addEventListener('click', () => {
      this.openSkillModal();
    });
    
    // Close modal when clicking the X
    const closeBtn = document.getElementById('close-skill-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancel-skill-btn');
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
      const skillData = {
        name: formData.get('skill-name'),
        description: formData.get('skill-description'),
        icon: formData.get('skill-emoji'),
        hover: formData.get('skill-hover'),
        initialScore: parseFloat(formData.get('skill-initial-score'))
      };
      
      // Validate data
      if (!skillData.name || !skillData.icon || skillData.initialScore < 0 || skillData.initialScore > 10) {
        App.showToast('Please fill all required fields and ensure score is between 0-10', 'error');
        return;
      }
      
      if (this.currentSkillId) {
        // Edit mode
        const updatedSkill = window.Storage.updateSkillFull(this.currentSkillId, skillData);
        if (updatedSkill) {
          App.showToast('Skill updated successfully!', 'success');
          
          // Update filtered skills
          App.filteredSkills = window.Storage.getSkillsInOrder();
          if (App.currentPage === 'skills') {
            UI.renderSkills();
            DragDrop.setupSkills();
            App.setupTooltips();
          }
          
          closeModal();
        } else {
          App.showToast('Failed to update skill', 'error');
        }
      } else {
        // Add mode
        const newSkill = window.Storage.addSkill(skillData);
        if (newSkill) {
          App.showToast('Skill added successfully!', 'success');
          
          // Update filtered skills
          App.filteredSkills = window.Storage.getSkillsInOrder();
          if (App.currentPage === 'skills') {
            UI.renderSkills();
            DragDrop.setupSkills();
            App.setupTooltips();
          }
          
          closeModal();
        } else {
          App.showToast('Failed to add skill', 'error');
        }
      }
    });
    
    // Delete button
    const deleteBtn = document.getElementById('delete-skill-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (this.currentSkillId) {
          this.deleteCurrentSkill(this.currentSkillId);
        }
      });
    }
  },

  openSkillModal() {
    console.log('🔧 openSkillModal() called');
    const modal = document.getElementById('add-skill-modal');
    console.log('🔧 Modal element:', modal);
    if (modal) {
      console.log('🔧 Adding active class to modal');
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Focus on first input
      const firstInput = document.getElementById('skill-name');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    } else {
      console.error('❌ Modal element not found!');
    }
  },

  editSkill(skillId) {
    // Convert string ID to number if needed for comparison
    const searchId = typeof skillId === 'string' ? parseInt(skillId) || skillId : skillId;
    
    const skill = window.Storage.getSkillById(searchId);
    if (!skill) {
      App.showToast('Skill not found', 'error');
      return;
    }
    
    this.currentSkillId = searchId;
    
    // Parse name and description
    const nameParts = skill.name.split('. ');
    const name = nameParts[0];
    const description = nameParts.slice(1).join('. ');
    
    // Populate form
    document.getElementById('skill-name').value = name;
    document.getElementById('skill-description').value = description;
    document.getElementById('skill-emoji').value = skill.icon;
    document.getElementById('skill-hover').value = skill.hover || '';
    document.getElementById('skill-initial-score').value = skill.initialScore;
    
    // Update modal for edit mode
    document.getElementById('skill-modal-title').textContent = 'Edit Skill';
    document.getElementById('submit-skill-btn').textContent = 'Update Skill';
    const deleteBtn = document.getElementById('delete-skill-btn');
    if (deleteBtn) {
      deleteBtn.style.display = 'flex';
    }
    
    this.openSkillModal();
  },

  deleteCurrentSkill(skillId) {
    if (!confirm('Are you sure you want to delete this skill? This action cannot be undone.')) {
      return;
    }
    
    const success = window.Storage.deleteSkill(skillId);
    if (success) {
      App.showToast('Skill deleted successfully', 'success');
      
      // Close modal
      const modal = document.getElementById('add-skill-modal');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
      
      // Update filtered skills
      App.filteredSkills = window.Storage.getSkillsInOrder();
      if (App.currentPage === 'skills') {
        UI.renderSkills();
        App.setupTooltips();
      }
    } else {
      App.showToast('Failed to delete skill', 'error');
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
      this.resetTargets();
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
    
    // Setup skill search for all 3 slots
    for (let i = 1; i <= 3; i++) {
      this.setupSkillSearch(i);
    }
    
    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const protocolData = {
        name: formData.get('protocol-name'),
        description: formData.get('protocol-description'),
        icon: formData.get('protocol-emoji'),
        hover: formData.get('protocol-hover'),
        weight: parseFloat(formData.get('protocol-weight')),
        targets: this.selectedTargets.filter(target => target !== null).map(target => target.id)
      };
      
      // Validate data
      if (!protocolData.name || !protocolData.icon || protocolData.weight < 0 || protocolData.weight > 1) {
        App.showToast('Please fill all required fields and ensure weight is between 0-1', 'error');
        return;
      }
      
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
            App.historyInitialized = false;
            App.applyHistoryFilters();
          } else {
            // If not on history page, just reset the history data for next visit
            App.filteredHistory = [];
            App.historyInitialized = false;
          }
          
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
          
          closeModal();
        } else {
          App.showToast('Failed to add protocol', 'error');
        }
      }
    });
    
    // Delete button
    const deleteBtn = document.getElementById('delete-protocol-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (this.currentProtocolId) {
          this.deleteCurrentProtocol(this.currentProtocolId);
        }
      });
    }
  },

  setupSkillSearch(slotNumber) {
    const inputId = slotNumber === 1 ? 'skill-search-input' : `skill-search-input-${slotNumber}`;
    const suggestionsId = slotNumber === 1 ? 'skill-suggestions' : `skill-suggestions-${slotNumber}`;
    
    const input = document.getElementById(inputId);
    const suggestions = document.getElementById(suggestionsId);
    
    if (!input || !suggestions) return;
    
    input.addEventListener('input', (e) => {
      this.handleSkillSearch(e.target.value, slotNumber);
    });
    
    input.addEventListener('focus', () => {
      // Show all available skills when focusing, or search results if there's input
      this.handleSkillSearch(input.value, slotNumber);
    });
    
    input.addEventListener('blur', () => {
      setTimeout(() => {
        suggestions.style.display = 'none';
      }, 300);
    });
  },

  resetTargets() {
    this.selectedTargets = [null, null, null];
    
    // Hide slots 2 and 3
    document.getElementById('target-slot-2').style.display = 'none';
    document.getElementById('target-slot-3').style.display = 'none';
    
    // Clear all inputs and show slot 1
    for (let i = 1; i <= 3; i++) {
      const slotId = `target-slot-${i}`;
      const inputId = i === 1 ? 'skill-search-input' : `skill-search-input-${i}`;
      const suggestionsId = i === 1 ? 'skill-suggestions' : `skill-suggestions-${i}`;
      
      const slot = document.getElementById(slotId);
      const input = document.getElementById(inputId);
      const suggestions = document.getElementById(suggestionsId);
      
      if (input) input.value = '';
      if (suggestions) suggestions.style.display = 'none';
      
      if (i === 1 && slot) {
        slot.style.display = 'flex';
      }
    }
  },

  renderTargetSlot(slotIndex) {
    const slotNumber = slotIndex + 1;
    const slotId = `target-slot-${slotNumber}`;
    const slot = document.getElementById(slotId);
    const targetContent = slot.querySelector('.target-content');
    
    if (this.selectedTargets[slotIndex]) {
      // Show selected skill badge
      const skill = this.selectedTargets[slotIndex];
      const nameParts = skill.name.split('. ');
      const mainName = nameParts[0];
      
      targetContent.innerHTML = `
        <div class="selected-skill-badge">
          <span class="skill-icon">${skill.icon}</span>
          <span class="skill-name">${mainName}</span>
          <button type="button" class="remove-btn" onclick="Modals.removeTarget(${slotIndex})">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
    } else {
      // Show search input
      const inputId = slotNumber === 1 ? 'skill-search-input' : `skill-search-input-${slotNumber}`;
      const suggestionsId = slotNumber === 1 ? 'skill-suggestions' : `skill-suggestions-${slotNumber}`;
      
      targetContent.innerHTML = `
        <div class="skill-search-wrapper">
          <input type="text" id="${inputId}" placeholder="Search and select a skill..." class="form-input" autocomplete="off">
          <div class="skill-suggestions" id="${suggestionsId}"></div>
        </div>
      `;
      
      // Re-setup event listeners for this slot
      this.setupSkillSearch(slotNumber);
    }
  },

  updateTargetSlots() {
    for (let i = 0; i < 3; i++) {
      const slotNumber = i + 1;
      const slotId = `target-slot-${slotNumber}`;
      const slot = document.getElementById(slotId);
      
      // Show slot if it has a target or if it's the next available slot
      const shouldShow = this.selectedTargets[i] !== null || 
                        (i === 0) || 
                        (i > 0 && this.selectedTargets[i-1] !== null);
      
      if (slot) {
        slot.style.display = shouldShow ? 'flex' : 'none';
      }
      
      this.renderTargetSlot(i);
    }
  },

  handleSkillSearch(query, slotNumber) {
    const suggestionsId = slotNumber === 1 ? 'skill-suggestions' : `skill-suggestions-${slotNumber}`;
    const suggestions = document.getElementById(suggestionsId);
    
    const allSkills = window.Storage.getSkills();
    let filteredSkills;
    
    // Filter out already selected skills first
    const availableSkills = allSkills.filter(skill => {
      return !this.selectedTargets.some(target => target && target.id === skill.id);
    });
    
    if (!query.trim()) {
      // Show all available skills when no search query
      filteredSkills = availableSkills.slice(0, 8); // Show more skills when no filter
    } else {
      // Filter by search term
      const searchTerm = query.toLowerCase();
      filteredSkills = availableSkills.filter(skill => {
        // Search in skill name and hover text
        const name = skill.name.toLowerCase();
        const hover = skill.hover ? skill.hover.toLowerCase() : '';
        
        return name.includes(searchTerm) || hover.includes(searchTerm);
      }).slice(0, 5); // Show fewer when filtering
    }
    
    if (filteredSkills.length > 0) {
      suggestions.style.display = 'block';
      suggestions.innerHTML = filteredSkills.map(skill => {
        const nameParts = skill.name.split('. ');
        const mainName = nameParts[0];
        const shortDesc = nameParts.slice(1).join('. ');
        
        return `
          <div class="skill-suggestion" data-skill-id="${skill.id}" data-slot-number="${slotNumber}">
            <span class="skill-suggestion-icon">${skill.icon}</span>
            <div>
              <div class="skill-suggestion-name">${mainName}</div>
              ${shortDesc ? `<div style="font-size: 0.75rem; color: var(--sub-color);">${shortDesc}</div>` : ''}
            </div>
          </div>
        `;
      }).join('');
      
      // Add event listeners to all suggestions
      const suggestionElements = suggestions.querySelectorAll('.skill-suggestion');
      suggestionElements.forEach(suggestion => {
        // Use mousedown instead of click to prevent blur from interfering
        suggestion.addEventListener('mousedown', (e) => {
          e.preventDefault(); // Prevent blur event
          const skillId = suggestion.getAttribute('data-skill-id');
          const slotNum = parseInt(suggestion.getAttribute('data-slot-number'));
          // Convert skillId to number if it's a valid number, otherwise keep as is
          const finalSkillId = isNaN(skillId) ? skillId : parseInt(skillId);
          this.selectTarget(finalSkillId, slotNum);
        });
      });
    } else {
      suggestions.style.display = 'none';
    }
  },

  selectTarget(skillId, slotNumber) {
    // Ensure skillId is the right type for comparison
    const skill = window.Storage.getSkillById(skillId);
    if (!skill) {
      console.error('Skill not found:', skillId);
      return;
    }
    
    const slotIndex = slotNumber - 1;
    
    // Check if skill is already selected
    if (this.selectedTargets.some(target => target && target.id == skill.id)) {
      App.showToast('This skill is already selected', 'error');
      return;
    }
    
    // Set the target for this slot
    this.selectedTargets[slotIndex] = skill;
    
    // Hide suggestions for this slot
    const suggestionsId = slotNumber === 1 ? 'skill-suggestions' : `skill-suggestions-${slotNumber}`;
    const suggestions = document.getElementById(suggestionsId);
    if (suggestions) {
      suggestions.style.display = 'none';
    }
    
    // Update all slots
    this.updateTargetSlots();
    
    App.showToast(`Target ${slotNumber} selected: ${skill.name.split('.')[0]}`, 'success');
  },

  removeTarget(slotIndex) {
    this.selectedTargets[slotIndex] = null;
    
    // Shift remaining targets left
    for (let i = slotIndex; i < 2; i++) {
      this.selectedTargets[i] = this.selectedTargets[i + 1];
    }
    this.selectedTargets[2] = null;
    
    this.updateTargetSlots();
  },

  openProtocolModal() {
    const modal = document.getElementById('add-protocol-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      this.resetTargets();
      this.updateTargetSlots();
      
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
    
    // Update modal for edit mode
    document.getElementById('protocol-modal-title').textContent = 'Edit Protocol';
    document.getElementById('submit-protocol-btn').textContent = 'Update Protocol';
    const deleteBtn = document.getElementById('delete-protocol-btn');
    if (deleteBtn) {
      deleteBtn.style.display = 'flex';
    }
    
    // Open modal first
    this.openProtocolModal();
    
    // THEN load selected skills into targets (after the modal is open and resetTargets() is called)
    this.selectedTargets = [null, null, null];
    const allSkills = window.Storage.getSkills();
    protocol.targets.forEach((targetId, index) => {
      if (index < 3) {
        const skill = allSkills.find(s => s.id === targetId);
        if (skill) {
          this.selectedTargets[index] = skill;
        }
      }
    });
    
    // Update the display to show selected targets
    this.updateTargetSlots();
  },

  deleteCurrentProtocol(protocolId) {
    if (!confirm('Are you sure you want to delete this protocol? This will also remove all related check-ins. This action cannot be undone.')) {
      return;
    }
    
    const success = window.Storage.deleteProtocol(protocolId);
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
    const skillsTab = document.getElementById('skills-tab');
    const statesTab = document.getElementById('states-tab');
    const skillsPanel = document.getElementById('skills-panel');
    const statesPanel = document.getElementById('states-panel');
    
    if (skillsTab && statesTab && skillsPanel && statesPanel) {
      skillsTab.addEventListener('click', () => {
        skillsTab.classList.add('active');
        statesTab.classList.remove('active');
        skillsPanel.classList.add('active');
        statesPanel.classList.remove('active');
      });
      
      statesTab.addEventListener('click', () => {
        statesTab.classList.add('active');
        skillsTab.classList.remove('active');
        statesPanel.classList.add('active');
        skillsPanel.classList.remove('active');
      });
    }
    
    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const selectedSkills = this.getSelectedDependencies('skills');
      const selectedStates = this.getSelectedDependencies('states');
      
      const stateData = {
        name: formData.get('state-name'),
        subtext: formData.get('state-subtext') || '',
        icon: formData.get('state-emoji'),
        hover: formData.get('state-hover'),
        skillIds: selectedSkills,
        stateIds: selectedStates
      };
      
      // Validate data
      if (!stateData.name || !stateData.icon || !stateData.hover) {
        App.showToast('Please fill all required fields', 'error');
        return;
      }
      
      if (selectedSkills.length === 0 && selectedStates.length === 0) {
        App.showToast('Please select at least one skill or state dependency', 'error');
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
    
    // Delete button
    const deleteBtn = document.getElementById('delete-state-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (this.currentStateId) {
          this.deleteCurrentState(this.currentStateId);
        }
      });
    }
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
      this.setSelectedDependencies(state.skillIds, state.stateIds);
    }, 100);
  },

  deleteCurrentState(stateId) {
    if (!confirm('Are you sure you want to delete this state? This action cannot be undone.')) {
      return;
    }
    
    const success = window.Storage.deleteState(stateId);
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
    if (!window.Storage || typeof window.Storage.getSkills !== 'function') {
      console.warn('Storage not available yet, retrying...');
      setTimeout(() => this.populateStateDependencies(), 100);
      return;
    }

    // Populate skills grid
    const skillsGrid = document.getElementById('skills-dependency-grid');
    const skills = window.Storage.getSkills();
    
    if (skillsGrid) {
      skillsGrid.innerHTML = skills.map(skill => {
        const nameParts = skill.name.split('. ');
        const mainName = nameParts[0];
        
        return `
          <div class="dependency-item" data-type="skill" data-id="${skill.id}">
            <input type="checkbox" value="${skill.id}" data-type="skill" style="display: none;">
            <div class="dependency-item-info">
              <span class="dependency-item-icon">${skill.icon}</span>
              <div class="dependency-item-name">${mainName}</div>
            </div>
          </div>
        `;
      }).join('');
      
      // Add click handlers
      skillsGrid.querySelectorAll('.dependency-item').forEach(item => {
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
    const dataType = type === 'skills' ? 'skill' : type === 'states' ? 'state' : type;
    
    const checkboxes = document.querySelectorAll(`input[type="checkbox"][data-type="${dataType}"]:checked`);
    const result = Array.from(checkboxes).map(cb => cb.value);
    return result;
  },

  setSelectedDependencies(skillIds, stateIds) {
    // Set skills
    if (skillIds) {
      skillIds.forEach(skillId => {
        const item = document.querySelector(`.dependency-item[data-type="skill"][data-id="${skillId}"]`);
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
    const skillsTab = document.getElementById('skills-tab');
    const statesTab = document.getElementById('states-tab');
    const skillsPanel = document.getElementById('skills-panel');
    const statesPanel = document.getElementById('states-panel');
    
    if (skillsTab && statesTab && skillsPanel && statesPanel) {
      skillsTab.classList.add('active');
      statesTab.classList.remove('active');
      skillsPanel.classList.add('active');
      statesPanel.classList.remove('active');
    }
  },

  refreshStatesView() {
    if (App.currentPage === 'dashboard') {
      UI.renderDashboard();
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
    
    const protocols = window.Storage.getProtocols();
    const currentQuickActions = window.Storage.getQuickActions();
    const skills = window.Storage.getSkills();
    
    // Filter available protocols (not already in quick actions)
    let availableProtocols = protocols.filter(protocol => 
      !currentQuickActions.some(qa => qa.id === protocol.id)
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
      // Get target skill names
      const targetNames = protocol.targets.map(targetId => {
        const skill = skills.find(s => s.id === targetId);
        return skill ? skill.name.split('. ')[0] : `Unknown (${targetId})`;
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
        UI.renderDashboard();
      }
    } else {
      App.showToast('Failed to add protocol to Quick Actions', 'error');
    }
  }
}; 