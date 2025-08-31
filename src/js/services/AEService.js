/**
 * AEService - Interface with After Effects through CEP/ExtendScript
 */
class AEService extends EventEmitter {
    constructor() {
        super();
        this.csInterface = new CSInterface();
        this.isConnected = false;
        this.projectData = null;
        
        this.init();
    }

    /**
     * Initialize the service
     */
    async init() {
        try {
            // Check if we're running in CEP environment
            if (typeof CSInterface === 'undefined') {
                console.warn('CEP environment not detected, running in mock mode');
                this.initMockMode();
                return;
            }

            // Set up CEP interface
            this.csInterface.addEventListener('com.aescripts.declutter.projectChanged', this.handleProjectChanged.bind(this));
            this.csInterface.addEventListener('com.aescripts.declutter.assetAdded', this.handleAssetAdded.bind(this));
            this.csInterface.addEventListener('com.aescripts.declutter.folderCreated', this.handleFolderCreated.bind(this));

            // Get initial project data
            await this.refreshProjectData();
            this.isConnected = true;
            
            this.emit('connected');
        } catch (error) {
            console.error('Failed to initialize AE service:', error);
            this.initMockMode();
        }
    }

    /**
     * Initialize mock mode for development/testing
     */
    initMockMode() {
        this.isConnected = false;
        this.projectData = this.generateMockProjectData();
        
        // Simulate connection after delay
        setTimeout(() => {
            this.isConnected = true;
            this.emit('connected');
        }, 1000);
    }

    /**
     * Generate mock project data for development
     * @returns {object} Mock project data
     */
    generateMockProjectData() {
        return {
            name: 'Sample Documentary Project',
            assets: [
                {
                    id: 'asset_1',
                    name: 'Interview_Subject_01.mov',
                    type: 'footage',
                    size: 1024 * 1024 * 1200, // 1.2GB
                    duration: 932, // seconds
                    width: 1920,
                    height: 1080,
                    frameRate: 29.97,
                    hasAudio: true,
                    folder: null,
                    tags: ['interview', '4K', 'primary'],
                    created: new Date('2024-01-15'),
                    modified: new Date('2024-01-16')
                },
                {
                    id: 'asset_2',
                    name: 'B-Roll_City_Skyline.mov',
                    type: 'footage',
                    size: 1024 * 1024 * 800,
                    duration: 45,
                    width: 3840,
                    height: 2160,
                    frameRate: 24,
                    hasAudio: false,
                    folder: null,
                    tags: ['b-roll', '4K', 'establishing'],
                    created: new Date('2024-01-14'),
                    modified: new Date('2024-01-14')
                },
                {
                    id: 'asset_3',
                    name: 'Background_Music_01.wav',
                    type: 'audio',
                    size: 1024 * 1024 * 45,
                    duration: 180,
                    sampleRate: 48000,
                    channels: 2,
                    folder: null,
                    tags: ['music', 'background', 'emotional'],
                    created: new Date('2024-01-13'),
                    modified: new Date('2024-01-13')
                },
                {
                    id: 'asset_4',
                    name: 'Logo_Animation.aep',
                    type: 'composition',
                    size: 1024 * 1024 * 2,
                    duration: 5,
                    width: 1920,
                    height: 1080,
                    frameRate: 30,
                    folder: null,
                    tags: ['logo', 'animation', 'branding'],
                    created: new Date('2024-01-12'),
                    modified: new Date('2024-01-17')
                },
                {
                    id: 'asset_5',
                    name: 'Title_Card_Template.psd',
                    type: 'image',
                    size: 1024 * 1024 * 15,
                    width: 1920,
                    height: 1080,
                    folder: null,
                    tags: ['title', 'template', 'graphics'],
                    created: new Date('2024-01-11'),
                    modified: new Date('2024-01-15')
                }
            ],
            folders: [
                {
                    id: 'folder_1',
                    name: 'Raw Footage',
                    color: 'blue',
                    parent: null,
                    children: [],
                    created: new Date('2024-01-10')
                }
            ],
            compositions: [
                {
                    id: 'comp_1',
                    name: 'Main Timeline',
                    width: 1920,
                    height: 1080,
                    duration: 300,
                    frameRate: 29.97,
                    folder: null
                }
            ]
        };
    }

    /**
     * Get current project data
     * @returns {object} Project data
     */
    getProjectData() {
        return this.projectData;
    }

