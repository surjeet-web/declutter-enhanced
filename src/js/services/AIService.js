/**
 * AIService - AI-powered features for smart organization and suggestions
 */
class AIService extends EventEmitter {
    constructor() {
        super();
        this.isEnabled = true;
        this.learningData = this.loadLearningData();
        this.patterns = new Map();
        this.suggestions = [];
        
        this.init();
    }

    /**
     * Initialize the AI service
     */
    init() {
        // Load pre-trained patterns
        this.loadPatterns();
        
        // Set up periodic learning updates
        setInterval(() => {
            this.updateLearning();
        }, 30000); // Update every 30 seconds
    }

    /**
     * Load learning data from storage
     * @returns {object} Learning data
     */
    loadLearningData() {
        try {
            const data = localStorage.getItem('declutter_ai_learning');
            return data ? JSON.parse(data) : {
                userActions: [],
                folderPatterns: {},
                namingPatterns: {},
                organizationHistory: []
            };
        } catch (error) {
            console.warn('Failed to load AI learning data:', error);
            return {
                userActions: [],
                folderPatterns: {},
                namingPatterns: {},
                organizationHistory: []
            };
        }
    }

    /**
     * Save learning data to storage
     */
    saveLearningData() {
        try {
            localStorage.setItem('declutter_ai_learning', JSON.stringify(this.learningData));
        } catch (error) {
            console.warn('Failed to save AI learning data:', error);
        }
    }

    /**
     * Load pre-trained patterns for common project types
     */
    loadPatterns() {
        // Documentary patterns
        this.patterns.set('documentary', {
            folders: [
                { name: 'Interviews', keywords: ['interview', 'subject', 'talking', 'head'] },
                { name: 'B-Roll', keywords: ['b-roll', 'broll', 'cutaway', 'establishing'] },
                { name: 'Archival', keywords: ['archive', 'historical', 'old', 'vintage'] },
                { name: 'Music', keywords: ['music', 'soundtrack', 'score', 'audio'] },
                { name: 'Graphics', keywords: ['title', 'graphic', 'logo', 'text'] }
            ],
            confidence: 0.9
        });

        // Corporate video patterns
        this.patterns.set('corporate', {
            folders: [
                { name: 'Talking Heads', keywords: ['ceo', 'executive', 'interview', 'testimonial'] },
                { name: 'Product Shots', keywords: ['product', 'demo', 'showcase'] },
                { name: 'Office B-Roll', keywords: ['office', 'workplace', 'meeting', 'team'] },
                { name: 'Branding', keywords: ['logo', 'brand', 'identity', 'corporate'] },
                { name: 'Music & SFX', keywords: ['music', 'sound', 'audio', 'sfx'] }
            ],
            confidence: 0.85
        });

        // Wedding patterns
        this.patterns.set('wedding', {
            folders: [
                { name: 'Ceremony', keywords: ['ceremony', 'vows', 'altar', 'church'] },
                { name: 'Reception', keywords: ['reception', 'party', 'dance', 'dinner'] },
                { name: 'Portraits', keywords: ['portrait', 'couple', 'family', 'group'] },
                { name: 'Details', keywords: ['ring', 'dress', 'flowers', 'decoration'] },
                { name: 'Music', keywords: ['music', 'song', 'audio', 'soundtrack'] }
            ],
            confidence: 0.8
        });

        // Music video patterns
        this.patterns.set('music_video', {
            folders: [
                { name: 'Performance', keywords: ['performance', 'band', 'singing', 'playing'] },
                { name: 'Narrative', keywords: ['story', 'narrative', 'acting', 'scene'] },
                { name: 'Abstract', keywords: ['abstract', 'artistic', 'creative', 'experimental'] },
                { name: 'Audio', keywords: ['track', 'music', 'audio', 'song'] },
                { name: 'Effects', keywords: ['effect', 'vfx', 'motion', 'graphics'] }
            ],
            confidence: 0.75
        });
    }

