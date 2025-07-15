// ===== app.js - Main Application Entry Point =====

// Wait for DOM to load and Firebase Auth to initialize
document.addEventListener('DOMContentLoaded', () => {
    // Show auth UI immediately 
    showAuth();
    
    // Wait for Firebase to be available
    const waitForFirebase = () => {
        if (window.firebaseAuth && window.Auth) {
            initializeApp();
        } else {
            setTimeout(waitForFirebase, 100);
        }
    };
    
    waitForFirebase();
});

function initializeApp() {
    let isInitializing = false; // Prevent multiple simultaneous initializations
    
    // Initialize Firebase Auth state listener
    window.firebaseAuth.onAuthStateChanged((user) => {
        if (isInitializing) {
            console.log('🔄 Already initializing, skipping...');
            return;
        }
        
        if (user) {
            // User is signed in
            console.log('🔥 User authenticated:', user.email);
            isInitializing = true;
            
            // Set user first
            window.Storage.setUser(user);
            
            // Initialize storage with user context
            window.Storage.init();
            
            // Start non-blocking sync in background
            syncUserData().finally(() => {
                isInitializing = false;
            });
            
            // Update username immediately when user object changes
            const appContainer = document.getElementById('appContainer');
            if (appContainer && appContainer.style.display !== 'none') {
                updateUsername(user);
            } else {
                showApp(user);
            }
        } else {
            // User is signed out
            console.log('🚪 User signed out');
            isInitializing = false;
            window.Storage.setUser(null);
            showAuth();
        }
    });
}

function showApp(user) {
    console.log('User authenticated, showing app:', user.email);
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    
    // Set user in storage
    window.Storage.setUser(user);
    
    // Initialize storage data
    window.Storage.init();
    
    // 🔑 ВАЖНО: Обновляем имя пользователя сразу при показе приложения
    updateUsername(user);
    
    // Initialize app
    initMainApp();
    
    // 🚀 ЕДИНСТВЕННАЯ начальная синхронизация + периодическая 
    syncUserData();
    setupPeriodicSync();
}

function updateUsername(user) {
    const usernameElement = document.getElementById('username');
    if (usernameElement && user) {
        usernameElement.textContent = user.displayName || user.email || 'player';
    }
}

// Make updateUsername globally available
window.updateUsername = updateUsername;

function showAuth() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

async function syncUserData() {
    try {
        console.log('📡 Starting automatic sync after user authentication...');
        await window.Storage.syncWithBackend();
        console.log('✅ Automatic sync completed successfully');
        
        // 🔍 Дополнительная проверка целостности при старте приложения
        console.log('🔍 Running startup data integrity check...');
        const hasIssues = await window.Storage.performDataIntegrityCheck();
        if (hasIssues) {
            console.log('✅ Startup integrity check fixed data issues');
        } else {
            console.log('✅ Startup integrity check: all data consistent');
        }
    } catch (error) {
        console.error('❌ Automatic sync failed:', error);
    }
}

// 🚀 НОВАЯ ФУНКЦИЯ: Периодическая синхронизация
let syncIntervalId = null;
function setupPeriodicSync() {
    console.log('⏰ Setting up periodic sync every 2 minutes...');
    
    // Очистить существующий интервал если есть
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
    }
    
    let periodicSyncCount = 0; // Счетчик для ограничения проверки целостности
    
    // Синхронизация каждые 2 минуты (120000 ms)
    syncIntervalId = setInterval(async () => {
        if (window.firebaseAuth?.currentUser && window.Storage) {
            console.log('⏰ Periodic sync starting...');
            
            try {
                await window.Storage.syncWithBackend();
                
                // Проверка целостности только каждый 4-й раз (каждые 8 минут)
                periodicSyncCount++;
                if (periodicSyncCount % 4 === 0) {
                    console.log('🔍 Running periodic data integrity check...');
                    const hasIssues = await window.Storage.performDataIntegrityCheck();
                    if (hasIssues) {
                        console.log('✅ Periodic integrity check fixed data issues');
                    } else {
                        console.log('✅ Periodic integrity check: all data consistent');
                    }
                }
            } catch (error) {
                console.warn('⚠️ Periodic sync failed:', error);
            }
        }
    }, 120000); // 2 минуты вместо 30 секунд
}

// Очистить интервал при выходе
window.addEventListener('beforeunload', () => {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
    }
});

