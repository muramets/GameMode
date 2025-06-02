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
    
    // Initialize app and sync
    initMainApp();
    syncUserData();
    
    // 🚀 НОВОЕ: Установить периодическую синхронизацию каждые 30 секунд
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
    } catch (error) {
        console.error('❌ Automatic sync failed:', error);
    }
}

// 🚀 НОВАЯ ФУНКЦИЯ: Периодическая синхронизация
let syncIntervalId = null;
function setupPeriodicSync() {
    // Очистить существующий интервал если есть
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
    }
    
    console.log('⏰ Setting up periodic sync every 30 seconds...');
    
    // Синхронизация каждые 30 секунд
    syncIntervalId = setInterval(async () => {
        try {
            console.log('🔄 Periodic sync triggered...');
            await window.Storage.syncWithBackend();
            console.log('✅ Periodic sync completed');
        } catch (error) {
            console.warn('⚠️ Periodic sync failed (will retry):', error);
        }
    }, 30000); // 30 секунд
    
    // Также добавить синхронизацию при фокусе окна
    window.addEventListener('focus', async () => {
        try {
            console.log('👁️ Window focused - triggering sync...');
            await window.Storage.syncWithBackend();
            console.log('✅ Focus sync completed');
        } catch (error) {
            console.warn('⚠️ Focus sync failed:', error);
        }
    });
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
        skillsPage: 1,
        skillsPerPage: 30,
        filteredSkills: [],
        filteredHistory: [],
        historyInitialized: false,
        states: [],
        historyFilters: {
            time: 'all',
            type: 'all', 
            protocol: 'all',
            state: 'all',
            effect: 'all',
            skill: 'all',
            customDateFrom: '',
            customDateTo: ''
        },

        init() {
            // Initialize data
            this.states = window.Storage.getStatesInOrder();
            
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

            // Skill search
            const skillSearchInput = document.getElementById('skill-search');
            if (skillSearchInput) {
                skillSearchInput.addEventListener('input', (e) => {
                    this.filterSkills(e.target.value);
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
                        this.updatePagination();
                    }
                });
            }

            // Skills pagination buttons
            const skillsPrevBtn = document.getElementById('skills-prev-page');
            const skillsNextBtn = document.getElementById('skills-next-page');
            
            if (skillsPrevBtn) {
                skillsPrevBtn.addEventListener('click', () => {
                    if (this.skillsPage > 1) {
                        this.skillsPage--;
                        UI.renderSkills();
                        DragDrop.setupSkills();
                        this.updateSkillsPagination();
                    }
                });
            }

            if (skillsNextBtn) {
                skillsNextBtn.addEventListener('click', () => {
                    const totalPages = Math.ceil(this.filteredSkills.length / this.skillsPerPage);
                    if (this.skillsPage < totalPages) {
                        this.skillsPage++;
                        UI.renderSkills();
                        DragDrop.setupSkills();
                        this.updateSkillsPagination();
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

            // Add tooltip handlers to protocol and skill name cells
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

            // Handle skill name cells
            document.querySelectorAll('.skill-name-cell[data-hover]').forEach(cell => {
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
                    const navSkillsGroup = document.querySelector('.nav-skills-group');
                    
                    if (navHistory && navExpandBtn && navSkillsGroup) {
                        navExpandBtn.classList.add('expanded');
                        navHistory.classList.add('expanded');
                        navSkillsGroup.classList.add('expanded');
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
            // 🚀 ПРИНУДИТЕЛЬНАЯ СИНХРОНИЗАЦИЯ ПРИ ПЕРЕКЛЮЧЕНИИ СТРАНИЦ
            // Получаем свежие данные с сервера перед рендерингом
            window.Storage.syncWithBackend().catch(error => {
                console.warn('⚠️ Page sync failed, using cached data:', error);
            });
            
            switch(page) {
                case 'dashboard':
                    UI.renderDashboard();
                    break;
                case 'protocols':
                    UI.renderProtocols();
                    DragDrop.setupProtocols();
                    this.setupTooltips();
                    break;
                case 'skills':
                    UI.renderSkills();
                    DragDrop.setupSkills();
                    this.setupTooltips();
                    break;
                case 'history':
                    // Initialize filtered history if not already set
                    if (this.filteredHistory.length === 0) {
                        this.filteredHistory = window.Storage.getCheckins().reverse();
                    }
                    
                    UI.renderHistory();
                    
                    // Setup filters after rendering
                    setTimeout(() => {
                        this.setupHistoryFilters();
                    }, 0);
                    
                    break;
            }
        },

        // Actions
        checkin(protocolId, action = '+') {
            const checkin = window.Storage.addCheckin(protocolId, action);
            if (checkin) {
                this.showToast('Check-in successful!', 'success');
                
                // Always update dashboard stats since skills changed
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
                
                // If we're not on skills page, but skills were affected, update skills data
                if (this.currentPage !== 'skills') {
                    this.filteredSkills = window.Storage.getSkillsInOrder();
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
            if (confirm('Delete this check-in?')) {
                const checkins = window.Storage.getCheckins();
                const checkin = checkins.find(c => c.id === checkinId);
                
                window.Storage.deleteCheckin(checkinId);
                
                // If it was a drag & drop operation, refresh the affected page
                if (checkin && checkin.type === 'drag_drop') {
                    if (checkin.subType === 'protocol') {
                        this.filteredProtocols = window.Storage.getProtocolsInOrder();
                        if (this.currentPage === 'protocols') {
                            UI.renderProtocols();
                        }
                        this.showToast('Protocol order reverted', 'success');
                    } else if (checkin.subType === 'skill') {
                        this.filteredSkills = window.Storage.getSkillsInOrder();
                        if (this.currentPage === 'skills') {
                            UI.renderSkills();
                            DragDrop.setupSkills();
                        }
                        this.showToast('Skill order reverted', 'success');
                    }
                } else {
                    this.showToast('Check-in deleted', 'success');
                }
                
                // Reset history filter to show all items
                this.filteredHistory = [];
                this.historyInitialized = false;
                UI.renderHistory();
                
                // Update user stats if on dashboard
                if (this.currentPage === 'dashboard') {
                    UI.updateUserStats();
                }
            }
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
            const allProtocols = window.Storage.getProtocolsInOrder();
            const skills = window.Storage.getSkills();
            
            if (!query.trim()) {
                this.filteredProtocols = allProtocols;
            } else {
                const searchTerm = query.toLowerCase();
                this.filteredProtocols = allProtocols.filter(protocol => {
                    // Search in protocol name
                    if (protocol.name.toLowerCase().includes(searchTerm)) {
                        return true;
                    }
                    
                    // Search in target skills
                    const targetNames = protocol.targets.map(targetId => {
                        const skill = skills.find(s => s.id === targetId);
                        return skill ? skill.name.toLowerCase() : targetId;
                    });
                    
                    return targetNames.some(name => name.includes(searchTerm));
                });
            }
            
            // Reset to first page when filtering
            this.protocolsPage = 1;
            UI.renderProtocols();
            DragDrop.setupProtocols();
            this.setupTooltips();
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

        updateSkillsPagination() {
            const totalSkills = this.filteredSkills.length;
            const totalPages = Math.ceil(totalSkills / this.skillsPerPage);
            
            const currentPageSpan = document.getElementById('skills-current-page');
            const totalPagesSpan = document.getElementById('skills-total-pages');
            const skillsPrevBtn = document.getElementById('skills-prev-page');
            const skillsNextBtn = document.getElementById('skills-next-page');
            
            if (currentPageSpan) currentPageSpan.textContent = this.skillsPage;
            if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
            
            if (skillsPrevBtn) {
                skillsPrevBtn.disabled = this.skillsPage <= 1;
            }
            
            if (skillsNextBtn) {
                skillsNextBtn.disabled = this.skillsPage >= totalPages;
            }
        },

        filterSkills(query) {
            const allSkills = window.Storage.getSkillsInOrder();
            
            if (!query.trim()) {
                this.filteredSkills = allSkills;
            } else {
                this.filteredSkills = allSkills.filter(skill => 
                    skill.name.toLowerCase().includes(query.toLowerCase()) ||
                    skill.hover.toLowerCase().includes(query.toLowerCase())
                );
            }
            
            // Reset to first page when filtering
            this.skillsPage = 1;
            UI.renderSkills();
            DragDrop.setupSkills();
            this.updateSkillsPagination();
        },

        filterHistory(query) {
            // Just trigger the main filter function which handles both search and filters
            this.applyHistoryFilters();
        },

        // Setup history filters
        setupHistoryFilters() {
            // Populate dynamic filter options
            this.populateProtocolFilters();
            this.populateStateFilters();
            this.populateSkillFilters();
            
            const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
            const customDateRange = document.getElementById('filter-custom-date-range');
            const dateFromInput = document.getElementById('filter-date-from');
            const dateToInput = document.getElementById('filter-date-to');
            const protocolSubmenu = document.getElementById('protocol-filter-submenu');
            const stateSubmenu = document.getElementById('state-filter-submenu');
            const skillSubmenu = document.getElementById('skill-filter-submenu');
            const protocolSpecificOption = document.getElementById('protocol-specific-option');
            const stateSpecificOption = document.getElementById('state-specific-option');
            const skillSpecificOption = document.getElementById('skill-specific-option');
            
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
                            
                            // Hide submenus for protocol/state/skill filters and remove active class
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
                            if (filterType === 'skill' && skillSubmenu && skillSpecificOption) {
                                skillSubmenu.classList.remove('show');
                                skillSpecificOption.classList.remove('active');
                                // Uncheck all submenu options
                                skillSubmenu.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
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
                            if (filterType === 'skill' && skillSubmenu && skillSpecificOption) {
                                skillSubmenu.classList.add('show');
                                skillSpecificOption.classList.add('active');
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
                            if (filterType === 'skill' && skillSubmenu && skillSpecificOption) {
                                skillSubmenu.classList.remove('show');
                                skillSpecificOption.classList.remove('active');
                                skillSubmenu.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
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
                                        if (filterType === 'skill' && skillSpecificOption) {
                                            skillSpecificOption.classList.remove('active');
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
                                     this.historyFilters.skill !== 'all';
            
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
            
            // Start with all history
            const allHistory = window.Storage.getCheckins().reverse();
            const skills = window.Storage.getSkills();
            
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
                        const actionText = checkin.subType === 'protocol' ? 'reordered protocol' : 'reordered skill';
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
                    
                    // Search in affected skill names
                    if (checkin.changes) {
                        const affectedSkills = Object.keys(checkin.changes).map(skillId => {
                            const skill = skills.find(s => s.id == skillId);
                            return skill ? skill.name.toLowerCase() : '';
                        });
                        
                        if (affectedSkills.some(skillName => skillName.includes(searchTerm))) {
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
                
                // State filter - show checkins that affect skills used by this state
                if (this.historyFilters.state !== 'all') {
                    if (checkin.type !== 'protocol' || !checkin.protocolId) {
                        return false; // Only protocol checkins can be filtered by state
                    }
                    
                    // Get the selected state and its dependencies
                    const state = window.Storage.getStateById(this.historyFilters.state);
                    if (!state) {
                        return false;
                    }
                    
                    // Get all skill IDs that affect this state (including from dependent states)
                    const stateSkillIds = this.getStateAffectedSkills(state.id);
                    
                    // Get the protocol and its targets
                    const protocol = window.Storage.getProtocolById(checkin.protocolId);
                    if (!protocol || !protocol.targets) {
                        return false;
                    }
                    
                    // Check if this protocol targets any of the state's skill dependencies
                    const protocolTargetsStateSkills = protocol.targets.some(targetId => 
                        stateSkillIds.includes(parseInt(targetId))
                    );
                    
                    if (!protocolTargetsStateSkills) {
                        return false;
                    }
                }
                
                // Skill filter - show checkins that affect a specific skill
                if (this.historyFilters.skill !== 'all') {
                    const skillId = parseInt(this.historyFilters.skill);
                    
                    // For protocol checkins, check if the skill was affected
                    if (checkin.type === 'protocol') {
                        if (!checkin.changes || !checkin.changes[skillId]) {
                            return false;
                        }
                    }
                    // For drag & drop operations, check if it's the specific skill being reordered
                    else if (checkin.type === 'drag_drop' && checkin.subType === 'skill') {
                        if (checkin.itemId !== skillId) {
                            return false;
                        }
                    }
                    // For other types, exclude them when filtering by skill
                    else {
                        return false;
                    }
                }
                
                return true;
            });
            
            UI.renderHistory();
        },

        // Get all skill IDs that affect a state (including from dependent states)
        getStateAffectedSkills(stateId, visitedStates = new Set()) {
            // Prevent infinite recursion with circular dependencies
            if (visitedStates.has(stateId)) {
                return [];
            }
            visitedStates.add(stateId);
            
            const state = window.Storage.getStateById(stateId);
            if (!state) {
                return [];
            }
            
            let affectedSkills = [];
            
            // Add direct skill dependencies (convert to numbers)
            if (state.skillIds && state.skillIds.length > 0) {
                affectedSkills.push(...state.skillIds.map(id => parseInt(id)));
            }
            
            // Add skills from dependent states (recursive)
            if (state.stateIds && state.stateIds.length > 0) {
                state.stateIds.forEach(dependentStateId => {
                    const dependentSkills = this.getStateAffectedSkills(dependentStateId, new Set(visitedStates));
                    affectedSkills.push(...dependentSkills);
                });
            }
            
            // Remove duplicates and return (all should be numbers now)
            return [...new Set(affectedSkills)];
        },

        // Populate dynamic filter options
        populateProtocolFilters() {
            const protocolContainer = document.getElementById('protocol-filter-options');
            if (!protocolContainer) return;
            
            const protocols = window.Storage.getProtocols();
            protocolContainer.innerHTML = protocols.map(protocol => {
                const protocolName = protocol.name.split('. ')[0]; // Get main name part
                return `
                    <label class="filter-option">
                        <input type="checkbox" class="filter-checkbox" data-filter="protocol" data-value="${protocol.id}">
                        <i class="fas fa-check filter-check-icon"></i>
                        <span class="filter-label">${UI.renderIcon(protocol.icon)} ${protocolName}</span>
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
        
        // Populate dynamic skill filters
        populateSkillFilters() {
            const skillContainer = document.getElementById('skill-filter-options');
            if (!skillContainer) return;
            
            const skills = window.Storage.getSkills();
            skillContainer.innerHTML = skills.map(skill => {
                const skillName = skill.name.split('. ')[0]; // Get main name part
                return `
                    <label class="filter-option">
                        <input type="checkbox" class="filter-checkbox" data-filter="skill" data-value="${skill.id}">
                        <i class="fas fa-check filter-check-icon"></i>
                        <span class="filter-label">${UI.renderIcon(skill.icon)} ${skillName}</span>
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
                    // Set specific filter
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
        
        // Navigate to history page and filter by specific skill
        viewSkillHistory(skillId) {
            // Reset all filters first
            this.historyFilters = {
                time: 'all',
                type: 'all',
                protocol: 'all',
                state: 'all',
                effect: 'all',
                skill: skillId.toString(),
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
            
            // Apply the skill filter
            this.applyHistoryFilters();
            
            // Update filter UI to show selected skill
            setTimeout(() => {
                this.updateFilterUI();
                this.updateFilterIcon();
            }, 100);
            
            // Show a toast to inform user about the filter
            const skill = window.Storage.getSkillById(skillId);
            if (skill) {
                this.showToast(`Showing history for ${skill.name}`, 'info');
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
                skill: 'all',
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
                skill: 'all',
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
            const navSkillsGroup = document.querySelector('.nav-skills-group');
            const navExpandBtn = document.getElementById('nav-expand-btn');
            const navHistory = document.getElementById('nav-history');
            
            if (!navSkillsGroup || !navExpandBtn || !navHistory) return;
            
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
                    navSkillsGroup.classList.add('hover-expanded');
                }
            });
            
            // Hover to collapse при уходе со стрелки или с history кнопки (с задержкой)
            const scheduleCollapse = () => {
                // Don't collapse if we're on history page, or if manually/programmatically expanded
                if (!isManuallyExpanded && !isProgramExpanded && this.currentPage !== 'history') {
                    hoverTimeout = setTimeout(() => {
                        navExpandBtn.classList.remove('expanded');
                        navHistory.classList.remove('expanded');
                        navSkillsGroup.classList.remove('hover-expanded');
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
                    navSkillsGroup.classList.add('expanded');
                } else {
                    navExpandBtn.classList.remove('expanded');
                    navHistory.classList.remove('expanded');
                    navSkillsGroup.classList.remove('expanded');
                    navSkillsGroup.classList.remove('hover-expanded');
                }
            });
            
            // Store reference for programmatic expansion
            this.navExpansion = {
                setProgram: (expanded) => {
                    isProgramExpanded = expanded;
                    if (expanded) {
                        navExpandBtn.classList.add('expanded');
                        navHistory.classList.add('program-expanded');
                        navHistory.classList.remove('expanded');
                        navSkillsGroup.classList.add('expanded');
                    } else {
                        navExpandBtn.classList.remove('expanded');
                        navHistory.classList.remove('program-expanded');
                        navHistory.classList.remove('expanded');
                        navSkillsGroup.classList.remove('expanded');
                        navSkillsGroup.classList.remove('hover-expanded');
                    }
                },
                
                reset: () => {
                    isManuallyExpanded = false;
                    isProgramExpanded = false;
                    navExpandBtn.classList.remove('expanded');
                    navHistory.classList.remove('expanded', 'program-expanded');
                    navSkillsGroup.classList.remove('expanded', 'hover-expanded');
                }
            };
        }
    };

    // Make App globally available
    window.App = App;
    
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
        window.UI.setupQuickProtocolTooltips();
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
        skills: window.Storage.get(window.Storage.KEYS.SKILLS) || [],
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
  }
};

console.log('🐛 DEBUG: Sync debugging functions available:');
console.log('  - debugSync.sync() - Manual sync trigger');
console.log('  - debugSync.forceUpload() - Force upload local data to server');
console.log('  - debugSync.compare() - Compare local vs server data');
console.log('  - debugSync.status() - Check sync status');  
console.log('  - debugSync.testBackend() - Test backend connectivity');
