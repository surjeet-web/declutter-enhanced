/**
 * StateManager - Centralized state management with persistence
 */
class StateManager extends EventEmitter {
    constructor() {
        super();
        this.state = this.getInitialState();
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
        // Auto-save state changes
        this.on('stateChanged', () => {
            this.saveState();
        });
    }

    /**
     * Get initial state structure
     * @returns {object} Initial state
     */
    getInitialState() {
        return {
            project: {
                name: 'Untitled Project',
                assets: [],
                folders: [],
                templates: [],
                health: {
                    score: 0,
                    metrics: {}
                },
                lastModified: null
            },
            ui: {
                activePanel: 'dashboard',
                selectedAssets: [],
                selectedFolders: [],
                filters: {
                    assetTypes: [],
                    searchQuery: '',
                    showUnorganized: false
                },
                preferences: {
                    theme: 'dark',
                    autoSave: true,
                    showTips: true,
                    animationsEnabled: true
                },
                modals: {
                    active: null,
                    data: null
                }
            },
            templates: {
                active: null,
                library: [],
                marketplace: [],
                recent: []
            },
            analytics: {
                usage: {},
                performance: {},
                errors: []
            },
            collaboration: {
                teamMembers: [],
                changes: [],
                permissions: {},
                isOnline: false
            }
        };
    }

    /**
     * Get current state or specific path
     * @param {string} path - Dot notation path (optional)
     * @returns {any} State value
     */
    getState(path = null) {
        if (!path) return this.state;
        
        return this.getNestedValue(this.state, path);
    }

    /**
     * Set state value at path
     * @param {string} path - Dot notation path
     * @param {any} value - New value
     * @param {boolean} addToHistory - Whether to add to undo history
     */
    setState(path, value, addToHistory = true) {
        const oldState = JSON.parse(JSON.stringify(this.state));
        
        this.setNestedValue(this.state, path, value);
        
        if (addToHistory) {
            this.addToHistory(oldState);
        }
        
        this.emit('stateChanged', {
            path,
            value,
            oldValue: this.getNestedValue(oldState, path),
            state: this.state
        });
    }

    /**
     * Update state by merging with existing value
     * @param {string} path - Dot notation path
     * @param {object} updates - Object to merge
     * @param {boolean} addToHistory - Whether to add to undo history
     */
    updateState(path, updates, addToHistory = true) {
        const currentValue = this.getState(path);
        const newValue = { ...currentValue, ...updates };
        this.setState(path, newValue, addToHistory);
    }

    /**
     * Add item to array in state
     * @param {string} path - Dot notation path to array
     * @param {any} item - Item to add
     * @param {boolean} addToHistory - Whether to add to undo history
     */
    addToArray(path, item, addToHistory = true) {
        const currentArray = this.getState(path) || [];
        const newArray = [...currentArray, item];
        this.setState(path, newArray, addToHistory);
    }

    /**
     * Remove item from array in state
     * @param {string} path - Dot notation path to array
     * @param {function|any} predicate - Function to find item or item to remove
     * @param {boolean} addToHistory - Whether to add to undo history
     */
    removeFromArray(path, predicate, addToHistory = true) {
        const currentArray = this.getState(path) || [];
        let newArray;
        
        if (typeof predicate === 'function') {
            newArray = currentArray.filter(item => !predicate(item));
        } else {
            newArray = currentArray.filter(item => item !== predicate);
        }
        
        this.setState(path, newArray, addToHistory);
    }

    /**
     * Update item in array
     * @param {string} path - Dot notation path to array
     * @param {function} predicate - Function to find item
     * @param {object} updates - Updates to apply
     * @param {boolean} addToHistory - Whether to add to undo history
     */
    updateInArray(path, predicate, updates, addToHistory = true) {
        const currentArray = this.getState(path) || [];
        const newArray = currentArray.map(item => {
            if (predicate(item)) {
                return { ...item, ...updates };
            }
            return item;
        });
        
        this.setState(path, newArray, addToHistory);
    }

