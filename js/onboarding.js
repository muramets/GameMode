// Onboarding System
class Onboarding {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            {
                type: 'intro',
                emoji: '<i class="fas fa-hat-wizard"></i>',
                title: 'Welcome to GameMode',
                text: `Imagine you're a Witcher or Batman.<br>You move with intent.<br>Every action shapes who you become.`
            },
            {
                type: 'step',
                emoji: '<i class="fas fa-list"></i>',
                title: 'Protocols',
                text: `Actions are your Protocols. Like combos in a game — each move levels a skill and shifts your state.`,
                targetSelector: '.nav-item[data-page="protocols"]',
                page: 'protocols'
            },
            {
                type: 'step',
                emoji: '<i class="fas fa-chart-line"></i>',
                title: 'Skills',
                text: `Every action upgrades or downgrades a skill — this is where you track your growth.`,
                targetSelector: '.nav-item[data-page="skills"]',
                page: 'skills'
            },
            {
                type: 'step',
                emoji: '<i class="fas fa-tachometer-alt"></i>',
                title: 'States',
                text: `States are live feedback — your inner speedometer, shaped by your skills. Customize it to feel your rhythm.`,
                targetSelector: '.state-card:first-child',
                page: 'dashboard'
            }
        ];
        
        this.isActive = false;
        this.wrapper = null;
        this.spotlightOverlay = null;
        this.originalData = null;
    }

    // Check if user should see onboarding
    shouldShowOnboarding() {
        const currentUser = window.firebaseAuth?.currentUser;
        if (!currentUser) {
            return false;
        }
        
        const userKey = `rpg_therapy_onboarding_completed_${currentUser.uid}`;
        const completed = localStorage.getItem(userKey);
        return !completed;
    }

    // Start onboarding
    async start() {
        if (!this.shouldShowOnboarding()) return;

        // Prevent multiple starts
        if (this.isActive) {
            console.log('🎯 Onboarding already active, ignoring start request');
            return;
        }

        console.log('🚀 Starting onboarding...');
        this.isActive = true;
        
        // Save original data and inject sample data
        await this.setupSampleData();
        
        // Create UI elements
        this.createOnboardingElements();
        
        // Show first step
        this.showStep(0);
    }

    // Setup sample data for demonstration
    async setupSampleData() {
        // Save original data
        this.originalData = {
            protocols: window.Storage.getProtocols(),
            skills: window.Storage.getSkills(),
            states: window.Storage.getStates(),
            checkins: window.Storage.getCheckins()
        };

        // Sample data
        const sampleSkills = [
            { id: 1, name: 'Focus', currentScore: 75, initialScore: 60, icon: 'focus', color: '#3b82f6' },
            { id: 2, name: 'Energy', currentScore: 82, initialScore: 70, icon: 'bolt', color: '#eab308' },
            { id: 3, name: 'Confidence', currentScore: 68, initialScore: 55, icon: 'heart', color: '#ef4444' },
            { id: 4, name: 'Calm', currentScore: 71, initialScore: 65, icon: 'leaf', color: '#10b981' },
            { id: 5, name: 'Creativity', currentScore: 89, initialScore: 75, icon: 'paint-brush', color: '#8b5cf6' },
            { id: 6, name: 'Discipline', currentScore: 77, initialScore: 60, icon: 'shield', color: '#f97316' }
        ];

        const sampleStates = [
            { id: 1, name: 'Focused Flow', currentValue: 78, targetValue: 80, icon: 'bullseye', color: '#3b82f6' },
            { id: 2, name: 'Inner Fire', currentValue: 85, targetValue: 85, icon: 'fire', color: '#ef4444' },
            { id: 3, name: 'Zen Mode', currentValue: 72, targetValue: 75, icon: 'yin-yang', color: '#10b981' },
            { id: 4, name: 'Creative Spark', currentValue: 91, targetValue: 90, icon: 'magic', color: '#8b5cf6' }
        ];

        const sampleProtocols = [
            { 
                id: 1, 
                name: 'Morning Meditation', 
                icon: 'om', 
                description: 'Start day with 10 minutes of mindfulness', 
                weight: 5, 
                targets: [1, 4], // Focus, Calm
                order: 0 
            },
            { 
                id: 2, 
                name: 'Power Workout', 
                icon: 'dumbbell', 
                description: 'Intense 30-min strength training session', 
                weight: 8, 
                targets: [2, 3], // Energy, Confidence
                order: 1 
            },
            { 
                id: 3, 
                name: 'Creative Writing', 
                icon: 'pen', 
                description: 'Daily journaling and creative expression', 
                weight: 6, 
                targets: [5, 1], // Creativity, Focus
                order: 2 
            },
            { 
                id: 4, 
                name: 'Cold Shower', 
                icon: 'snowflake', 
                description: 'Build mental resilience with cold exposure', 
                weight: 7, 
                targets: [6, 3], // Discipline, Confidence
                order: 3 
            },
            { 
                id: 5, 
                name: 'Deep Work Block', 
                icon: 'clock', 
                description: '2-hour focused work session with no distractions', 
                weight: 9, 
                targets: [1, 6], // Focus, Discipline
                order: 4 
            }
        ];

        // Generate sample check-ins from the last 7 days
        const sampleCheckins = [];
        const now = new Date();
        for (let i = 0; i < 15; i++) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const protocol = sampleProtocols[Math.floor(Math.random() * sampleProtocols.length)];
            const action = Math.random() > 0.2 ? '+' : '-'; // 80% positive, 20% negative
            
            const checkin = {
                id: Date.now() + i,
                type: 'protocol',
                protocolId: protocol.id,
                protocolName: protocol.name,
                protocolIcon: protocol.icon,
                timestamp: date.toISOString(),
                action: action,
                changes: {}
            };

            // Calculate changes based on protocol targets
            const changeValue = action === '+' ? protocol.weight : -protocol.weight;
            protocol.targets.forEach(skillId => {
                checkin.changes[skillId] = changeValue;
            });

            sampleCheckins.push(checkin);
        }

        // Inject sample data
        localStorage.setItem('rpg_therapy_skills', JSON.stringify(sampleSkills));
        localStorage.setItem('rpg_therapy_states', JSON.stringify(sampleStates));
        localStorage.setItem('rpg_therapy_protocols', JSON.stringify(sampleProtocols));
        localStorage.setItem('rpg_therapy_checkins', JSON.stringify(sampleCheckins));

        // Refresh the app with sample data
        if (window.App) {
            window.App.filteredSkills = sampleSkills;
            window.App.filteredStates = sampleStates;
            window.App.filteredProtocols = sampleProtocols;
            window.App.filteredHistory = sampleCheckins;
            
            // Render current page
            if (window.UI) {
                window.UI.updateUserStats();
                window.UI.renderDashboard();
                window.UI.renderProtocols();
                window.UI.renderSkills();
                window.UI.renderStates();
            }
        }
    }

    // Restore original data
    restoreOriginalData() {
        if (!this.originalData) return;

        // Restore original data
        localStorage.setItem('rpg_therapy_skills', JSON.stringify(this.originalData.skills));
        localStorage.setItem('rpg_therapy_states', JSON.stringify(this.originalData.states));
        localStorage.setItem('rpg_therapy_protocols', JSON.stringify(this.originalData.protocols));
        localStorage.setItem('rpg_therapy_checkins', JSON.stringify(this.originalData.checkins));

        // Refresh the app
        if (window.App) {
            window.App.filteredSkills = this.originalData.skills;
            window.App.filteredStates = this.originalData.states;
            window.App.filteredProtocols = this.originalData.protocols;
            window.App.filteredHistory = this.originalData.checkins;
            
            if (window.UI) {
                window.UI.updateUserStats();
                window.UI.renderDashboard();
                window.UI.renderProtocols();
                window.UI.renderSkills();
                window.UI.renderStates();
            }
        }
    }

    // Create onboarding UI elements
    createOnboardingElements() {
        // Create modal wrapper (only for intro)
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'modal-wrapper onboarding-wrapper';
        this.wrapper.innerHTML = '<div class="modal"></div>';
        document.body.appendChild(this.wrapper);

        // Create spotlight overlay
        this.spotlightOverlay = document.createElement('div');
        this.spotlightOverlay.className = 'spotlight-overlay';
        document.body.appendChild(this.spotlightOverlay);

        // Create tooltip for guide steps
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'onboarding-tooltip';
        document.body.appendChild(this.tooltip);

        // Add event listeners
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.skip();
            }
        });

        // Close on backdrop click
        this.wrapper.addEventListener('click', (e) => {
            if (e.target === this.wrapper) {
                this.skip();
            }
        });
    }

    // Show specific step
    showStep(stepIndex) {
        console.log(`🎯 Showing step ${stepIndex}`);
        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];
        
        if (step.type === 'intro') {
            this.showIntroStep(step);
        } else {
            this.showGuideStep(step);
        }
    }

    // Show intro step
    showIntroStep(step) {
        // Show modal wrapper for intro
        this.wrapper.classList.add('show');
        this.wrapper.querySelector('.modal').innerHTML = `
            <div class="onboarding-intro">
                <span class="emoji">${step.emoji}</span>
                <h1>${step.title}</h1>
                <p>${step.text}</p>
                
                <div class="onboarding-progress">
                    ${this.renderProgressDots()}
                </div>
                
                <div class="onboarding-nav">
                    <button class="btn-secondary" onclick="window.onboarding.skip()">
                        Skip Tour
                    </button>
                    <button class="btn-primary" onclick="window.onboarding.next()">
                        Let's Start
                    </button>
                </div>
            </div>
        `;
        
        // Hide spotlight and tooltip
        this.hideSpotlight();
        this.tooltip.classList.remove('show');
    }

    // Show guide step
    showGuideStep(step) {
        // Completely hide modal wrapper for guide steps
        this.wrapper.classList.remove('show');
        
        // Navigate to correct page and highlight navigation simultaneously
        if (step.page && window.App) {
            window.App.renderPage(step.page);
            // Highlight navigation immediately, don't wait
            this.highlightNavigationButton(step.page);
        }
        
        // Reduced delay and optimized operations
        setTimeout(() => {
            // Show spotlight and tooltip together
            this.showSpotlight(step.targetSelector);
            this.showTooltip(step);
            
            // Set up tracking after UI is ready
            setTimeout(() => {
                this.setupSpotlightTracking(step.targetSelector);
            }, 50);
        }, 100);
    }

    // Highlight the correct navigation button
    highlightNavigationButton(page) {
        // Use more efficient DOM operation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
    }

    // Setup tracking for spotlight position
    setupSpotlightTracking(selector) {
        // Clean up existing tracker first
        this.cleanupSpotlightTracking();
        
        // Smooth throttling with requestAnimationFrame for better sync
        let isThrottled = false;
        this.spotlightTracker = () => {
            if (!isThrottled) {
                isThrottled = true;
                // Use requestAnimationFrame for smooth 60fps updates
                requestAnimationFrame(() => {
                    this.updateSpotlightPosition();
                    this.updateTooltipPosition();
                    // Add slight delay to reduce frequency
                    setTimeout(() => {
                        isThrottled = false;
                    }, 16); // ~60fps with slight throttling
                });
            }
        };
        
        // Add more comprehensive event listeners
        window.addEventListener('scroll', this.spotlightTracker, { passive: true });
        window.addEventListener('resize', this.spotlightTracker, { passive: true });
        document.addEventListener('scroll', this.spotlightTracker, { passive: true });
        
        // Also listen for scroll events on main content areas
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.addEventListener('scroll', this.spotlightTracker, { passive: true });
        }
        
        const appContainer = document.querySelector('.app');
        if (appContainer) {
            appContainer.addEventListener('scroll', this.spotlightTracker, { passive: true });
        }
        
        // Store references for cleanup
        this.trackedElements = [window, document, mainContent, appContainer].filter(Boolean);
    }

    // Clean up spotlight tracking
    cleanupSpotlightTracking() {
        if (this.spotlightTracker) {
            // Clean up all tracked elements
            if (this.trackedElements) {
                this.trackedElements.forEach(element => {
                    element.removeEventListener('scroll', this.spotlightTracker);
                    if (element === window) {
                        element.removeEventListener('resize', this.spotlightTracker);
                    }
                });
            } else {
                // Fallback cleanup
                window.removeEventListener('scroll', this.spotlightTracker);
                window.removeEventListener('resize', this.spotlightTracker);
                document.removeEventListener('scroll', this.spotlightTracker);
            }
            
            this.spotlightTracker = null;
            this.trackedElements = null;
        }
    }

    // Update spotlight position when scrolling/resizing
    updateSpotlightPosition() {
        const step = this.steps[this.currentStep];
        if (!step || !step.targetSelector) return;
        
        let target = null;
        const selector = step.targetSelector;
        
        // Handle multiple selectors (comma-separated)
        if (selector.includes(',')) {
            const selectors = selector.split(',').map(s => s.trim());
            for (const sel of selectors) {
                target = document.querySelector(sel);
                if (target) break;
            }
        } else {
            target = document.querySelector(selector);
        }
        
        // Special fallback for States step: if no state cards exist, target the container
        if (!target && selector === '.state-card:first-child') {
            target = document.querySelector('.states-grid');
        }
        
        if (!target) {
            this.hideSpotlight();
            return;
        }

        const rect = target.getBoundingClientRect();
        
        // Check if element is visible on screen (with some buffer)
        const buffer = 50;
        const isVisible = rect.bottom > -buffer && 
                         rect.top < window.innerHeight + buffer &&
                         rect.right > -buffer && 
                         rect.left < window.innerWidth + buffer;
        
        if (!isVisible) {
            // Hide spotlight if element is not visible
            this.spotlightOverlay.classList.remove('show');
            return;
        } else {
            // Show spotlight if element is visible and we're in a guide step
            if (!this.spotlightOverlay.classList.contains('show') && step.type === 'step') {
                this.spotlightOverlay.classList.add('show');
            }
        }

        const padding = 8;
        const hole = this.spotlightOverlay.querySelector('.spotlight-hole');
        
        if (hole) {
            hole.style.transform = `translate(${rect.left - padding}px, ${rect.top - padding}px)`;
            hole.style.width = `${rect.width + padding * 2}px`;
            hole.style.height = `${rect.height + padding * 2}px`;
        }
    }

    // Update tooltip position when scrolling/resizing
    updateTooltipPosition() {
        const step = this.steps[this.currentStep];
        if (!step || !step.targetSelector || !this.tooltip || !this.tooltip.classList.contains('show')) {
            return;
        }
        
        let target = null;
        const selector = step.targetSelector;
        
        // Handle multiple selectors (comma-separated)
        if (selector.includes(',')) {
            const selectors = selector.split(',').map(s => s.trim());
            for (const sel of selectors) {
                target = document.querySelector(sel);
                if (target) break;
            }
        } else {
            target = document.querySelector(selector);
        }
        
        // Special fallback for States step: if no state cards exist, target the container
        if (!target && selector === '.state-card:first-child') {
            target = document.querySelector('.states-grid');
        }
        
        if (!target) return;

        const rect = target.getBoundingClientRect();
        
        // Check if element is visible on screen (with some buffer)
        const buffer = 50;
        const isVisible = rect.bottom > -buffer && 
                         rect.top < window.innerHeight + buffer &&
                         rect.right > -buffer && 
                         rect.left < window.innerWidth + buffer;
        
        if (!isVisible) {
            // Keep tooltip visible but position it at a safe location when target is off-screen
            this.tooltip.style.top = '20px';
            this.tooltip.style.left = '50%';
            this.tooltip.style.transform = 'translateX(-50%)';
        } else {
            // Reposition tooltip relative to updated target position when target is visible
            this.positionTooltip(target);
        }
    }

    // Show tooltip near target element
    showTooltip(step) {
        const target = document.querySelector(step.targetSelector);
        
        this.tooltip.innerHTML = `
            <div class="tooltip-header">
                <span class="tooltip-emoji">${step.emoji}</span>
                <h3 class="tooltip-title">${step.title}</h3>
            </div>
            
            <div class="tooltip-text">${step.text}</div>
            
            <div class="tooltip-nav">
                <div class="tooltip-progress">
                    ${this.renderProgressDots()}
                </div>
                
                <div class="tooltip-buttons">
                    <button class="btn-sm btn-secondary" onclick="window.onboarding.previous()">
                        ${this.currentStep === 1 ? 'Back' : 'Previous'}
                    </button>
                    <button class="btn-sm btn-primary" onclick="window.onboarding.next()">
                        ${this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        `;

        // Position tooltip near target element
        if (target) {
            this.positionTooltip(target);
        } else {
            // Fallback position
            this.tooltip.style.top = '50%';
            this.tooltip.style.left = '50%';
            this.tooltip.style.transform = 'translate(-50%, -50%)';
        }
        
        this.tooltip.classList.add('show');
    }

    // Position tooltip relative to target element
    positionTooltip(target) {
        const rect = target.getBoundingClientRect();
        const tooltipWidth = 350; // max-width from CSS
        const tooltipHeight = 200; // estimated height
        const spacing = 20;
        
        let top, left;
        
        // Try to position to the right of target
        if (rect.right + spacing + tooltipWidth < window.innerWidth) {
            left = rect.right + spacing;
            top = Math.max(spacing, rect.top + (rect.height - tooltipHeight) / 2);
        }
        // Try to position to the left of target
        else if (rect.left - spacing - tooltipWidth > 0) {
            left = rect.left - spacing - tooltipWidth;
            top = Math.max(spacing, rect.top + (rect.height - tooltipHeight) / 2);
        }
        // Position below target
        else if (rect.bottom + spacing + tooltipHeight < window.innerHeight) {
            left = Math.max(spacing, Math.min(window.innerWidth - tooltipWidth - spacing, rect.left + (rect.width - tooltipWidth) / 2));
            top = rect.bottom + spacing;
        }
        // Position above target
        else {
            left = Math.max(spacing, Math.min(window.innerWidth - tooltipWidth - spacing, rect.left + (rect.width - tooltipWidth) / 2));
            top = Math.max(spacing, rect.top - spacing - tooltipHeight);
        }
        
        // Make sure tooltip stays within viewport
        top = Math.max(spacing, Math.min(window.innerHeight - tooltipHeight - spacing, top));
        left = Math.max(spacing, Math.min(window.innerWidth - tooltipWidth - spacing, left));
        
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.transform = 'none';
    }

    // Render progress dots
    renderProgressDots() {
        return this.steps.map((_, index) => {
            let className = 'progress-dot';
            if (index < this.currentStep) className += ' completed';
            else if (index === this.currentStep) className += ' active';
            
            return `<div class="${className}"></div>`;
        }).join('');
    }

    // Show spotlight on target element
    showSpotlight(selector) {
        if (!selector) {
            this.hideSpotlight();
            return;
        }

        let target = null;
        
        // Handle multiple selectors (comma-separated)
        if (selector.includes(',')) {
            const selectors = selector.split(',').map(s => s.trim());
            for (const sel of selectors) {
                target = document.querySelector(sel);
                if (target) break;
            }
        } else {
            target = document.querySelector(selector);
        }
        
        // Special fallback for States step: if no state cards exist, target the container
        if (!target && selector === '.state-card:first-child') {
            target = document.querySelector('.states-grid');
            console.log(`🎯 No state cards found, falling back to states-grid`);
        }
        
        if (!target) {
            this.hideSpotlight();
            return;
        }

        console.log(`🎯 Spotlighting element:`, target);

        const rect = target.getBoundingClientRect();
        const padding = 8;
        
        this.spotlightOverlay.innerHTML = `
            <div class="spotlight-hole" style="
                transform: translate(${rect.left - padding}px, ${rect.top - padding}px);
                width: ${rect.width + padding * 2}px;
                height: ${rect.height + padding * 2}px;
                top: 0;
                left: 0;
            "></div>
        `;
        
        this.spotlightOverlay.classList.add('show');
    }

    // Hide spotlight
    hideSpotlight() {
        this.spotlightOverlay.classList.remove('show');
    }

    // Next step
    next() {
        console.log(`🎯 Next step from ${this.currentStep}`);
        if (this.currentStep >= this.steps.length - 1) {
            this.finish();
        } else {
            this.showStep(this.currentStep + 1);
        }
    }

    // Previous step
    previous() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    // Skip onboarding
    skip() {
        this.finish();
    }

    // Finish onboarding
    finish() {
        this.isActive = false;
        
        // Clean up spotlight tracking
        this.cleanupSpotlightTracking();
        
        // Hide UI
        this.wrapper.classList.remove('show');
        this.tooltip.classList.remove('show');
        this.hideSpotlight();
        
        // Clean up after animation
        setTimeout(() => {
            if (this.wrapper) {
                this.wrapper.remove();
                this.wrapper = null;
            }
            if (this.spotlightOverlay) {
                this.spotlightOverlay.remove();
                this.spotlightOverlay = null;
            }
            if (this.tooltip) {
                this.tooltip.remove();
                this.tooltip = null;
            }
        }, 300);

        // Restore original data
        this.restoreOriginalData();
        
        // Mark as completed
        const currentUser = window.firebaseAuth?.currentUser;
        if (currentUser) {
            const userKey = `rpg_therapy_onboarding_completed_${currentUser.uid}`;
            localStorage.setItem(userKey, 'true');
        }
        
        // Show completion message
        if (window.App) {
            window.App.showToast('Welcome to GameMode! Ready to level up your life?', 'success', 5000);
        }
    }

    // Reset onboarding (for testing)
    reset() {
        const currentUser = window.firebaseAuth?.currentUser;
        if (currentUser) {
            const userKey = `rpg_therapy_onboarding_completed_${currentUser.uid}`;
            localStorage.removeItem(userKey);
        }
    }
}

