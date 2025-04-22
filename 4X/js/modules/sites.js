/**
 * Site-specific adapters for different archive sites
 * Handles different DOM structures and site-specific behaviors
 */
(function() {
    // Initialize namespace if it doesn't exist
    if (!window.FourX) window.FourX = {};
    
    // Sites module
    FourX.Sites = {
        // Current site adapter
        currentAdapter: null,
        
        /**
         * Initialize the sites module
         */
        init: function() {
            // Determine the current site and initialize the appropriate adapter
            const domain = window.location.hostname;
            
            // Find matching adapter
            for (const siteKey in this.adapters) {
                const adapter = this.adapters[siteKey];
                if (adapter.matches(domain)) {
                    this.currentAdapter = adapter;
                    FourX.debug(`Using ${siteKey} site adapter`);
                    
                    // Initialize the adapter
                    adapter.init();
                    return;
                }
            }
            
            // Fallback to generic adapter if no specific one matches
            this.currentAdapter = this.adapters.generic;
            FourX.debug('Using generic site adapter');
            this.currentAdapter.init();
        },
        
        /**
         * Get the current adapter
         * @returns {object} The current site adapter
         */
        getCurrentAdapter: function() {
            return this.currentAdapter;
        },
        
        /**
         * Site-specific adapters
         */
        adapters: {
            /**
             * 4plebs archive adapter
             */
            fourPlebs: {
                matches: function(domain) {
                    return domain.includes('4plebs.org');
                },
                
                init: function() {
                    // Add any site-specific initialization here
                },
                
                // Get the appropriate post selector for this site
                getPostSelector: function() {
                    return '.post';
                },
                
                // Get the appropriate quote link selector for this site
                getQuoteLinkSelector: function() {
                    return '.quotelink';
                },
                
                // Extract post ID from an element
                extractPostId: function(element) {
                    if (!element) return null;
                    
                    if (element.id && element.id.startsWith('p')) {
                        return element.id.substring(1);
                    }
                    
                    return null;
                },
                
                // Get the post message container from a post element
                getPostMessageElement: function(postElement) {
                    if (!postElement) return null;
                    return postElement.querySelector('.text');
                },
                
                // Get the image container from a post element
                getPostImageElement: function(postElement) {
                    if (!postElement) return null;
                    return postElement.querySelector('.img-container img');
                },
                
                // Get the post author container from a post element
                getPostAuthorElement: function(postElement) {
                    if (!postElement) return null;
                    return postElement.querySelector('.name');
                },
                
                // Add a backlink section to a post
                addBacklinkSection: function(postElement) {
                    if (!postElement) return null;
                    
                    // Check if backlink section already exists
                    let backlinkSection = postElement.querySelector('.backlink-section');
                    if (backlinkSection) return backlinkSection;
                    
                    // Create new backlink section
                    backlinkSection = document.createElement('div');
                    backlinkSection.className = 'backlink-section';
                    
                    // Find where to append (after header, before text)
                    const postText = this.getPostMessageElement(postElement);
                    if (postText && postText.parentNode) {
                        postText.parentNode.insertBefore(backlinkSection, postText);
                    } else {
                        postElement.appendChild(backlinkSection);
                    }
                    
                    return backlinkSection;
                },
                
                // Get the post API URL
                getPostApiUrl: function(postId, board) {
                    return `//archive.4plebs.org/_/api/chan/post/?board=${board}&num=${postId}`;
                },
                
                // Get the thread API URL
                getThreadApiUrl: function(threadId, board) {
                    return `//archive.4plebs.org/_/api/chan/thread/?board=${board}&num=${threadId}`;
                },
                
                // Parse API response into post data
                parsePostApiResponse: function(data) {
                    if (!data || !data.posts || data.posts.length === 0) {
                        throw new Error('Invalid API response');
                    }
                    
                    const post = data.posts[0];
                    return {
                        id: post.num,
                        threadId: post.thread_num,
                        board: post.board,
                        author: post.name,
                        tripcode: post.trip,
                        timestamp: post.timestamp,
                        comment: post.comment,
                        media: post.media && post.media.media_link ? {
                            url: post.media.media_link,
                            thumb: post.media.thumb_link,
                            filename: post.media.media_filename,
                            dimensions: `${post.media.media_w}x${post.media.media_h}`
                        } : null
                    };
                }
            },
            
            /**
             * FoolFuuka-based archives (desuarchive, archive.loveisover.me, etc.)
             */
            foolFuuka: {
                matches: function(domain) {
                    return domain.includes('desuarchive.org') || 
                           domain.includes('loveisover.me') || 
                           domain.includes('archived.moe') ||
                           domain.includes('thebarchive.com') ||
                           domain.includes('b4k.co');
                },
                
                init: function() {
                    // Add any site-specific initialization here
                },
                
                // Get the appropriate post selector for this site
                getPostSelector: function() {
                    return '.post';
                },
                
                // Get the appropriate quote link selector for this site
                getQuoteLinkSelector: function() {
                    return '.postlink';
                },
                
                // Extract post ID from an element
                extractPostId: function(element) {
                    if (!element) return null;
                    
                    if (element.id && element.id.startsWith('p')) {
                        return element.id.substring(1);
                    }
                    
                    if (element.hasAttribute('data-post-id')) {
                        return element.getAttribute('data-post-id');
                    }
                    
                    return null;
                },
                
                // Get the post message container from a post element
                getPostMessageElement: function(postElement) {
                    if (!postElement) return null;
                    return postElement.querySelector('.text');
                },
                
                // Get the image container from a post element
                getPostImageElement: function(postElement) {
                    if (!postElement) return null;
                    return postElement.querySelector('.post_file_image img');
                },
                
                // Get the post author container from a post element
                getPostAuthorElement: function(postElement) {
                    if (!postElement) return null;
                    return postElement.querySelector('.name');
                },
                
                // Add a backlink section to a post
                addBacklinkSection: function(postElement) {
                    if (!postElement) return null;
                    
                    // Check if backlink section already exists
                    let backlinkSection = postElement.querySelector('.backlink-section');
                    if (backlinkSection) return backlinkSection;
                    
                    // Create new backlink section
                    backlinkSection = document.createElement('div');
                    backlinkSection.className = 'backlink-section';
                    
                    // Find where to append (after header, before text)
                    const postText = this.getPostMessageElement(postElement);
                    if (postText && postText.parentNode) {
                        postText.parentNode.insertBefore(backlinkSection, postText);
                    } else {
                        postElement.appendChild(backlinkSection);
                    }
                    
                    return backlinkSection;
                },
                
                // Get the post API URL
                getPostApiUrl: function(postId, board) {
                    return `//${window.location.host}/_/api/chan/post/?board=${board}&num=${postId}`;
                },
                
                // Get the thread API URL
                getThreadApiUrl: function(threadId, board) {
                    return `//${window.location.host}/_/api/chan/thread/?board=${board}&num=${threadId}`;
                },
                
                // Parse API response into post data
                parsePostApiResponse: function(data) {
                    if (!data || !data.posts || data.posts.length === 0) {
                        throw new Error('Invalid API response');
                    }
                    
                    const post = data.posts[0];
                    return {
                        id: post.num,
                        threadId: post.thread_num,
                        board: post.board,
                        author: post.name,
                        tripcode: post.trip,
                        timestamp: post.timestamp,
                        comment: post.comment,
                        media: post.media && post.media.media_link ? {
                            url: post.media.media_link,
                            thumb: post.media.thumb_link,
                            filename: post.media.media_filename,
                            dimensions: `${post.media.media_w}x${post.media.media_h}`
                        } : null
                    };
                }
            },
            
            /**
             * 4chan adapter
             */
            fourChan: {
                matches: function(domain) {
                    return domain.includes('4chan.org') || domain.includes('4channel.org');
                },
                
                init: function() {
                    // Add any site-specific initialization here
                },
                
                // Get the appropriate post selector for this site
                getPostSelector: function() {
                    return '.post';
                },
                
                // Get the appropriate quote link selector for this site
                getQuoteLinkSelector: function() {
                    return '.quotelink';
                },
                
                // Extract post ID from an element
                extractPostId: function(element) {
                    if (!element) return null;
                    
                    if (element.id && element.id.startsWith('p')) {
                        return element.id.substring(1);
                    }
                    
                    if (element.hasAttribute('data-post')) {
                        return element.getAttribute('data-post');
                    }
                    
                    return null;
                },
                
                // Get the post message container from a post element
                getPostMessageElement: function(postElement) {
                    if (!postElement) return null;
                    return postElement.querySelector('.postMessage');
                },
                
                // Get the image container from a post element
                getPostImageElement: function(postElement) {
                    if (!postElement) return null;
                    return postElement.querySelector('.fileThumb img');
                },
                
                // Get the post author container from a post element
                getPostAuthorElement: function(postElement) {
                    if (!postElement) return null;
                    return postElement.querySelector('.nameBlock .name');
                },
                
                // Add a backlink section to a post
                addBacklinkSection: function(postElement) {
                    if (!postElement) return null;
                    
                    // Check if backlink section already exists
                    let backlinkSection = postElement.querySelector('.backlink-section');
                    if (backlinkSection) return backlinkSection;
                    
                    // Create new backlink section
                    backlinkSection = document.createElement('div');
                    backlinkSection.className = 'backlink-section';
                    
                    // Find where to append (after post info, before message)
                    const postMessage = this.getPostMessageElement(postElement);
                    if (postMessage && postMessage.parentNode) {
                        postMessage.parentNode.insertBefore(backlinkSection, postMessage);
                    } else {
                        postElement.appendChild(backlinkSection);
                    }
                    
                    return backlinkSection;
                },
                
                // Get the post API URL (4chan doesn't have a post API, so we use the thread API)
                getPostApiUrl: function(postId, board) {
                    // Get thread ID from the URL
                    const match = window.location.pathname.match(/\/thread\/(\d+)/);
                    const threadId = match ? match[1] : null;
                    
                    if (!threadId) {
                        throw new Error('Could not determine thread ID');
                    }
                    
                    return `//a.4cdn.org/${board}/thread/${threadId}.json`;
                },
                
                // Get the thread API URL
                getThreadApiUrl: function(threadId, board) {
                    return `//a.4cdn.org/${board}/thread/${threadId}.json`;
                },
                
                // Parse API response into post data (for a specific post)
                parsePostApiResponse: function(data, targetPostId) {
                    if (!data || !data.posts || data.posts.length === 0) {
                        throw new Error('Invalid API response');
                    }
                    
                    // Find the specific post
                    const post = data.posts.find(p => p.no.toString() === targetPostId.toString());
                    if (!post) {
                        throw new Error(`Post ${targetPostId} not found in thread`);
                    }
                    
                    return {
                        id: post.no,
                        threadId: data.posts[0].no, // OP's post ID is the thread ID
                        board: board,
                        author: post.name,
                        tripcode: post.trip,
                        timestamp: post.time * 1000, // Convert to milliseconds
                        comment: post.com,
                        media: post.filename ? {
                            url: `//i.4cdn.org/${board}/${post.tim}${post.ext}`,
                            thumb: `//i.4cdn.org/${board}/${post.tim}s.jpg`,
                            filename: post.filename + post.ext,
                            dimensions: `${post.w}x${post.h}`
                        } : null
                    };
                }
            },
            
            /**
             * Fireden adapter
             */
            fireden: {
                matches: function(domain) {
                    return domain.includes('fireden.net');
                },
                
                init: function() {
                    // Add any site-specific initialization here
                },
                
                // Get the appropriate post selector for this site
                getPostSelector: function() {
                    return '.post';
                },
                
                // Get the appropriate quote link selector for this site
                getQuoteLinkSelector: function() {
                    return '.quotelink';
                },
                
                // Extract post ID from an element
                extractPostId: function(element) {
                    if (!element) return null;
                    
                    if (element.id && element.id.startsWith('p')) {
                        return element.id.substring(1);
                    }
                    
                    if (element.hasAttribute('data-id')) {
                        return element.getAttribute('data-id');
                    }
                    
                    return null;
                },
                
                // Get the post message container from a post element
                getPostMessageElement: function(postElement) {
                    if (!postElement) return null;
                    return postElement.querySelector('.post_body');
                },
                
                // Get the image container from a post element
                getPostImageElement: function(postElement) {
                    if (!postElement) return null;
                    return postElement.querySelector('.post_file img');
                },
                
                // Get the post author container from a post element
                getPostAuthorElement: function(postElement) {
                    if (!postElement) return null;
                    return postElement.querySelector('.post_author');
                },
                
                // Add a backlink section to a post
                addBacklinkSection: function(postElement) {
                    if (!postElement) return null;
                    
                    // Check if backlink section already exists
                    let backlinkSection = postElement.querySelector('.backlink-section');
                    if (backlinkSection) return backlinkSection;
                    
                    // Create new backlink section
                    backlinkSection = document.createElement('div');
                    backlinkSection.className = 'backlink-section';
                    
                    // Find where to append (after post header, before body)
                    const postBody = this.getPostMessageElement(postElement);
                    if (postBody && postBody.parentNode) {
                        postBody.parentNode.insertBefore(backlinkSection, postBody);
                    } else {
                        postElement.appendChild(backlinkSection);
                    }
                    
                    return backlinkSection;
                },
                
                // Get the post API URL (Fireden doesn't have a typical API, so we use the HTML page)
                getPostApiUrl: function(postId, board) {
                    return `//boards.fireden.net/${board}/thread/${postId}/#${postId}`;
                },
                
                // Get the thread API URL
                getThreadApiUrl: function(threadId, board) {
                    return `//boards.fireden.net/${board}/thread/${threadId}/`;
                },
                
                // Parse HTML response into post data (for a specific post)
                // Note: This would require HTML parsing, which is more complex
                parsePostApiResponse: function(html, targetPostId) {
                    throw new Error('Direct HTML parsing is not supported. Use a DOM parser instead.');
                }
            },
            
            /**
             * Warosu adapter
             */
            warosu: {
                matches: function(domain) {
                    return domain.includes('warosu.org');
                },
                
                init: function() {
                    // Add any site-specific initialization here
                },
                
                // Get the appropriate post selector for this site
                getPostSelector: function() {
                    return '.post';
                },
                
                // Get the appropriate quote link selector for this site
                getQuoteLinkSelector: function() {
                    return '.posterquote';
                },
                
                // Extract post ID from an element
                extractPostId: function(element) {
                    if (!element) return null;
                    
                    if (element.id && element.id.startsWith('p')) {
                        return element.id.substring(1);
                    }
                    
                    if (element.hasAttribute('data-id')) {
                        return element.getAttribute('data-id');
                    }
                    
                    return null;
                },
                
                // Get the post message container from a post element
                getPostMessageElement: function(postElement) {
                    if (!postElement) return null;
                    return postElement.querySelector('.postbody');
                },
                
                // Get the image container from a post element
                getPostImageElement: function(postElement) {
                    if (!postElement) return null;
                    return postElement.querySelector('.img-container img');
                },
                
                // Get the post author container from a post element
                getPostAuthorElement: function(postElement) {
                    if (!postElement) return null;
                    return postElement.querySelector('.postername');
                },
                
                // Add a backlink section to a post
                addBacklinkSection: function(postElement) {
                    if (!postElement) return null;
                    
                    // Check if backlink section already exists
                    let backlinkSection = postElement.querySelector('.backlink-section');
                    if (backlinkSection) return backlinkSection;
                    
                    // Create new backlink section
                    backlinkSection = document.createElement('div');
                    backlinkSection.className = 'backlink-section';
                    
                    // Find where to append (after header, before message)
                    const postBody = this.getPostMessageElement(postElement);
                    if (postBody && postBody.parentNode) {
                        postBody.parentNode.insertBefore(backlinkSection, postBody);
                    } else {
                        postElement.appendChild(backlinkSection);
                    }
                    
                    return backlinkSection;
                },
                
                // Warosu doesn't have a public API, so we'll just fetch the thread HTML
                getPostApiUrl: function(postId, board) {
                    return `//warosu.org/${board}/thread/${postId}`;
                },
                
                getThreadApiUrl: function(threadId, board) {
                    return `//warosu.org/${board}/thread/${threadId}`;
                },
                
                // Parse HTML response into post data (for a specific post)
                // Note: This would require HTML parsing, which is more complex
                parsePostApiResponse: function(html, targetPostId) {
                    throw new Error('Direct HTML parsing is not supported. Use a DOM parser instead.');
                }
            },
            
            /**
             * Generic adapter as fallback
             */
            generic: {
                matches: function(domain) {
                    // Always matches as a fallback
                    return true;
                },
                
                init: function() {
                    // No specific initialization
                },
                
                // Get the appropriate post selector for this site
                getPostSelector: function() {
                    // Try different post selector patterns
                    const selectors = ['.post', '.postContainer', '.post-container', '[id^="p"]'];
                    for (const selector of selectors) {
                        if (document.querySelector(selector)) {
                            return selector;
                        }
                    }
                    return '.post';
                },
                
                // Get the appropriate quote link selector for this site
                getQuoteLinkSelector: function() {
                    // Try different quote link selector patterns
                    const selectors = ['.quotelink', '.postlink', '.posterquote', 'a[href*="#p"]'];
                    for (const selector of selectors) {
                        if (document.querySelector(selector)) {
                            return selector;
                        }
                    }
                    return 'a[href*="#p"]';
                },
                
                // Extract post ID from an element
                extractPostId: function(element) {
                    if (!element) return null;
                    
                    // Try different ID patterns
                    if (element.id) {
                        if (element.id.startsWith('p')) {
                            return element.id.substring(1);
                        }
                        
                        const match = element.id.match(/\d+/);
                        if (match) {
                            return match[0];
                        }
                    }
                    
                    // Try data attributes
                    for (const attr of ['data-post-id', 'data-id', 'data-post']) {
                        if (element.hasAttribute(attr)) {
                            return element.getAttribute(attr);
                        }
                    }
                    
                    return null;
                },
                
                // Get the post message container from a post element
                getPostMessageElement: function(postElement) {
                    if (!postElement) return null;
                    
                    // Try different post message selectors
                    const selectors = [
                        '.text', '.post_body', '.postMessage', '.post-message', 
                        '.body', '.message', '.postbody'
                    ];
                    
                    for (const selector of selectors) {
                        const element = postElement.querySelector(selector);
                        if (element) {
                            return element;
                        }
                    }
                    
                    return null;
                },
                
                // Get the image container from a post element
                getPostImageElement: function(postElement) {
                    if (!postElement) return null;
                    
                    // Try different image selectors
                    const selectors = [
                        '.img-container img', '.post_file_image img', '.fileThumb img', 
                        '.post_file img', '.post_image', '.post-image', 'img.post-image'
                    ];
                    
                    for (const selector of selectors) {
                        const element = postElement.querySelector(selector);
                        if (element) {
                            return element;
                        }
                    }
                    
                    return null;
                },
                
                // Get the post author container from a post element
                getPostAuthorElement: function(postElement) {
                    if (!postElement) return null;
                    
                    // Try different author selectors
                    const selectors = [
                        '.name', '.post_author', '.postername', '.author', 
                        '.nameBlock .name', '.post_author_name'
                    ];
                    
                    for (const selector of selectors) {
                        const element = postElement.querySelector(selector);
                        if (element) {
                            return element;
                        }
                    }
                    
                    return null;
                },
                
                // Add a backlink section to a post
                addBacklinkSection: function(postElement) {
                    if (!postElement) return null;
                    
                    // Check if backlink section already exists
                    let backlinkSection = postElement.querySelector('.backlink-section');
                    if (backlinkSection) return backlinkSection;
                    
                    // Create new backlink section
                    backlinkSection = document.createElement('div');
                    backlinkSection.className = 'backlink-section';
                    
                    // Find the post message element
                    const postMessage = this.getPostMessageElement(postElement);
                    if (postMessage && postMessage.parentNode) {
                        postMessage.parentNode.insertBefore(backlinkSection, postMessage);
                    } else {
                        postElement.appendChild(backlinkSection);
                    }
                    
                    return backlinkSection;
                },
                
                // Generic API methods - these won't work for all sites but serve as placeholders
                getPostApiUrl: function(postId, board) {
                    return null; // Cannot provide a generic API URL
                },
                
                getThreadApiUrl: function(threadId, board) {
                    return null; // Cannot provide a generic API URL
                },
                
                parsePostApiResponse: function(data, targetPostId) {
                    throw new Error('No API supported for this site');
                }
            }
        }
    };
})(); 