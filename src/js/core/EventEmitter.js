/**
 * EventEmitter - Simple event system for component communication
 */
class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     * @param {object} context - Context for callback execution
     * @returns {function} Unsubscribe function
     */
    on(event, callback, context = null) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        const listener = { callback, context };
        this.events.get(event).push(listener);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     * @param {object} context - Context for callback execution
     * @returns {function} Unsubscribe function
     */
    once(event, callback, context = null) {
        const onceWrapper = (...args) => {
            this.off(event, onceWrapper);
            callback.apply(context, args);
        };

        return this.on(event, onceWrapper, context);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {function} callback - Callback function to remove
     */
    off(event, callback) {
        if (!this.events.has(event)) return;

        const listeners = this.events.get(event);
        const index = listeners.findIndex(listener => listener.callback === callback);
        
        if (index !== -1) {
            listeners.splice(index, 1);
        }

        if (listeners.length === 0) {
            this.events.delete(event);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {...any} args - Arguments to pass to callbacks
     */
    emit(event, ...args) {
        if (!this.events.has(event)) return;

        const listeners = this.events.get(event).slice(); // Copy to avoid issues with modifications during iteration
        
        listeners.forEach(listener => {
            try {
                listener.callback.apply(listener.context, args);
            } catch (error) {
                console.error(`Error in event listener for "${event}":`, error);
            }
        });
    }

    /**
     * Remove all listeners for an event or all events
     * @param {string} event - Event name (optional)
     */
    removeAllListeners(event = null) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }

    /**
     * Get listener count for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        return this.events.has(event) ? this.events.get(event).length : 0;
    }

    /**
     * Get all event names
     * @returns {string[]} Array of event names
     */
    eventNames() {
        return Array.from(this.events.keys());
    }
}

// Create global event bus
window.EventBus = new EventEmitter();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventEmitter;
}