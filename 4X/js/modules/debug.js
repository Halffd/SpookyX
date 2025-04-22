/**
 * 4X - Debug Module
 * Provides logging and debugging functionality
 */
(function() {
    // Initialize namespace
    window.FourX = window.FourX || {};
    
    // Create Debug module
    FourX.Debug = {
        enabled: false,
        
        /**
         * Initialize the debug module
         * @param {boolean} enabled - Whether debug mode is enabled
         */
        init: function(enabled = false) {
            this.enabled = enabled;
            this.log('Debug module initialized', { enabled: this.enabled });
            
            // Add console command for toggling debug mode
            if (typeof window.FourXDebug === 'undefined') {
                window.FourXDebug = function(enable = null) {
                    if (enable === null) {
                        // Toggle if no parameter
                        FourX.Debug.enabled = !FourX.Debug.enabled;
                    } else {
                        // Set to specified value
                        FourX.Debug.enabled = !!enable;
                    }
                    console.log(`4X Debug mode ${FourX.Debug.enabled ? 'enabled' : 'disabled'}`);
                    
                    // Update settings if available
                    if (FourX.Settings) {
                        const settings = FourX.Settings.getAllSettings();
                        if (settings.advanced) {
                            settings.advanced.debugMode = FourX.Debug.enabled;
                            FourX.Settings.updateSettings(settings);
                        }
                    }
                    
                    return FourX.Debug.enabled;
                };
            }
            
            // Add window error handler in debug mode
            if (this.enabled) {
                this.setupErrorHandling();
            }
        },
        
        /**
         * Log a message to the console if debug mode is enabled
         * @param {string} message - The message to log
         * @param {Object} [data] - Optional data to log
         */
        log: function(message, data) {
            if (this.enabled) {
                if (data) {
                    console.log(`%c4X Debug: ${message}`, 'color: #6200ee; font-weight: bold;', data);
                } else {
                    console.log(`%c4X Debug: ${message}`, 'color: #6200ee; font-weight: bold;');
                }
            }
        },
        
        /**
         * Log an error to the console
         * @param {string} message - The error message
         * @param {Error|Object} [error] - The error object or data
         */
        error: function(message, error) {
            console.error(`%c4X Error: ${message}`, 'color: #d32f2f; font-weight: bold;', error || '');
        },
        
        /**
         * Log a warning to the console
         * @param {string} message - The warning message
         * @param {Object} [data] - Optional data related to the warning
         */
        warn: function(message, data) {
            console.warn(`%c4X Warning: ${message}`, 'color: #ff9800; font-weight: bold;', data || '');
        },
        
        /**
         * Set up error handling for uncaught exceptions
         */
        setupErrorHandling: function() {
            window.addEventListener('error', (event) => {
                // Only handle errors from our extension
                if (event.filename && (
                    event.filename.includes('4X/') || 
                    event.filename.includes('chrome-extension') ||
                    event.message.includes('4X')
                )) {
                    this.error('Uncaught exception', {
                        message: event.message,
                        filename: event.filename,
                        lineno: event.lineno,
                        colno: event.colno,
                        stack: event.error ? event.error.stack : null
                    });
                }
            });
            
            // Handle promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                if (typeof event.reason === 'object' && event.reason.stack && 
                    (event.reason.stack.includes('4X/') || event.reason.stack.includes('chrome-extension'))) {
                    this.error('Unhandled promise rejection', {
                        reason: event.reason,
                        stack: event.reason.stack
                    });
                }
            });
        },
        
        /**
         * Creates a performance marker and returns a function to measure the elapsed time
         * @param {string} label - Label for the performance measure
         * @returns {Function} - Function to call when finished to log the elapsed time
         */
        timeStart: function(label) {
            if (!this.enabled) return () => {};
            
            const markName = `4X_${label}_start`;
            performance.mark(markName);
            
            return () => {
                const endMarkName = `4X_${label}_end`;
                performance.mark(endMarkName);
                performance.measure(`4X_${label}`, markName, endMarkName);
                
                const entries = performance.getEntriesByName(`4X_${label}`);
                if (entries.length > 0) {
                    const duration = entries[0].duration.toFixed(2);
                    this.log(`${label} took ${duration}ms`);
                }
                
                // Cleanup
                performance.clearMarks(markName);
                performance.clearMarks(endMarkName);
                performance.clearMeasures(`4X_${label}`);
            };
        }
    };
})(); 