    /**
     * Refresh project data from After Effects
     */
    async refreshProjectData() {
        if (!this.isConnected && typeof CSInterface !== 'undefined') {
            try {
                const result = await this.evalScript('getProjectData()');
                this.projectData = JSON.parse(result);
                this.emit('projectDataUpdated', this.projectData);
            } catch (error) {
                console.error('Failed to refresh project data:', error);
            }
        }
    }

    /**
     * Get all assets in the project
     * @returns {array} Array of assets
     */
    getAssets() {
        return this.projectData?.assets || [];
    }

    /**
     * Get assets by type
     * @param {string} type - Asset type (footage, audio, image, composition)
     * @returns {array} Filtered assets
     */
    getAssetsByType(type) {
        return this.getAssets().filter(asset => asset.type === type);
    }

    /**
     * Get unorganized assets (not in any folder)
     * @returns {array} Unorganized assets
     */
    getUnorganizedAssets() {
        return this.getAssets().filter(asset => !asset.folder);
    }

    /**
     * Get all folders in the project
     * @returns {array} Array of folders
     */
    getFolders() {
        return this.projectData?.folders || [];
    }

    /**
     * Create a new folder
     * @param {string} name - Folder name
     * @param {string} color - Folder color
     * @param {string} parentId - Parent folder ID (optional)
     * @returns {Promise<object>} Created folder
     */
    async createFolder(name, color = 'none', parentId = null) {
        try {
            if (this.isConnected && typeof CSInterface !== 'undefined') {
                const script = `createFolder("${name}", "${color}", ${parentId ? `"${parentId}"` : 'null'})`;
                const result = await this.evalScript(script);
                const folder = JSON.parse(result);
                
                // Update local data
                this.projectData.folders.push(folder);
                this.emit('folderCreated', folder);
                
                return folder;
            } else {
                // Mock mode
                const folder = {
                    id: `folder_${Date.now()}`,
                    name,
                    color,
                    parent: parentId,
                    children: [],
                    created: new Date()
                };
                
                this.projectData.folders.push(folder);
                this.emit('folderCreated', folder);
                
                return folder;
            }
        } catch (error) {
            console.error('Failed to create folder:', error);
            throw error;
        }
    }

    /**
     * Move assets to folder
     * @param {array} assetIds - Array of asset IDs
     * @param {string} folderId - Target folder ID
     * @returns {Promise<boolean>} Success
     */
    async moveAssetsToFolder(assetIds, folderId) {
        try {
            if (this.isConnected && typeof CSInterface !== 'undefined') {
                const script = `moveAssetsToFolder([${assetIds.map(id => `"${id}"`).join(',')}], "${folderId}")`;
                await this.evalScript(script);
            }
            
            // Update local data
            this.projectData.assets.forEach(asset => {
                if (assetIds.includes(asset.id)) {
                    asset.folder = folderId;
                }
            });
            
            this.emit('assetsMoved', { assetIds, folderId });
            return true;
        } catch (error) {
            console.error('Failed to move assets:', error);
            throw error;
        }
    }

    /**
     * Rename folder
     * @param {string} folderId - Folder ID
     * @param {string} newName - New folder name
     * @returns {Promise<boolean>} Success
     */
    async renameFolder(folderId, newName) {
        try {
            if (this.isConnected && typeof CSInterface !== 'undefined') {
                const script = `renameFolder("${folderId}", "${newName}")`;
                await this.evalScript(script);
            }
            
            // Update local data
            const folder = this.projectData.folders.find(f => f.id === folderId);
            if (folder) {
                folder.name = newName;
                this.emit('folderRenamed', { folderId, newName });
            }
            
            return true;
        } catch (error) {
            console.error('Failed to rename folder:', error);
            throw error;
        }
    }

    /**
     * Delete folder
     * @param {string} folderId - Folder ID
     * @param {boolean} moveAssetsToParent - Whether to move assets to parent folder
     * @returns {Promise<boolean>} Success
     */
    async deleteFolder(folderId, moveAssetsToParent = true) {
        try {
            if (this.isConnected && typeof CSInterface !== 'undefined') {
                const script = `deleteFolder("${folderId}", ${moveAssetsToParent})`;
                await this.evalScript(script);
            }
            
            // Update local data
            const folderIndex = this.projectData.folders.findIndex(f => f.id === folderId);
            if (folderIndex !== -1) {
                const folder = this.projectData.folders[folderIndex];
                
                if (moveAssetsToParent) {
                    // Move assets to parent folder
                    this.projectData.assets.forEach(asset => {
                        if (asset.folder === folderId) {
                            asset.folder = folder.parent;
                        }
                    });
                }
                
                this.projectData.folders.splice(folderIndex, 1);
                this.emit('folderDeleted', { folderId, moveAssetsToParent });
            }
            
            return true;
        } catch (error) {
            console.error('Failed to delete folder:', error);
            throw error;
        }
    }

