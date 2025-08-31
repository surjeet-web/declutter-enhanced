/**
 * TemplateService - Manage folder structure templates
 */
class TemplateService extends EventEmitter {
    constructor() {
        super();
        this.templates = new Map();
        this.activeTemplate = null;
        this.builtInTemplates = new Map();
        
        this.init();
    }

    /**
     * Initialize the service
     */
    init() {
        this.loadBuiltInTemplates();
        this.loadUserTemplates();
    }

    /**
     * Load built-in templates
     */
    loadBuiltInTemplates() {
        // Documentary template
        this.builtInTemplates.set('documentary', {
            id: 'documentary',
            name: 'Documentary',
            description: 'Standard structure for documentary projects',
            category: 'built-in',
            version: '1.0',
            author: 'Declutter',
            folders: [
                {
                    name: 'Raw Footage',
                    color: 'blue',
                    parent: null,
                    filters: [
                        { type: 'type', operator: '=', value: 'footage' }
                    ]
                },
                {
                    name: 'Interviews',
                    color: 'red',
                    parent: 'Raw Footage',
                    filters: [
                        { type: 'name', operator: 'contains', value: 'interview' },
                        { type: 'tag', operator: 'contains', value: 'interview' }
                    ]
                },
                {
                    name: 'B-Roll',
                    color: 'blue',
                    parent: 'Raw Footage',
                    filters: [
                        { type: 'name', operator: 'contains', value: 'b-roll' },
                        { type: 'name', operator: 'contains', value: 'broll' },
                        { type: 'tag', operator: 'contains', value: 'b-roll' }
                    ]
                },
                {
                    name: 'Archival',
                    color: 'brown',
                    parent: 'Raw Footage',
                    filters: [
                        { type: 'name', operator: 'contains', value: 'archive' },
                        { type: 'name', operator: 'contains', value: 'historical' },
                        { type: 'tag', operator: 'contains', value: 'archival' }
                    ]
                },
                {
                    name: 'Audio',
                    color: 'green',
                    parent: null,
                    filters: [
                        { type: 'type', operator: '=', value: 'audio' }
                    ]
                },
                {
                    name: 'Music',
                    color: 'green',
                    parent: 'Audio',
                    filters: [
                        { type: 'name', operator: 'contains', value: 'music' },
                        { type: 'name', operator: 'contains', value: 'soundtrack' },
                        { type: 'tag', operator: 'contains', value: 'music' }
                    ]
                },
                {
                    name: 'SFX',
                    color: 'green',
                    parent: 'Audio',
                    filters: [
                        { type: 'name', operator: 'contains', value: 'sfx' },
                        { type: 'name', operator: 'contains', value: 'sound' },
                        { type: 'tag', operator: 'contains', value: 'sfx' }
                    ]
                }
            ],
            created: new Date('2024-01-01'),
            modified: new Date('2024-01-01')
        });

        // Corporate template
        this.builtInTemplates.set('corporate', {
            id: 'corporate',
            name: 'Corporate Video',
            description: 'Professional structure for corporate videos',
            category: 'built-in',
            version: '1.0',
            author: 'Declutter',
            folders: [
                {
                    name: 'Interviews',
                    color: 'red',
                    parent: null,
                    filters: [
                        { type: 'name', operator: 'contains', value: 'interview' },
                        { type: 'name', operator: 'contains', value: 'testimonial' },
                        { type: 'name', operator: 'contains', value: 'talking' }
                    ]
                },
                {
                    name: 'Product Shots',
                    color: 'yellow',
                    parent: null,
                    filters: [
                        { type: 'name', operator: 'contains', value: 'product' },
                        { type: 'name', operator: 'contains', value: 'demo' },
                        { type: 'tag', operator: 'contains', value: 'product' }
                    ]
                },
                {
                    name: 'Office B-Roll',
                    color: 'blue',
                    parent: null,
                    filters: [
                        { type: 'name', operator: 'contains', value: 'office' },
                        { type: 'name', operator: 'contains', value: 'workplace' },
                        { type: 'name', operator: 'contains', value: 'meeting' }
                    ]
                },
                {
                    name: 'Graphics',
                    color: 'orange',
                    parent: null,
                    filters: [
                        { type: 'type', operator: '=', value: 'image' },
                        { type: 'name', operator: 'contains', value: 'logo' },
                        { type: 'name', operator: 'contains', value: 'graphic' }
                    ]
                },
                {
                    name: 'Audio',
                    color: 'green',
                    parent: null,
                    filters: [
                        { type: 'type', operator: '=', value: 'audio' }
                    ]
                }
            ],
            created: new Date('2024-01-01'),
            modified: new Date('2024-01-01')
        });

        // Wedding template
        this.builtInTemplates.set('wedding', {
            id: 'wedding',
            name: 'Wedding',
            description: 'Romantic structure for wedding videos',
            category: 'built-in',
            version: '1.0',
            author: 'Declutter',
            folders: [
                {
                    name: 'Ceremony',
                    color: 'red',
                    parent: null,
                    filters: [
                        { type: 'name', operator: 'contains', value: 'ceremony' },
                        { type: 'name', operator: 'contains', value: 'vows' },
                        { type: 'name', operator: 'contains', value: 'altar' }
                    ]
                },
                {
                    name: 'Reception',
                    color: 'yellow',
                    parent: null,
                    filters: [
                        { type: 'name', operator: 'contains', value: 'reception' },
                        { type: 'name', operator: 'contains', value: 'party' },
                        { type: 'name', operator: 'contains', value: 'dance' }
                    ]
                },
                {
                    name: 'Portraits',
                    color: 'purple',
                    parent: null,
                    filters: [
                        { type: 'name', operator: 'contains', value: 'portrait' },
                        { type: 'name', operator: 'contains', value: 'couple' },
                        { type: 'name', operator: 'contains', value: 'family' }
                    ]
                },
                {
                    name: 'Details',
                    color: 'orange',
                    parent: null,
                    filters: [
                        { type: 'name', operator: 'contains', value: 'ring' },
                        { type: 'name', operator: 'contains', value: 'dress' },
                        { type: 'name', operator: 'contains', value: 'flowers' }
                    ]
                },
                {
                    name: 'Audio',
                    color: 'green',
                    parent: null,
                    filters: [
                        { type: 'type', operator: '=', value: 'audio' }
                    ]
                }
            ],
            created: new Date('2024-01-01'),
            modified: new Date('2024-01-01')
        });

        // Music video template
        this.builtInTemplates.set('music_video', {
            id: 'music_video',
            name: 'Music Video',
            description: 'Creative structure for music videos',
            category: 'built-in',
            version: '1.0',
            author: 'Declutter',
            folders: [
                {
                    name: 'Performance',
                    color: 'red',
                    parent: null,
                    filters: [
                        { type: 'name', operator: 'contains', value: 'performance' },
                        { type: 'name', operator: 'contains', value: 'band' },
                        { type: 'name', operator: 'contains', value: 'singing' }
                    ]
                },
                {
                    name: 'Narrative',
                    color: 'blue',
                    parent: null,
                    filters: [
                        { type: 'name', operator: 'contains', value: 'story' },
                        { type: 'name', operator: 'contains', value: 'narrative' },
                        { type: 'name', operator: 'contains', value: 'scene' }
                    ]
                },
                {
                    name: 'Abstract',
                    color: 'purple',
                    parent: null,
                    filters: [
                        { type: 'name', operator: 'contains', value: 'abstract' },
                        { type: 'name', operator: 'contains', value: 'artistic' },
                        { type: 'name', operator: 'contains', value: 'creative' }
                    ]
                },
                {
                    name: 'Audio',
                    color: 'green',
                    parent: null,
                    filters: [
                        { type: 'type', operator: '=', value: 'audio' }
                    ]
                }
            ],
            created: new Date('2024-01-01'),
            modified: new Date('2024-01-01')
        });
    }

