/**
 * Dashboard Component - Main overview panel
 */
class Dashboard extends EventEmitter {
    constructor(container) {
        super();
        this.container = container;
        this.projectData = null;
        this.healthMetrics = null;
        this.activityFeed = [];
        
        this.init();
    }

    /**
     * Initialize the dashboard
     */
    init() {
        this.render();
        this.bindEvents();
        this.loadData();
        
        // Subscribe to state changes
        StateManager.subscribe('project', () => {
            this.loadData();
        });

        // Subscribe to AE service events
        AEService.on('projectDataUpdated', (data) => {
            this.projectData = data;
            this.updateProjectOverview();
        });

        AEService.on('assetAdded', (asset) => {
            this.addActivity('Asset Added', `Added ${asset.name}`, 'add');
        });

        AEService.on('folderCreated', (folder) => {
            this.addActivity('Folder Created', `Created "${folder.name}" folder`, 'folder');
        });
    }

    /**
     * Render the dashboard HTML
     */
    render() {
        this.container.innerHTML = `
            <div class="dashboard-content">
                <!-- Project Overview -->
                <div class="project-overview">
                    <div class="health-score">
                        <div class="health-indicator" id="healthIndicator">
                            <span id="healthScore">--</span>
                        </div>
                        <div class="health-info">
                            <h2 id="projectTitle">Loading Project...</h2>
                            <p id="healthDescription">Analyzing project structure...</p>
                        </div>
                    </div>
                    <div class="project-stats" id="projectStats">
                        <!-- Stats will be populated dynamically -->
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="quick-actions">
                    <div class="action-card" data-action="newTemplate">
                        <span class="action-icon">📁</span>
                        <div class="action-title">New Structure</div>
                        <div class="action-description">Create a custom folder structure</div>
                    </div>
                    <div class="action-card" data-action="organize">
                        <span class="action-icon">🧹</span>
                        <div class="action-title">Quick Organize</div>
                        <div class="action-description">Organize unstructured assets</div>
                    </div>
                    <div class="action-card" data-action="analyze">
                        <span class="action-icon">📊</span>
                        <div class="action-title">AI Analysis</div>
                        <div class="action-description">Get smart organization suggestions</div>
                    </div>
                    <div class="action-card" data-action="templates">
                        <span class="action-icon">📋</span>
                        <div class="action-title">Templates</div>
                        <div class="action-description">Browse template library</div>
                    </div>
                </div>

                <!-- Activity Feed -->
                <div class="activity-feed">
                    <div class="card-header">
                        <h3 class="card-title">Recent Activity</h3>
                        <button class="btn-icon" id="clearActivity" title="Clear Activity">
                            <svg class="icon"><use href="#icon-delete"></use></svg>
                        </button>
                    </div>
                    <div class="activity-list" id="activityList">
                        <div class="activity-item">
                            <div class="activity-icon">ℹ️</div>
                            <div class="activity-content">
                                <div class="activity-text">Welcome to Declutter!</div>
                                <div class="activity-time">Just now</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- AI Suggestions Modal -->
            <div id="aiSuggestionsModal" class="modal-container">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">🤖 AI Suggestions</h3>
                        <button class="btn-icon" id="closeSuggestions">
                            <svg class="icon"><use href="#icon-close"></use></svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="suggestionsContent">
                            <div class="text-center">
                                <div class="loader"></div>
                                <p>Analyzing your project...</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="dismissSuggestions">Dismiss</button>
                        <button class="btn btn-success" id="applySuggestions">Apply Selected</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Quick action cards
        this.container.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Clear activity button
        const clearBtn = this.container.querySelector('#clearActivity');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearActivity();
            });
        }

        // AI suggestions modal
        const modal = this.container.querySelector('#aiSuggestionsModal');
        const closeBtn = this.container.querySelector('#closeSuggestions');
        const dismissBtn = this.container.querySelector('#dismissSuggestions');
        const applyBtn = this.container.querySelector('#applySuggestions');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeSuggestionsModal();
            });
        }

        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                this.closeSuggestionsModal();
            });
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applySuggestions();
            });
        }

        // Close modal on backdrop click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeSuggestionsModal();
                }
            });
        }
    }

    /**
     * Load dashboard data
     */
    async loadData() {
        try {
            // Get project data from AE service
            this.projectData = AEService.getProjectData();
            
            if (this.projectData) {
                // Calculate health metrics
                this.healthMetrics = AEService.calculateProjectHealth();
                
                // Update UI
                this.updateProjectOverview();
                this.updateProjectStats();
                
                // Load activity from state
                this.activityFeed = StateManager.getState('ui.activityFeed') || [];
                this.updateActivityFeed();
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showError('Failed to load project data');
        }
    }

    /**
     * Update project overview section
     */
    updateProjectOverview() {
        if (!this.projectData || !this.healthMetrics) return;

        const titleEl = this.container.querySelector('#projectTitle');
        const scoreEl = this.container.querySelector('#healthScore');
        const indicatorEl = this.container.querySelector('#healthIndicator');
        const descriptionEl = this.container.querySelector('#healthDescription');

        if (titleEl) {
            titleEl.textContent = this.projectData.name || 'Untitled Project';
        }

        if (scoreEl && indicatorEl) {
            const score = this.healthMetrics.overallScore;
            scoreEl.textContent = score;
            
            // Update indicator color based on score
            indicatorEl.className = 'health-indicator';
            if (score >= 80) {
                indicatorEl.classList.add('excellent');
            } else if (score >= 60) {
                indicatorEl.classList.add('good');
            } else {
                indicatorEl.classList.add('poor');
            }
        }

        if (descriptionEl) {
            const score = this.healthMetrics.overallScore;
            let description = '';
            
            if (score >= 80) {
                description = 'Excellent organization! Your project is well-structured.';
            } else if (score >= 60) {
                description = 'Good organization with room for improvement.';
            } else {
                description = 'Your project needs better organization.';
            }
            
            descriptionEl.textContent = description;
        }
    }

    /**
     * Update project statistics
     */
    updateProjectStats() {
        if (!this.healthMetrics) return;

        const statsContainer = this.container.querySelector('#projectStats');
        if (!statsContainer) return;

        const stats = [
            {
                label: 'Assets',
                value: this.healthMetrics.totalAssets,
                icon: '📄'
            },
            {
                label: 'Folders',
                value: this.healthMetrics.totalFolders,
                icon: '📁'
            },
            {
                label: 'Unorganized',
                value: this.healthMetrics.unorganizedAssets,
                icon: '❓'
            },
            {
                label: 'Organization',
                value: `${Math.round(this.healthMetrics.organizationRate)}%`,
                icon: '📊'
            }
        ];

        statsContainer.innerHTML = stats.map(stat => `
            <div class="stat-item">
                <div class="stat-icon">${stat.icon}</div>
                <span class="stat-value">${stat.value}</span>
                <span class="stat-label">${stat.label}</span>
            </div>
        `).join('');
    }

    /**
     * Handle quick action clicks
     * @param {string} action - Action type
     */
    handleQuickAction(action) {
        switch (action) {
            case 'newTemplate':
                this.emit('navigateToPanel', 'templates');
                EventBus.emit('createNewTemplate');
                break;
                
            case 'organize':
                this.emit('navigateToPanel', 'organize');
                break;
                
            case 'analyze':
                this.showAISuggestions();
                break;
                
            case 'templates':
                this.emit('navigateToPanel', 'templates');
                break;
                
            default:
                console.warn('Unknown quick action:', action);
        }
    }

    /**
     * Show AI suggestions modal
     */
    async showAISuggestions() {
        const modal = this.container.querySelector('#aiSuggestionsModal');
        const content = this.container.querySelector('#suggestionsContent');
        
        if (!modal || !content) return;

        // Show modal
        modal.classList.add('active');
        
        // Show loading state
        content.innerHTML = `
            <div class="text-center">
                <div class="loader"></div>
                <p>Analyzing your project...</p>
            </div>
        `;

        try {
            // Get AI analysis
            const assets = AEService.getAssets();
            const folders = AEService.getFolders();
            const analysis = AIService.analyzeProject(assets, folders);
            
            // Display suggestions
            this.renderSuggestions(analysis);
            
        } catch (error) {
            console.error('Failed to get AI suggestions:', error);
            content.innerHTML = `
                <div class="text-center text-danger">
                    <p>Failed to analyze project. Please try again.</p>
                </div>
            `;
        }
    }

    /**
     * Render AI suggestions in modal
     * @param {object} analysis - AI analysis result
     */
    renderSuggestions(analysis) {
        const content = this.container.querySelector('#suggestionsContent');
        if (!content) return;

        if (analysis.suggestions.length === 0) {
            content.innerHTML = `
                <div class="text-center">
                    <p>🎉 Your project looks well organized!</p>
                    <p>No suggestions at this time.</p>
                </div>
            `;
            return;
        }

        const suggestionsHtml = analysis.suggestions.map((suggestion, index) => {
            let suggestionContent = '';
            
            if (suggestion.type === 'createFolder') {
                suggestionContent = `
                    <div class="suggestion-item" data-index="${index}">
                        <div class="suggestion-header">
                            <label class="form-checkbox">
                                <input type="checkbox" checked>
                                <span class="suggestion-title">📁 Create "${suggestion.name}" folder</span>
                            </label>
                            <span class="confidence-badge">${Math.round(suggestion.confidence * 100)}%</span>
                        </div>
                        <div class="suggestion-body">
                            <p>${suggestion.reason}</p>
                            <div class="suggestion-details">
                                <small>Will organize ${suggestion.matchingAssets.length} assets</small>
                            </div>
                        </div>
                    </div>
                `;
            } else if (suggestion.type === 'namingImprovement') {
                suggestionContent = `
                    <div class="suggestion-item" data-index="${index}">
                        <div class="suggestion-header">
                            <label class="form-checkbox">
                                <input type="checkbox" checked>
                                <span class="suggestion-title">✏️ ${suggestion.title}</span>
                            </label>
                            <span class="confidence-badge">${Math.round(suggestion.confidence * 100)}%</span>
                        </div>
                        <div class="suggestion-body">
                            <p>${suggestion.reason}</p>
                            <ul class="suggestion-actions">
                                ${suggestion.actions.map(action => `<li>${action}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `;
            }
            
            return suggestionContent;
        }).join('');

