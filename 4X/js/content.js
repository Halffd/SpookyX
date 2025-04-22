/**
 * 4X Extension - Main Content Script
 * Initializes the extension and loads all modules
 */
(function() {
    // Create global namespace
    window.FourX = window.FourX || {};
    
    // Extension state
    FourX.state = {
        initialized: false,
        currentBoard: '',
        siteDomain: window.location.hostname,
        supportedDomains: [
            'boards.4channel.org',
            'boards.4chan.org',
            'archive.4plebs.org',
            'archive.loveisover.me',
            'warosu.org',
            'desuarchive.org',
            'archived.moe',
            'thebarchive.com',
            'fireden.net',
            'arch.b4k.co',
            'boards.fireden.net'
        ]
    };
    
    // Debug helper
    FourX.debug = function(message, ...args) {
        if (FourX.Settings && FourX.Settings.get('advanced.debugMode')) {
            console.log(`[4X] ${message}`, ...args);
        }
    };
    
    /**
     * Check if current site is supported
     */
    FourX.isSupportedSite = function() {
        return FourX.state.supportedDomains.some(domain => 
            FourX.state.siteDomain.includes(domain));
    };
    
    /**
     * Initialize the extension
     */
    FourX.init = async function() {
        if (FourX.state.initialized) return;
        
        try {
            // Check if site is supported
            if (!FourX.isSupportedSite()) {
                console.log("[4X] This site is not supported by the 4X extension.");
                return;
            }
            
            FourX.debug("Initializing 4X extension...");
            
            // Initialize all modules
            await FourX.Settings.init();
            FourX.Utils.init();
            FourX.DOM.init();
            FourX.Sites.init();
            FourX.Cache.init();
            FourX.UI.init();
            FourX.Posts.init();
            
            // Add message listener for extension communication
            chrome.runtime.onMessage.addListener(FourX.handleMessage);
            
            // Apply user settings
            FourX.applySettings();
            
            // Mark as initialized
            FourX.state.initialized = true;
            FourX.debug("4X extension initialization complete");
            
        } catch (error) {
            console.error("[4X] Error initializing extension:", error);
        }
    };
    
    /**
     * Handle messages from popup and background script
     */
    FourX.handleMessage = function(message, sender, sendResponse) {
        FourX.debug("Received message:", message);
        
        switch (message.action) {
            case 'getSettings':
                sendResponse(FourX.Settings.getAll());
                return true;
                
            case 'updateSettings':
                FourX.Settings.updateAll(message.settings);
                FourX.applySettings();
                sendResponse({success: true});
                return true;
                
            case 'openSettingsPanel':
                FourX.UI.openSettingsPanel();
                sendResponse({success: true});
                return true;
                
            default:
                FourX.debug("Unknown message action:", message.action);
                return false;
        }
    };
    
    /**
     * Apply all user settings
     */
    FourX.applySettings = function() {
        // Apply dark mode
        if (FourX.Settings.get('appearance.darkMode')) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // Apply compact mode
        if (FourX.Settings.get('appearance.compactMode')) {
            document.body.classList.add('compact-mode');
        } else {
            document.body.classList.remove('compact-mode');
        }
        
        // Apply other visual settings
        FourX.UI.applyStyles();
        
        // Apply post processing settings
        if (FourX.Settings.get('postProcessing.enableHighlighting')) {
            FourX.Posts.applyKeywordHighlighting();
        }
        
        // Mark your posts
        FourX.Posts.highlightYourPosts();
    };
    
    // Initialize the extension when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', FourX.init);
    } else {
        FourX.init();
    }
})(); 