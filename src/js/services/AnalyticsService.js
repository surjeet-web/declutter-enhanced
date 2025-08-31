/**
 * AnalyticsService - Track usage and performance metrics
 */
class AnalyticsService extends EventEmitter {
    constructor() {
        super();
        this.isEnabled = true;
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.metrics = this.loadMetrics();
        this.events = [];
        this.performanceData = new Map();
        
        this.init();
    }

    /**
     * Initialize the analytics service
     */
    init() {
        // Start session
        this.startSession();
        
        // Set up periodic data saving
        setInterval(() => {
            this.saveMetrics();
        }, 30000); // Save every 30 seconds
        
        // Set up performance monitoring
        this.initPerformanceMonitoring();
        
        // Listen for app events
        this.bindAppEvents();
    }

    /**
     * Start analytics session
     */
    startSession() {
        this.trackEvent('session_start', {
            sessionId: this.sessionId,
            timestamp: this.sessionStart,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
        });
        
        // Update session metrics
        this.metrics.sessions.total++;
        this.metrics.sessions.current = {
            id: this.sessionId,
            start: this.sessionStart,
            events: 0,
            actions: 0
        };
    }

    /**
     * End analytics session
     */
    endSession() {
        const sessionDuration = Date.now() - this.sessionStart;
        
        this.trackEvent('session_end', {
            sessionId: this.sessionId,
            duration: sessionDuration,
            events: this.metrics.sessions.current.events,
            actions: this.metrics.sessions.current.actions
        });
        
        // Update session metrics
        this.metrics.sessions.totalDuration += sessionDuration;
        this.metrics.sessions.averageDuration = 
            this.metrics.sessions.totalDuration / this.metrics.sessions.total;
        
        this.saveMetrics();
    }

    /**
     * Initialize performance monitoring
     */
    initPerformanceMonitoring() {
        // Monitor page load performance
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            
            this.trackPerformance('page_load', {
                loadTime: loadTime,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                domInteractive: timing.domInteractive - timing.navigationStart
            });
        }
        