    /**
     * Get nested value from object using dot notation
     * @param {object} obj - Object to search
     * @param {string} path - Dot notation path
     * @returns {any} Value at path
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Set nested value in object using dot notation
     * @param {object} obj - Object to modify
     * @param {string} path - Dot notation path
     * @param {any} value - Value to set
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        
        target[lastKey] = value;
    }

    /**
     * Add state to history for undo functionality
     * @param {object} state - State to add to history
     */
    addToHistory(state) {
        // Remove any history after current index
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add new state
        this.history.push(JSON.parse(JSON.stringify(state)));
        this.historyIndex++;
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }
        
        this.emit('historyChanged', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        });
    }

    /**
     * Undo last state change
     * @returns {boolean} Success
     */
    undo() {
        if (!this.canUndo()) return false;
        
        this.historyIndex--;
        this.state = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
        
        this.emit('stateChanged', {
            path: null,
            value: this.state,
            oldValue: null,
            state: this.state,
            isUndo: true
        });
        
        this.emit('historyChanged', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        });
        
        return true;
    }

    /**
     * Redo last undone state change
     * @returns {boolean} Success
     */
    redo() {
        if (!this.canRedo()) return false;
        
        this.historyIndex++;
        this.state = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
        
        this.emit('stateChanged', {
            path: null,
            value: this.state,
            oldValue: null,
            state: this.state,
            isRedo: true
        });
        
        this.emit('historyChanged', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        });
        
        return true;
    }

    /**
     * Check if undo is possible
     * @returns {boolean} Can undo
     */
    canUndo() {
        return this.historyIndex > 0;
    }

    /**
     * Check if redo is possible
     * @returns {boolean} Can redo
     */
    canRedo() {
        return this.historyIndex < this.history.length - 1;
    }

    /**
     * Clear undo/redo history
     */
    clearHistory() {
        this.history = [];
        this.historyIndex = -1;
        
        this.emit('historyChanged', {
            canUndo: false,
            canRedo: false
        });
    }

    /**
     * Save state to localStorage
     */
    saveState() {
        try {
            const stateToSave = {
                ...this.state,
                _timestamp: Date.now()
            };
            localStorage.setItem('declutter_state', JSON.stringify(stateToSave));
        } catch (error) {
            console.warn('Failed to save state to localStorage:', error);
        }
    }

    /**
     * Load state from localStorage
     * @returns {boolean} Success
     */
    loadState() {
        try {
            const savedState = localStorage.getItem('declutter_state');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                delete parsedState._timestamp; // Remove timestamp
                
                this.state = { ...this.getInitialState(), ...parsedState };
                this.emit('stateLoaded', this.state);
                return true;
            }
        } catch (error) {
            console.warn('Failed to load state from localStorage:', error);
        }
        return false;
    }

    /**
     * Reset state to initial values
     * @param {boolean} addToHistory - Whether to add to undo history
     */
    resetState(addToHistory = true) {
        const oldState = JSON.parse(JSON.stringify(this.state));
        
        if (addToHistory) {
            this.addToHistory(oldState);
        }
        
        this.state = this.getInitialState();
        
        this.emit('stateChanged', {
            path: null,
            value: this.state,
            oldValue: oldState,
            state: this.state,
            isReset: true
        });
    }

    /**
     * Subscribe to state changes at specific path
     * @param {string} path - Dot notation path
     * @param {function} callback - Callback function
     * @returns {function} Unsubscribe function
     */
    subscribe(path, callback) {
        return this.on('stateChanged', (event) => {
            if (!path || event.path === path || event.path?.startsWith(path + '.')) {
                callback(this.getState(path), event);
            }
        });
    }

    /**
     * Create a computed value that updates when dependencies change
     * @param {string[]} dependencies - Array of state paths
     * @param {function} computeFn - Function to compute value
     * @returns {function} Unsubscribe function
     */
    computed(dependencies, computeFn) {
        const update = () => {
            const values = dependencies.map(dep => this.getState(dep));
            return computeFn(...values);
        };

        // Initial computation
        let currentValue = update();

        const unsubscribe = this.on('stateChanged', (event) => {
            const shouldUpdate = dependencies.some(dep => 
                event.path === dep || event.path?.startsWith(dep + '.')
            );
            
            if (shouldUpdate) {
                const newValue = update();
                if (newValue !== currentValue) {
                    currentValue = newValue;
                    this.emit('computedChanged', {
                        dependencies,
                        value: newValue
                    });
                }
            }
        });

        return unsubscribe;
    }
}

// Create global state manager
window.StateManager = new StateManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}