function initMainApp() {
    // Main App Object
    const App = {
        currentPage: 'dashboard',
        protocolsPage: 1,
        protocolsPerPage: 30,
        filteredProtocols: [],
        innerfacesPage: 1,
        innerfacesPerPage: 30,
        filteredInnerfaces: [],
        filteredHistory: [],
        historyInitialized: false,
        states: [],
        historyFilters: {
            time: 'all',
            type: 'all', 
            protocol: 'all',
            state: 'all',
            effect: 'all',
            innerface: 'all',
            customDateFrom: '',
            customDateTo: ''
        },
        protocolGroupFilters: {
            selectedGroups: ['all']
        },

        init() {
            // Initialize data
            this.states = window.Storage.getStatesInOrder();
            
            // Initialize protocol group filters
            this.protocolGroupFilters = {
                selectedGroups: ['all']
            };
            
            // Initialize filtered protocols
            this.filteredProtocols = window.Storage.getProtocolsInOrder();
            
            // 🔧 ДОПОЛНИТЕЛЬНАЯ ЗАЩИТА: Убеждаемся, что filteredProtocols не undefined
            if (!this.filteredProtocols || this.filteredProtocols === undefined) {
                console.warn('⚠️ INIT: filteredProtocols is undefined, setting to empty array');
                this.filteredProtocols = [];
            }
            
            // Setup navigation
            this.setupNavigation();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize modals
            Modals.init();
            
            // Render initial page
            this.renderPage('dashboard');
            
            // Setup navigation indicator
            this.updateNavIndicator();
        },

        setupNavigation() {
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const page = e.currentTarget.dataset.page;
                    this.navigateTo(page);
                });
            });
            
            // Setup expandable navigation
            this.setupExpandableNavigation();
        },

        setupEventListeners() {
            // Clear history button
            const clearBtn = document.getElementById('clear-history');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
                        window.Storage.clearAllCheckins();
                        this.filteredHistory = [];
                        this.historyInitialized = false;
                        
                        // Clear search input
                        const historySearchInput = document.getElementById('history-search');
                        if (historySearchInput) {
                            historySearchInput.value = '';
                        }
                        
                        this.showToast('History cleared', 'success');
                        this.renderPage('history');
                    }
                });
            }

            // Protocol search
            const searchInput = document.getElementById('protocol-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.filterProtocols(e.target.value);
                });
            }

            // Innerface search
            const innerfaceSearchInput = document.getElementById('innerface-search');
            if (innerfaceSearchInput) {
                innerfaceSearchInput.addEventListener('input', (e) => {
                    this.filterInnerfaces(e.target.value);
                });
            }

            // History search
            const historySearchInput = document.getElementById('history-search');
            if (historySearchInput) {
                historySearchInput.addEventListener('input', (e) => {
                    this.filterHistory(e.target.value);
                });
            }

            // History filters
            this.setupHistoryFilters();

            // Pagination buttons
            const prevBtn = document.getElementById('prev-page');
            const nextBtn = document.getElementById('next-page');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (this.protocolsPage > 1) {
                        this.protocolsPage--;
                        UI.renderProtocols();
                        DragDrop.setupProtocols();
                        this.setupTooltips();
                        this.updatePagination();
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    const totalPages = Math.ceil(this.filteredProtocols.length / this.protocolsPerPage);
                    if (this.protocolsPage < totalPages) {
                        this.protocolsPage++;
                        UI.renderProtocols();
                        DragDrop.setupProtocols();
                        this.setupTooltips();
                        this.updatePagination();
                    }
                });
            }

            // Innerfaces pagination buttons
            const innerfacesPrevBtn = document.getElementById('innerfaces-prev-page');
            const innerfacesNextBtn = document.getElementById('innerfaces-next-page');
            
            if (innerfacesPrevBtn) {
                innerfacesPrevBtn.addEventListener('click', () => {
                    if (this.innerfacesPage > 1) {
                        this.innerfacesPage--;
                        UI.renderInnerfaces();
                        DragDrop.setupInnerfaces();
                        this.updateInnerfacesPagination();
                    }
                });
            }

            if (innerfacesNextBtn) {
                innerfacesNextBtn.addEventListener('click', () => {
                    const totalPages = Math.ceil(this.filteredInnerfaces.length / this.innerfacesPerPage);
                    if (this.innerfacesPage < totalPages) {
                        this.innerfacesPage++;
                        UI.renderInnerfaces();
                        DragDrop.setupInnerfaces();
                        this.updateInnerfacesPagination();
                    }
                });
            }

            // Setup tooltip positioning
            this.setupTooltips();
        },

        setupTooltips() {
            let tooltipTimeout = null;
            let currentTooltipElement = null;

            // Clear any existing tooltip
            const clearCurrentTooltip = () => {
                if (tooltipTimeout) {
                    clearTimeout(tooltipTimeout);
                    tooltipTimeout = null;
                }
                if (currentTooltipElement) {
                    currentTooltipElement.classList.remove('show-tooltip');
                    currentTooltipElement = null;
                }
            };

            // Add tooltip handlers to protocol and innerface name cells
            this.setupTooltipRowHandlers(clearCurrentTooltip, (element) => {
                currentTooltipElement = element;
                tooltipTimeout = setTimeout(() => {
                    if (currentTooltipElement === element) {
                        element.classList.add('show-tooltip');
                    }
                }, 1000);
            });
        },

        setupTooltipRowHandlers(clearTooltip, startTooltip) {
            // Handle protocol name cells
            document.querySelectorAll('.protocol-name-cell[data-hover]').forEach(cell => {
                cell.addEventListener('mouseenter', () => {
                    clearTooltip();
                    startTooltip(cell);
                });
                
                cell.addEventListener('mouseleave', () => {
                    clearTooltip();
                });
            });

            // Handle innerface name cells
            document.querySelectorAll('.innerface-name-cell[data-hover]').forEach(cell => {
                cell.addEventListener('mouseenter', () => {
                    clearTooltip();
                    startTooltip(cell);
                });
                
                cell.addEventListener('mouseleave', () => {
                    clearTooltip();
                });
            });
            
            // Handle quick protocol cells with hover information
            document.querySelectorAll('.quick-protocol[data-hover]').forEach(cell => {
                cell.addEventListener('mouseenter', () => {
                    clearTooltip();
                    startTooltip(cell);
                });
                
                cell.addEventListener('mouseleave', () => {
                    clearTooltip();
                });
            });
        },

        navigateTo(page) {
            // 🎯 НОВОЕ: Сброс фильтров при уходе из History
            if (this.currentPage === 'history' && page !== 'history') {
                console.log('🔄 LEAVING HISTORY PAGE: Resetting filters');
                this.historyFilters = {
                    time: 'all',
                    type: 'all',
                    protocol: 'all',
                    state: 'all',
                    effect: 'all',
                    innerface: 'all',
                    customDateFrom: '',
                    customDateTo: ''
                };
                
                // Clear search input
                const historySearchInput = document.getElementById('history-search');
                if (historySearchInput) {
                    historySearchInput.value = '';
                }
                
                // Reset history data for next visit
                this.filteredHistory = [];
                this.historyInitialized = false;
                
                console.log('✅ HISTORY FILTERS RESET');
            }
            
            // Update nav
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.page === page);
            });
            
            // Update pages
            document.querySelectorAll('.page').forEach(p => {
                p.classList.toggle('active', p.id === page);
            });
            
            // Handle history button expansion
            if (page === 'history' && this.navExpansion) {
                // Check if history button is already in program-expanded state
                const navHistory = document.getElementById('nav-history');
                const isProgramExpanded = navHistory && navHistory.classList.contains('program-expanded');
                
                if (!isProgramExpanded) {
                    // Only expand if not already in program state
                    const navExpandBtn = document.getElementById('nav-expand-btn');
                    const navInnerfacesGroup = document.querySelector('.nav-innerfaces-group');
                    
                    if (navHistory && navExpandBtn && navInnerfacesGroup) {
                        navExpandBtn.classList.add('expanded');
                        navHistory.classList.add('expanded');
                        navInnerfacesGroup.classList.add('expanded');
                    }
                }
            } else if (page !== 'history' && this.navExpansion) {
                // Reset navigation expansion if not navigating to history
                this.navExpansion.reset();
            }
            
            this.currentPage = page;
            this.renderPage(page);
            this.updateNavIndicator();
        },

        updateNavIndicator() {
            const activeItem = document.querySelector('.nav-item.active');
            const indicator = document.querySelector('.nav-indicator');
            
            if (activeItem && indicator) {
                const rect = activeItem.getBoundingClientRect();
                const containerRect = activeItem.parentElement.getBoundingClientRect();
                
                indicator.style.left = (rect.left - containerRect.left) + 'px';
                indicator.style.width = rect.width + 'px';
            }
        },

        renderPage(page) {
            // 🚫 УБИРАЕМ ПРИНУДИТЕЛЬНУЮ СИНХРОНИЗАЦИЮ ПРИ ПЕРЕКЛЮЧЕНИИ СТРАНИЦ
            // Слишком шумно и не нужно при наличии периодической синхронизации
            // window.Storage.syncWithBackend().catch(error => {
            //     console.warn('⚠️ Page sync failed, using cached data:', error);
            // });
            
            switch(page) {
                case 'dashboard':
                    UI.renderDashboard();
                    this.setupTooltips();
                    break;
                case 'protocols':
                    // Apply protocol group filters first, then render
                    this.applyProtocolGroupFilters();
                    DragDrop.setupProtocols();
                    this.setupTooltips();
                    
                    // Setup protocol group filters after rendering
                    setTimeout(() => {
                        this.setupProtocolGroupFilters();
                        // Ensure badges are rendered after setup
                        this.renderActiveFilterBadges();
                    }, 0);
                    break;
                case 'innerfaces':
                    UI.renderInnerfaces();
                    DragDrop.setupInnerfaces();
                    this.setupTooltips();
                    break;
                case 'history':
                    // Don't automatically reload history from storage - let UI.renderHistory() handle initialization properly
                    // This prevents deleted checkins from being restored when switching to history page
                    
                    UI.renderHistory();
                    
                    // Setup filters after rendering
                    setTimeout(() => {
                        this.setupHistoryFilters();
                    }, 0);
                    
                    break;
            }
            
            // 🔧 Event delegation for delete buttons is now handled by modals.js initialization
            // No need to re-setup on every page render since we use document-level delegation
        },

        // Actions
        checkin(protocolId, action = '+') {
            const checkin = window.Storage.addCheckin(protocolId, action);
            if (checkin) {
                this.showToast('Check-in successful!', 'success');
                
                // Always update dashboard stats since innerfaces changed
                UI.updateUserStats();
                
                // Update current page
                this.renderPage(this.currentPage);
                
                // Update history in real-time if we're on the history page
                if (this.currentPage === 'history') {
                    // Reset history filter to refresh data and re-apply current filters
                    this.filteredHistory = [];
                    this.historyInitialized = false;
                    this.applyHistoryFilters();
                } else {
                    // If not on history page, just reset the history data for next visit
                    this.filteredHistory = [];
                    this.historyInitialized = false;
                }
                
                // If we're not on innerfaces page, but innerfaces were affected, update innerfaces data
                if (this.currentPage !== 'innerfaces') {
                    this.filteredInnerfaces = window.Storage.getInnerfacesInOrder();
                }
                
                // If we're not on dashboard, but dashboard shows states that could be affected
                if (this.currentPage !== 'dashboard') {
                    // Update states data for next dashboard visit
                    this.states = window.Storage.getStatesInOrder();
                }
                
                // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ ЧЕКИНА
                // Синхронизируем данные с сервером в фоне
                window.Storage.syncWithBackend().catch(error => {
                    console.warn('⚠️ Background sync after checkin failed:', error);
                    // Не показываем ошибку пользователю, так как данные сохранены локально
                });
            }
        },

        quickCheckin(protocolId, action = '+') {
            this.checkin(protocolId, action);
        },

        deleteCheckin(checkinId) {
            // 🔧 DEPRECATED: This method is now handled by event delegation in modals.js
            // Left here for backward compatibility, but all functionality moved to setupHistoryDeleteButtons()
            console.warn('⚠️ App.deleteCheckin() is deprecated - deletion now handled by modals.js event delegation');
        },

        // Toast notifications
        showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
            toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
            
            container.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('toast-fade-out');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        },

        filterProtocols(query) {
            // Use applyProtocolGroupFilters which handles both search and group filters
            this.applyProtocolGroupFilters();
        },

        updatePagination() {
            const totalProtocols = this.filteredProtocols.length;
            const totalPages = Math.ceil(totalProtocols / this.protocolsPerPage);
            
            const currentPageSpan = document.getElementById('current-page');
            const totalPagesSpan = document.getElementById('total-pages');
            const prevBtn = document.getElementById('prev-page');
            const nextBtn = document.getElementById('next-page');
            
            if (currentPageSpan) currentPageSpan.textContent = this.protocolsPage;
            if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
            
            if (prevBtn) {
                prevBtn.disabled = this.protocolsPage <= 1;
            }
            
            if (nextBtn) {
                nextBtn.disabled = this.protocolsPage >= totalPages;
            }
        },

        updateInnerfacesPagination() {
            const totalInnerfaces = this.filteredInnerfaces.length;
            const totalPages = Math.ceil(totalInnerfaces / this.innerfacesPerPage);
            
            const currentPageSpan = document.getElementById('innerfaces-current-page');
            const totalPagesSpan = document.getElementById('innerfaces-total-pages');
            const innerfacesPrevBtn = document.getElementById('innerfaces-prev-page');
            const innerfacesNextBtn = document.getElementById('innerfaces-next-page');
            
            if (currentPageSpan) currentPageSpan.textContent = this.innerfacesPage;
            if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
            
            if (innerfacesPrevBtn) {
                innerfacesPrevBtn.disabled = this.innerfacesPage <= 1;
            }
            
            if (innerfacesNextBtn) {
                innerfacesNextBtn.disabled = this.innerfacesPage >= totalPages;
            }
        },

        filterInnerfaces(query) {
            const allInnerfaces = window.Storage.getInnerfacesInOrder();
            
            if (!query.trim()) {
                this.filteredInnerfaces = allInnerfaces;
            } else {
                this.filteredInnerfaces = allInnerfaces.filter(innerface => 
                    innerface.name.toLowerCase().includes(query.toLowerCase()) ||
                    innerface.hover.toLowerCase().includes(query.toLowerCase())
                );
            }
            
            // Reset to first page when filtering
            this.innerfacesPage = 1;
            UI.renderInnerfaces();
            DragDrop.setupInnerfaces();
            this.updateInnerfacesPagination();
        },

        filterHistory(query) {
            // Just trigger the main filter function which handles both search and filters
            this.applyHistoryFilters();
        },

        // Setup protocol group filters
        setupProtocolGroupFilters() {
            if (window.DEBUG_PROTOCOL_FILTERS) {
                console.log('🔧 SETUP PROTOCOL GROUP FILTERS DEBUG');
            }
            this.populateProtocolGroupFilters();
            
            const filterCheckboxes = document.querySelectorAll('.group-filter-checkbox');
            const protocolsFiltersIcon = document.getElementById('protocols-filters-icon');
            
            if (window.DEBUG_PROTOCOL_FILTERS) {
                console.log('Found filter checkboxes:', filterCheckboxes.length);
                console.log('Filter checkboxes:', Array.from(filterCheckboxes).map(cb => ({
                    value: cb.dataset.value,
                    checked: cb.checked
                })));
            }
            
            filterCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    if (window.DEBUG_PROTOCOL_FILTERS) {
                        console.log('📋 CHECKBOX CHANGE EVENT');
                    }
                    const filterValue = e.target.dataset.value;
                    if (window.DEBUG_PROTOCOL_FILTERS) {
                        console.log('Filter value:', filterValue);
                        console.log('Checked:', e.target.checked);
                    }
                    
                    if (e.target.checked) {
                        if (window.DEBUG_PROTOCOL_FILTERS) {
                            console.log('Checkbox checked - setting up filters');
                        }
                        
                        if (filterValue === 'all') {
                            // If "all" is selected, uncheck all other checkboxes
                            filterCheckboxes.forEach(cb => {
                                if (cb !== e.target) {
                                    cb.checked = false;
                                }
                            });
                            this.protocolGroupFilters.selectedGroups = ['all'];
                        } else {
                            // If a specific group is selected, uncheck "all" and add to selected groups
                            const allCheckbox = document.querySelector('.group-filter-checkbox[data-value="all"]');
                            if (allCheckbox) {
                                allCheckbox.checked = false;
                            }
                            
                            // Add to selected groups (multiple selection)
                            if (!this.protocolGroupFilters.selectedGroups.includes(filterValue)) {
                                // Remove 'all' if it exists
                                this.protocolGroupFilters.selectedGroups = this.protocolGroupFilters.selectedGroups.filter(g => g !== 'all');
                                this.protocolGroupFilters.selectedGroups.push(filterValue);
                            }
                        }
                    } else {
                        if (window.DEBUG_PROTOCOL_FILTERS) {
                            console.log('Checkbox unchecked - removing from filters');
                        }
                        
                        if (filterValue === 'all') {
                            // Prevent unchecking "all" if it's the only one checked
                            e.target.checked = true;
                            return;
                        } else {
                            // Remove from selected groups
                            this.protocolGroupFilters.selectedGroups = this.protocolGroupFilters.selectedGroups.filter(g => g !== filterValue);
                            
                            // If no groups are selected, default to "all"
                            if (this.protocolGroupFilters.selectedGroups.length === 0) {
                                const allCheckbox = document.querySelector('.group-filter-checkbox[data-value="all"]');
                                if (allCheckbox) {
                                    allCheckbox.checked = true;
                                }
                                this.protocolGroupFilters.selectedGroups = ['all'];
                            }
                        }
                    }
                    
                    if (window.DEBUG_PROTOCOL_FILTERS) {
                        console.log('New selectedGroups:', this.protocolGroupFilters.selectedGroups);
                    }
                    this.updateGroupFilterIcon();
                    this.applyProtocolGroupFilters();
                });
            });
            
            this.updateGroupFilterIcon();
        },

        // Populate protocol group filter options
        populateProtocolGroupFilters() {
            if (window.DEBUG_PROTOCOL_FILTERS) {
                console.log('🏗️ POPULATE PROTOCOL GROUP FILTERS DEBUG');
            }
            const container = document.getElementById('protocol-group-filter-options');
            if (!container) {
                if (window.DEBUG_PROTOCOL_FILTERS) {
                    console.log('❌ Container not found: protocol-group-filter-options');
                }
                return;
            }
            if (window.DEBUG_PROTOCOL_FILTERS) {
                console.log('✅ Container found');
            }

            const groups = window.Storage.getProtocolGroups();
            if (window.DEBUG_PROTOCOL_FILTERS) {
                console.log('Available groups:', groups);
            }
            
            // Build filter options - only add custom groups (ungrouped is already in HTML)
            const filterOptions = [];
            
            // Add custom groups
            groups.forEach(group => {
                // Use UI renderIcon for proper FontAwesome support with group color
                const icon = group.icon || '📁';
                const groupColor = group.color || '#7fb3d3';
                let iconHtml;
                if (window.UI) {
                    iconHtml = window.UI.renderIcon(icon, groupColor);
                } else {
                    iconHtml = icon;
                }
                
                filterOptions.push(`
                    <label class="filter-option filter-group-option" data-group-id="${group.id}">
                        <input type="checkbox" class="group-filter-checkbox" data-filter="group" data-value="${group.id}">
                        <i class="fas fa-check filter-check-icon"></i>
                        <span class="filter-label">${iconHtml} ${group.name}</span>
                        <span class="filter-group-settings" data-group-id="${group.id}">
                            <i class="fas fa-cog"></i>
                        </span>
                    </label>
                `);
            });
            
            container.innerHTML = filterOptions.join('');
            if (window.DEBUG_PROTOCOL_FILTERS) {
                console.log('Generated filter options HTML:', filterOptions.join(''));
            }
            
            // Setup gear icon click handlers
            this.setupFilterGroupSettingsHandlers();
        },

        // Setup filter group settings handlers
        setupFilterGroupSettingsHandlers() {
            const settingsIcons = document.querySelectorAll('.filter-group-settings');
            
            settingsIcons.forEach(icon => {
                icon.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const groupId = e.currentTarget.dataset.groupId;
                    if (groupId && Modals) {
                        Modals.openGroupSettings(groupId);
                    }
                });
            });
        },

        // Update group filter icon state
        updateGroupFilterIcon() {
            const protocolsFiltersIcon = document.getElementById('protocols-filters-icon');
            if (!protocolsFiltersIcon) return;
            
            const hasActiveFilters = !this.protocolGroupFilters.selectedGroups.includes('all');
            
            if (hasActiveFilters) {
                protocolsFiltersIcon.classList.add('active');
            } else {
                protocolsFiltersIcon.classList.remove('active');
            }
            
            // Update active filter badges
            this.renderActiveFilterBadges();
        },

        // Render active filter badges
        renderActiveFilterBadges() {
            const badgesContainer = document.getElementById('protocols-active-filters');
            
            if (!badgesContainer) return;
            
            const hasActiveFilters = !this.protocolGroupFilters.selectedGroups.includes('all');
            
            // Show badges only if there are active filters
            if (!hasActiveFilters) {
                badgesContainer.classList.add('hidden');
                return;
            }
            
            // Show badges and render them
            badgesContainer.classList.remove('hidden');
            
            // Generate badge HTML for each active filter
            const badgeData = [];
            
            this.protocolGroupFilters.selectedGroups.forEach(groupId => {
                if (groupId === 'all') return; // Skip 'all' filter
                
                let badgeHtml = '';
                
                if (groupId === 'ungrouped') {
                    // Special case for ungrouped filter
                    badgeHtml = `
                        <div class="protocol-filter-badge ungrouped-badge" data-group-id="ungrouped">
                            <span class="filter-badge-icon">
                                <i class="fas fa-folder-open"></i>
                            </span>
                            <span class="filter-badge-name">Ungrouped</span>
                            <button class="protocol-filter-badge-delete" onclick="removeActiveFilter('ungrouped')" title="Remove filter">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                } else {
                    // Regular group filter
                    const groups = window.Storage.getProtocolGroups();
                    const group = groups.find(g => g.id.toString() === groupId);
                    
                    if (group) {
                        const groupColor = group.color || '#7fb3d3';
                        let iconHtml;
                        
                        if (window.UI) {
                            iconHtml = window.UI.renderIcon(group.icon, groupColor);
                        } else {
                            iconHtml = group.icon || '📁';
                        }
                        
                        // Convert hex color to RGB for CSS custom properties
                        const hexToRgb = (hex) => {
                            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                            return result ? {
                                r: parseInt(result[1], 16),
                                g: parseInt(result[2], 16),
                                b: parseInt(result[3], 16)
                            } : null;
                        };
                        
                        const rgb = hexToRgb(groupColor);
                        const rgbString = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '127, 179, 211';
                        
                        badgeHtml = `
                            <div class="protocol-filter-badge group-badge" data-group-id="${group.id}" style="--group-color: ${groupColor}; --group-color-rgb: ${rgbString};">
                                <span class="filter-badge-icon">${iconHtml}</span>
                                <span class="filter-badge-name">${group.name}</span>
                                <button class="protocol-filter-badge-delete" onclick="removeActiveFilter('${group.id}')" title="Remove filter">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `;
                    }
                }
                
                if (badgeHtml) {
                    badgeData.push(badgeHtml);
                }
            });
            
            // For now, simply show all badges - the CSS will handle overflow
            // TODO: Implement proper width measurement later if needed
            badgesContainer.innerHTML = badgeData.join('');
        },

        // Remove active filter (called by badge delete button)
        removeActiveFilter(groupId) {
            // Remove specific group from selected groups
            this.protocolGroupFilters.selectedGroups = this.protocolGroupFilters.selectedGroups.filter(g => g !== groupId);
            
            // If no groups are selected, default to 'all'
            if (this.protocolGroupFilters.selectedGroups.length === 0) {
                this.protocolGroupFilters.selectedGroups = ['all'];
            }
            
            // Update checkboxes in the dropdown
            const filterCheckboxes = document.querySelectorAll('.group-filter-checkbox');
            filterCheckboxes.forEach(checkbox => {
                if (checkbox.dataset.value === 'all') {
                    checkbox.checked = this.protocolGroupFilters.selectedGroups.includes('all');
                } else {
                    checkbox.checked = this.protocolGroupFilters.selectedGroups.includes(checkbox.dataset.value);
                }
            });
            
            // Update UI
            this.updateGroupFilterIcon();
            this.applyProtocolGroupFilters();
        },

        // Apply protocol group filters
        applyProtocolGroupFilters(resetPage = true) {
            // Debug logging (can be enabled via window.DEBUG_PROTOCOL_FILTERS = true)
            if (window.DEBUG_PROTOCOL_FILTERS) {
                console.log('🔍 APPLY PROTOCOL GROUP FILTERS DEBUG');
                console.log('Selected groups:', this.protocolGroupFilters.selectedGroups);
                console.log('Reset page:', resetPage);
            }
            
            const searchInput = document.getElementById('protocol-search');
            const searchQuery = searchInput ? searchInput.value : '';
            
            if (window.DEBUG_PROTOCOL_FILTERS) {
                console.log('Search query:', searchQuery);
            }
            
            // Start with all protocols
            const allProtocols = window.Storage.getProtocolsInOrder();
            const innerfaces = window.Storage.getInnerfaces();
            
            if (window.DEBUG_PROTOCOL_FILTERS) {
                console.log('All protocols:', allProtocols.map(p => ({
                    id: p.id, 
                    name: p.name.split('. ')[0], 
                    groupId: p.groupId
                })));
            }
            
            let filteredProtocols = allProtocols;
            
            // Apply group filters
            if (!this.protocolGroupFilters.selectedGroups.includes('all')) {
                if (window.DEBUG_PROTOCOL_FILTERS) {
                    console.log('Applying group filters...');
                }
                filteredProtocols = allProtocols.filter(protocol => {
                    // Check if ungrouped is selected and protocol has no groupId
                    if (this.protocolGroupFilters.selectedGroups.includes('ungrouped') && !protocol.groupId) {
                        if (window.DEBUG_PROTOCOL_FILTERS) {
                            console.log(`Protocol ${protocol.name} matches ungrouped filter`);
                        }
                        return true;
                    }
                    
                    // Check if protocol's groupId matches any selected group
                    if (protocol.groupId) {
                        const matches = this.protocolGroupFilters.selectedGroups.includes(protocol.groupId.toString());
                        if (window.DEBUG_PROTOCOL_FILTERS) {
                            console.log(`Protocol ${protocol.name} (groupId: ${protocol.groupId}) matches: ${matches}`);
                        }
                        return matches;
                    }
                    
                    if (window.DEBUG_PROTOCOL_FILTERS) {
                        console.log(`Protocol ${protocol.name} filtered out (no groupId, ungrouped not selected)`);
                    }
                    return false;
                });
            } else {
                if (window.DEBUG_PROTOCOL_FILTERS) {
                    console.log('Showing all protocols (no group filter)');
                }
            }
            
            // Apply search filter
            if (searchQuery.trim()) {
                if (window.DEBUG_PROTOCOL_FILTERS) {
                    console.log('Applying search filter...');
                }
                const searchTerm = searchQuery.toLowerCase();
                filteredProtocols = filteredProtocols.filter(protocol => {
                    // Search in protocol name
                    if (protocol.name.toLowerCase().includes(searchTerm)) {
                        return true;
                    }
                    
                    // Search in target innerfaces
                    const targetNames = protocol.targets.map(targetId => {
                        const innerface = innerfaces.find(s => s.id === targetId);
                        return innerface ? innerface.name.toLowerCase() : targetId;
                    });
                    
                    return targetNames.some(name => name.includes(searchTerm));
                });
            }
            
            if (window.DEBUG_PROTOCOL_FILTERS) {
                console.log('Final filtered protocols:', filteredProtocols.map(p => ({
                    id: p.id, 
                    name: p.name.split('. ')[0], 
                    groupId: p.groupId
                })));
            }
            
            this.filteredProtocols = filteredProtocols;
            
            // 🔧 НОВОЕ: Применяем правильный порядок для текущего фильтра
            if (window.DEBUG_PROTOCOL_FILTERS) {
                console.log('🔧 APPLYING FILTER ORDER:', {
                    selectedGroups: this.protocolGroupFilters.selectedGroups,
                    filteredProtocolsBeforeOrder: this.filteredProtocols.map(p => p.id),
                    filterKey: window.Storage.getFilterKey(this.protocolGroupFilters.selectedGroups)
                });
            }
            
            this.filteredProtocols = window.Storage.getProtocolsInOrderForFilter(
                this.protocolGroupFilters.selectedGroups,
                this.filteredProtocols
            );
            
            if (window.DEBUG_PROTOCOL_FILTERS) {
                console.log('🔧 FILTER ORDER APPLIED:', {
                    filteredProtocolsAfterOrder: this.filteredProtocols.map(p => p.id)
                });
            }
            
            // 🔧 ИСПРАВЛЕНИЕ: Сбрасываем страницу только при фильтрации, не при reordering
            if (resetPage) {
                this.protocolsPage = 1; // Reset to first page
            }
            
            UI.renderProtocols();
            DragDrop.setupProtocols();
            this.setupTooltips();
            this.updatePagination(); // 🔧 ИСПРАВЛЕНИЕ: Обновляем пагинацию после фильтрации
            this.renderActiveFilterBadges(); // 🔧 ИСПРАВЛЕНИЕ: Отображаем бейджи групп протоколов
        },

        // Setup history filters
        setupHistoryFilters() {
            // Populate dynamic filter options
            this.populateProtocolFilters();
            this.populateStateFilters();
            this.populateInnerfaceFilters();
            
            const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
            const customDateRange = document.getElementById('filter-custom-date-range');
            const dateFromInput = document.getElementById('filter-date-from');
            const dateToInput = document.getElementById('filter-date-to');
            const protocolSubmenu = document.getElementById('protocol-filter-submenu');
            const stateSubmenu = document.getElementById('state-filter-submenu');
            const innerfaceSubmenu = document.getElementById('innerface-filter-submenu');
            const protocolSpecificOption = document.getElementById('protocol-specific-option');
            const stateSpecificOption = document.getElementById('state-specific-option');
            const innerfaceSpecificOption = document.getElementById('innerface-specific-option');
            
            filterCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const filterType = e.target.dataset.filter;
                    const filterValue = e.target.dataset.value;
                    
                    // Handle "all" checkboxes
                    if (filterValue === 'all') {
                        if (e.target.checked) {
                            // Uncheck other options in the same group
                            const groupCheckboxes = document.querySelectorAll(`[data-filter="${filterType}"]`);
                            groupCheckboxes.forEach(cb => {
                                if (cb !== e.target) {
                                    cb.checked = false;
                                }
                            });
                            this.historyFilters[filterType] = 'all';
                            
                            // Hide custom date range if time filter is set to all
                            if (filterType === 'time' && customDateRange) {
                                customDateRange.style.display = 'none';
                            }
                            
                            // Hide submenus for protocol/state/innerface filters and remove active class
                            if (filterType === 'protocol' && protocolSubmenu && protocolSpecificOption) {
                                protocolSubmenu.classList.remove('show');
                                protocolSpecificOption.classList.remove('active');
                                // Uncheck all submenu options
                                protocolSubmenu.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                            }
                            if (filterType === 'state' && stateSubmenu && stateSpecificOption) {
                                stateSubmenu.classList.remove('show');
                                stateSpecificOption.classList.remove('active');
                                // Uncheck all submenu options
                                stateSubmenu.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                            }
                            if (filterType === 'innerface' && innerfaceSubmenu && innerfaceSpecificOption) {
                                innerfaceSubmenu.classList.remove('show');
                                innerfaceSpecificOption.classList.remove('active');
                                // Uncheck all submenu options
                                innerfaceSubmenu.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                            }
                        } else {
                            // Prevent unchecking "all" if it's the only one checked
                            e.target.checked = true;
                        }
                    } else if (filterValue === 'specific') {
                        // Handle "specific protocol/state" checkboxes
                        if (e.target.checked) {
                            // Uncheck "all"
                            const allCheckbox = document.querySelector(`[data-filter="${filterType}"][data-value="all"]`);
                            if (allCheckbox) {
                                allCheckbox.checked = false;
                            }
                            
                            // Show appropriate submenu and add active class
                            if (filterType === 'protocol' && protocolSubmenu && protocolSpecificOption) {
                                protocolSubmenu.classList.add('show');
                                protocolSpecificOption.classList.add('active');
                                // Don't auto-select anything - user will choose manually
                            }
                            if (filterType === 'state' && stateSubmenu && stateSpecificOption) {
                                stateSubmenu.classList.add('show');
                                stateSpecificOption.classList.add('active');
                                // Don't auto-select anything - user will choose manually
                            }
                            if (filterType === 'innerface' && innerfaceSubmenu && innerfaceSpecificOption) {
                                innerfaceSubmenu.classList.add('show');
                                innerfaceSpecificOption.classList.add('active');
                                // Don't auto-select anything - user will choose manually
                            }
                        } else {
                            // If unchecking specific, hide submenu and check "all"
                            const allCheckbox = document.querySelector(`[data-filter="${filterType}"][data-value="all"]`);
                            if (allCheckbox) {
                                allCheckbox.checked = true;
                                this.historyFilters[filterType] = 'all';
                            }
                            
                            // Hide submenu, remove active class and uncheck all options
                            if (filterType === 'protocol' && protocolSubmenu && protocolSpecificOption) {
                                protocolSubmenu.classList.remove('show');
                                protocolSpecificOption.classList.remove('active');
                                protocolSubmenu.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                            }
                            if (filterType === 'state' && stateSubmenu && stateSpecificOption) {
                                stateSubmenu.classList.remove('show');
                                stateSpecificOption.classList.remove('active');
                                stateSubmenu.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                            }
                            if (filterType === 'innerface' && innerfaceSubmenu && innerfaceSpecificOption) {
                                innerfaceSubmenu.classList.remove('show');
                                innerfaceSpecificOption.classList.remove('active');
                                innerfaceSubmenu.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                            }
                        }
                    } else {
                        // Handle specific filter options within submenus or regular filters
                        if (e.target.checked) {
                            // For submenu options, uncheck other options in the same submenu
                            const isInSubmenu = e.target.closest('.filter-submenu');
                            if (isInSubmenu) {
                                const submenuCheckboxes = isInSubmenu.querySelectorAll('input[type="checkbox"]');
                                submenuCheckboxes.forEach(cb => {
                                    if (cb !== e.target) {
                                        cb.checked = false;
                                    }
                                });
                            } else {
                                // For regular filters, uncheck other options in the same group
                                const groupCheckboxes = document.querySelectorAll(`[data-filter="${filterType}"]`);
                                groupCheckboxes.forEach(cb => {
                                    if (cb !== e.target) {
                                        cb.checked = false;
                                    }
                                });
                            }
                            
                            this.historyFilters[filterType] = filterValue;
                            
                            // Show/hide custom date range for time filter
                            if (filterType === 'time' && customDateRange) {
                                if (filterValue === 'custom') {
                                    customDateRange.style.display = 'block';
                                    // Set default dates if empty
                                    const today = new Date();
                                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                                    if (!dateFromInput.value) {
                                        dateFromInput.value = weekAgo.toISOString().split('T')[0];
                                        this.historyFilters.customDateFrom = dateFromInput.value;
                                    }
                                    if (!dateToInput.value) {
                                        dateToInput.value = today.toISOString().split('T')[0];
                                        this.historyFilters.customDateTo = dateToInput.value;
                                    }
                                } else {
                                    customDateRange.style.display = 'none';
                                }
                            }
                        } else {
                            // If unchecking and no other options are checked, check "all"
                            const isInSubmenu = e.target.closest('.filter-submenu');
                            if (isInSubmenu) {
                                // For submenu items, if no submenu options are checked, go back to "all"
                                const submenuCheckboxes = isInSubmenu.querySelectorAll('input[type="checkbox"]');
                                const hasChecked = Array.from(submenuCheckboxes).some(cb => cb.checked);
                                
                                if (!hasChecked) {
                                    const allCheckbox = document.querySelector(`[data-filter="${filterType}"][data-value="all"]`);
                                    const specificCheckbox = document.querySelector(`[data-filter="${filterType}"][data-value="specific"]`);
                                    if (allCheckbox && specificCheckbox) {
                                        allCheckbox.checked = true;
                                        specificCheckbox.checked = false;
                                        this.historyFilters[filterType] = 'all';
                                        isInSubmenu.classList.remove('show');
                                        
                                        // Remove active class from parent option
                                        if (filterType === 'protocol' && protocolSpecificOption) {
                                            protocolSpecificOption.classList.remove('active');
                                        }
                                        if (filterType === 'state' && stateSpecificOption) {
                                            stateSpecificOption.classList.remove('active');
                                        }
                                        if (filterType === 'innerface' && innerfaceSpecificOption) {
                                            innerfaceSpecificOption.classList.remove('active');
                                        }
                                    }
                                }
                            } else {
                                // For regular filters
                                const groupCheckboxes = document.querySelectorAll(`[data-filter="${filterType}"]`);
                                const hasChecked = Array.from(groupCheckboxes).some(cb => cb.checked && cb.dataset.value !== 'all');
                                
                                if (!hasChecked) {
                                    const allCheckbox = document.querySelector(`[data-filter="${filterType}"][data-value="all"]`);
                                    if (allCheckbox) {
                                        allCheckbox.checked = true;
                                        this.historyFilters[filterType] = 'all';
                                        
                                        // Hide custom date range when reverting to all
                                        if (filterType === 'time' && customDateRange) {
                                            customDateRange.style.display = 'none';
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    this.updateFilterIcon();
                    this.applyHistoryFilters();
                });
            });
            
            // Handle custom date inputs
            if (dateFromInput) {
                dateFromInput.addEventListener('change', (e) => {
                    this.historyFilters.customDateFrom = e.target.value;
                    this.applyHistoryFilters();
                });
            }
            
            if (dateToInput) {
                dateToInput.addEventListener('change', (e) => {
                    this.historyFilters.customDateTo = e.target.value;
                    this.applyHistoryFilters();
                });
            }
            
            this.updateFilterIcon();
        },

        // Update filter icon active state
        updateFilterIcon() {
            const filterIcon = document.getElementById('history-filters-icon');
            if (!filterIcon) {
                return;
            }
            
            // Check only the main filter values (time, type, protocol, state, effect), ignore custom date fields
            const hasActiveFilters = this.historyFilters.time !== 'all' ||
                                     this.historyFilters.type !== 'all' ||
                                     this.historyFilters.protocol !== 'all' ||
                                     this.historyFilters.state !== 'all' ||
                                     this.historyFilters.effect !== 'all' ||
                                     this.historyFilters.innerface !== 'all';
            
            if (hasActiveFilters) {
                filterIcon.classList.add('active');
            } else {
                filterIcon.classList.remove('active');
            }
        },

        // Apply history filters
        applyHistoryFilters() {
            const searchInput = document.getElementById('history-search');
            const searchQuery = searchInput ? searchInput.value : '';
            
            // Start with all history (already sorted newest-first by getCheckins)
            const allHistory = window.Storage.getCheckins();
            const innerfaces = window.Storage.getInnerfaces();
            
            this.filteredHistory = allHistory.filter(checkin => {
                // Search filter
                if (searchQuery.trim()) {
                    const searchTerm = searchQuery.toLowerCase();
                    let matchesSearch = false;
                    
                    // Search in protocol name
                    if (checkin.protocolName && checkin.protocolName.toLowerCase().includes(searchTerm)) {
                        matchesSearch = true;
                    }
                    
                    // Search in item name (for drag & drop operations)
                    if (checkin.itemName && checkin.itemName.toLowerCase().includes(searchTerm)) {
                        matchesSearch = true;
                    }
                    
                    // Search in operation type
                    if (checkin.type === 'drag_drop') {
                        const actionText = checkin.subType === 'protocol' ? 'reordered protocol' : 'reordered innerface';
                        if (actionText.includes(searchTerm)) {
                            matchesSearch = true;
                        }
                    }
                    
                    // Search in quick action operations
                    if (checkin.type === 'quick_action') {
                        const actionText = checkin.subType === 'added' ? 'added to quick actions' : 'removed from quick actions';
                        if (actionText.includes(searchTerm)) {
                            matchesSearch = true;
                        }
                    }
                    
                    // Search in affected innerface names
                    if (checkin.changes) {
                        const affectedInnerfaces = Object.keys(checkin.changes).map(innerfaceId => {
                            const innerface = innerfaces.find(s => s.id == innerfaceId);
                            return innerface ? innerface.name.toLowerCase() : '';
                        });
                        
                        if (affectedInnerfaces.some(innerfaceName => innerfaceName.includes(searchTerm))) {
                            matchesSearch = true;
                        }
                    }
                    
                    if (!matchesSearch) {
                        return false;
                    }
                }
                
                // Time filter
                if (this.historyFilters.time !== 'all') {
                    const checkinDate = new Date(checkin.timestamp);
                    const now = new Date();
                    
                    switch (this.historyFilters.time) {
                        case 'today':
                            if (checkinDate.toDateString() !== now.toDateString()) {
                                return false;
                            }
                            break;
                        case 'week':
                            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            if (checkinDate < weekAgo) {
                                return false;
                            }
                            break;
                        case 'month':
                            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                            if (checkinDate < monthAgo) {
                                return false;
                            }
                            break;
                        case 'custom':
                            if (this.historyFilters.customDateFrom && this.historyFilters.customDateTo) {
                                // Parse checkin timestamp and extract date string in YYYY-MM-DD format using UTC
                                const checkinDateTime = new Date(checkin.timestamp);
                                const checkinDateString = checkinDateTime.getUTCFullYear() + '-' + 
                                    String(checkinDateTime.getUTCMonth() + 1).padStart(2, '0') + '-' + 
                                    String(checkinDateTime.getUTCDate()).padStart(2, '0');
                                
                                // Compare date strings directly
                                if (checkinDateString < this.historyFilters.customDateFrom || checkinDateString > this.historyFilters.customDateTo) {
                                    return false;
                                }
                            }
                            break;
                    }
                }
                
                // Type filter
                if (this.historyFilters.type !== 'all') {
                    switch (this.historyFilters.type) {
                        case 'protocol':
                            // Show only protocol check-ins
                            if (checkin.type !== 'protocol') {
                                return false;
                            }
                            break;
                        case 'manual':
                            // Show everything except protocol check-ins (drag&drop, quick actions, etc.)
                            if (checkin.type === 'protocol') {
                                return false;
                            }
                            break;
                    }
                }
                
                // Effect filter
                if (this.historyFilters.effect !== 'all') {
                    if (!checkin.changes) {
                        return false;
                    }
                    
                    const changes = Object.values(checkin.changes);
                    const hasPositive = changes.some(change => change > 0);
                    const hasNegative = changes.some(change => change < 0);
                    
                    switch (this.historyFilters.effect) {
                        case 'positive':
                            if (!hasPositive) {
                                return false;
                            }
                            break;
                        case 'negative':
                            if (!hasNegative) {
                                return false;
                            }
                            break;
                    }
                }
                
                // Protocol filter
                if (this.historyFilters.protocol !== 'all') {
                    if (checkin.type !== 'protocol') {
                        return false; // Only protocol checkins have protocolId
                    }
                    
                    const protocolId = parseInt(this.historyFilters.protocol);
                    if (checkin.protocolId !== protocolId) {
                        return false;
                    }
                }
                
                // State filter - show checkins that affect innerfaces used by this state
                if (this.historyFilters.state !== 'all') {
                    if (checkin.type !== 'protocol' || !checkin.protocolId) {
                        return false; // Only protocol checkins can be filtered by state
                    }
                    
                    // Get the selected state and its dependencies
                    const state = window.Storage.getStateById(this.historyFilters.state);
                    if (!state) {
                        return false;
                    }
                    
                    // Get all innerface IDs that affect this state (including from dependent states)
                    const stateInnerfaceIds = this.getStateAffectedInnerfaces(state.id);
                    
                    // Get the protocol and its targets
                    const protocol = window.Storage.getProtocolById(checkin.protocolId);
                    if (!protocol || !protocol.targets) {
                        return false;
                    }
                    
                    // Check if this protocol targets any of the state's innerface dependencies
                    const protocolTargetsStateInnerfaces = protocol.targets.some(targetId => 
                        stateInnerfaceIds.includes(parseInt(targetId))
                    );
                    
                    if (!protocolTargetsStateInnerfaces) {
                        return false;
                    }
                }
                
                // Innerface filter - show checkins that affect a specific innerface
                if (this.historyFilters.innerface !== 'all') {
                    const innerfaceId = parseInt(this.historyFilters.innerface);
                    
                    // For protocol checkins, check if the innerface was affected
                    if (checkin.type === 'protocol') {
                        if (!checkin.changes || !checkin.changes[innerfaceId]) {
                            return false;
                        }
                    }
                    // For drag & drop operations, check if it's the specific innerface being reordered
                    else if (checkin.type === 'drag_drop' && checkin.subType === 'innerface') {
                        if (checkin.itemId !== innerfaceId) {
                            return false;
                        }
                    }
                    // For other types, exclude them when filtering by innerface
                    else {
                        return false;
                    }
                }
                
                return true;
            });
            
            UI.renderHistory();
        },

        // Get all innerface IDs that affect a state (including from dependent states)
        getStateAffectedInnerfaces(stateId, visitedStates = new Set()) {
            // Prevent infinite recursion with circular dependencies
            if (visitedStates.has(stateId)) {
                return [];
            }
            visitedStates.add(stateId);
            
            const state = window.Storage.getStateById(stateId);
            if (!state) {
                return [];
            }
            
            let affectedInnerfaces = [];
            
            // Add direct innerface dependencies (convert to numbers)
            if (state.innerfaceIds && state.innerfaceIds.length > 0) {
                affectedInnerfaces.push(...state.innerfaceIds.map(id => parseInt(id)));
            }
            
            // Add innerfaces from dependent states (recursive)
            if (state.stateIds && state.stateIds.length > 0) {
                state.stateIds.forEach(dependentStateId => {
                    const dependentInnerfaces = this.getStateAffectedInnerfaces(dependentStateId, new Set(visitedStates));
                    affectedInnerfaces.push(...dependentInnerfaces);
                });
            }
            
            // Remove duplicates and return (all should be numbers now)
            return [...new Set(affectedInnerfaces)];
        },

        // Populate dynamic filter options
        populateProtocolFilters() {
            const protocolContainer = document.getElementById('protocol-filter-options');
            if (!protocolContainer) return;
            
            const protocols = window.Storage.getProtocols();
            protocolContainer.innerHTML = protocols.map(protocol => {
                const protocolName = protocol.name.split('. ')[0]; // Get main name part
                const finalColor = UI.getProtocolColor(protocol);
                return `
                    <label class="filter-option">
                        <input type="checkbox" class="filter-checkbox" data-filter="protocol" data-value="${protocol.id}">
                        <i class="fas fa-check filter-check-icon"></i>
                        <span class="filter-label">${UI.renderIcon(protocol.icon, finalColor)} ${protocolName}</span>
                    </label>
                `;
            }).join('');
        },

        // Populate dynamic state filters
        populateStateFilters() {
            const stateContainer = document.getElementById('state-filter-options');
            if (!stateContainer) return;
            
            const states = window.Storage.getStates();
            stateContainer.innerHTML = states.map(state => {
                const stateName = state.name.split('. ')[0]; // Get main name part
                return `
                    <label class="filter-option">
                        <input type="checkbox" class="filter-checkbox" data-filter="state" data-value="${state.id}">
                        <i class="fas fa-check filter-check-icon"></i>
                        <span class="filter-label">${UI.renderIcon(state.icon)} ${stateName}</span>
                    </label>
                `;
            }).join('');
        },
        
        // Populate dynamic innerface filters
        populateInnerfaceFilters() {
            const innerfaceContainer = document.getElementById('innerface-filter-options');
            if (!innerfaceContainer) return;
            
            const innerfaces = window.Storage.getInnerfaces();
            innerfaceContainer.innerHTML = innerfaces.map(innerface => {
                const innerfaceName = innerface.name.split('. ')[0]; // Get main name part
                return `
                    <label class="filter-option">
                        <input type="checkbox" class="filter-checkbox" data-filter="innerface" data-value="${innerface.id}">
                        <i class="fas fa-check filter-check-icon"></i>
                        <span class="filter-label">${UI.renderIcon(innerface.icon)} ${innerfaceName}</span>
                    </label>
                `;
            }).join('');
        },
        
        // Update filter UI to reflect current filter state
        updateFilterUI() {
            // Reset all checkboxes first
            const allCheckboxes = document.querySelectorAll('.filter-checkbox');
            allCheckboxes.forEach(cb => cb.checked = false);
            
            // Hide all submenus and remove active classes
            const submenus = document.querySelectorAll('.filter-submenu');
            submenus.forEach(submenu => submenu.classList.remove('show'));
            
            const specificOptions = document.querySelectorAll('.filter-option-with-submenu');
            specificOptions.forEach(option => option.classList.remove('active'));
            
            // Set checkboxes based on current filters
            Object.entries(this.historyFilters).forEach(([filterType, filterValue]) => {
                if (filterValue !== 'all' && filterValue !== '' && filterType !== 'customDateFrom' && filterType !== 'customDateTo') {
                    // 🎯 ИСПРАВЛЕНИЕ: Для прямых фильтров (time, type, effect) используем прямые значения, не submenu
                    if (filterType === 'time' || filterType === 'type' || filterType === 'effect') {
                        const valueCheckbox = document.querySelector(`[data-filter="${filterType}"][data-value="${filterValue}"]`);
                        if (valueCheckbox) {
                            valueCheckbox.checked = true;
                        }
                    } else {
                        // For submenu filters (protocol, state, innerface) - use submenu logic
                        const specificCheckbox = document.querySelector(`[data-filter="${filterType}"][data-value="specific"]`);
                        const valueCheckbox = document.querySelector(`[data-filter="${filterType}"][data-value="${filterValue}"]`);
                        const submenu = document.getElementById(`${filterType}-filter-submenu`);
                        const specificOption = document.getElementById(`${filterType}-specific-option`);
                        
                        if (specificCheckbox && valueCheckbox && submenu && specificOption) {
                            specificCheckbox.checked = true;
                            valueCheckbox.checked = true;
                            submenu.classList.add('show');
                            specificOption.classList.add('active');
                        }
                    }
                } else {
                    // Set "all" filter
                    const allCheckbox = document.querySelector(`[data-filter="${filterType}"][data-value="all"]`);
                    if (allCheckbox) {
                        allCheckbox.checked = true;
                    }
                }
            });
            
            // Handle custom date range
            if (this.historyFilters.time === 'custom') {
                const customDateRange = document.getElementById('filter-custom-date-range');
                const dateFromInput = document.getElementById('filter-date-from');
                const dateToInput = document.getElementById('filter-date-to');
                
                if (customDateRange) {
                    customDateRange.style.display = 'block';
                }
                if (dateFromInput && this.historyFilters.customDateFrom) {
                    dateFromInput.value = this.historyFilters.customDateFrom;
                }
                if (dateToInput && this.historyFilters.customDateTo) {
                    dateToInput.value = this.historyFilters.customDateTo;
                }
            }
            
            this.updateFilterIcon();
        },
        
        // Navigate to history page and filter by specific innerface
        viewInnerfaceHistory(innerfaceId) {
            // Reset all filters first
            this.historyFilters = {
                time: 'all',
                type: 'all',
                protocol: 'all',
                state: 'all',
                effect: 'all',
                innerface: innerfaceId.toString(),
                customDateFrom: '',
                customDateTo: ''
            };
            
            // Clear search input
            const historySearchInput = document.getElementById('history-search');
            if (historySearchInput) {
                historySearchInput.value = '';
            }
            
            // Navigate to history page
            this.navigateTo('history');
            
            // Expand navigation to show history button with special styling
            if (this.navExpansion) {
                this.navExpansion.setProgram(true);
            }
            
            // Apply the innerface filter
            this.applyHistoryFilters();
            
            // Update filter UI to show selected innerface
            setTimeout(() => {
                this.updateFilterUI();
                this.updateFilterIcon();
            }, 100);
            
            // Show a toast to inform user about the filter
            const innerface = window.Storage.getInnerfaceById(innerfaceId);
            if (innerface) {
                this.showToast(`Showing history for ${innerface.name}`, 'info');
            }
        },
        
        // Navigate to history page and filter by specific protocol
        viewProtocolHistory(protocolId) {
            // Reset all filters first
            this.historyFilters = {
                time: 'all',
                type: 'all',
                protocol: protocolId.toString(),
                state: 'all',
                effect: 'all',
                innerface: 'all',
                customDateFrom: '',
                customDateTo: ''
            };
            
            // Clear search input
            const historySearchInput = document.getElementById('history-search');
            if (historySearchInput) {
                historySearchInput.value = '';
            }
            
            // Navigate to history page
            this.navigateTo('history');
            
            // Expand navigation to show history button with special styling
            if (this.navExpansion) {
                this.navExpansion.setProgram(true);
            }
            
            // Apply the protocol filter
            this.applyHistoryFilters();
            
            // Update filter UI to show selected protocol
            setTimeout(() => {
                this.updateFilterUI();
                this.updateFilterIcon();
            }, 100);
            
            // Show a toast to inform user about the filter
            const protocol = window.Storage.getProtocolById(protocolId);
            if (protocol) {
                this.showToast(`Showing history for ${protocol.name}`, 'info');
            }
        },
        
        // Navigate to history page and filter by specific state
        viewStateHistory(stateId) {
            // Reset all filters first
            this.historyFilters = {
                time: 'all',
                type: 'all',
                protocol: 'all',
                state: stateId.toString(),
                effect: 'all',
                innerface: 'all',
                customDateFrom: '',
                customDateTo: ''
            };
            
            // Clear search input
            const historySearchInput = document.getElementById('history-search');
            if (historySearchInput) {
                historySearchInput.value = '';
            }
            
            // Navigate to history page
            this.navigateTo('history');
            
            // Expand navigation to show history button with special styling
            if (this.navExpansion) {
                this.navExpansion.setProgram(true);
            }
            
            // Apply the state filter
            this.applyHistoryFilters();
            
            // Update filter UI to show selected state
            setTimeout(() => {
                this.updateFilterUI();
                this.updateFilterIcon(); // Ensure filter icon shows as active
            }, 100);
            
            // Show a toast to inform user about the filter
            const state = window.Storage.getStateById(stateId);
            if (state) {
                this.showToast(`Showing history for ${state.name}`, 'info');
            }
        },

        // Setup expandable navigation
        setupExpandableNavigation() {
            const navInnerfacesGroup = document.querySelector('.nav-innerfaces-group');
            const navExpandBtn = document.getElementById('nav-expand-btn');
            const navHistory = document.getElementById('nav-history');
            
            if (!navInnerfacesGroup || !navExpandBtn || !navHistory) return;
            
            let hoverTimeout;
            let isManuallyExpanded = false;
            let isProgramExpanded = false;
            
            // Hover на стрелку для expand
            navExpandBtn.addEventListener('mouseenter', () => {
                // Only expand on hover if not already expanded and not on history page
                if (!isManuallyExpanded && !isProgramExpanded && this.currentPage !== 'history') {
                    clearTimeout(hoverTimeout);
                    navExpandBtn.classList.add('expanded');
                    navHistory.classList.add('expanded');
                    navInnerfacesGroup.classList.add('hover-expanded');
                }
            });
            
            // Hover to collapse при уходе со стрелки или с history кнопки (с задержкой)
            const scheduleCollapse = () => {
                // Don't collapse if we're on history page, or if manually/programmatically expanded
                if (!isManuallyExpanded && !isProgramExpanded && this.currentPage !== 'history') {
                    hoverTimeout = setTimeout(() => {
                        navExpandBtn.classList.remove('expanded');
                        navHistory.classList.remove('expanded');
                        navInnerfacesGroup.classList.remove('hover-expanded');
                    }, 150);
                }
            };
            
            navExpandBtn.addEventListener('mouseleave', scheduleCollapse);
            navHistory.addEventListener('mouseleave', scheduleCollapse);
            
            // При входе на history кнопку - отменяем коллапс
            navHistory.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimeout);
            });
            
            // Click arrow to toggle manual expansion
            navExpandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                isManuallyExpanded = !isManuallyExpanded;
                
                if (isManuallyExpanded) {
                    navExpandBtn.classList.add('expanded');
                    navHistory.classList.add('expanded');
                    navInnerfacesGroup.classList.add('expanded');
                } else {
                    navExpandBtn.classList.remove('expanded');
                    navHistory.classList.remove('expanded');
                    navInnerfacesGroup.classList.remove('expanded');
                    navInnerfacesGroup.classList.remove('hover-expanded');
                }
            });
            
            // Store reference for programmatic expansion
            this.navExpansion = {
                setProgram: (expanded) => {
                    isProgramExpanded = expanded;
                    if (expanded) {
                        navExpandBtn.classList.add('expanded');
                        navHistory.classList.add('expanded');
                        navHistory.classList.remove('expanded');
                        navInnerfacesGroup.classList.add('expanded');
                    } else {
                        navExpandBtn.classList.remove('expanded');
                        navHistory.classList.remove('program-expanded');
                        navHistory.classList.remove('expanded');
                        navInnerfacesGroup.classList.remove('expanded');
                        navInnerfacesGroup.classList.remove('hover-expanded');
                    }
                },
                
                reset: () => {
                    isManuallyExpanded = false;
                    isProgramExpanded = false;
                    navExpandBtn.classList.remove('expanded');
                    navHistory.classList.remove('expanded', 'program-expanded');
                    navInnerfacesGroup.classList.remove('expanded', 'hover-expanded');
                }
            };
        },

        // Force reset user data on server and resync
        async forceResetAndSync() {
            console.log('💥 FORCE RESET: Resetting all user data on server and resyncing...');
            try {
                const token = await firebase.auth().currentUser.getIdToken();
                const response = await fetch(`${BACKEND_URL}/api/user/force-reset`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Force reset successful:', result);
                    
                    // Now sync current local data to server
                    await window.Storage.syncWithBackend();
                    console.log('✅ Resync completed successfully');
                    
                    // Refresh the page to ensure clean state
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    const errorText = await response.text();
                    console.error('❌ Force reset failed:', response.status, response.statusText, errorText);
                }
            } catch (error) {
                console.error('❌ Force reset error:', error);
            }
        },
        
        // Emergency cleanup of duplicate protocols and innerfaces on server
        async cleanDuplicates() {
            console.log('🧹 EMERGENCY CLEANUP: Removing duplicate protocols and innerfaces from server...');
            try {
                const token = await firebase.auth().currentUser.getIdToken();
                const response = await fetch(`${BACKEND_URL}/api/emergency/clean-duplicates`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Emergency cleanup successful:', result);
                    
                    // Sync again to get clean data
                    await window.Storage.syncWithBackend();
                    console.log('✅ Post-cleanup sync completed');
                    
                    // Show results
                    console.log('🧹 CLEANUP RESULTS:', {
                        protocolsRemoved: result.cleaned.protocols.removed,
                        innerfacesRemoved: result.cleaned.innerfaces.removed,
                        finalProtocolsCount: result.cleaned.protocols.after,
                        finalInnerfacesCount: result.cleaned.innerfaces.after
                    });
                    
                    return result;
                } else {
                    const errorText = await response.text();
                    console.error('❌ Emergency cleanup failed:', response.status, response.statusText, errorText);
                }
            } catch (error) {
                console.error('❌ Emergency cleanup error:', error);
            }
        },

        // Safer sync debugging
        async smartSync() {
            console.log('🧠 Smart sync debugging - preserving data from all devices...');
            
            if (!window.Storage.currentUser) {
                console.error('❌ No authenticated user');
                return;
            }
            
            try {
                // Step 1: Force multiple sync cycles to resolve conflicts
                console.log('🔄 Running multiple sync cycles...');
                
                for (let i = 1; i <= 3; i++) {
                    console.log(`🔄 Sync cycle ${i}/3...`);
                    await window.Storage.syncWithBackend();
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between syncs
                }
                
                console.log('✅ Smart sync completed - data should be consistent now');
                
                // Step 2: Refresh current page
                if (window.App && window.App.renderPage) {
                    window.App.renderPage(window.App.currentPage);
                    console.log('🔄 Page refreshed after smart sync');
                }
                
            } catch (error) {
                console.error('❌ Smart sync failed:', error);
            }
        },

        // Test protocol recalculation
        testRecalculation(protocolId) {
            console.log('🧪 Testing protocol recalculation for protocol:', protocolId);
            
            const protocol = window.Storage.getProtocolById(protocolId);
            if (!protocol) {
                console.error('❌ Protocol not found:', protocolId);
                return;
            }
            
            console.log('📋 Current protocol data:', protocol);
            
            // Get history for this protocol
            const checkins = window.Storage.getCheckins();
            const protocolCheckins = checkins.filter(c => c.type === 'protocol' && c.protocolId === protocolId);
            
            console.log(`📊 Found ${protocolCheckins.length} checkins for this protocol:`);
            protocolCheckins.forEach(checkin => {
                console.log(`  - Checkin ${checkin.id}:`, {
                    timestamp: checkin.timestamp,
                    action: checkin.action,
                    changes: checkin.changes
                });
            });
            
            // Test recalculation with current targets
            const currentTargets = protocol.targets || [];
            console.log('🔄 Testing recalculation with current targets:', currentTargets);
            
            // Simulate different old targets to trigger recalculation
            const simulatedOldTargets = [];
            const wasRecalculated = window.Storage.recalculateProtocolHistory(protocolId, simulatedOldTargets, currentTargets);
            
            console.log('✅ Recalculation test result:', wasRecalculated);
            
            // Show updated checkins
            const updatedCheckins = window.Storage.getCheckins().filter(c => c.type === 'protocol' && c.protocolId === protocolId);
            console.log('📊 Updated checkins:');
            updatedCheckins.forEach(checkin => {
                console.log(`  - Checkin ${checkin.id}:`, {
                    timestamp: checkin.timestamp,
                    action: checkin.action,
                    changes: checkin.changes
                });
            });
        },

        // Inspect protocol history in detail
        inspectProtocolHistory(protocolId) {
            console.log('🔍 INSPECTING PROTOCOL HISTORY for protocol:', protocolId);
            
            const protocol = window.Storage.getProtocolById(protocolId);
            if (!protocol) {
                console.error('❌ Protocol not found:', protocolId);
                return;
            }
            
            console.log('📋 Protocol details:', {
                id: protocol.id,
                name: protocol.name,
                icon: protocol.icon,
                weight: protocol.weight,
                targets: protocol.targets
            });
            
            const checkins = window.Storage.getCheckins();
            const protocolCheckins = checkins.filter(c => c.type === 'protocol' && c.protocolId === protocolId);
            
            console.log(`📊 ALL CHECKINS for protocol ${protocolId} (${protocolCheckins.length} total):`);
            protocolCheckins.forEach((checkin, index) => {
                console.log(`${index + 1}. Checkin ${checkin.id}:`, {
                    timestamp: new Date(checkin.timestamp).toLocaleString(),
                    action: checkin.action,
                    changes: checkin.changes,
                    hasTargetEffects: Object.keys(checkin.changes || {}).length > 0,
                    affectedInnerfaces: Object.keys(checkin.changes || {}),
                    raw: checkin
                });
            });
            
            // Check if protocol targets are properly applied in recent checkins
            const recentCheckins = protocolCheckins.slice(-5); // Last 5 checkins
            console.log('🔍 Recent checkins analysis:');
            recentCheckins.forEach((checkin, index) => {
                const expectedTargets = protocol.targets || [];
                const actualTargets = Object.keys(checkin.changes || {}).map(id => parseInt(id));
                const hasCorrectTargets = expectedTargets.every(target => actualTargets.includes(target)) &&
                                         actualTargets.every(target => expectedTargets.includes(target));
                
                console.log(`${index + 1}. Checkin ${checkin.id}:`, {
                    expectedTargets,
                    actualTargets,
                    hasCorrectTargets,
                    status: hasCorrectTargets ? '✅ Correct' : '❌ Incorrect'
                });
            });
        },
        
        // Debug function to test specific protocol issues
        debugProtocolTargets(protocolId) {
            console.log('🐛 DEBUGGING PROTOCOL TARGETS for protocol:', protocolId);
            
            const protocol = window.Storage.getProtocolById(protocolId);
            if (!protocol) {
                console.error('❌ Protocol not found:', protocolId);
                return;
            }
            
            console.log('📋 Current protocol targets:', protocol.targets || []);
            
            // Find all checkins for this protocol
            const checkins = window.Storage.getCheckins();
            const protocolCheckins = checkins.filter(c => c.type === 'protocol' && c.protocolId === protocolId);
            
            console.log(`📊 Found ${protocolCheckins.length} checkins for this protocol`);
            
            // Find checkins missing target effects
            const missingEffectsCheckins = protocolCheckins.filter(checkin => {
                if (!checkin.changes) return true; // No changes at all
                
                // Check if all targets are present in changes
                const hasAllTargets = (protocol.targets || []).every(targetId => 
                    checkin.changes.hasOwnProperty(targetId)
                );
                return !hasAllTargets;
            });
            
            if (missingEffectsCheckins.length > 0) {
                console.log(`🚨 FOUND ${missingEffectsCheckins.length} CHECKINS MISSING TARGET EFFECTS:`);
                missingEffectsCheckins.forEach(checkin => {
                    const missingTargets = (protocol.targets || []).filter(targetId => 
                        !checkin.changes || !checkin.changes.hasOwnProperty(targetId)
                    );
                    console.log(`  - Checkin ${checkin.id} (${new Date(checkin.timestamp).toLocaleString()}):`, {
                        action: checkin.action,
                        currentChanges: checkin.changes || {},
                        missingTargets,
                        expectedTargets: protocol.targets || []
                    });
                });
                
                // Offer to fix them
                console.log('🔧 Run debugSync.fixProtocolHistory(' + protocolId + ') to fix these checkins');
            } else {
                console.log('✅ All checkins have proper target effects');
            }
        },
        
        // Fix protocol history by running recalculation
        fixProtocolHistory(protocolId) {
            console.log('🔧 FIXING PROTOCOL HISTORY for protocol:', protocolId);
            
            const protocol = window.Storage.getProtocolById(protocolId);
            if (!protocol) {
                console.error('❌ Protocol not found:', protocolId);
                return;
            }
            
            const oldTargets = [];
            const newTargets = protocol.targets || [];
            
            console.log('📊 Attempting recalculation with:', {
                protocolId,
                protocolName: protocol.name,
                oldTargets,
                newTargets
            });
            
            const result = window.Storage.recalculateProtocolHistory(protocolId, oldTargets, newTargets);
            
            if (result) {
                console.log('✅ Recalculation completed successfully');
                
                // Refresh UI
                if (window.App && window.App.renderPage) {
                    window.App.renderPage(window.App.currentPage);
                    console.log('🔄 UI refreshed');
                }
                
                // Show updated state
                this.debugProtocolTargets(protocolId);
            } else {
                console.log('ℹ️ No changes were needed');
            }
        },

        // Check raw server data to see what was actually uploaded (FIXED VERSION)
        async checkServerDataNew() {
            console.log('🔍 CHECKING RAW SERVER DATA (via /api/sync)...');
            
            if (!window.Storage.currentUser) {
                console.error('❌ No authenticated user');
                return;
            }
            
            try {
                const token = await window.Storage.currentUser.getIdToken();
                
                // 🔧 FIX: Use /api/sync with empty data to get current server state
                // This ensures we get the ACTUAL data that sync operations work with
                const response = await fetch(`${window.BACKEND_URL}/api/sync?_debug=true&_t=${Date.now()}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    },
                    body: JSON.stringify({
                        protocols: [],
                        innerfaces: [],
                        states: [],
                        history: [],
                        quickActions: [],
                        quickActionOrder: [],
                        protocolOrder: [],
                        innerfaceOrder: [],
                        stateOrder: [],
                        deletedCheckins: []
                    })
                });
                
                if (response.ok) {
                    const serverResponse = await response.json();
                    const serverData = serverResponse.data || {};
                    
                    console.log('🗄️ RAW SERVER DATA (via /api/sync):', serverData);
                    
                    // Focus on protocols
                    if (serverData.protocols) {
                        console.log('\n📋 SERVER PROTOCOLS DETAILS:');
                        serverData.protocols.forEach(protocol => {
                            console.log(`  Protocol ${protocol.id}: ${protocol.name}`, {
                                targets: protocol.targets || [],
                                weight: protocol.weight,
                                icon: protocol.icon,
                                updatedAt: protocol.updatedAt || 'no timestamp'
                            });
                        });
                    }
                    
                    // Focus on innerfaces  
                    if (serverData.innerfaces) {
                        console.log('\n🎯 SERVER INNERFACES DETAILS:');
                        serverData.innerfaces.forEach(innerface => {
                            console.log(`  Innerface ${innerface.id}: ${innerface.name}`, {
                                value: innerface.value,
                                icon: innerface.icon,
                                updatedAt: innerface.updatedAt || 'no timestamp'
                            });
                        });
                    }
                    
                    // Show sync metadata
                    console.log('\n⏰ SERVER SYNC INFO:');
                    console.log('  Last Updated:', serverResponse.lastUpdated);
                    console.log('  Data Keys:', Object.keys(serverData));
                    console.log('  Data Counts:', {
                        protocols: (serverData.protocols || []).length,
                        innerfaces: (serverData.innerfaces || []).length,
                        states: (serverData.states || []).length,
                        history: (serverData.history || []).length,
                        quickActions: (serverData.quickActions || []).length
                    });
                    
                    return serverData;
                    
                } else {
                    console.error('❌ Failed to fetch server data via /api/sync:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('❌ Server data check failed:', error);
            }
        },

        // 🔧 NEW: Check what Quick Actions data is on server
        async checkQuickActionsServer() {
            console.log('🔍 CHECKING SERVER QUICK ACTIONS DATA...');
            try {
                const serverData = await this.checkServerDataNew();
                console.log('🐞 SERVER QUICK ACTIONS DEBUG:', {
                    quickActionsCount: serverData?.quickActions?.length || 0,
                    quickActionsData: serverData?.quickActions,
                    quickActionOrderCount: serverData?.quickActionOrder?.length || 0,
                    quickActionOrderData: serverData?.quickActionOrder,
                    fullServerResponse: serverData
                });
                return serverData;
            } catch (error) {
                console.error('❌ Error checking server Quick Actions:', error);
            }
        },

        // Reset first-time login flag to test new device behavior
        resetFirstTimeLogin() {
            if (!window.Storage.currentUser) {
                console.error('❌ No authenticated user');
                return;
            }
            
            const firstTimeKey = `first_login_${window.Storage.currentUser.uid}`;
            localStorage.removeItem(firstTimeKey);
            console.log('🆕 First-time login flag reset for user:', window.Storage.currentUser.email);
            console.log('🔄 Next page reload will behave as first-time login (server-first)');
            console.log('🔄 Run window.location.reload() to test');
        },

        // Check first-time login status
        checkFirstTimeStatus() {
            if (!window.Storage.currentUser) {
                console.error('❌ No authenticated user');
                return;
            }
            
            const firstTimeKey = `first_login_${window.Storage.currentUser.uid}`;
            const timestamp = localStorage.getItem(firstTimeKey);
            
            console.log('🔍 FIRST-TIME LOGIN STATUS:', {
                user: window.Storage.currentUser.email,
                isFirstTime: !timestamp,
                firstLoginTimestamp: timestamp,
                firstLoginDate: timestamp ? new Date(parseInt(timestamp)).toLocaleString() : 'Never',
                currentFlag: window.Storage.isFirstTimeLogin
            });
        },

        // Simulate completely new device by clearing all user data
        simulateNewDevice() {
            if (!window.Storage.currentUser) {
                console.error('❌ No authenticated user');
                return;
            }
            
            const userId = window.Storage.currentUser.uid;
            const userEmail = window.Storage.currentUser.email;
            
            console.log('🧹 SIMULATING NEW DEVICE for user:', userEmail);
            console.log('⚠️ This will clear ALL local data for this user');
            
            // Find all user-specific keys
            const userKeys = Object.keys(localStorage).filter(key => key.startsWith(userId));
            const firstTimeKey = `first_login_${userId}`;
            
            console.log('📋 Keys to be deleted:', userKeys.concat([firstTimeKey]));
            
            // Clear all user data
            userKeys.forEach(key => {
                localStorage.removeItem(key);
                console.log(`🗑️ Removed: ${key}`);
            });
            
            // Clear first-time flag
            localStorage.removeItem(firstTimeKey);
            console.log(`🗑️ Removed: ${firstTimeKey}`);
            
            console.log('✅ All user data cleared');
            console.log('🔄 Reload page to test first-time login behavior:');
            console.log('  window.location.reload()');
            
            return {
                clearedKeys: userKeys.length + 1,
                userEmail
            };
        },

        // Clean undefined elements from deletedCheckins
        clearDeletedCheckins() {
            if (!window.Storage) {
                console.error('❌ Storage not available');
                return;
            }
            
            return window.Storage.clearDeletedCheckins();
        },

        // Clear deleted states list (for debugging)
        clearDeletedStates() {
            if (!window.Storage) {
                console.error('❌ Storage not available');
                return;
            }
            
            console.log('🧹 CLEARING DELETED STATES LIST...');
            window.Storage.set('deletedStates', []);
            console.log('✅ Deleted states list cleared');
            return { cleared: true };
        },

        // Clean undefined values from deletedStates (for fixing sync issues)
        cleanDeletedStates() {
            if (!window.Storage) {
                console.error('❌ Storage not available');
                return;
            }
            
            return window.Storage.cleanDeletedStates();
        },

        // Safer sync debugging
        async smartSync() {
            console.log('🧠 Smart sync debugging - preserving data from all devices...');
            
            if (!window.Storage.currentUser) {
                console.error('❌ No authenticated user');
                return;
            }
            
            try {
                // Step 1: Force multiple sync cycles to resolve conflicts
                console.log('🔄 Running multiple sync cycles...');
                
                for (let i = 1; i <= 3; i++) {
                    console.log(`🔄 Sync cycle ${i}/3...`);
                    await window.Storage.syncWithBackend();
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between syncs
                }
                
                console.log('✅ Smart sync completed - data should be consistent now');
                
                // Step 2: Refresh current page
                if (window.App && window.App.renderPage) {
                    window.App.renderPage(window.App.currentPage);
                    console.log('🔄 Page refreshed after smart sync');
                }
                
            } catch (error) {
                console.error('❌ Smart sync failed:', error);
            }
        }
    };

    // Make App globally available
    window.App = App;
    
    // Make removeActiveFilter globally accessible for onclick handlers
    window.removeActiveFilter = (groupId) => {
        if (window.App && window.App.removeActiveFilter) {
            window.App.removeActiveFilter(groupId);
        }
    };
    
    // Initialize app
    App.init();
    
    // Set up periodic sync (every 5 minutes)
    if (window.Storage.currentUser) {
        setInterval(() => {
            window.Storage.syncWithBackend();
        }, 5 * 60 * 1000);
    }
    
    console.log('🎮 RPG Therapy initialized');
}