        // Monitor memory usage (if available)
        if (window.performance && window.performance.memory) {
            setInterval(() => {
                this.trackPerformance('memory_usage', {
                    used: window.performance.memory.usedJSHeapSize,
                    total: window.performance.memory.totalJSHeapSize,
                    limit: window.performance.memory.jsHeapSizeLimit
                });
            }, 60000); // Every minute
        }
    }

    /**
     * Bind application events for tracking
     */
    bindAppEvents() {
        // Panel navigation
        EventBus.on('panelChanged', (panel) => {
            this.trackEvent('panel_view', { panel });
        });
        
        // Template usage
        TemplateService.on('templateApplied', (data) => {
            this.trackEvent('template_applied', {
                templateId: data.template.id,
                templateName: data.template.name,
                templateCategory: data.template.category,
                foldersCreated: data.result.foldersCreated,
                assetsMoved: data.result.assetsMoved
            });
        });
        
        // Folder operations
        AEService.on('folderCreated', (folder) => {
            this.trackEvent('folder_created', {
                folderName: folder.name,
                folderColor: folder.color,
                method: 'manual' // vs 'template' or 'ai'
            });
        });
        
        AEService.on('assetsMoved', (data) => {
            this.trackEvent('assets_moved', {
                assetCount: data.assetIds.length,
                targetFolder: data.folderId
            });
        });
        
        // AI interactions
        AIService.on('analysisCompleted', (analysis) => {
            this.trackEvent('ai_analysis', {
                projectType: analysis.projectType.type,
                confidence: analysis.projectType.confidence,
                suggestionsCount: analysis.suggestions.length
            });
        });
        
        // Error tracking
        window.addEventListener('error', (event) => {
            this.trackError('javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error ? event.error.stack : null
            });
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError('unhandled_promise_rejection', {
                reason: event.reason,
                stack: event.reason && event.reason.stack ? event.reason.stack : null
            });
        });
    }

    /**
     * Track an event
     * @param {string} eventName - Event name
     * @param {object} properties - Event properties
     */
    trackEvent(eventName, properties = {}) {
        if (!this.isEnabled) return;
        
        const event = {
            id: this.generateEventId(),
            name: eventName,
            properties: {
                ...properties,
                sessionId: this.sessionId,
                timestamp: Date.now(),
                url: window.location.href
            }
        };
        
        this.events.push(event);
        
        // Update metrics
        this.updateEventMetrics(eventName, properties);
        
        // Limit events array size
        if (this.events.length > 1000) {
            this.events = this.events.slice(-500);
        }
        
        this.emit('eventTracked', event);
    }

    /**
     * Track performance metric
     * @param {string} metricName - Metric name
     * @param {object} data - Performance data
     */
    trackPerformance(metricName, data) {
        if (!this.isEnabled) return;
        
        const metric = {
            name: metricName,
            data: data,
            timestamp: Date.now(),
            sessionId: this.sessionId
        };
        
        if (!this.performanceData.has(metricName)) {
            this.performanceData.set(metricName, []);
        }
        
        const metrics = this.performanceData.get(metricName);
        metrics.push(metric);
        
        // Limit metrics array size
        if (metrics.length > 100) {
            this.performanceData.set(metricName, metrics.slice(-50));
        }
        
        this.emit('performanceTracked', metric);
    }

    /**
     * Track an error
     * @param {string} errorType - Error type
     * @param {object} errorData - Error data
     */
    trackError(errorType, errorData) {
        if (!this.isEnabled) return;
        
        const error = {
            id: this.generateEventId(),
            type: errorType,
            data: errorData,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        // Store in metrics
        if (!this.metrics.errors) {
            this.metrics.errors = [];
        }
        
        this.metrics.errors.push(error);
        
        // Limit errors array size
        if (this.metrics.errors.length > 100) {
            this.metrics.errors = this.metrics.errors.slice(-50);
        }
        
        this.emit('errorTracked', error);
        
        // Also log to console for debugging
        console.error('Analytics tracked error:', error);
    }

    /**
     * Update event metrics
     * @param {string} eventName - Event name
     * @param {object} properties - Event properties
     */
    updateEventMetrics(eventName, properties) {
        // Update event counts
        if (!this.metrics.events[eventName]) {
            this.metrics.events[eventName] = 0;
        }
        this.metrics.events[eventName]++;
        
        // Update session event count
        if (this.metrics.sessions.current) {
            this.metrics.sessions.current.events++;
        }
        
        // Update specific metrics based on event type
        switch (eventName) {
            case 'panel_view':
                if (!this.metrics.panels[properties.panel]) {
                    this.metrics.panels[properties.panel] = 0;
                }
                this.metrics.panels[properties.panel]++;
                break;
                
            case 'template_applied':
                if (!this.metrics.templates[properties.templateId]) {
                    this.metrics.templates[properties.templateId] = {
                        name: properties.templateName,
                        category: properties.templateCategory,
                        usageCount: 0,
                        totalFoldersCreated: 0,
                        totalAssetsMoved: 0
                    };
                }
                const templateMetric = this.metrics.templates[properties.templateId];
                templateMetric.usageCount++;
                templateMetric.totalFoldersCreated += properties.foldersCreated || 0;
                templateMetric.totalAssetsMoved += properties.assetsMoved || 0;
                break;
                
            case 'folder_created':
                this.metrics.folders.totalCreated++;
                if (!this.metrics.folders.byColor[properties.folderColor]) {
                    this.metrics.folders.byColor[properties.folderColor] = 0;
                }
                this.metrics.folders.byColor[properties.folderColor]++;
                break;
                
            case 'assets_moved':
                this.metrics.assets.totalMoved += properties.assetCount || 0;
                break;
        }
    }

    /**
     * Get analytics dashboard data
     * @returns {object} Dashboard data
     */
    getDashboardData() {
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        const weekMs = 7 * dayMs;
        const monthMs = 30 * dayMs;
        
        // Filter recent events
        const todayEvents = this.events.filter(e => now - e.properties.timestamp < dayMs);
        const weekEvents = this.events.filter(e => now - e.properties.timestamp < weekMs);
        const monthEvents = this.events.filter(e => now - e.properties.timestamp < monthMs);
        
        return {
            overview: {
                totalSessions: this.metrics.sessions.total,
                averageSessionDuration: Math.round(this.metrics.sessions.averageDuration / 1000), // in seconds
                totalEvents: Object.values(this.metrics.events).reduce((sum, count) => sum + count, 0),
                totalErrors: this.metrics.errors ? this.metrics.errors.length : 0
            },
            activity: {
                today: todayEvents.length,
                thisWeek: weekEvents.length,
                thisMonth: monthEvents.length
            },
            panels: {
                mostUsed: this.getMostUsedPanels(),
                usage: this.metrics.panels
            },
            templates: {
                mostUsed: this.getMostUsedTemplates(),
                totalApplications: Object.values(this.metrics.templates)
                    .reduce((sum, t) => sum + t.usageCount, 0)
            },
            folders: {
                totalCreated: this.metrics.folders.totalCreated,
                colorDistribution: this.metrics.folders.byColor,
                averagePerSession: this.metrics.sessions.total > 0 
                    ? this.metrics.folders.totalCreated / this.metrics.sessions.total 
                    : 0
            },
            assets: {
                totalMoved: this.metrics.assets.totalMoved,
                averagePerSession: this.metrics.sessions.total > 0 
                    ? this.metrics.assets.totalMoved / this.metrics.sessions.total 
                    : 0
            },
            performance: this.getPerformanceMetrics(),
            errors: this.getRecentErrors()
        };
    }

    /**
     * Get most used panels
     * @returns {array} Sorted panel usage
     */
    getMostUsedPanels() {
        return Object.entries(this.metrics.panels)
            .map(([panel, count]) => ({ panel, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }

    /**
     * Get most used templates
     * @returns {array} Sorted template usage
     */
    getMostUsedTemplates() {
        return Object.entries(this.metrics.templates)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 10);
    }

    /**
     * Get performance metrics summary
     * @returns {object} Performance summary
     */
    getPerformanceMetrics() {
        const summary = {};
        
        this.performanceData.forEach((metrics, name) => {
            if (metrics.length === 0) return;
            
            const values = metrics.map(m => {
                if (name === 'memory_usage') {
                    return m.data.used;
                } else if (name === 'page_load') {
                    return m.data.loadTime;
                } else {
                    return Object.values(m.data)[0] || 0;
                }
            });
            
            summary[name] = {
                count: values.length,
                average: values.reduce((sum, val) => sum + val, 0) / values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                latest: values[values.length - 1]
            };
        });
        
        return summary;
    }

    /**
     * Get recent errors
     * @returns {array} Recent errors
     */
    getRecentErrors() {
        if (!this.metrics.errors) return [];
        
        return this.metrics.errors
            .slice(-10) // Last 10 errors
            .reverse(); // Most recent first
    }

    /**
     * Get usage trends
     * @param {number} days - Number of days to analyze
     * @returns {object} Usage trends
     */
    getUsageTrends(days = 30) {
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        const startTime = now - (days * dayMs);
        
        const recentEvents = this.events.filter(e => 
            e.properties.timestamp >= startTime
        );
        
        // Group events by day
        const dailyData = {};
        for (let i = 0; i < days; i++) {
            const date = new Date(now - (i * dayMs));
            const dateKey = date.toISOString().split('T')[0];
            dailyData[dateKey] = {
                date: dateKey,
                events: 0,
                sessions: new Set(),
                templates: 0,
                folders: 0,
                assets: 0
            };
        }
        
        recentEvents.forEach(event => {
            const date = new Date(event.properties.timestamp);
            const dateKey = date.toISOString().split('T')[0];
            
            if (dailyData[dateKey]) {
                dailyData[dateKey].events++;
                dailyData[dateKey].sessions.add(event.properties.sessionId);
                
                if (event.name === 'template_applied') {
                    dailyData[dateKey].templates++;
                } else if (event.name === 'folder_created') {
                    dailyData[dateKey].folders++;
                } else if (event.name === 'assets_moved') {
                    dailyData[dateKey].assets += event.properties.assetCount || 0;
                }
            }
        });
        
        // Convert sessions Set to count
        Object.values(dailyData).forEach(day => {
            day.sessions = day.sessions.size;
        });
        
        return Object.values(dailyData).reverse(); // Chronological order
    }

    /**
     * Export analytics data
     * @param {object} options - Export options
     * @returns {string} JSON data
     */
    exportData(options = {}) {
        const exportData = {
            metadata: {
                exportedAt: new Date().toISOString(),
                version: '1.0',
                sessionId: this.sessionId
            },
            metrics: this.metrics,
            events: options.includeEvents ? this.events : [],
            performance: options.includePerformance ? 
                Object.fromEntries(this.performanceData) : {},
            dashboard: this.getDashboardData()
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Clear analytics data
     * @param {object} options - Clear options
     */
    clearData(options = {}) {
        if (options.events !== false) {
            this.events = [];
        }
        
        if (options.metrics !== false) {
            this.metrics = this.getInitialMetrics();
        }
        
        if (options.performance !== false) {
            this.performanceData.clear();
        }
        
        this.saveMetrics();
        this.emit('dataCleared', options);
    }

    /**
     * Load metrics from storage
     * @returns {object} Metrics data
     */
    loadMetrics() {
        try {
            const saved = localStorage.getItem('declutter_analytics');
            if (saved) {
                return { ...this.getInitialMetrics(), ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Failed to load analytics metrics:', error);
        }
        
        return this.getInitialMetrics();
    }

    /**
     * Save metrics to storage
     */
    saveMetrics() {
        try {
            localStorage.setItem('declutter_analytics', JSON.stringify(this.metrics));
        } catch (error) {
            console.warn('Failed to save analytics metrics:', error);
        }
    }

    /**
     * Get initial metrics structure
     * @returns {object} Initial metrics
     */
    getInitialMetrics() {
        return {
            sessions: {
                total: 0,
                totalDuration: 0,
                averageDuration: 0,
                current: null
            },
            events: {},
            panels: {},
            templates: {},
            folders: {
                totalCreated: 0,
                byColor: {}
            },
            assets: {
                totalMoved: 0
            },
            errors: []
        };
    }

    /**
     * Generate session ID
     * @returns {string} Session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate event ID
     * @returns {string} Event ID
     */
    generateEventId() {
        return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Enable or disable analytics
     * @param {boolean} enabled - Whether analytics is enabled
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        this.emit('enabledChanged', enabled);
        
        if (enabled) {
            this.trackEvent('analytics_enabled');
        } else {
            this.trackEvent('analytics_disabled');
        }
    }

    /**
     * Check if analytics is enabled
     * @returns {boolean} Is enabled
     */
    getEnabled() {
        return this.isEnabled;
    }
}

// Create global analytics service instance
window.AnalyticsService = new AnalyticsService();

// End session on page unload
window.addEventListener('beforeunload', () => {
    if (window.AnalyticsService) {
        window.AnalyticsService.endSession();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsService;
}