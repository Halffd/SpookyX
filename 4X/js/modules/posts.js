/**
 * Posts module for handling post expansion, quotes, backlinks and highlighting
 * Handles the core functionality of expanding posts, managing quotes and backlinks
 */
(function() {
    // Initialize namespace if it doesn't exist
    if (!window.FourX) window.FourX = {};
    
    // Posts module
    FourX.Posts = {
        // Store for processed posts
        cache: {},
        // Backlink mappings (postId -> array of posts that quote it)
        backlinks: {},
        // Store for posts data retrieved from API
        postsData: {},
        // Store for your posts
        yourPosts: [],
        // Track last seen posts for notifications
        lastSeen: {},
        // Track expanded posts on current page
        expandedPosts: new Set(),

        /**
         * Initialize posts module
         */
        init: function() {
            // Load your posts from storage
            this.loadYourPosts();
            
            // Setup post-related event listeners
            this.setupEventListeners();
            
            // Process existing quotes on the page
            this.processExistingPosts();
            
            // Listen for new posts if on a live thread
            if (document.querySelector('.thread-stats')) {
                this.setupLiveThreadListeners();
            }
        },
        
        /**
         * Load posts marked as "yours" from storage
         */
        loadYourPosts: function() {
            chrome.runtime.sendMessage({action: "getYourPosts"}, response => {
                if (response && response.yourPosts) {
                    this.yourPosts = response.yourPosts;
                    // Highlight your posts on the page
                    this.highlightYourPosts();
                }
            });
        },
        
        /**
         * Setup event listeners for post-related actions
         */
        setupEventListeners: function() {
            // Global click listener for quotes
            document.addEventListener('click', event => {
                const quoteLink = event.target.closest('.quotelink');
                if (quoteLink && !event.ctrlKey && !event.metaKey) {
                    event.preventDefault();
                    const postId = FourX.Utils.extractPostId(quoteLink.getAttribute('href') || quoteLink.textContent);
                    if (postId) {
                        this.expandPost(postId, quoteLink);
                    }
                }
                
                // Handle backlink clicks
                const backlink = event.target.closest('.backlink');
                if (backlink && !event.ctrlKey && !event.metaKey) {
                    event.preventDefault();
                    const postId = FourX.Utils.extractPostId(backlink.getAttribute('data-post-id') || backlink.textContent);
                    if (postId) {
                        this.scrollToPost(postId);
                    }
                }
                
                // Handle closing expanded posts
                const closeBtn = event.target.closest('.close-post-btn');
                if (closeBtn) {
                    const expandedPost = closeBtn.closest('.expanded-post');
                    if (expandedPost) {
                        expandedPost.remove();
                        const postId = expandedPost.getAttribute('data-post-id');
                        this.expandedPosts.delete(postId);
                    }
                }
                
                // Handle marking post as yours
                const yourPostBtn = event.target.closest('.mark-as-yours');
                if (yourPostBtn) {
                    const postContainer = yourPostBtn.closest('.post');
                    if (postContainer) {
                        const postId = postContainer.id.replace('p', '');
                        this.toggleYourPost(postId);
                    }
                }
            });
            
            // Right-click menu for posts
            document.addEventListener('contextmenu', event => {
                const post = event.target.closest('.post');
                if (post && FourX.Settings.get('general.enableRightClickMenu')) {
                    const postId = post.id.replace('p', '');
                    this.showPostMenu(event, postId);
                    event.preventDefault();
                }
            });
        },
        
        /**
         * Process existing quotes on the page
         */
        processExistingPosts: function() {
            // Gather all posts on the page
            const posts = document.querySelectorAll('.post');
            
            // Process each post to find quotes and build backlink index
            posts.forEach(post => {
                const postId = post.id.replace('p', '');
                
                // Find all quote links in this post
                const quoteLinks = post.querySelectorAll('.quotelink');
                quoteLinks.forEach(link => {
                    const quotedId = FourX.Utils.extractPostId(link.getAttribute('href') || link.textContent);
                    if (quotedId) {
                        // Add to backlinks index
                        if (!this.backlinks[quotedId]) {
                            this.backlinks[quotedId] = [];
                        }
                        if (!this.backlinks[quotedId].includes(postId)) {
                            this.backlinks[quotedId].push(postId);
                        }
                    }
                });
                
                // Add backlink section to each post if it has backlinks
                if (this.backlinks[postId] && this.backlinks[postId].length > 0) {
                    this.addBacklinkSection(postId);
                }
            });
            
            // Apply keyword highlighting if enabled
            if (FourX.Settings.get('postProcessing.enableHighlighting')) {
                this.applyKeywordHighlighting();
            }
            
            // Auto-expand posts if setting is enabled
            if (FourX.Settings.get('postProcessing.autoExpandQuotes')) {
                this.autoExpandQuotes();
            }
        },
        
        /**
         * Add backlink section to a post
         * @param {string} postId - The ID of the post to add backlinks to
         */
        addBacklinkSection: function(postId) {
            const post = document.getElementById(`p${postId}`);
            if (!post) return;
            
            let backlinkSection = post.querySelector('.backlink-section');
            if (!backlinkSection) {
                backlinkSection = document.createElement('div');
                backlinkSection.className = 'backlink-section';
                backlinkSection.innerHTML = '<span class="backlinks-title">Replies:</span> ';
                
                // Find where to insert the backlink section (before .post-message or at the end)
                const postMessage = post.querySelector('.post-message');
                if (postMessage) {
                    postMessage.parentNode.insertBefore(backlinkSection, postMessage);
                } else {
                    post.appendChild(backlinkSection);
                }
            }
            
            // Add all backlinks
            this.backlinks[postId].forEach(replyId => {
                if (!backlinkSection.querySelector(`[data-post-id="${replyId}"]`)) {
                    const backlink = document.createElement('a');
                    backlink.className = 'backlink';
                    backlink.textContent = `>>${replyId}`;
                    backlink.setAttribute('data-post-id', replyId);
                    backlink.href = `#p${replyId}`;
                    
                    backlinkSection.appendChild(document.createTextNode(' '));
                    backlinkSection.appendChild(backlink);
                }
            });
        },
        
        /**
         * Expand a post inline
         * @param {string} postId - ID of the post to expand
         * @param {Element} quoteLink - The quote link element that was clicked
         */
        expandPost: function(postId, quoteLink) {
            // Check if the post is already on the page
            const existingPost = document.getElementById(`p${postId}`);
            
            if (existingPost) {
                // Post is on the page, scroll to it and highlight it
                this.scrollToPost(postId);
                return;
            }
            
            // Check if the post is already expanded under this quote link
            const parentContainer = quoteLink.closest('.post, .expanded-post');
            if (parentContainer) {
                const alreadyExpanded = parentContainer.querySelector(`.expanded-post[data-post-id="${postId}"]`);
                if (alreadyExpanded) {
                    // Remove it if it's already expanded (toggle behavior)
                    alreadyExpanded.remove();
                    this.expandedPosts.delete(postId);
                    return;
                }
            }
            
            // Check if we already have this post in cache
            if (this.cache[postId]) {
                this.insertExpandedPost(this.cache[postId], quoteLink);
                return;
            }
            
            // We need to fetch the post
            this.fetchPost(postId).then(postHTML => {
                if (postHTML) {
                    // Cache the result
                    this.cache[postId] = postHTML;
                    this.insertExpandedPost(postHTML, quoteLink);
                } else {
                    this.showErrorMessage(quoteLink, `Failed to load post ${postId}`);
                }
            }).catch(error => {
                FourX.Debug.error('Error expanding post:', error);
                this.showErrorMessage(quoteLink, `Error loading post ${postId}`);
            });
        },
        
        /**
         * Insert expanded post into the page
         * @param {string} postHTML - The HTML of the post to insert
         * @param {Element} quoteLink - The quote link element that was clicked
         */
        insertExpandedPost: function(postHTML, quoteLink) {
            // Create container for expanded post
            const expandedPost = document.createElement('div');
            expandedPost.className = 'expanded-post';
            
            // Parse the post HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(postHTML, 'text/html');
            
            // Extract post content
            const post = doc.querySelector('.post');
            if (!post) {
                this.showErrorMessage(quoteLink, 'Invalid post data received');
                return;
            }
            
            const postId = post.id.replace('p', '');
            expandedPost.setAttribute('data-post-id', postId);
            
            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-post-btn';
            closeBtn.textContent = '×';
            expandedPost.appendChild(closeBtn);
            
            // Add post content
            expandedPost.appendChild(post);
            
            // Find where to insert the expanded post
            const parentContainer = quoteLink.closest('.post, .expanded-post');
            if (!parentContainer) return;
            
            // Insert after the quotelink's containing element (post or expanded post)
            parentContainer.appendChild(expandedPost);
            
            // Track expanded posts
            this.expandedPosts.add(postId);
            
            // Find any quote links in the expanded post and make them expandable too
            const newQuoteLinks = expandedPost.querySelectorAll('.quotelink');
            newQuoteLinks.forEach(link => {
                // We don't do anything here because the global click handler will handle these
                // But we could pre-process them if needed
            });
            
            // Apply highlighting if needed
            if (FourX.Settings.get('postProcessing.enableHighlighting')) {
                this.applyKeywordHighlighting(expandedPost);
            }
        },
        
        /**
         * Fetch a post from the API
         * @param {string} postId - ID of the post to fetch
         * @returns {Promise<string>} - HTML of the post or null if not found
         */
        fetchPost: function(postId) {
            return new Promise((resolve, reject) => {
                const board = FourX.Utils.getCurrentBoard();
                const apiUrl = this.getPostApiUrl(postId, board);
                
                // Show loading indicator
                FourX.UI.showNotification(`Loading post ${postId}...`, 'loading');
                
                fetch(apiUrl)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`API returned ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        // Store post data
                        this.postsData[postId] = data;
                        
                        // Convert API data to HTML
                        const postHTML = this.convertApiDataToHtml(data, postId);
                        resolve(postHTML);
                        
                        // Hide loading notification
                        FourX.UI.hideNotification();
                    })
                    .catch(error => {
                        FourX.Debug.error(`Error fetching post ${postId}:`, error);
                        FourX.UI.showNotification(`Error loading post ${postId}`, 'error');
                        resolve(null); // Resolve with null to prevent breaking the chain
                    });
            });
        },
        
        /**
         * Get API URL for a specific post
         * @param {string} postId - ID of the post to fetch
         * @param {string} board - Board the post is on
         * @returns {string} - API URL
         */
        getPostApiUrl: function(postId, board) {
            // This will need to be adjusted based on the specific archive's API
            const domain = window.location.hostname;
            
            // Different archives have different API endpoints
            if (domain.includes('4plebs.org')) {
                return `https://archive.4plebs.org/_/api/chan/post/?board=${board}&num=${postId}`;
            } else if (domain.includes('desuarchive.org')) {
                return `https://desuarchive.org/_/api/chan/post/?board=${board}&num=${postId}`;
            } else {
                // Default format - many archives follow a similar pattern
                return `https://${domain}/_/api/chan/post/?board=${board}&num=${postId}`;
            }
        },
        
        /**
         * Convert API data to HTML
         * @param {Object} data - API response data
         * @param {string} postId - ID of the post
         * @returns {string} - HTML representation of the post
         */
        convertApiDataToHtml: function(data, postId) {
            if (!data || !data.posts || !data.posts[0]) {
                return null;
            }
            
            const post = data.posts[0];
            const board = post.board || FourX.Utils.getCurrentBoard();
            const name = post.name || 'Anonymous';
            const subject = post.sub || '';
            const comment = post.com || '';
            const date = post.now || '';
            const hasImage = !!post.tim;
            
            let html = `<div id="p${postId}" class="post">`;
            
            // Post info section
            html += `<div class="post-info">`;
            if (subject) {
                html += `<span class="subject">${subject}</span>`;
            }
            html += `<span class="name">${name}</span>`;
            html += `<span class="date">${date}</span>`;
            html += `<span class="post-number">No.${postId}</span>`;
            html += `</div>`;
            
            // Post image if present
            if (hasImage) {
                const fileUrl = this.getImageUrl(post);
                const thumbUrl = this.getThumbnailUrl(post);
                const fileExt = post.ext || '.jpg';
                const fileSize = this.formatFileSize(post.fsize);
                const fileName = post.filename + fileExt;
                const fileWidth = post.w || 0;
                const fileHeight = post.h || 0;
                
                html += `<div class="post-file">`;
                html += `<div class="file-info">File: <a href="${fileUrl}" target="_blank">${fileName}</a> (${fileSize}, ${fileWidth}x${fileHeight})</div>`;
                html += `<a href="${fileUrl}" target="_blank" class="file-link">`;
                html += `<img src="${thumbUrl}" alt="${fileName}" class="post-image" loading="lazy">`;
                html += `</a>`;
                html += `</div>`;
            }
            
            // Post message
            html += `<div class="post-message">${comment}</div>`;
            
            html += `</div>`;
            
            return html;
        },
        
        /**
         * Get full image URL from post data
         * @param {Object} post - Post data
         * @returns {string} - Image URL
         */
        getImageUrl: function(post) {
            const domain = window.location.hostname;
            const board = post.board || FourX.Utils.getCurrentBoard();
            
            if (!post.tim || !post.ext) return '';
            
            // Different archives have different image URL structures
            if (domain.includes('4plebs.org')) {
                return `https://img.4plebs.org/${board}/image/${post.tim}${post.ext}`;
            } else if (domain.includes('desuarchive.org')) {
                return `https://desu-img.bne.jp/${board}/image/${post.tim}${post.ext}`;
            } else {
                // Default format - many archives follow a similar pattern
                return `https://${domain.replace('archive', 'img')}/${board}/image/${post.tim}${post.ext}`;
            }
        },
        
        /**
         * Get thumbnail URL from post data
         * @param {Object} post - Post data
         * @returns {string} - Thumbnail URL
         */
        getThumbnailUrl: function(post) {
            const domain = window.location.hostname;
            const board = post.board || FourX.Utils.getCurrentBoard();
            
            if (!post.tim || !post.ext) return '';
            
            // Different archives have different thumbnail URL structures
            if (domain.includes('4plebs.org')) {
                return `https://img.4plebs.org/${board}/thumb/${post.tim}s.jpg`;
            } else if (domain.includes('desuarchive.org')) {
                return `https://desu-img.bne.jp/${board}/thumb/${post.tim}s.jpg`;
            } else {
                // Default format - many archives follow a similar pattern
                return `https://${domain.replace('archive', 'img')}/${board}/thumb/${post.tim}s.jpg`;
            }
        },
        
        /**
         * Format file size in human-readable format
         * @param {number} bytes - File size in bytes
         * @returns {string} - Formatted file size
         */
        formatFileSize: function(bytes) {
            if (!bytes) return '0 B';
            
            const units = ['B', 'KB', 'MB', 'GB'];
            let i = 0;
            while (bytes >= 1024 && i < units.length - 1) {
                bytes /= 1024;
                i++;
            }
            
            return `${bytes.toFixed(1)} ${units[i]}`;
        },
        
        /**
         * Show error message below a quote link
         * @param {Element} quoteLink - The quote link element
         * @param {string} message - Error message to display
         */
        showErrorMessage: function(quoteLink, message) {
            const errorElement = document.createElement('div');
            errorElement.className = 'post-error';
            errorElement.textContent = message;
            
            // Insert after the quote link
            quoteLink.parentNode.insertBefore(errorElement, quoteLink.nextSibling);
            
            // Remove after 5 seconds
            setTimeout(() => {
                errorElement.remove();
            }, 5000);
        },
        
        /**
         * Scroll to a post and highlight it
         * @param {string} postId - ID of the post to scroll to
         */
        scrollToPost: function(postId) {
            const post = document.getElementById(`p${postId}`);
            if (!post) return;
            
            // Scroll to post
            post.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight the post
            post.classList.add('highlight');
            setTimeout(() => {
                post.classList.remove('highlight');
            }, 2000);
        },
        
        /**
         * Apply keyword highlighting to posts
         * @param {Element} container - Optional container to limit scope (for expanded posts)
         */
        applyKeywordHighlighting: function(container = document) {
            const keywords = FourX.Settings.get('postProcessing.highlightKeywords') || [];
            if (!keywords.length) return;
            
            const posts = container.querySelectorAll('.post-message');
            posts.forEach(post => {
                // Skip if already processed
                if (post.getAttribute('data-highlighted') === 'true') return;
                
                let html = post.innerHTML;
                keywords.forEach(keyword => {
                    if (!keyword.trim()) return;
                    
                    // Escape regex special characters
                    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
                    
                    // Replace with highlighted span
                    html = html.replace(regex, '<span class="keyword-highlight">$1</span>');
                });
                
                post.innerHTML = html;
                post.setAttribute('data-highlighted', 'true');
            });
        },
        
        /**
         * Auto-expand quotes when the page loads
         */
        autoExpandQuotes: function() {
            if (!FourX.Settings.get('postProcessing.autoExpandQuotes')) return;
            
            // Get the maximum number of quotes to auto-expand
            const maxQuotes = FourX.Settings.get('postProcessing.maxAutoExpand') || 5;
            let expandedCount = 0;
            
            const quoteLinks = document.querySelectorAll('.quotelink');
            quoteLinks.forEach(link => {
                if (expandedCount >= maxQuotes) return;
                
                const postId = FourX.Utils.extractPostId(link.getAttribute('href') || link.textContent);
                if (postId && !this.expandedPosts.has(postId)) {
                    // Only auto-expand if not already on page
                    const existingPost = document.getElementById(`p${postId}`);
                    if (!existingPost) {
                        this.expandPost(postId, link);
                        expandedCount++;
                    }
                }
            });
        },
        
        /**
         * Toggle marking a post as "yours"
         * @param {string} postId - ID of the post to mark/unmark
         */
        toggleYourPost: function(postId) {
            const index = this.yourPosts.indexOf(postId);
            
            if (index === -1) {
                // Add to your posts
                this.yourPosts.push(postId);
                // Highlight the post
                const post = document.getElementById(`p${postId}`);
                if (post) {
                    post.classList.add('your-post');
                }
            } else {
                // Remove from your posts
                this.yourPosts.splice(index, 1);
                // Remove highlight
                const post = document.getElementById(`p${postId}`);
                if (post) {
                    post.classList.remove('your-post');
                }
            }
            
            // Save your posts to storage
            chrome.runtime.sendMessage({
                action: "saveYourPosts",
                yourPosts: this.yourPosts
            });
        },
        
        /**
         * Highlight your posts on the page
         */
        highlightYourPosts: function() {
            this.yourPosts.forEach(postId => {
                const post = document.getElementById(`p${postId}`);
                if (post) {
                    post.classList.add('your-post');
                }
            });
        },
        
        /**
         * Show context menu for a post
         * @param {Event} event - The contextmenu event
         * @param {string} postId - ID of the post
         */
        showPostMenu: function(event, postId) {
            // Remove any existing post menu
            const existingMenu = document.querySelector('.post-menu');
            if (existingMenu) {
                existingMenu.remove();
            }
            
            // Create menu
            const menu = document.createElement('div');
            menu.className = 'post-menu';
            menu.style.top = `${event.pageY}px`;
            menu.style.left = `${event.pageX}px`;
            
            // Add menu items
            const menuItems = [
                {
                    text: this.yourPosts.includes(postId) ? 'Unmark as Your Post' : 'Mark as Your Post',
                    action: () => this.toggleYourPost(postId)
                },
                {
                    text: 'Copy Post Link',
                    action: () => {
                        const url = `${window.location.origin}${window.location.pathname}#p${postId}`;
                        navigator.clipboard.writeText(url);
                        FourX.UI.showNotification('Post link copied to clipboard', 'success');
                    }
                },
                {
                    text: 'Copy Post ID',
                    action: () => {
                        navigator.clipboard.writeText(postId);
                        FourX.UI.showNotification('Post ID copied to clipboard', 'success');
                    }
                }
            ];
            
            // Create menu items
            menuItems.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item';
                menuItem.textContent = item.text;
                menuItem.addEventListener('click', () => {
                    item.action();
                    menu.remove();
                });
                menu.appendChild(menuItem);
            });
            
            // Add menu to page
            document.body.appendChild(menu);
            
            // Close menu when clicking outside
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        },
        
        /**
         * Setup listeners for new posts in live threads
         */
        setupLiveThreadListeners: function() {
            // This is a placeholder - actual implementation would depend on the specific archive's live thread functionality
            FourX.Debug.log('Live thread detected, setting up listeners');
            
            // Example: check for new posts every 30 seconds
            setInterval(() => {
                this.checkForNewPosts();
            }, 30000);
        },
        
        /**
         * Check for new posts in live threads
         */
        checkForNewPosts: function() {
            // This is a placeholder - actual implementation would depend on the specific archive's API
            const threadId = this.getThreadId();
            const board = FourX.Utils.getCurrentBoard();
            
            if (!threadId) return;
            
            const apiUrl = this.getThreadApiUrl(threadId, board);
            
            fetch(apiUrl)
                .then(response => response.json())
                .then(data => {
                    // Process new posts
                    this.processNewPosts(data);
                })
                .catch(error => {
                    FourX.Debug.error('Error checking for new posts:', error);
                });
        },
        
        /**
         * Get thread ID from the current page
         * @returns {string} - Thread ID
         */
        getThreadId: function() {
            // Extract thread ID from URL or page elements
            const match = window.location.pathname.match(/\/thread\/(\d+)/);
            if (match && match[1]) {
                return match[1];
            }
            
            // Try to get from thread element
            const threadElement = document.querySelector('.thread');
            if (threadElement && threadElement.id) {
                return threadElement.id.replace('t', '');
            }
            
            return null;
        },
        
        /**
         * Get API URL for a thread
         * @param {string} threadId - Thread ID
         * @param {string} board - Board name
         * @returns {string} - API URL
         */
        getThreadApiUrl: function(threadId, board) {
            const domain = window.location.hostname;
            
            // Different archives have different API endpoints
            if (domain.includes('4plebs.org')) {
                return `https://archive.4plebs.org/_/api/chan/thread/?board=${board}&num=${threadId}`;
            } else if (domain.includes('desuarchive.org')) {
                return `https://desuarchive.org/_/api/chan/thread/?board=${board}&num=${threadId}`;
            } else {
                // Default format
                return `https://${domain}/_/api/chan/thread/?board=${board}&num=${threadId}`;
            }
        },
        
        /**
         * Process new posts from API data
         * @param {Object} data - Thread API data
         */
        processNewPosts: function(data) {
            // This is a placeholder - actual implementation would depend on the specific archive's API format
            if (!data || !data.posts) return;
            
            // Get current posts on the page
            const existingPostIds = new Set();
            document.querySelectorAll('.post').forEach(post => {
                const postId = post.id.replace('p', '');
                existingPostIds.add(postId);
            });
            
            // Find new posts
            const newPosts = data.posts.filter(post => !existingPostIds.has(post.no.toString()));
            
            if (newPosts.length > 0) {
                FourX.UI.showNotification(`${newPosts.length} new post(s) in this thread`, 'info');
                
                // If auto-refresh is enabled, reload the page
                if (FourX.Settings.get('advanced.autoRefreshOnNewPosts')) {
                    window.location.reload();
                }
            }
        }
    };
})(); 