    /**
     * Analyze project and suggest organization structure
     * @param {array} assets - Project assets
     * @param {array} existingFolders - Existing folders
     * @returns {object} Analysis and suggestions
     */
    analyzeProject(assets, existingFolders = []) {
        const analysis = {
            projectType: this.detectProjectType(assets),
            assetBreakdown: this.analyzeAssetTypes(assets),
            namingPatterns: this.analyzeNamingPatterns(assets),
            suggestions: [],
            confidence: 0
        };

        // Generate folder suggestions based on detected project type
        if (analysis.projectType.type !== 'unknown') {
            const pattern = this.patterns.get(analysis.projectType.type);
            analysis.suggestions = this.generateFolderSuggestions(assets, pattern, existingFolders);
            analysis.confidence = analysis.projectType.confidence;
        } else {
            // Generate generic suggestions based on asset analysis
            analysis.suggestions = this.generateGenericSuggestions(assets, existingFolders);
            analysis.confidence = 0.6;
        }

        // Add naming improvement suggestions
        analysis.suggestions.push(...this.generateNamingSuggestions(assets));

        // Learn from this analysis
        this.recordAnalysis(analysis);

        return analysis;
    }

    /**
     * Detect project type based on asset names and types
     * @param {array} assets - Project assets
     * @returns {object} Project type detection result
     */
    detectProjectType(assets) {
        const scores = new Map();
        
        // Initialize scores for each pattern
        this.patterns.forEach((pattern, type) => {
            scores.set(type, 0);
        });

        // Analyze each asset
        assets.forEach(asset => {
            const assetName = asset.name.toLowerCase();
            const assetTags = (asset.tags || []).map(tag => tag.toLowerCase());
            
            this.patterns.forEach((pattern, type) => {
                let score = 0;
                
                pattern.folders.forEach(folder => {
                    folder.keywords.forEach(keyword => {
                        if (assetName.includes(keyword)) {
                            score += 2; // Name match is worth more
                        }
                        if (assetTags.includes(keyword)) {
                            score += 1; // Tag match
                        }
                    });
                });
                
                scores.set(type, scores.get(type) + score);
            });
        });

        // Find the highest scoring pattern
        let bestType = 'unknown';
        let bestScore = 0;
        let totalAssets = assets.length;

        scores.forEach((score, type) => {
            if (score > bestScore) {
                bestScore = score;
                bestType = type;
            }
        });

        // Calculate confidence based on score relative to asset count
        const confidence = totalAssets > 0 ? Math.min(bestScore / (totalAssets * 2), 1) : 0;

        return {
            type: confidence > 0.3 ? bestType : 'unknown',
            confidence: confidence,
            scores: Object.fromEntries(scores)
        };
    }

    /**
     * Analyze asset types distribution
     * @param {array} assets - Project assets
     * @returns {object} Asset type breakdown
     */
    analyzeAssetTypes(assets) {
        const breakdown = {
            footage: 0,
            audio: 0,
            image: 0,
            composition: 0,
            other: 0
        };

        assets.forEach(asset => {
            if (breakdown.hasOwnProperty(asset.type)) {
                breakdown[asset.type]++;
            } else {
                breakdown.other++;
            }
        });

        const total = assets.length;
        const percentages = {};
        
        Object.keys(breakdown).forEach(type => {
            percentages[type] = total > 0 ? (breakdown[type] / total) * 100 : 0;
        });

        return {
            counts: breakdown,
            percentages: percentages,
            total: total
        };
    }

