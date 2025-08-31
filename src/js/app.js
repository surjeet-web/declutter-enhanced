/**
 * Main Application - Declutter Enhanced
 */
class DeclutterApp extends EventEmitter {
    constructor() {
        super();
        this.components = new Map();
        this.currentPanel = 'dashboard';
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
                return;
            }

            // Initialize core services
            await this.initializeServices();
            
            // Initialize UI components
            this.initializeUI();
            
            // Set up global event listeners
            this.bindGlobalEvents();
            
            // Load saved state
            this.loadState();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('Declutter Enhanced initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Declutter:', error);
            this.showCriticalError('Failed to initialize application');
        }
    }

    /**
     * Initialize core services
     */
    async initializeServices() {
        // Initialize state manager
        if (!StateManager.loadState()) {
            console.log('No saved state found, using defaults');
        }

        // Wait for AE service to connect
        if (!AEService.isConnected) {
            await new Promise((resolve) => {
                AEService.once('connected', resolve);
            });
        }

        // Initialize AI service
        AIService.setEnabled(StateManager.getState('ui.preferences.aiEnabled') !== false);
    }

    /**
     * Initialize UI components
     */
    initializeUI() {
        // Initialize tab navigation
        this.initializeTabNavigation();
        
        // Initialize panels
        this.initializePanels();
        
        // Initialize global UI elements
        this.initializeGlobalUI();
        
        // Apply theme
        this.applyTheme(StateManager.getState('ui.preferences.theme') || 'dark');
        
        // Show initial panel
        this.showPanel(StateManager.getState('ui.activePanel') || 'dashboard');
    }

    /**
     * Initialize tab navigation
     */
    initializeTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const panel = e.currentTarget.dataset.panel;
                this.showPanel(panel);
            });
        });
    }

    /**
     * Initialize panels
     */
    initializePanels() {
        // Dashboard panel
        const dashboardContainer = document.querySelector('#dashboardPanel .dashboard-content');
        if (dashboardContainer) {
            const dashboard = new Dashboard(dashboardContainer);
            dashboard.on('navigateToPanel', (panel) => this.showPanel(panel));
            this.components.set('dashboard', dashboard);
        }

        // Templates panel (placeholder for now)
        const templatesContainer = document.querySelector('#templatesPanel .templates-content');
        if (templatesContainer) {
            templatesContainer.innerHTML = `
                <div class="text-center">
                    <h3>Template Builder</h3>
                    <p>Template builder component will be implemented here</p>
                    <button class="btn btn-primary" id="createTemplateBtn">Create New Template</button>
                </div>
            `;
            
            const createBtn = templatesContainer.querySelector('#createTemplateBtn');
            if (createBtn) {
                createBtn.addEventListener('click', () => {
                    EventBus.emit('showNotification', {
                        type: 'info',
                        title: 'Coming Soon',
                        message: 'Template builder is under development'
                    });
                });
            }
        }

        // Organize panel (placeholder for now)
        const organizeContainer = document.querySelector('#organizePanel .organize-content');
        if (organizeContainer) {
            organizeContainer.innerHTML = `
                <div class="text-center">
                    <h3>Asset Organizer</h3>
                    <p>Asset organization component will be implemented here</p>
                    <button class="btn btn-success" id="organizeBtn">Start Organizing</button>
                </div>
            `;
            
            const organizeBtn = organizeContainer.querySelector('#organizeBtn');
            if (organizeBtn) {
                organizeBtn.addEventListener('click', () => {
                    EventBus.emit('showNotification', {
                        type: 'info',
                        title: 'Coming Soon',
                        message: 'Asset organizer is under development'
                    });
                });
            }
        }

        // Analytics panel (placeholder for now)
        const analyticsContainer = document.querySelector('#analyticsPanel .analytics-content');
        if (analyticsContainer) {
            analyticsContainer.innerHTML = `
                <div class="text-center">
                    <h3>Analytics Dashboard</h3>
                    <p>Analytics and insights will be displayed here</p>
                    <div class="analytics-grid mt-4">
                        <div class="metric-card">
                            <div class="metric-value">85</div>
                            <div class="metric-label">Organization Score</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">247</div>
                            <div class="metric-label">Total Assets</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">12</div>
                            <div class="metric-label">Folders Created</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">23</div>
                            <div class="metric-label">Assets Organized</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Initialize global UI elements
     */
    initializeGlobalUI() {
        // Settings button
        const settingsBtn = document.querySelector('#settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }

        // Help button
        const helpBtn = document.querySelector('#helpBtn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                this.showHelpModal();
            });
        }

        // Initialize notification system
        this.initializeNotifications();
        
        // Initialize progress overlay
        this.initializeProgressOverlay();
    }

    /**
     * Initialize notification system
     */
    initializeNotifications() {
        EventBus.on('showNotification', (notification) => {
            this.showNotification(notification);
        });
    }

    /**
     * Initialize progress overlay
     */
    initializeProgressOverlay() {
        EventBus.on('showProgress', (data) => {
            this.showProgress(data);
        });

        EventBus.on('updateProgress', (data) => {
            this.updateProgress(data);
        });

        EventBus.on('hideProgress', () => {
            this.hideProgress();
        });

        // Progress cancel button
        const cancelBtn = document.querySelector('#progressCancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                EventBus.emit('cancelProgress');
                this.hideProgress();
            });
        }
    }

    /**
     * Bind global event listeners
     */
    bindGlobalEvents() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcut(e);
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Before unload - save state
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });

        // State change events
        StateManager.on('stateChanged', (event) => {
            this.handleStateChange(event);
        });

        // AE service events
        AEService.on('projectDataUpdated', () => {
            this.updateProjectInfo();
        });
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcut(e) {
        // Ctrl/Cmd + Shift + shortcuts
        if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            switch (e.key.toLowerCase()) {
                case 'o':
                    e.preventDefault();
                    this.showPanel('organize');
                    break;
                case 't':
                    e.preventDefault();
                    this.showPanel('templates');
                    break;
                case 'a':
                    e.preventDefault();
                    this.showPanel('analytics');
                    break;
                case 'd':
                    e.preventDefault();
                    this.showPanel('dashboard');
                    break;
            }
        }

        // Escape key
        if (e.key === 'Escape') {
            this.closeModals();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update any size-dependent components
        this.emit('resize');
    }

    /**
     * Handle state changes
     * @param {object} event - State change event
     */
    handleStateChange(event) {
        if (event.path === 'ui.activePanel') {
            this.currentPanel = event.value;
        } else if (event.path === 'ui.preferences.theme') {
            this.applyTheme(event.value);
        }
    }

    /**
     * Show panel
     * @param {string} panelName - Panel name
     */
    showPanel(panelName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.panel === panelName);
        });

        // Update panels
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${panelName}Panel`);
        });

        // Update state
        StateManager.setState('ui.activePanel', panelName);
        this.currentPanel = panelName;

        // Emit panel change event
        this.emit('panelChanged', panelName);
    }

    /**
     * Apply theme
     * @param {string} theme - Theme name
     */
    applyTheme(theme) {
        document.body.className = document.body.className
            .replace(/theme-\w+/g, '')
            .trim();
        
        document.body.classList.add(`theme-${theme}`);
        
        // Update state if different
        if (StateManager.getState('ui.preferences.theme') !== theme) {
            StateManager.setState('ui.preferences.theme', theme);
        }
    }

    /**
     * Show notification
     * @param {object} notification - Notification data
     */
    showNotification(notification) {
        const container = document.querySelector('#notificationContainer');
        if (!container) return;

        const notificationEl = document.createElement('div');
        notificationEl.className = `notification ${notification.type || 'info'}`;
        
        notificationEl.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">${notification.title || 'Notification'}</div>
                <button class="notification-close">×</button>
            </div>
            <div class="notification-message">${notification.message || ''}</div>
        `;

        // Add to container
        container.appendChild(notificationEl);

        // Show animation
        setTimeout(() => {
            notificationEl.classList.add('show');
        }, 10);

        // Auto-hide after delay
        const hideDelay = notification.duration || 5000;
        setTimeout(() => {
            this.hideNotification(notificationEl);
        }, hideDelay);

        // Close button
        const closeBtn = notificationEl.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideNotification(notificationEl);
            });
        }
    }

    /**
     * Hide notification
     * @param {HTMLElement} notificationEl - Notification element
     */
    hideNotification(notificationEl) {
        notificationEl.classList.remove('show');
        setTimeout(() => {
            if (notificationEl.parentNode) {
                notificationEl.parentNode.removeChild(notificationEl);
            }
        }, 300);
    }

    /**
     * Show progress overlay
     * @param {object} data - Progress data
     */
    showProgress(data) {
        const overlay = document.querySelector('#progressOverlay');
        const title = document.querySelector('#progressTitle');
        const text = document.querySelector('#progressText');
        
        if (overlay) {
            overlay.classList.remove('hidden');
        }
        
        if (title) {
            title.textContent = data.title || 'Processing...';
        }
        
        if (text) {
            text.textContent = data.message || 'Please wait...';
        }
        
        this.updateProgress({ progress: 0 });
    }

    /**
     * Update progress
     * @param {object} data - Progress data
     */
    updateProgress(data) {
        const fill = document.querySelector('#progressFill');
        const text = document.querySelector('#progressText');
        const details = document.querySelector('#progressDetails');
        
        if (fill && typeof data.progress === 'number') {
            fill.style.width = `${Math.max(0, Math.min(100, data.progress))}%`;
        }
        
        if (text && data.message) {
            text.textContent = data.message;
        }
        
        if (details && data.details) {
            details.textContent = data.details;
        }
    }

    /**
     * Hide progress overlay
     */
    hideProgress() {
        const overlay = document.querySelector('#progressOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    /**
     * Show settings modal
     */
    showSettingsModal() {
        const modalHtml = `
            <div class="modal-container active" id="settingsModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Settings</h3>
                        <button class="btn-icon" id="closeSettings">
                            <svg class="icon"><use href="#icon-close"></use></svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Theme</label>
                            <select class="form-select" id="themeSelect">
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                                <option value="high-contrast">High Contrast</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-checkbox">
                                <input type="checkbox" id="aiEnabled">
                                Enable AI suggestions
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="form-checkbox">
                                <input type="checkbox" id="autoSave">
                                Auto-save project before organizing
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="form-checkbox">
                                <input type="checkbox" id="showTips">
                                Show helpful tips
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancelSettings">Cancel</button>
                        <button class="btn btn-primary" id="saveSettings">Save</button>
                    </div>
                </div>
            </div>
        `;

        // Add to modal container
        const container = document.querySelector('#modalContainer');
        if (container) {
            container.innerHTML = modalHtml;
            
            // Load current settings
            this.loadSettingsValues();
            
            // Bind events
            this.bindSettingsEvents();
        }
    }

    /**
     * Load current settings values
     */
    loadSettingsValues() {
        const preferences = StateManager.getState('ui.preferences') || {};
        
        const themeSelect = document.querySelector('#themeSelect');
        const aiEnabled = document.querySelector('#aiEnabled');
        const autoSave = document.querySelector('#autoSave');
        const showTips = document.querySelector('#showTips');
        
        if (themeSelect) {
            themeSelect.value = preferences.theme || 'dark';
        }
        
        if (aiEnabled) {
            aiEnabled.checked = preferences.aiEnabled !== false;
        }
        
        if (autoSave) {
            autoSave.checked = preferences.autoSave !== false;
        }
        
        if (showTips) {
            showTips.checked = preferences.showTips !== false;
        }
    }

    /**
     * Bind settings modal events
     */
    bindSettingsEvents() {
        const modal = document.querySelector('#settingsModal');
        const closeBtn = document.querySelector('#closeSettings');
        const cancelBtn = document.querySelector('#cancelSettings');
        const saveBtn = document.querySelector('#saveSettings');
        
        const closeModal = () => {
            if (modal) {
                modal.classList.remove('active');
                setTimeout(() => {
                    const container = document.querySelector('#modalContainer');
                    if (container) {
                        container.innerHTML = '';
                    }
                }, 300);
            }
        };
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeModal);
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings();
                closeModal();
            });
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
        }
    }

    /**
     * Save settings
     */
    saveSettings() {
        const themeSelect = document.querySelector('#themeSelect');
        const aiEnabled = document.querySelector('#aiEnabled');
        const autoSave = document.querySelector('#autoSave');
        const showTips = document.querySelector('#showTips');
        
        const preferences = {
            theme: themeSelect?.value || 'dark',
            aiEnabled: aiEnabled?.checked !== false,
            autoSave: autoSave?.checked !== false,
            showTips: showTips?.checked !== false
        };
        
        StateManager.setState('ui.preferences', preferences);
        
        // Apply theme immediately
        this.applyTheme(preferences.theme);
        
        // Update AI service
        AIService.setEnabled(preferences.aiEnabled);
        
        this.showNotification({
            type: 'success',
            title: 'Settings Saved',
            message: 'Your preferences have been saved'
        });
    }

    /**
     * Show help modal
     */
    showHelpModal() {
        const modalHtml = `
            <div class="modal-container active" id="helpModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Help & Shortcuts</h3>
                        <button class="btn-icon" id="closeHelp">
                            <svg class="icon"><use href="#icon-close"></use></svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <h4>Keyboard Shortcuts</h4>
                        <div class="shortcuts-list">
                            <div class="shortcut-item">
                                <kbd>Ctrl+Shift+D</kbd>
                                <span>Go to Dashboard</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>Ctrl+Shift+T</kbd>
                                <span>Go to Templates</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>Ctrl+Shift+O</kbd>
                                <span>Go to Organize</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>Ctrl+Shift+A</kbd>
                                <span>Go to Analytics</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>Esc</kbd>
                                <span>Close modals</span>
                            </div>
                        </div>
                        
                        <h4>Getting Started</h4>
                        <ol>
                            <li>Review your project health on the Dashboard</li>
                            <li>Use AI Analysis to get smart suggestions</li>
                            <li>Create custom templates for your workflow</li>
                            <li>Organize assets using templates or manual selection</li>
                            <li>Monitor your progress in Analytics</li>
                        </ol>
                        
                        <h4>Tips</h4>
                        <ul>
                            <li>Use consistent naming conventions for better organization</li>
                            <li>Create templates for different project types</li>
                            <li>Let AI analyze your project for smart suggestions</li>
                            <li>Regularly check your organization health score</li>
                        </ul>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" id="closeHelpBtn">Got it!</button>
                    </div>
                </div>
            </div>
        `;

        // Add to modal container
        const container = document.querySelector('#modalContainer');
        if (container) {
            container.innerHTML = modalHtml;
            
            // Bind close events
            const modal = document.querySelector('#helpModal');
            const closeBtn = document.querySelector('#closeHelp');
            const closeHelpBtn = document.querySelector('#closeHelpBtn');
            
            const closeModal = () => {
                if (modal) {
                    modal.classList.remove('active');
                    setTimeout(() => {
                        container.innerHTML = '';
                    }, 300);
                }
            };
            
            if (closeBtn) closeBtn.addEventListener('click', closeModal);
            if (closeHelpBtn) closeHelpBtn.addEventListener('click', closeModal);
            
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) closeModal();
                });
            }
        }
    }

    /**
     * Close all modals
     */
    closeModals() {
        const modals = document.querySelectorAll('.modal-container.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        
        setTimeout(() => {
            const container = document.querySelector('#modalContainer');
            if (container) {
                container.innerHTML = '';
            }
        }, 300);
    }

    /**
     * Update project info in header
     */
    updateProjectInfo() {
        const projectData = AEService.getProjectData();
        const projectNameEl = document.querySelector('#projectName');
        
        if (projectNameEl && projectData) {
            projectNameEl.textContent = projectData.name || 'Untitled Project';
        }
    }

    /**
     * Load application state
     */
    loadState() {
        // State is automatically loaded by StateManager
        const activePanel = StateManager.getState('ui.activePanel');
        if (activePanel) {
            this.showPanel(activePanel);
        }
    }

    /**
     * Save application state
     */
    saveState() {
        // State is automatically saved by StateManager
        StateManager.setState('ui.activePanel', this.currentPanel);
    }

    /**
     * Show critical error
     * @param {string} message - Error message
     */
    showCriticalError(message) {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #2D2D30; color: #E0E0E0; font-family: Arial, sans-serif;">
                <div style="text-align: center; padding: 2rem;">
                    <h1 style="color: #F44336; margin-bottom: 1rem;">⚠️ Critical Error</h1>
                    <p style="margin-bottom: 2rem;">${message}</p>
                    <button onclick="location.reload()" style="padding: 0.5rem 1rem; background: #2A5CAA; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Reload Application
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Destroy the application
     */
    destroy() {
        // Clean up components
        this.components.forEach(component => {
            if (component.destroy) {
                component.destroy();
            }
        });
        this.components.clear();
        
        // Remove event listeners
        this.removeAllListeners();
        
        // Save final state
        this.saveState();
    }
}

// Initialize application when DOM is ready
let app;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new DeclutterApp();
    });
} else {
    app = new DeclutterApp();
}

// Make app globally available
window.DeclutterApp = app;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeclutterApp;
}