        content.innerHTML = `
            <div class="suggestions-header">
                <h4>Project Analysis Results</h4>
                <p>Detected project type: <strong>${analysis.projectType.type}</strong> 
                   (${Math.round(analysis.projectType.confidence * 100)}% confidence)</p>
            </div>
            <div class="suggestions-list">
                ${suggestionsHtml}
            </div>
        `;

        // Store suggestions for later use
        this.currentSuggestions = analysis.suggestions;
    }

    /**
     * Apply selected suggestions
     */
    async applySuggestions() {
        const checkboxes = this.container.querySelectorAll('#suggestionsContent input[type="checkbox"]:checked');
        const selectedIndices = Array.from(checkboxes).map(cb => 
            parseInt(cb.closest('.suggestion-item').dataset.index)
        );

        if (selectedIndices.length === 0) {
            this.closeSuggestionsModal();
            return;
        }

        try {
            // Show progress
            const content = this.container.querySelector('#suggestionsContent');
            content.innerHTML = `
                <div class="text-center">
                    <div class="loader"></div>
                    <p>Applying suggestions...</p>
                </div>
            `;

            // Apply each selected suggestion
            for (const index of selectedIndices) {
                const suggestion = this.currentSuggestions[index];
                
                if (suggestion.type === 'createFolder') {
                    await AEService.createFolder(
                        suggestion.name,
                        suggestion.color || 'blue'
                    );
                    
                    // Move matching assets if any
                    if (suggestion.matchingAssets && suggestion.matchingAssets.length > 0) {
                        // Get the created folder (it should be the last one)
                        const folders = AEService.getFolders();
                        const createdFolder = folders[folders.length - 1];
                        
                        if (createdFolder) {
                            await AEService.moveAssetsToFolder(
                                suggestion.matchingAssets,
                                createdFolder.id
                            );
                        }
                    }
                    
                    this.addActivity(
                        'AI Suggestion Applied',
                        `Created "${suggestion.name}" folder`,
                        'ai'
                    );
                }
            }

            // Close modal and refresh data
            this.closeSuggestionsModal();
            await this.loadData();
            
            // Show success notification
            EventBus.emit('showNotification', {
                type: 'success',
                title: 'Suggestions Applied',
                message: `Successfully applied ${selectedIndices.length} suggestions`
            });
            
        } catch (error) {
            console.error('Failed to apply suggestions:', error);
            EventBus.emit('showNotification', {
                type: 'error',
                title: 'Error',
                message: 'Failed to apply some suggestions'
            });
        }
    }

    /**
     * Close AI suggestions modal
     */
    closeSuggestionsModal() {
        const modal = this.container.querySelector('#aiSuggestionsModal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.currentSuggestions = null;
    }

    /**
     * Add activity to feed
     * @param {string} title - Activity title
     * @param {string} description - Activity description
     * @param {string} type - Activity type
     */
    addActivity(title, description, type = 'info') {
        const activity = {
            id: Date.now(),
            title,
            description,
            type,
            timestamp: new Date()
        };

        this.activityFeed.unshift(activity);
        
        // Limit activity feed size
        if (this.activityFeed.length > 50) {
            this.activityFeed = this.activityFeed.slice(0, 50);
        }

        // Save to state
        StateManager.setState('ui.activityFeed', this.activityFeed);
        
        // Update UI
        this.updateActivityFeed();
    }

    /**
     * Update activity feed display
     */
    updateActivityFeed() {
        const listContainer = this.container.querySelector('#activityList');
        if (!listContainer) return;

        if (this.activityFeed.length === 0) {
            listContainer.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">ℹ️</div>
                    <div class="activity-content">
                        <div class="activity-text">No recent activity</div>
                        <div class="activity-time">Start organizing to see activity here</div>
                    </div>
                </div>
            `;
            return;
        }

        const activitiesHtml = this.activityFeed.slice(0, 10).map(activity => {
            const icon = this.getActivityIcon(activity.type);
            const timeAgo = this.formatTimeAgo(activity.timestamp);
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">${icon}</div>
                    <div class="activity-content">
                        <div class="activity-text">${activity.description}</div>
                        <div class="activity-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');

        listContainer.innerHTML = activitiesHtml;
    }

    /**
     * Get icon for activity type
     * @param {string} type - Activity type
     * @returns {string} Icon emoji
     */
    getActivityIcon(type) {
        const icons = {
            'add': '➕',
            'folder': '📁',
            'organize': '🧹',
            'ai': '🤖',
            'template': '📋',
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        
        return icons[type] || icons.info;
    }

    /**
     * Format timestamp as time ago
     * @param {Date} timestamp - Timestamp
     * @returns {string} Formatted time
     */
    formatTimeAgo(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    }

    /**
     * Clear activity feed
     */
    clearActivity() {
        this.activityFeed = [];
        StateManager.setState('ui.activityFeed', []);
        this.updateActivityFeed();
        
        this.addActivity('Activity Cleared', 'Activity feed has been cleared', 'info');
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        EventBus.emit('showNotification', {
            type: 'error',
            title: 'Error',
            message: message
        });
    }

    /**
     * Destroy the dashboard
     */
    destroy() {
        this.removeAllListeners();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
}