    /**
     * Analyze naming patterns in assets
     * @param {array} assets - Project assets
     * @returns {object} Naming pattern analysis
     */
    analyzeNamingPatterns(assets) {
        const patterns = {
            hasNumbers: 0,
            hasUnderscores: 0,
            hasHyphens: 0,
            hasSpaces: 0,
            startsWithCapital: 0,
            allCaps: 0,
            camelCase: 0,
            inconsistencies: []
        };

        const commonPrefixes = new Map();
        const commonSuffixes = new Map();

        assets.forEach(asset => {
            const name = asset.name;
            
            // Pattern detection
            if (/\d/.test(name)) patterns.hasNumbers++;
            if (/_/.test(name)) patterns.hasUnderscores++;
            if (/-/.test(name)) patterns.hasHyphens++;
            if (/\s/.test(name)) patterns.hasSpaces++;
            if (/^[A-Z]/.test(name)) patterns.startsWithCapital++;
            if (/^[A-Z]+$/.test(name.replace(/[^a-zA-Z]/g, ''))) patterns.allCaps++;
            if (/^[a-z]+([A-Z][a-z]*)*$/.test(name.replace(/[^a-zA-Z]/g, ''))) patterns.camelCase++;

            // Extract prefixes and suffixes
            const parts = name.split(/[_\-\s]+/);
            if (parts.length > 1) {
                const prefix = parts[0];
                const suffix = parts[parts.length - 1];
                
                commonPrefixes.set(prefix, (commonPrefixes.get(prefix) || 0) + 1);
                commonSuffixes.set(suffix, (commonSuffixes.get(suffix) || 0) + 1);
            }
        });

        // Calculate percentages
        const total = assets.length;
        Object.keys(patterns).forEach(key => {
            if (typeof patterns[key] === 'number') {
                patterns[key] = total > 0 ? (patterns[key] / total) * 100 : 0;
            }
        });

        // Find most common prefixes and suffixes
        const sortedPrefixes = Array.from(commonPrefixes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const sortedSuffixes = Array.from(commonSuffixes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return {
            patterns: patterns,
            commonPrefixes: sortedPrefixes,
            commonSuffixes: sortedSuffixes,
            consistencyScore: this.calculateNamingConsistency(patterns)
        };
    }

    /**
     * Calculate naming consistency score
     * @param {object} patterns - Naming patterns
     * @returns {number} Consistency score (0-100)
     */
    calculateNamingConsistency(patterns) {
        let score = 100;
        
        // Penalize mixed patterns
        const mixedPatterns = [
            ['hasUnderscores', 'hasHyphens', 'hasSpaces'],
            ['startsWithCapital', 'allCaps', 'camelCase']
        ];

        mixedPatterns.forEach(group => {
            const activePatterns = group.filter(pattern => patterns[pattern] > 10);
            if (activePatterns.length > 1) {
                score -= 20; // Penalty for mixed patterns
            }
        });

        return Math.max(0, score);
    }

    /**
     * Generate folder suggestions based on pattern
     * @param {array} assets - Project assets
     * @param {object} pattern - Project pattern
     * @param {array} existingFolders - Existing folders
     * @returns {array} Folder suggestions
     */
    generateFolderSuggestions(assets, pattern, existingFolders) {
        const suggestions = [];
        const existingNames = existingFolders.map(f => f.name.toLowerCase());

        pattern.folders.forEach(folderDef => {
            // Skip if folder already exists
            if (existingNames.includes(folderDef.name.toLowerCase())) {
                return;
            }

            // Find matching assets
            const matchingAssets = assets.filter(asset => {
                const assetName = asset.name.toLowerCase();
                const assetTags = (asset.tags || []).map(tag => tag.toLowerCase());
                
                return folderDef.keywords.some(keyword => 
                    assetName.includes(keyword) || assetTags.includes(keyword)
                );
            });

            if (matchingAssets.length > 0) {
                suggestions.push({
                    type: 'createFolder',
                    name: folderDef.name,
                    reason: `Found ${matchingAssets.length} assets that match "${folderDef.name}" criteria`,
                    matchingAssets: matchingAssets.map(a => a.id),
                    confidence: 0.8,
                    color: this.suggestFolderColor(folderDef.name)
                });
            }
        });

        return suggestions;
    }

    /**
     * Generate generic suggestions based on asset analysis
     * @param {array} assets - Project assets
     * @param {array} existingFolders - Existing folders
     * @returns {array} Generic suggestions
     */
    generateGenericSuggestions(assets, existingFolders) {
        const suggestions = [];
        const existingNames = existingFolders.map(f => f.name.toLowerCase());
        const assetTypes = this.analyzeAssetTypes(assets);

        // Suggest folders by asset type
        Object.keys(assetTypes.counts).forEach(type => {
            const count = assetTypes.counts[type];
            if (count > 2 && type !== 'other') { // Only suggest if more than 2 assets
                const folderName = this.getTypeFolderName(type);
                
                if (!existingNames.includes(folderName.toLowerCase())) {
                    suggestions.push({
                        type: 'createFolder',
                        name: folderName,
                        reason: `Organize ${count} ${type} assets`,
                        matchingAssets: assets.filter(a => a.type === type).map(a => a.id),
                        confidence: 0.7,
                        color: this.suggestFolderColor(type)
                    });
                }
            }
        });

        // Suggest folders based on common naming patterns
        const namingAnalysis = this.analyzeNamingPatterns(assets);
        namingAnalysis.commonPrefixes.forEach(([prefix, count]) => {
            if (count > 2 && !existingNames.includes(prefix.toLowerCase())) {
                const matchingAssets = assets.filter(a => 
                    a.name.toLowerCase().startsWith(prefix.toLowerCase())
                );
                
                suggestions.push({
                    type: 'createFolder',
                    name: this.formatFolderName(prefix),
                    reason: `Group ${count} assets with "${prefix}" prefix`,
                    matchingAssets: matchingAssets.map(a => a.id),
                    confidence: 0.6,
                    color: 'blue'
                });
            }
        });

        return suggestions;
    }

    /**
     * Generate naming improvement suggestions
     * @param {array} assets - Project assets
     * @returns {array} Naming suggestions
     */
    generateNamingSuggestions(assets) {
        const suggestions = [];
        const namingAnalysis = this.analyzeNamingPatterns(assets);

        // Suggest naming consistency improvements
        if (namingAnalysis.consistencyScore < 70) {
            suggestions.push({
                type: 'namingImprovement',
                title: 'Improve Naming Consistency',
                reason: 'Inconsistent naming patterns detected',
                confidence: 0.8,
                actions: [
                    'Consider using a consistent separator (underscores, hyphens, or spaces)',
                    'Standardize capitalization (Title Case, camelCase, or lowercase)',
                    'Use consistent numbering format (01, 02, 03 vs 1, 2, 3)'
                ]
            });
        }

        // Suggest removing redundant information
        const redundantPatterns = this.findRedundantPatterns(assets);
        if (redundantPatterns.length > 0) {
            suggestions.push({
                type: 'namingCleanup',
                title: 'Remove Redundant Information',
                reason: 'Found repeated information in asset names',
                confidence: 0.7,
                patterns: redundantPatterns
            });
        }

        return suggestions;
    }

    /**
     * Find redundant patterns in asset names
     * @param {array} assets - Project assets
     * @returns {array} Redundant patterns
     */
    findRedundantPatterns(assets) {
        const patterns = [];
        const words = new Map();

        // Count word frequency
        assets.forEach(asset => {
            const words_in_name = asset.name.toLowerCase()
                .replace(/[^a-z0-9\s]/g, ' ')
                .split(/\s+/)
                .filter(word => word.length > 2);

            words_in_name.forEach(word => {
                words.set(word, (words.get(word) || 0) + 1);
            });
        });

        // Find words that appear in most assets
        const threshold = Math.max(2, Math.floor(assets.length * 0.7));
        words.forEach((count, word) => {
            if (count >= threshold) {
                patterns.push({
                    word: word,
                    frequency: count,
                    percentage: (count / assets.length) * 100
                });
            }
        });

        return patterns.sort((a, b) => b.frequency - a.frequency);
    }

    /**
     * Get appropriate folder name for asset type
     * @param {string} type - Asset type
     * @returns {string} Folder name
     */
    getTypeFolderName(type) {
        const typeNames = {
            footage: 'Video Footage',
            audio: 'Audio Files',
            image: 'Images',
            composition: 'Compositions'
        };
        
        return typeNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
    }

    /**
     * Suggest appropriate color for folder
     * @param {string} folderName - Folder name or type
     * @returns {string} Color name
     */
    suggestFolderColor(folderName) {
        const colorMap = {
            // By content type
            'video': 'blue',
            'footage': 'blue',
            'audio': 'green',
            'music': 'green',
            'image': 'yellow',
            'graphics': 'orange',
            'composition': 'purple',
            
            // By project type
            'interview': 'red',
            'b-roll': 'blue',
            'archival': 'brown',
            'title': 'orange',
            'logo': 'purple'
        };

        const lowerName = folderName.toLowerCase();
        
        for (const [key, color] of Object.entries(colorMap)) {
            if (lowerName.includes(key)) {
                return color;
            }
        }
        
        return 'blue'; // Default color
    }

    /**
     * Format folder name for consistency
     * @param {string} name - Raw folder name
     * @returns {string} Formatted name
     */
    formatFolderName(name) {
        return name.split(/[_\-\s]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Record user action for learning
     * @param {string} action - Action type
     * @param {object} data - Action data
     */
    recordAction(action, data) {
        this.learningData.userActions.push({
            action,
            data,
            timestamp: Date.now()
        });

        // Limit stored actions to prevent memory issues
        if (this.learningData.userActions.length > 1000) {
            this.learningData.userActions = this.learningData.userActions.slice(-500);
        }

        this.saveLearningData();
    }

    /**
     * Record analysis for learning
     * @param {object} analysis - Analysis result
     */
    recordAnalysis(analysis) {
        this.learningData.organizationHistory.push({
            analysis,
            timestamp: Date.now()
        });

        // Limit stored analyses
        if (this.learningData.organizationHistory.length > 100) {
            this.learningData.organizationHistory = this.learningData.organizationHistory.slice(-50);
        }

        this.saveLearningData();
    }

    /**
     * Update learning patterns based on user behavior
     */
    updateLearning() {
        // Analyze recent user actions to improve suggestions
        const recentActions = this.learningData.userActions
            .filter(action => Date.now() - action.timestamp < 86400000) // Last 24 hours
            .slice(-50); // Last 50 actions

        // Update folder patterns based on user preferences
        recentActions.forEach(action => {
            if (action.action === 'folderCreated') {
                const folderName = action.data.name;
                const keywords = this.extractKeywords(folderName);
                
                if (!this.learningData.folderPatterns[folderName]) {
                    this.learningData.folderPatterns[folderName] = {
                        keywords: keywords,
                        usage: 1,
                        lastUsed: action.timestamp
                    };
                } else {
                    this.learningData.folderPatterns[folderName].usage++;
                    this.learningData.folderPatterns[folderName].lastUsed = action.timestamp;
                }
            }
        });

        this.saveLearningData();
    }

    /**
     * Extract keywords from folder name
     * @param {string} folderName - Folder name
     * @returns {array} Keywords
     */
    extractKeywords(folderName) {
        return folderName.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }

    /**
     * Get personalized suggestions based on user history
     * @param {array} assets - Current assets
     * @returns {array} Personalized suggestions
     */
    getPersonalizedSuggestions(assets) {
        const suggestions = [];
        
        // Suggest folders based on user's past preferences
        Object.entries(this.learningData.folderPatterns).forEach(([folderName, pattern]) => {
            if (pattern.usage > 2) { // Only suggest frequently used patterns
                const matchingAssets = assets.filter(asset => {
                    const assetName = asset.name.toLowerCase();
                    return pattern.keywords.some(keyword => assetName.includes(keyword));
                });

                if (matchingAssets.length > 0) {
                    suggestions.push({
                        type: 'createFolder',
                        name: folderName,
                        reason: `Based on your previous organization patterns`,
                        matchingAssets: matchingAssets.map(a => a.id),
                        confidence: Math.min(0.9, pattern.usage / 10),
                        isPersonalized: true
                    });
                }
            }
        });

        return suggestions;
    }

    /**
     * Enable or disable AI features
     * @param {boolean} enabled - Whether AI is enabled
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        this.emit('enabledChanged', enabled);
    }

    /**
     * Clear all learning data
     */
    clearLearningData() {
        this.learningData = {
            userActions: [],
            folderPatterns: {},
            namingPatterns: {},
            organizationHistory: []
        };
        this.saveLearningData();
        this.emit('learningDataCleared');
    }

    /**
     * Export learning data for backup
     * @returns {string} JSON string of learning data
     */
    exportLearningData() {
        return JSON.stringify(this.learningData, null, 2);
    }

    /**
     * Import learning data from backup
     * @param {string} jsonData - JSON string of learning data
     * @returns {boolean} Success
     */
    importLearningData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            this.learningData = { ...this.learningData, ...data };
            this.saveLearningData();
            this.emit('learningDataImported');
            return true;
        } catch (error) {
            console.error('Failed to import learning data:', error);
            return false;
        }
    }
}

// Create global AI service instance
window.AIService = new AIService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIService;
}