    /**
     * Load user templates from storage
     */
    loadUserTemplates() {
        try {
            const saved = localStorage.getItem('declutter_templates');
            if (saved) {
                const templates = JSON.parse(saved);
                templates.forEach(template => {
                    this.templates.set(template.id, template);
                });
            }
        } catch (error) {
            console.warn('Failed to load user templates:', error);
        }
    }

    /**
     * Save user templates to storage
     */
    saveUserTemplates() {
        try {
            const templates = Array.from(this.templates.values())
                .filter(t => t.category !== 'built-in');
            localStorage.setItem('declutter_templates', JSON.stringify(templates));
        } catch (error) {
            console.warn('Failed to save user templates:', error);
        }
    }

    /**
     * Get all templates
     * @returns {array} Array of templates
     */
    getAllTemplates() {
        const allTemplates = [
            ...Array.from(this.builtInTemplates.values()),
            ...Array.from(this.templates.values())
        ];
        
        return allTemplates.sort((a, b) => {
            // Built-in templates first, then by name
            if (a.category === 'built-in' && b.category !== 'built-in') return -1;
            if (a.category !== 'built-in' && b.category === 'built-in') return 1;
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Get template by ID
     * @param {string} id - Template ID
     * @returns {object|null} Template or null
     */
    getTemplate(id) {
        return this.builtInTemplates.get(id) || this.templates.get(id) || null;
    }

    /**
     * Create new template
     * @param {object} templateData - Template data
     * @returns {object} Created template
     */
    createTemplate(templateData) {
        const template = {
            id: this.generateId(),
            name: templateData.name || 'Untitled Template',
            description: templateData.description || '',
            category: 'user',
            version: '1.0',
            author: 'User',
            folders: templateData.folders || [],
            created: new Date(),
            modified: new Date()
        };

        this.templates.set(template.id, template);
        this.saveUserTemplates();
        
        this.emit('templateCreated', template);
        return template;
    }

    /**
     * Update template
     * @param {string} id - Template ID
     * @param {object} updates - Updates to apply
     * @returns {object|null} Updated template or null
     */
    updateTemplate(id, updates) {
        const template = this.templates.get(id);
        if (!template || template.category === 'built-in') {
            return null;
        }

        const updatedTemplate = {
            ...template,
            ...updates,
            id: template.id, // Preserve ID
            category: template.category, // Preserve category
            created: template.created, // Preserve creation date
            modified: new Date()
        };

        this.templates.set(id, updatedTemplate);
        this.saveUserTemplates();
        
        this.emit('templateUpdated', updatedTemplate);
        return updatedTemplate;
    }

    /**
     * Delete template
     * @param {string} id - Template ID
     * @returns {boolean} Success
     */
    deleteTemplate(id) {
        const template = this.templates.get(id);
        if (!template || template.category === 'built-in') {
            return false;
        }

        this.templates.delete(id);
        this.saveUserTemplates();
        
        this.emit('templateDeleted', { id, template });
        return true;
    }

    /**
     * Duplicate template
     * @param {string} id - Template ID to duplicate
     * @param {string} newName - New template name
     * @returns {object|null} Duplicated template or null
     */
    duplicateTemplate(id, newName) {
        const original = this.getTemplate(id);
        if (!original) return null;

        const duplicate = {
            ...original,
            id: this.generateId(),
            name: newName || `${original.name} Copy`,
            category: 'user',
            author: 'User',
            created: new Date(),
            modified: new Date()
        };

        this.templates.set(duplicate.id, duplicate);
        this.saveUserTemplates();
        
        this.emit('templateCreated', duplicate);
        return duplicate;
    }

    /**
     * Export template
     * @param {string} id - Template ID
     * @returns {string|null} JSON string or null
     */
    exportTemplate(id) {
        const template = this.getTemplate(id);
        if (!template) return null;

        const exportData = {
            ...template,
            exportedAt: new Date(),
            exportedBy: 'Declutter Enhanced'
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import template
     * @param {string} jsonData - JSON template data
     * @returns {object|null} Imported template or null
     */
    importTemplate(jsonData) {
        try {
            const templateData = JSON.parse(jsonData);
            
            // Validate template structure
            if (!this.validateTemplate(templateData)) {
                throw new Error('Invalid template structure');
            }

            // Create new template with imported data
            const template = {
                id: this.generateId(),
                name: templateData.name || 'Imported Template',
                description: templateData.description || '',
                category: 'user',
                version: templateData.version || '1.0',
                author: templateData.author || 'Unknown',
                folders: templateData.folders || [],
                created: new Date(),
                modified: new Date(),
                imported: true,
                importedFrom: templateData.exportedBy || 'Unknown'
            };

            this.templates.set(template.id, template);
            this.saveUserTemplates();
            
            this.emit('templateImported', template);
            return template;
            
        } catch (error) {
            console.error('Failed to import template:', error);
            return null;
        }
    }

    /**
     * Validate template structure
     * @param {object} template - Template to validate
     * @returns {boolean} Is valid
     */
    validateTemplate(template) {
        if (!template || typeof template !== 'object') return false;
        if (!template.name || typeof template.name !== 'string') return false;
        if (!Array.isArray(template.folders)) return false;

        // Validate folders
        for (const folder of template.folders) {
            if (!folder.name || typeof folder.name !== 'string') return false;
            if (folder.filters && !Array.isArray(folder.filters)) return false;
        }

        return true;
    }

    /**
     * Set active template
     * @param {string} id - Template ID
     * @returns {boolean} Success
     */
    setActiveTemplate(id) {
        const template = this.getTemplate(id);
        if (!template) return false;

        this.activeTemplate = template;
        this.emit('activeTemplateChanged', template);
        
        // Save to state
        StateManager.setState('templates.active', id);
        
        return true;
    }

    /**
     * Get active template
     * @returns {object|null} Active template or null
     */
    getActiveTemplate() {
        return this.activeTemplate;
    }

    /**
     * Clear active template
     */
    clearActiveTemplate() {
        this.activeTemplate = null;
        this.emit('activeTemplateChanged', null);
        StateManager.setState('templates.active', null);
    }

    /**
     * Apply template to project
     * @param {string} id - Template ID
     * @param {object} options - Application options
     * @returns {Promise<object>} Application result
     */
    async applyTemplate(id, options = {}) {
        const template = this.getTemplate(id);
        if (!template) {
            throw new Error('Template not found');
        }

        try {
            // Use AE service to apply template
            const result = await AEService.applyTemplate(template, options.selectedAssets);
            
            // Record usage
            this.recordTemplateUsage(id);
            
            this.emit('templateApplied', { template, result, options });
            return result;
            
        } catch (error) {
            console.error('Failed to apply template:', error);
            throw error;
        }
    }

    /**
     * Record template usage for analytics
     * @param {string} id - Template ID
     */
    recordTemplateUsage(id) {
        const usage = StateManager.getState('analytics.templateUsage') || {};
        usage[id] = (usage[id] || 0) + 1;
        StateManager.setState('analytics.templateUsage', usage);
        
        // Also record in AI service for learning
        AIService.recordAction('templateApplied', { templateId: id });
    }

    /**
     * Get template usage statistics
     * @returns {object} Usage statistics
     */
    getUsageStatistics() {
        const usage = StateManager.getState('analytics.templateUsage') || {};
        const templates = this.getAllTemplates();
        
        return templates.map(template => ({
            id: template.id,
            name: template.name,
            category: template.category,
            usageCount: usage[template.id] || 0,
            lastUsed: null // TODO: Track last used date
        })).sort((a, b) => b.usageCount - a.usageCount);
    }

    /**
     * Search templates
     * @param {string} query - Search query
     * @param {object} filters - Search filters
     * @returns {array} Matching templates
     */
    searchTemplates(query = '', filters = {}) {
        let templates = this.getAllTemplates();
        
        // Text search
        if (query.trim()) {
            const searchTerm = query.toLowerCase();
            templates = templates.filter(template => 
                template.name.toLowerCase().includes(searchTerm) ||
                template.description.toLowerCase().includes(searchTerm) ||
                template.author.toLowerCase().includes(searchTerm)
            );
        }
        
        // Category filter
        if (filters.category) {
            templates = templates.filter(template => 
                template.category === filters.category
            );
        }
        
        // Author filter
        if (filters.author) {
            templates = templates.filter(template => 
                template.author === filters.author
            );
        }
        
        return templates;
    }

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return 'template_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get template categories
     * @returns {array} Array of categories
     */
    getCategories() {
        const categories = new Set();
        this.getAllTemplates().forEach(template => {
            categories.add(template.category);
        });
        return Array.from(categories);
    }

    /**
     * Get template authors
     * @returns {array} Array of authors
     */
    getAuthors() {
        const authors = new Set();
        this.getAllTemplates().forEach(template => {
            authors.add(template.author);
        });
        return Array.from(authors);
    }
}

// Create global template service instance
window.TemplateService = new TemplateService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateService;
}