    /**
     * Apply folder structure template
     * @param {object} template - Template object
     * @param {array} selectedAssets - Selected assets to organize
     * @returns {Promise<object>} Organization result
     */
    async applyTemplate(template, selectedAssets = null) {
        try {
            const assetsToOrganize = selectedAssets || this.getUnorganizedAssets();
            const result = {
                foldersCreated: 0,
                assetsMoved: 0,
                errors: []
            };

            // Create folders from template
            for (const folderDef of template.folders) {
                try {
                    const folder = await this.createFolder(
                        folderDef.name,
                        folderDef.color,
                        folderDef.parent
                    );
                    result.foldersCreated++;

                    // Apply filters to move matching assets
                    if (folderDef.filters && folderDef.filters.length > 0) {
                        const matchingAssets = this.filterAssets(assetsToOrganize, folderDef.filters);
                        if (matchingAssets.length > 0) {
                            await this.moveAssetsToFolder(
                                matchingAssets.map(a => a.id),
                                folder.id
                            );
                            result.assetsMoved += matchingAssets.length;
                        }
                    }
                } catch (error) {
                    result.errors.push(`Failed to create folder "${folderDef.name}": ${error.message}`);
                }
            }

            this.emit('templateApplied', { template, result });
            return result;
        } catch (error) {
            console.error('Failed to apply template:', error);
            throw error;
        }
    }

    /**
     * Filter assets based on filter rules
     * @param {array} assets - Assets to filter
     * @param {array} filters - Filter rules
     * @returns {array} Matching assets
     */
    filterAssets(assets, filters) {
        return assets.filter(asset => {
            return filters.some(filter => {
                switch (filter.type) {
                    case 'name':
                        return asset.name.toLowerCase().includes(filter.value.toLowerCase());
                    case 'type':
                        return asset.type === filter.value;
                    case 'size':
                        return this.compareSize(asset.size, filter.operator, filter.value);
                    case 'duration':
                        return this.compareDuration(asset.duration, filter.operator, filter.value);
                    case 'tag':
                        return asset.tags && asset.tags.includes(filter.value);
                    default:
                        return false;
                }
            });
        });
    }

    /**
     * Compare asset size with filter value
     * @param {number} assetSize - Asset size in bytes
     * @param {string} operator - Comparison operator
     * @param {string} filterValue - Filter value with unit
     * @returns {boolean} Comparison result
     */
    compareSize(assetSize, operator, filterValue) {
        const sizeInBytes = this.parseSize(filterValue);
        
        switch (operator) {
            case '>': return assetSize > sizeInBytes;
            case '<': return assetSize < sizeInBytes;
            case '>=': return assetSize >= sizeInBytes;
            case '<=': return assetSize <= sizeInBytes;
            case '=': return Math.abs(assetSize - sizeInBytes) < 1024; // Within 1KB
            default: return false;
        }
    }

    /**
     * Compare asset duration with filter value
     * @param {number} assetDuration - Asset duration in seconds
     * @param {string} operator - Comparison operator
     * @param {number} filterValue - Filter value in seconds
     * @returns {boolean} Comparison result
     */
    compareDuration(assetDuration, operator, filterValue) {
        if (!assetDuration) return false;
        
        switch (operator) {
            case '>': return assetDuration > filterValue;
            case '<': return assetDuration < filterValue;
            case '>=': return assetDuration >= filterValue;
            case '<=': return assetDuration <= filterValue;
            case '=': return Math.abs(assetDuration - filterValue) < 1; // Within 1 second
            default: return false;
        }
    }

    /**
     * Parse size string to bytes
     * @param {string} sizeStr - Size string (e.g., "100MB", "1.5GB")
     * @returns {number} Size in bytes
     */
    parseSize(sizeStr) {
        const units = {
            'B': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024
        };
        
        const match = sizeStr.match(/^([\d.]+)\s*([A-Z]+)$/i);
        if (!match) return 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        
        return value * (units[unit] || 1);
    }