// Initialize onboarding system
window.onboarding = new Onboarding();

// Auto-start onboarding after app initialization
document.addEventListener('DOMContentLoaded', () => {
    // Reduced delay for smoother user experience
    setTimeout(() => {
        if (window.firebaseAuth && window.firebaseAuth.currentUser && window.onboarding.shouldShowOnboarding()) {
            window.onboarding.start();
        }
    }, 500);
});

// Patch the showApp function to trigger onboarding for new users
if (typeof window.showAppOriginal === 'undefined' && typeof window.showApp !== 'undefined') {
    window.showAppOriginal = window.showApp;
    window.showApp = function(user) {
        // Call original showApp
        window.showAppOriginal(user);
        
        // Check for onboarding after a short delay
        setTimeout(() => {
            if (window.onboarding && window.onboarding.shouldShowOnboarding()) {
                window.onboarding.start();
            }
        }, 800);
    };
} else {
    // If showApp is not available yet, wait for it
    const waitForShowApp = setInterval(() => {
        if (typeof window.showApp !== 'undefined') {
            clearInterval(waitForShowApp);
            
            window.showAppOriginal = window.showApp;
            window.showApp = function(user) {
                // Call original showApp
                window.showAppOriginal(user);
                
                // Check for onboarding after a short delay
                setTimeout(() => {
                    if (window.onboarding && window.onboarding.shouldShowOnboarding()) {
                        window.onboarding.start();
                    }
                }, 800);
            };
        }
    }, 100);
}

// Manual start function for testing
window.startOnboarding = function() {
    if (window.onboarding) {
        window.onboarding.reset(); // Reset completion flag
        window.onboarding.start();
    }
}; 