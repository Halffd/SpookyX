/**
 * Cache module for 4X Extension
 * Handles caching of posts and threads for better performance
 */
(function() {
    // Initialize namespace if it doesn't exist
    if (!window.FourX) window.FourX = {};
    
    // Private cache storage
    const _postCache = new Map();
    const _threadCache = new Map();
    const _pageCache = new Map();
    
    // Cache configuration
    const config = {
        enabled: true,
        maxSize: 500, // Maximum number of posts to cache
        expiryTime: 30 * 60 * 1000, // 30 minutes in milliseconds
        threadExpiryTime: 5 * 60 * 1000 // 5 minutes for threads
    };
    
    // Cache module
    FourX.Cache = {
        /**
         * Initialize the cache module
         */
        init: function() {
            // Load cache settings
            if (FourX.Settings) {
                config.enabled = FourX.Settings.get('advanced.enableCaching') !== false;
                
                // Set max cache size from settings if available
                const settingsMaxSize = FourX.Settings.get('advanced.maxCacheSize');
                if (settingsMaxSize && !isNaN(parseInt(settingsMaxSize))) {
                    config.maxSize = parseInt(settingsMaxSize);
                }
            }
            
            FourX.debug('Cache module initialized', {
                enabled: config.enabled,
                maxSize: config.maxSize
            });
            
            // Set up periodic cache cleanup
            setInterval(this.cleanup, 10 * 60 * 1000); // Cleanup every 10 minutes
        },
        
        /**
         * Get configuration values
         */
        getConfig: function() {
            return {...config};
        },
        
        /**
         * Update configuration
         * @param {object} newConfig - New configuration values
         */
        updateConfig: function(newConfig) {
            if (!newConfig) return;
            
            if (typeof newConfig.enabled === 'boolean') {
                config.enabled = newConfig.enabled;
            }
            
            if (newConfig.maxSize && !isNaN(parseInt(newConfig.maxSize))) {
                config.maxSize = parseInt(newConfig.maxSize);
            }
            
            if (newConfig.expiryTime && !isNaN(parseInt(newConfig.expiryTime))) {
                config.expiryTime = parseInt(newConfig.expiryTime);
            }
            
            FourX.debug('Cache config updated', config);
        },
        
        /**
         * Get a post from cache
         * @param {string} postId - ID of the post to retrieve
         * @param {string} board - Board the post is from
         * @returns {object|null} The cached post or null if not found
         */
        getPost: function(postId, board) {
            if (!config.enabled) return null;
            
            const cacheKey = `${board || '_'}-${postId}`;
            const cachedItem = _postCache.get(cacheKey);
            
            if (!cachedItem) return null;
            
            // Check if the cache has expired
            if (Date.now() - cachedItem.timestamp > config.expiryTime) {
                _postCache.delete(cacheKey);
                return null;
            }
            
            return cachedItem.data;
        },
        
        /**
         * Store a post in cache
         * @param {object} postData - The post data to cache
         * @param {string} board - Board the post is from
         */
        storePost: function(postData, board) {
            if (!config.enabled || !postData || !postData.id) return;
            
            const cacheKey = `${board || '_'}-${postData.id}`;
            
            // Store with timestamp
            _postCache.set(cacheKey, {
                data: postData,
                timestamp: Date.now()
            });
            
            // Check if we need to prune the cache
            if (_postCache.size > config.maxSize) {
                this.pruneCache(_postCache);
            }
            
            FourX.debug(`Post ${postData.id} cached`);
        },
        
        /**
         * Get a thread from cache
         * @param {string} threadId - ID of the thread to retrieve
         * @param {string} board - Board the thread is from
         * @returns {object|null} The cached thread or null if not found
         */
        getThread: function(threadId, board) {
            if (!config.enabled) return null;
            
            const cacheKey = `${board || '_'}-${threadId}`;
            const cachedItem = _threadCache.get(cacheKey);
            
            if (!cachedItem) return null;
            
            // Thread cache has a shorter expiry time
            if (Date.now() - cachedItem.timestamp > config.threadExpiryTime) {
                _threadCache.delete(cacheKey);
                return null;
            }
            
            return cachedItem.data;
        },
        
        /**
         * Store a thread in cache
         * @param {object} threadData - The thread data to cache
         * @param {string} board - Board the thread is from
         */
        storeThread: function(threadData, board) {
            if (!config.enabled || !threadData || !threadData.id) return;
            
            const cacheKey = `${board || '_'}-${threadData.id}`;
            
            // Store with timestamp
            _threadCache.set(cacheKey, {
                data: threadData,
                timestamp: Date.now()
            });
            
            // Store individual posts from the thread in post cache
            if (threadData.posts && Array.isArray(threadData.posts)) {
                threadData.posts.forEach(post => {
                    this.storePost(post, board);
                });
            }
            
            FourX.debug(`Thread ${threadData.id} cached with ${threadData.posts ? threadData.posts.length : 0} posts`);
        },
        
        /**
         * Cache rendered HTML for a post
         * @param {string} postId - ID of the post
         * @param {string} html - Rendered HTML
         * @param {string} board - Board the post is from
         */
        storeRenderedPost: function(postId, html, board) {
            if (!config.enabled || !postId || !html) return;
            
            const cacheKey = `rendered-${board || '_'}-${postId}`;
            
            _pageCache.set(cacheKey, {
                data: html,
                timestamp: Date.now()
            });
        },
        
        /**
         * Get rendered HTML for a post
         * @param {string} postId - ID of the post
         * @param {string} board - Board the post is from
         * @returns {string|null} The cached HTML or null if not found
         */
        getRenderedPost: function(postId, board) {
            if (!config.enabled) return null;
            
            const cacheKey = `rendered-${board || '_'}-${postId}`;
            const cachedItem = _pageCache.get(cacheKey);
            
            if (!cachedItem) return null;
            
            // Check if the cache has expired
            if (Date.now() - cachedItem.timestamp > config.expiryTime) {
                _pageCache.delete(cacheKey);
                return null;
            }
            
            return cachedItem.data;
        },
        
        /**
         * Clear specific cache entries
         * @param {string} type - Type of cache to clear ('posts', 'threads', 'rendered', 'all')
         */
        clear: function(type = 'all') {
            switch (type) {
                case 'posts':
                    _postCache.clear();
                    FourX.debug('Post cache cleared');
                    break;
                    
                case 'threads':
                    _threadCache.clear();
                    FourX.debug('Thread cache cleared');
                    break;
                    
                case 'rendered':
                    _pageCache.clear();
                    FourX.debug('Rendered post cache cleared');
                    break;
                    
                case 'all':
                default:
                    _postCache.clear();
                    _threadCache.clear();
                    _pageCache.clear();
                    FourX.debug('All caches cleared');
                    break;
            }
        },
        
        /**
         * Prune a cache to the maximum size by removing oldest entries
         * @param {Map} cache - The cache to prune
         */
        pruneCache: function(cache) {
            // Convert to array to sort by timestamp
            const entries = Array.from(cache.entries());
            
            // Sort by timestamp (oldest first)
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            // Calculate how many to remove
            const removeCount = cache.size - config.maxSize;
            
            // Remove oldest entries
            for (let i = 0; i < removeCount; i++) {
                if (entries[i]) {
                    cache.delete(entries[i][0]);
                }
            }
            
            FourX.debug(`Pruned ${removeCount} items from cache`);
        },
        
        /**
         * Clean up expired cache entries
         */
        cleanup: function() {
            if (!config.enabled) return;
            
            const now = Date.now();
            let postExpiredCount = 0;
            let threadExpiredCount = 0;
            let pageExpiredCount = 0;
            
            // Clean up post cache
            for (const [key, value] of _postCache.entries()) {
                if (now - value.timestamp > config.expiryTime) {
                    _postCache.delete(key);
                    postExpiredCount++;
                }
            }
            
            // Clean up thread cache
            for (const [key, value] of _threadCache.entries()) {
                if (now - value.timestamp > config.threadExpiryTime) {
                    _threadCache.delete(key);
                    threadExpiredCount++;
                }
            }
            
            // Clean up page cache
            for (const [key, value] of _pageCache.entries()) {
                if (now - value.timestamp > config.expiryTime) {
                    _pageCache.delete(key);
                    pageExpiredCount++;
                }
            }
            
            // Log cleanup stats if in debug mode
            if (postExpiredCount || threadExpiredCount || pageExpiredCount) {
                FourX.debug('Cache cleanup completed', {
                    posts: {
                        expired: postExpiredCount,
                        remaining: _postCache.size
                    },
                    threads: {
                        expired: threadExpiredCount,
                        remaining: _threadCache.size
                    },
                    rendered: {
                        expired: pageExpiredCount,
                        remaining: _pageCache.size
                    }
                });
            }
        },
        
        /**
         * Get cache statistics
         * @returns {object} Cache statistics
         */
        getStats: function() {
            return {
                enabled: config.enabled,
                posts: {
                    size: _postCache.size,
                    maxSize: config.maxSize
                },
                threads: {
                    size: _threadCache.size
                },
                rendered: {
                    size: _pageCache.size
                }
            };
        }
    };
})(); 