    /**
     * Calculate project health score
     * @returns {object} Health metrics
     */
    calculateProjectHealth() {
        const assets = this.getAssets();
        const folders = this.getFolders();
        const unorganized = this.getUnorganizedAssets();
        
        const metrics = {
            totalAssets: assets.length,
            totalFolders: folders.length,
            unorganizedAssets: unorganized.length,
            organizationRate: assets.length > 0 ? ((assets.length - unorganized.length) / assets.length) * 100 : 100,
            averageFolderDepth: this.calculateAverageFolderDepth(),
            namingConsistency: this.calculateNamingConsistency(assets),
            duplicateRisk: this.calculateDuplicateRisk(assets)
        };
        
        // Calculate overall score (0-100)
        let score = 0;
        score += metrics.organizationRate * 0.4; // 40% weight
        score += Math.min(metrics.namingConsistency, 100) * 0.3; // 30% weight
        score += Math.max(0, 100 - metrics.duplicateRisk) * 0.2; // 20% weight
        score += Math.min(metrics.averageFolderDepth * 20, 100) * 0.1; // 10% weight
        
        metrics.overallScore = Math.round(score);
        
        return metrics;
    }

    /**
     * Calculate average folder depth
     * @returns {number} Average depth
     */
    calculateAverageFolderDepth() {
        const folders = this.getFolders();
        if (folders.length === 0) return 0;
        
        const depths = folders.map(folder => {
            let depth = 1;
            let current = folder;
            
            while (current.parent) {
                depth++;
                current = folders.find(f => f.id === current.parent);
                if (!current) break;
            }
            
            return depth;
        });
        
        return depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
    }

    /**
     * Calculate naming consistency score
     * @param {array} assets - Assets to analyze
     * @returns {number} Consistency score (0-100)
     */
    calculateNamingConsistency(assets) {
        if (assets.length === 0) return 100;
        
        let consistencyScore = 100;
        const patterns = {
            hasNumbers: /\d/,
            hasUnderscores: /_/,
            hasHyphens: /-/,
            hasSpaces: /\s/,
            isUpperCase: /^[A-Z]/,
            isLowerCase: /^[a-z]/
        };
        
        // Check each pattern consistency
        Object.keys(patterns).forEach(pattern => {
            const matches = assets.filter(asset => patterns[pattern].test(asset.name)).length;
            const ratio = matches / assets.length;
            
            // Penalize inconsistency (neither all match nor none match)
            if (ratio > 0.1 && ratio < 0.9) {
                consistencyScore -= 15;
            }
        });
        
        return Math.max(0, consistencyScore);
    }

    /**
     * Calculate duplicate risk score
     * @param {array} assets - Assets to analyze
     * @returns {number} Risk score (0-100)
     */
    calculateDuplicateRisk(assets) {
        if (assets.length === 0) return 0;
        
        const nameGroups = {};
        const sizeGroups = {};
        
        assets.forEach(asset => {
            // Group by similar names
            const baseName = asset.name.replace(/\d+/g, '').replace(/[_\-\s]+/g, '');
            nameGroups[baseName] = (nameGroups[baseName] || 0) + 1;
            
            // Group by exact size
            sizeGroups[asset.size] = (sizeGroups[asset.size] || 0) + 1;
        });
        
        const nameConflicts = Object.values(nameGroups).filter(count => count > 1).length;
        const sizeConflicts = Object.values(sizeGroups).filter(count => count > 1).length;
        
        const riskScore = ((nameConflicts + sizeConflicts) / assets.length) * 100;
        return Math.min(100, riskScore);
    }

    /**
     * Execute ExtendScript in After Effects
     * @param {string} script - Script to execute
     * @returns {Promise<string>} Script result
     */
    evalScript(script) {
        return new Promise((resolve, reject) => {
            if (typeof CSInterface === 'undefined') {
                // Mock mode - return fake data
                setTimeout(() => resolve('{}'), 100);
                return;
            }
            
            this.csInterface.evalScript(script, (result) => {
                if (result === 'EvalScript error.') {
                    reject(new Error('ExtendScript execution failed'));
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * Handle project changed event from After Effects
     * @param {object} event - Event data
     */
    handleProjectChanged(event) {
        this.refreshProjectData();
    }

    /**
     * Handle asset added event from After Effects
     * @param {object} event - Event data
     */
    handleAssetAdded(event) {
        const assetData = JSON.parse(event.data);
        this.projectData.assets.push(assetData);
        this.emit('assetAdded', assetData);
    }

    /**
     * Handle folder created event from After Effects
     * @param {object} event - Event data
     */
    handleFolderCreated(event) {
        const folderData = JSON.parse(event.data);
        this.projectData.folders.push(folderData);
        this.emit('folderCreated', folderData);
    }
}

// Create global AE service instance
window.AEService = new AEService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AEService;
}