// Handle window resize for nav indicator
window.addEventListener('resize', () => {
    if (window.App) {
        window.App.updateNavIndicator();
    }
    if (window.UI) {
        window.UI.setupQuickActionsTooltips();
    }
});

// Global debugging functions for console use
window.debugSync = {
  // Manual sync trigger
  async sync() {
    console.log('🔄 Manual sync triggered from console...');
    try {
      await window.Storage.syncWithBackend();
      console.log('✅ Manual sync completed successfully');
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
    }
  },
  
  // Force upload local data to server
  async forceUpload() {
    console.log('🚀 Force upload triggered from console...');
    try {
      const success = await window.Storage.forceUploadToServer();
      if (success) {
        console.log('✅ Force upload completed successfully');
      } else {
        console.log('❌ Force upload failed');
      }
    } catch (error) {
      console.error('❌ Force upload error:', error);
    }
  },
  
  // Test protocol recalculation
  testRecalculation(protocolId) {
    console.log('🧪 Testing protocol recalculation for protocol:', protocolId);
    
    const protocol = window.Storage.getProtocolById(protocolId);
    if (!protocol) {
      console.error('❌ Protocol not found:', protocolId);
      return;
    }
    
    console.log('📋 Current protocol data:', protocol);
    
    // Get history for this protocol
    const checkins = window.Storage.getCheckins();
    const protocolCheckins = checkins.filter(c => c.type === 'protocol' && c.protocolId === protocolId);
    
    console.log(`📊 Found ${protocolCheckins.length} checkins for this protocol:`);
    protocolCheckins.forEach(checkin => {
      console.log(`  - Checkin ${checkin.id}:`, {
        timestamp: checkin.timestamp,
        action: checkin.action,
        changes: checkin.changes
      });
    });
    
    // Test recalculation with current targets
    const currentTargets = protocol.targets || [];
    console.log('🔄 Testing recalculation with current targets:', currentTargets);
    
    // Simulate different old targets to trigger recalculation
    const simulatedOldTargets = [];
    const wasRecalculated = window.Storage.recalculateProtocolHistory(protocolId, simulatedOldTargets, currentTargets);
    
    console.log('✅ Recalculation test result:', wasRecalculated);
    
    // Show updated checkins
    const updatedCheckins = window.Storage.getCheckins().filter(c => c.type === 'protocol' && c.protocolId === protocolId);
    console.log('📊 Updated checkins:');
    updatedCheckins.forEach(checkin => {
      console.log(`  - Checkin ${checkin.id}:`, {
        timestamp: checkin.timestamp,
        action: checkin.action,
        changes: checkin.changes
      });
    });
  },
  
  // Compare local vs server data
  async compare() {
    console.log('🔍 Comparing local vs server data...');
    
    if (!window.Storage.currentUser) {
      console.error('❌ No authenticated user');
      return;
    }
    
    try {
      const localData = {
        protocols: window.Storage.get(window.Storage.KEYS.PROTOCOLS) || [],
        innerfaces: window.Storage.get(window.Storage.KEYS.INNERFACES) || [],
        states: window.Storage.get(window.Storage.KEYS.STATES) || [],
        history: window.Storage.get(window.Storage.KEYS.HISTORY) || [],
        quickActions: window.Storage.get(window.Storage.KEYS.QUICK_ACTIONS) || []
      };
      
      const token = await window.Storage.currentUser.getIdToken();
      const response = await fetch(`${window.BACKEND_URL}/api/user/data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const serverResponse = await response.json();
        const serverData = serverResponse.data || {};
        
        console.log('📊 DATA COMPARISON:');
        Object.keys(localData).forEach(key => {
          const local = localData[key] || [];
          const server = serverData[key] || [];
          
          console.log(`\n📋 ${key.toUpperCase()}:`);
          console.log(`  Local: ${local.length} items`);
          console.log(`  Server: ${server.length} items`);
          
          if (local.length > 0) {
            console.log(`  Local IDs:`, local.map(item => item.id));
          }
          if (server.length > 0) {
            console.log(`  Server IDs:`, server.map(item => item.id));
          }
          
          // Find unique items
          const localIds = new Set(local.map(item => item.id));
          const serverIds = new Set(server.map(item => item.id));
          
          const onlyLocal = [...localIds].filter(id => !serverIds.has(id));
          const onlyServer = [...serverIds].filter(id => !localIds.has(id));
          
          if (onlyLocal.length > 0) {
            console.log(`  📱 Only in local:`, onlyLocal);
          }
          if (onlyServer.length > 0) {
            console.log(`  ☁️ Only on server:`, onlyServer);
          }
          if (onlyLocal.length === 0 && onlyServer.length === 0) {
            console.log(`  ✅ Perfect sync`);
          }
        });
        
      } else {
        console.error('❌ Failed to fetch server data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Compare failed:', error);
    }
  },
  
  // Check sync status
  status() {
    console.log('📊 SYNC STATUS:', {
      isOnline: navigator.onLine,
      hasUser: !!window.Storage.currentUser,
      userEmail: window.Storage.currentUser?.email,
      backendUrl: window.BACKEND_URL,
      lastSyncTime: window.Storage.lastSyncTime,
      pendingSync: window.Storage.pendingSync?.size || 0
    });
  },
  
  // Test backend connectivity
  async testBackend() {
    console.log('🌐 Testing backend connectivity...');
    try {
      const response = await fetch(`${window.BACKEND_URL}/health`);
      console.log('📡 Backend health check:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (response.ok) {
        const data = await response.text();
        console.log('📥 Backend response:', data);
      }
    } catch (error) {
      console.error('❌ Backend connectivity test failed:', error);
    }
  },
  
  // Force reset user data on server and resync
  async forceResetAndSync() {
    console.log('🗑️ Force resetting user data on server and resyncing...');
    console.warn('⚠️ WARNING: This will DELETE ALL server data and upload only local data from THIS device!');
    console.warn('⚠️ Data from other devices will be LOST permanently!');
    console.warn('⚠️ Use debugSync.smartSync() for safer sync debugging.');
    
    if (!window.Storage.currentUser) {
      console.error('❌ No authenticated user');
      return;
    }
    
    try {
      // Step 1: Clear user data on server
      const token = await window.Storage.currentUser.getIdToken();
      const response = await fetch(`${window.BACKEND_URL}/api/user/force-reset`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Server data cleared:', result);
        
        // Step 2: Clear local data
        window.Storage.set(window.Storage.KEYS.HISTORY, []);
        console.log('🧹 Local history cleared');
        
        // Step 3: Force sync to rebuild data on server
        await window.Storage.syncWithBackend();
        console.log('✅ Force reset and sync completed');
        
        // Step 4: Refresh current page
        if (window.App && window.App.renderPage) {
          window.App.renderPage(window.App.currentPage);
          console.log('🔄 Page refreshed after force reset');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Server reset failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Force reset and sync failed:', error);
    }
  },
  
  // Safer sync debugging - tries to preserve data
  async smartSync() {
    console.log('🧠 Smart sync debugging - preserving data from all devices...');
    
    if (!window.Storage.currentUser) {
      console.error('❌ No authenticated user');
      return;
    }
    
    try {
      // Step 1: Force multiple sync cycles to resolve conflicts
      console.log('🔄 Running multiple sync cycles...');
      
      for (let i = 1; i <= 3; i++) {
        console.log(`🔄 Sync cycle ${i}/3...`);
        await window.Storage.syncWithBackend();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between syncs
      }
      
      console.log('✅ Smart sync completed - data should be consistent now');
      
      // Step 2: Refresh current page
      if (window.App && window.App.renderPage) {
        window.App.renderPage(window.App.currentPage);
        console.log('🔄 Page refreshed after smart sync');
      }
      
    } catch (error) {
      console.error('❌ Smart sync failed:', error);
    }
  },

  // Inspect protocol history in detail
  inspectProtocolHistory(protocolId) {
    console.log('🔍 INSPECTING PROTOCOL HISTORY for protocol:', protocolId);
    
    const protocol = window.Storage.getProtocolById(protocolId);
    if (!protocol) {
      console.error('❌ Protocol not found:', protocolId);
      return;
    }
    
    console.log('📋 Protocol details:', {
      id: protocol.id,
      name: protocol.name,
      icon: protocol.icon,
      weight: protocol.weight,
      targets: protocol.targets
    });
    
    const checkins = window.Storage.getCheckins();
    const protocolCheckins = checkins.filter(c => c.type === 'protocol' && c.protocolId === protocolId);
    
    console.log(`📊 ALL CHECKINS for protocol ${protocolId} (${protocolCheckins.length} total):`);
    protocolCheckins.forEach((checkin, index) => {
      console.log(`${index + 1}. Checkin ${checkin.id}:`, {
        timestamp: new Date(checkin.timestamp).toLocaleString(),
        action: checkin.action,
        changes: checkin.changes,
        hasTargetEffects: Object.keys(checkin.changes || {}).length > 0,
        affectedInnerfaces: Object.keys(checkin.changes || {}),
        raw: checkin
      });
    });
    
    // Check if protocol targets are properly applied in recent checkins
    const recentCheckins = protocolCheckins.slice(-5); // Last 5 checkins
    console.log('🔍 Recent checkins analysis:');
    recentCheckins.forEach((checkin, index) => {
      const expectedTargets = protocol.targets || [];
      const actualTargets = Object.keys(checkin.changes || {}).map(id => parseInt(id));
      const hasCorrectTargets = expectedTargets.every(target => actualTargets.includes(target)) &&
                               actualTargets.every(target => expectedTargets.includes(target));
      
      console.log(`${index + 1}. Checkin ${checkin.id}:`, {
        expectedTargets,
        actualTargets,
        hasCorrectTargets,
        status: hasCorrectTargets ? '✅ Correct' : '❌ Incorrect'
      });
    });
  },
  
  // Debug function to test specific protocol issues
  debugProtocolTargets(protocolId) {
    console.log('🐛 DEBUGGING PROTOCOL TARGETS for protocol:', protocolId);
    
    const protocol = window.Storage.getProtocolById(protocolId);
    if (!protocol) {
      console.error('❌ Protocol not found:', protocolId);
      return;
    }
    
    console.log('📋 Current protocol targets:', protocol.targets || []);
    
    // Find all checkins for this protocol
    const checkins = window.Storage.getCheckins();
    const protocolCheckins = checkins.filter(c => c.type === 'protocol' && c.protocolId === protocolId);
    
    console.log(`📊 Found ${protocolCheckins.length} checkins for this protocol`);
    
    // Find checkins missing target effects
    const missingEffectsCheckins = protocolCheckins.filter(checkin => {
      if (!checkin.changes) return true; // No changes at all
      
      // Check if all targets are present in changes
      const hasAllTargets = (protocol.targets || []).every(targetId => 
        checkin.changes.hasOwnProperty(targetId)
      );
      return !hasAllTargets;
    });
    
    if (missingEffectsCheckins.length > 0) {
      console.log(`🚨 FOUND ${missingEffectsCheckins.length} CHECKINS MISSING TARGET EFFECTS:`);
      missingEffectsCheckins.forEach(checkin => {
        const missingTargets = (protocol.targets || []).filter(targetId => 
          !checkin.changes || !checkin.changes.hasOwnProperty(targetId)
        );
        console.log(`  - Checkin ${checkin.id} (${new Date(checkin.timestamp).toLocaleString()}):`, {
          action: checkin.action,
          currentChanges: checkin.changes || {},
          missingTargets,
          expectedTargets: protocol.targets || []
        });
      });
      
      // Offer to fix them
      console.log('🔧 Run debugSync.fixProtocolHistory(' + protocolId + ') to fix these checkins');
    } else {
      console.log('✅ All checkins have proper target effects');
    }
  },
  
  // Fix protocol history by running recalculation
  fixProtocolHistory(protocolId) {
    console.log('🔧 FIXING PROTOCOL HISTORY for protocol:', protocolId);
    
    const protocol = window.Storage.getProtocolById(protocolId);
    if (!protocol) {
      console.error('❌ Protocol not found:', protocolId);
      return;
    }
    
    const oldTargets = [];
    const newTargets = protocol.targets || [];
    
    console.log('📊 Attempting recalculation with:', {
      protocolId,
      protocolName: protocol.name,
      oldTargets,
      newTargets
    });
    
    const result = window.Storage.recalculateProtocolHistory(protocolId, oldTargets, newTargets);
    
    if (result) {
      console.log('✅ Recalculation completed successfully');
      
      // Refresh UI
      if (window.App && window.App.renderPage) {
        window.App.renderPage(window.App.currentPage);
        console.log('🔄 UI refreshed');
      }
      
      // Show updated state
      this.debugProtocolTargets(protocolId);
    } else {
      console.log('ℹ️ No changes were needed');
    }
  },

  // Check raw server data to see what was actually uploaded
  async checkServerData() {
    console.log('🔍 CHECKING RAW SERVER DATA...');
    
    if (!window.Storage.currentUser) {
      console.error('❌ No authenticated user');
      return;
    }
    
    try {
      const token = await window.Storage.currentUser.getIdToken();
      const response = await fetch(`${window.BACKEND_URL}/api/user/data`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const serverResponse = await response.json();
        const serverData = serverResponse.data || {};
        
        console.log('🗄️ RAW SERVER DATA:', serverData);
        
        // Focus on protocols
        if (serverData.protocols) {
          console.log('\n📋 SERVER PROTOCOLS DETAILS:');
          serverData.protocols.forEach(protocol => {
            console.log(`  Protocol ${protocol.id}: ${protocol.name}`, {
              targets: protocol.targets || [],
              weight: protocol.weight,
              icon: protocol.icon,
              updatedAt: protocol.updatedAt || 'no timestamp'
            });
          });
        }
        
        // Focus on innerfaces  
        if (serverData.innerfaces) {
          console.log('\n🎯 SERVER INNERFACES DETAILS:');
          serverData.innerfaces.forEach(innerface => {
            console.log(`  Innerface ${innerface.id}: ${innerface.name}`, {
              value: innerface.value,
              icon: innerface.icon,
              updatedAt: innerface.updatedAt || 'no timestamp'
            });
          });
        }
        
        // Show sync metadata
        console.log('\n⏰ SERVER SYNC INFO:');
        console.log('  Last Updated:', serverResponse.lastUpdated);
        console.log('  Data Keys:', Object.keys(serverData));
        console.log('  Data Counts:', {
          protocols: (serverData.protocols || []).length,
          innerfaces: (serverData.innerfaces || []).length,
          states: (serverData.states || []).length,
          history: (serverData.history || []).length,
          quickActions: (serverData.quickActions || []).length
        });
        
        return serverData;
        
      } else {
        console.error('❌ Failed to fetch server data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Server data check failed:', error);
    }
  },

  // Check raw server data via /api/sync endpoint (more accurate)
  async checkServerDataNew() {
    console.log('🔍 CHECKING RAW SERVER DATA (via /api/sync)...');
    
    if (!window.Storage.currentUser) {
      console.error('❌ No authenticated user');
      return;
    }
    
    try {
      const token = await window.Storage.currentUser.getIdToken();
      
      // Use /api/sync with empty data to get current server state
      const response = await fetch(`${window.BACKEND_URL}/api/sync?_debug=true&_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          protocols: [],
          innerfaces: [],
          states: [],
          history: [],
          quickActions: [],
          quickActionOrder: [],
          protocolOrder: [],
          innerfaceOrder: [],
          stateOrder: [],
          deletedCheckins: []
        })
      });
      
      if (response.ok) {
        const serverResponse = await response.json();
        const serverData = serverResponse.data || {};
        
        console.log('🗄️ RAW SERVER DATA (via /api/sync):', serverData);
        
        // Focus on Quick Actions specifically
        console.log('\n⚡ SERVER QUICK ACTIONS DETAILS:');
        console.log('  quickActions:', {
          count: (serverData.quickActions || []).length,
          data: serverData.quickActions,
          type: typeof serverData.quickActions
        });
        console.log('  quickActionOrder:', {
          count: (serverData.quickActionOrder || []).length,
          data: serverData.quickActionOrder,
          type: typeof serverData.quickActionOrder
        });
        
        // Focus on protocols
        if (serverData.protocols) {
          console.log('\n📋 SERVER PROTOCOLS DETAILS:');
          serverData.protocols.forEach(protocol => {
            console.log(`  Protocol ${protocol.id}: ${protocol.name}`, {
              targets: protocol.targets || [],
              weight: protocol.weight,
              icon: protocol.icon,
              updatedAt: protocol.updatedAt || 'no timestamp'
            });
          });
        }
        
        // Show sync metadata
        console.log('\n⏰ SERVER SYNC INFO:');
        console.log('  Last Updated:', serverResponse.lastUpdated);
        console.log('  Data Keys:', Object.keys(serverData));
        console.log('  Data Counts:', {
          protocols: (serverData.protocols || []).length,
          innerfaces: (serverData.innerfaces || []).length,
          states: (serverData.states || []).length,
          history: (serverData.history || []).length,
          quickActions: (serverData.quickActions || []).length,
          quickActionOrder: (serverData.quickActionOrder || []).length
        });
        
        return serverData;
        
      } else {
        console.error('❌ Failed to fetch server data via /api/sync:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Server data check failed:', error);
    }
  },

  // Check what Quick Actions data is on server
  async checkQuickActionsServer() {
    console.log('🔍 CHECKING SERVER QUICK ACTIONS DATA...');
    try {
      const serverData = await this.checkServerDataNew();
      console.log('🐞 SERVER QUICK ACTIONS DEBUG:', {
        quickActionsCount: serverData?.quickActions?.length || 0,
        quickActionsData: serverData?.quickActions,
        quickActionOrderCount: serverData?.quickActionOrder?.length || 0,
        quickActionOrderData: serverData?.quickActionOrder,
        fullServerResponse: serverData
      });
      return serverData;
    } catch (error) {
      console.error('❌ Error checking server Quick Actions:', error);
    }
  },

  // Reset first-time login flag to test new device behavior
  resetFirstTimeLogin() {
    if (!window.Storage.currentUser) {
      console.error('❌ No authenticated user');
      return;
    }
    
    const firstTimeKey = `first_login_${window.Storage.currentUser.uid}`;
    localStorage.removeItem(firstTimeKey);
    console.log('🆕 First-time login flag reset for user:', window.Storage.currentUser.email);
    console.log('🔄 Next page reload will behave as first-time login (server-first)');
    console.log('🔄 Run window.location.reload() to test');
  },

  // Check first-time login status
  checkFirstTimeStatus() {
    if (!window.Storage.currentUser) {
      console.error('❌ No authenticated user');
      return;
    }
    
    const firstTimeKey = `first_login_${window.Storage.currentUser.uid}`;
    const timestamp = localStorage.getItem(firstTimeKey);
    
    console.log('🔍 FIRST-TIME LOGIN STATUS:', {
      user: window.Storage.currentUser.email,
      isFirstTime: !timestamp,
      firstLoginTimestamp: timestamp,
      firstLoginDate: timestamp ? new Date(parseInt(timestamp)).toLocaleString() : 'Never',
      currentFlag: window.Storage.isFirstTimeLogin
    });
  },

  // Simulate completely new device by clearing all user data
  simulateNewDevice() {
    if (!window.Storage.currentUser) {
      console.error('❌ No authenticated user');
      return;
    }
    
    const userId = window.Storage.currentUser.uid;
    const userEmail = window.Storage.currentUser.email;
    
    console.log('🧹 SIMULATING NEW DEVICE for user:', userEmail);
    console.log('⚠️ This will clear ALL local data for this user');
    
    // Find all user-specific keys
    const userKeys = Object.keys(localStorage).filter(key => key.startsWith(userId));
    const firstTimeKey = `first_login_${userId}`;
    
    console.log('📋 Keys to be deleted:', userKeys.concat([firstTimeKey]));
    
    // Clear all user data
    userKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed: ${key}`);
    });
    
    // Clear first-time flag
    localStorage.removeItem(firstTimeKey);
    console.log(`🗑️ Removed: ${firstTimeKey}`);
    
    console.log('✅ All user data cleared');
    console.log('🔄 Reload page to test first-time login behavior:');
    console.log('  window.location.reload()');
    
    return {
      clearedKeys: userKeys.length + 1,
      userEmail
    };
  },

  // Emergency cleanup of duplicate protocols and innerfaces on server
  async cleanDuplicates() {
    console.log('🧹 EMERGENCY CLEANUP: Removing duplicate protocols and innerfaces from server...');
    try {
      const token = await firebase.auth().currentUser.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/emergency/clean-duplicates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Emergency cleanup successful:', result);
        
        // Sync again to get clean data
        await window.Storage.syncWithBackend();
        console.log('✅ Post-cleanup sync completed');
        
        // Show results
        console.log('🧹 CLEANUP RESULTS:', {
          protocolsRemoved: result.cleaned.protocols.removed,
          innerfacesRemoved: result.cleaned.innerfaces.removed,
          finalProtocolsCount: result.cleaned.protocols.after,
          finalInnerfacesCount: result.cleaned.innerfaces.after
        });
        
        return result;
      } else {
        const errorText = await response.text();
        console.error('❌ Emergency cleanup failed:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('❌ Emergency cleanup error:', error);
    }
  },

  // Clean undefined elements from deletedCheckins
  clearDeletedCheckins() {
    if (!window.Storage) {
      console.error('❌ Storage not available');
      return;
    }
    
    return window.Storage.clearDeletedCheckins();
  },

  // Clear deleted states list (for debugging)
  clearDeletedStates() {
    if (!window.Storage) {
      console.error('❌ Storage not available');
      return;
    }
    
    console.log('🧹 CLEARING DELETED STATES LIST...');
    window.Storage.set('deletedStates', []);
    console.log('✅ Deleted states list cleared');
    return { cleared: true };
  },

  // Clean undefined values from deletedStates (for fixing sync issues)
  cleanDeletedStates() {
    if (!window.Storage) {
      console.error('❌ Storage not available');
      return;
    }
    
    return window.Storage.cleanDeletedStates();
  },

  // Safer sync debugging
  async smartSync() {
    console.log('🧠 Smart sync debugging - preserving data from all devices...');
    
    if (!window.Storage.currentUser) {
      console.error('❌ No authenticated user');
      return;
    }
    
    try {
      // Step 1: Force multiple sync cycles to resolve conflicts
      console.log('🔄 Running multiple sync cycles...');
      
      for (let i = 1; i <= 3; i++) {
        console.log(`🔄 Sync cycle ${i}/3...`);
        await window.Storage.syncWithBackend();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between syncs
      }
      
      console.log('✅ Smart sync completed - data should be consistent now');
      
      // Step 2: Refresh current page
      if (window.App && window.App.renderPage) {
        window.App.renderPage(window.App.currentPage);
        console.log('🔄 Page refreshed after smart sync');
      }
      
    } catch (error) {
      console.error('❌ Smart sync failed:', error);
    }
  }
};

// 🔧 НОВОЕ: Функция для отладки фильтров протоколов
window.debugProtocolFilters = {
  // Включить отладку фильтров
  enableDebug() {
    window.DEBUG_PROTOCOL_FILTERS = true;
    console.log('🔧 Protocol filters debugging enabled');
  },
  
  // Выключить отладку фильтров
  disableDebug() {
    window.DEBUG_PROTOCOL_FILTERS = false;
    console.log('🔧 Protocol filters debugging disabled');
  },
  
  // Показать текущие порядки фильтров
  showFilterOrders() {
    console.log('🔧 CURRENT PROTOCOL FILTER ORDERS:', {
      filterOrders: window.Storage.getProtocolFilterOrders(),
      currentFilter: window.App.protocolGroupFilters.selectedGroups,
      currentFilterKey: window.Storage.getFilterKey(window.App.protocolGroupFilters.selectedGroups)
    });
  },
  
  // Очистить все порядки фильтров
  clearFilterOrders() {
    window.Storage.setProtocolFilterOrders({});
    console.log('🔧 All protocol filter orders cleared');
  },
  
  // Показать порядок для конкретного фильтра
  showFilterOrder(filterKey) {
    const filterOrders = window.Storage.getProtocolFilterOrders();
    console.log(`🔧 FILTER ORDER FOR "${filterKey}":`, filterOrders[filterKey] || 'Not found');
  }
};

console.log('🐛 DEBUG: Sync debugging functions available:');
console.log('  - debugSync.sync() - Manual sync trigger');
console.log('  - debugSync.forceUpload() - Force upload local data to server');
console.log('  - debugSync.testRecalculation(protocolId) - Test protocol history recalculation');
console.log('  - debugSync.inspectProtocolHistory(protocolId) - Detailed protocol history analysis');
console.log('  - debugSync.debugProtocolTargets(protocolId) - Debug specific protocol target issues');
console.log('  - debugSync.fixProtocolHistory(protocolId) - Fix protocol history by recalculation');
console.log('  - debugSync.checkServerData() - Check raw server data to see what was uploaded');
console.log('  - debugSync.checkServerDataNew() - Check server data via /api/sync endpoint (more accurate)');
console.log('  - debugSync.checkQuickActionsServer() - Check Quick Actions data on server');
console.log('  - debugSync.resetFirstTimeLogin() - Reset first-time login flag to test new device behavior');
console.log('  - debugSync.checkFirstTimeStatus() - Check first-time login status');
console.log('  - debugSync.simulateNewDevice() - Clear all user data to simulate completely new device');
console.log('  - debugSync.compare() - Compare local vs server data');
console.log('  - debugSync.status() - Check sync status');  
console.log('  - debugSync.testBackend() - Test backend connectivity');
console.log('  - debugSync.forceResetAndSync() - Force reset user data on server and resync');
console.log('  - debugSync.cleanDuplicates() - Emergency cleanup of duplicate protocols/innerfaces on server');
console.log('  - debugSync.clearDeletedCheckins() - Clean undefined elements from deletedCheckins array');
console.log('  - debugSync.clearDeletedStates() - Clear deleted states list (for debugging)');
console.log('  - debugSync.cleanDeletedStates() - Clean undefined values from deletedStates (fix sync issues)');
console.log('  - debugSync.smartSync() - Safer sync debugging');

console.log('🔧 DEBUG: Protocol filters debugging functions available:');
console.log('  - debugProtocolFilters.enableDebug() - Enable protocol filters debugging');
console.log('  - debugProtocolFilters.disableDebug() - Disable protocol filters debugging');
console.log('  - debugProtocolFilters.showFilterOrders() - Show all filter orders');
console.log('  - debugProtocolFilters.clearFilterOrders() - Clear all filter orders');
console.log('  - debugProtocolFilters.showFilterOrder(filterKey) - Show order for specific filter');
