/**
 * Post Processor module for the 4X extension
 * Handles post expansion, backlinks, and post manipulation
 */
(function() {
  // Initialize FourX namespace if it doesn't exist
  window.FourX = window.FourX || {};

  // Store references to posts and their data
  const postCache = {};
  const postIdRegex = /\d+/;
  const backlinkMap = {};
  
  // Post Processor module definition
  const postProcessor = {
    /**
     * Initialize the post processor module
     */
    init: function() {
      FourX.debug.log('Post processor initialized');
      this.setupPostListeners();
      this.processPosts();
    },

    /**
     * Process all posts on the page
     */
    processPosts: function() {
      FourX.debug.time('Processing posts');
      
      // Get all posts on the page
      const posts = document.querySelectorAll('.post');
      
      if (posts.length === 0) {
        FourX.debug.log('No posts found on page');
        FourX.debug.timeEnd('Processing posts');
        return;
      }
      
      FourX.debug.log(`Found ${posts.length} posts on page`);
      
      // Process each post
      posts.forEach(post => {
        this.processPost(post);
      });
      
      // Process backlinks after all posts are processed
      this.processBacklinks();
      
      FourX.debug.timeEnd('Processing posts');
    },
    
    /**
     * Process a single post
     * @param {HTMLElement} post - The post element to process
     */
    processPost: function(post) {
      // Extract post ID
      const postId = this.extractPostId(post);
      
      if (!postId) {
        FourX.debug.warn('Could not extract post ID', post);
        return;
      }
      
      // Cache the post
      this.cachePost(postId, post);
      
      // Process quotes in the post
      this.processQuotes(post, postId);
      
      // Add post to seen posts if tracking is enabled
      if (FourX.settings.get('advanced.trackPosts')) {
        this.addToSeenPosts(postId);
      }
    },
    
    /**
     * Extract the post ID from a post element
     * @param {HTMLElement} post - The post element
     * @returns {string|null} - The post ID or null if not found
     */
    extractPostId: function(post) {
      // First try data attribute
      if (post.dataset.postId) {
        return post.dataset.postId;
      }
      
      // Try ID attribute
      if (post.id) {
        const match = post.id.match(postIdRegex);
        if (match) {
          return match[0];
        }
      }
      
      // Try to find an element with the post ID
      const idEl = post.querySelector('.post-id, .post_no');
      if (idEl && idEl.textContent) {
        const match = idEl.textContent.match(postIdRegex);
        if (match) {
          return match[0];
        }
      }
      
      return null;
    },
    
    /**
     * Cache a post for later reference
     * @param {string} postId - The post ID
     * @param {HTMLElement} post - The post element
     */
    cachePost: function(postId, post) {
      if (!FourX.settings.get('advanced.cacheEnabled')) {
        return;
      }
      
      if (!postCache[postId]) {
        // Extract post content
        const postContent = post.querySelector('.post-content, .post_content, .post_body') || post;
        
        postCache[postId] = {
          element: post,
          content: postContent.innerHTML,
          timestamp: Date.now()
        };
        
        FourX.debug.log(`Cached post #${postId}`);
      }
    },
    
    /**
     * Process all quotes in a post
     * @param {HTMLElement} post - The post element
     * @param {string} sourcePostId - The ID of the post containing the quotes
     */
    processQuotes: function(post, sourcePostId) {
      // Find all quote links in the post
      const quoteLinks = post.querySelectorAll('.quotelink, .quote_link, a[href^="#p"]');
      
      quoteLinks.forEach(quoteLink => {
        // Extract the quoted post ID
        const quotedPostId = this.extractQuotedPostId(quoteLink);
        
        if (!quotedPostId) {
          return;
        }
        
        // Add this post to the backlink map
        this.addBacklink(quotedPostId, sourcePostId);
        
        // Add click listener for inline expansion
        if (FourX.settings.get('expansion.enabled')) {
          this.addQuoteClickListener(quoteLink, quotedPostId);
        }
      });
    },
    
    /**
     * Extract the post ID from a quote link
     * @param {HTMLElement} quoteLink - The quote link element
     * @returns {string|null} - The quoted post ID or null if not found
     */
    extractQuotedPostId: function(quoteLink) {
      const href = quoteLink.getAttribute('href');
      
      if (!href) {
        return null;
      }
      
      // Try to extract post ID from href
      const match = href.match(/(?:#p?|#q)(\d+)/);
      
      if (match && match[1]) {
        return match[1];
      }
      
      return null;
    },
    
    /**
     * Add a backlink to the backlink map
     * @param {string} targetPostId - The post being quoted
     * @param {string} sourcePostId - The post quoting the target
     */
    addBacklink: function(targetPostId, sourcePostId) {
      if (!backlinkMap[targetPostId]) {
        backlinkMap[targetPostId] = new Set();
      }
      
      backlinkMap[targetPostId].add(sourcePostId);
    },
    
    /**
     * Process all backlinks after posts are processed
     */
    processBacklinks: function() {
      if (!FourX.settings.get('expansion.backlinks')) {
        return;
      }
      
      FourX.debug.time('Processing backlinks');
      
      Object.keys(backlinkMap).forEach(targetPostId => {
        const sourcePostIds = Array.from(backlinkMap[targetPostId]);
        this.addBacklinksToPost(targetPostId, sourcePostIds);
      });
      
      FourX.debug.timeEnd('Processing backlinks');
    },
    
    /**
     * Add backlinks to a post
     * @param {string} targetPostId - The post ID to add backlinks to
     * @param {string[]} sourcePostIds - Array of post IDs that link to the target
     */
    addBacklinksToPost: function(targetPostId, sourcePostIds) {
      // Find the target post
      const targetPost = postCache[targetPostId]?.element;
      
      if (!targetPost) {
        return;
      }
      
      // Find or create the backlinks container
      let backlinksContainer = targetPost.querySelector('.backlinks');
      
      if (!backlinksContainer) {
        backlinksContainer = document.createElement('div');
        backlinksContainer.className = 'backlinks';
        
        // Find where to insert the backlinks container
        const postContent = targetPost.querySelector('.post-content, .post_content, .post_body');
        
        if (postContent) {
          postContent.appendChild(backlinksContainer);
        } else {
          targetPost.appendChild(backlinksContainer);
        }
      }
      
      // Add backlinks
      sourcePostIds.forEach(sourcePostId => {
        // Check if this backlink already exists
        const existingBacklink = backlinksContainer.querySelector(`a[data-post-id="${sourcePostId}"]`);
        
        if (existingBacklink) {
          return;
        }
        
        // Create a new backlink
        const backlink = document.createElement('a');
        backlink.href = `#p${sourcePostId}`;
        backlink.className = 'backlink';
        backlink.textContent = `>>${sourcePostId}`;
        backlink.dataset.postId = sourcePostId;
        
        // Add click listener for inline expansion
        if (FourX.settings.get('expansion.enabled')) {
          this.addQuoteClickListener(backlink, sourcePostId);
        }
        
        // Add the backlink to the container
        backlinksContainer.appendChild(backlink);
        backlinksContainer.appendChild(document.createTextNode(' '));
      });
    },
    
    /**
     * Add click listener to quote links for inline expansion
     * @param {HTMLElement} quoteLink - The quote link element
     * @param {string} quotedPostId - The ID of the quoted post
     */
    addQuoteClickListener: function(quoteLink, quotedPostId) {
      quoteLink.addEventListener('click', async (event) => {
        // Prevent default action (scrolling to post)
        event.preventDefault();
        
        // Toggle the expanded post
        this.toggleExpandedPost(quoteLink, quotedPostId);
      });
    },
    
    /**
     * Toggle the expanded state of a quoted post
     * @param {HTMLElement} quoteLink - The quote link element
     * @param {string} quotedPostId - The ID of the quoted post
     */
    async toggleExpandedPost: function(quoteLink, quotedPostId) {
      // Check if post is already expanded
      let expandedPost = quoteLink.nextElementSibling;
      
      if (expandedPost && expandedPost.classList.contains('expanded-post')) {
        // Post is already expanded, collapse it
        expandedPost.remove();
        return;
      }
      
      // Create expanded post container
      expandedPost = document.createElement('div');
      expandedPost.className = 'expanded-post';
      
      // Create loading indicator
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'loading';
      loadingIndicator.textContent = 'Loading post...';
      expandedPost.appendChild(loadingIndicator);
      
      // Insert expanded post after quote link
      quoteLink.parentNode.insertBefore(expandedPost, quoteLink.nextSibling);
      
      try {
        // Try to fetch the post from cache or DOM
        const post = this.fetchPost(quotedPostId);
        
        if (post) {
          // Post found, display it
          this.displayExpandedPost(expandedPost, post, quotedPostId);
        } else {
          // Post not found, show error
          this.displayExpandedPostError(expandedPost, 'Post not found');
        }
      } catch (error) {
        // Handle error
        FourX.debug.error(`Error expanding post #${quotedPostId}`, error);
        this.displayExpandedPostError(expandedPost, 'Error loading post');
      }
    },
    
    /**
     * Fetch a post from cache or DOM
     * @param {string} postId - The post ID to fetch
     * @returns {HTMLElement|null} - The post element or null if not found
     */
    fetchPost: function(postId) {
      // First check cache
      if (postCache[postId]) {
        return postCache[postId].element;
      }
      
      // Then check page DOM
      const postSelector = `#p${postId}, #post_${postId}, [data-post-id="${postId}"]`;
      return document.querySelector(postSelector);
    },
    
    /**
     * Display an expanded post
     * @param {HTMLElement} expandedPost - The expanded post container
     * @param {HTMLElement} originalPost - The original post element
     * @param {string} postId - The post ID
     */
    displayExpandedPost: function(expandedPost, originalPost, postId) {
      // Clear loading indicator
      expandedPost.innerHTML = '';
      
      // Clone the post content
      let postContent;
      const contentElement = originalPost.querySelector('.post-content, .post_content, .post_body');
      
      if (contentElement) {
        postContent = contentElement.cloneNode(true);
      } else {
        postContent = originalPost.cloneNode(true);
      }
      
      // Create post header
      const header = document.createElement('div');
      header.className = 'expanded-post-header';
      
      // Add post number
      const postNumber = document.createElement('span');
      postNumber.className = 'post-number';
      postNumber.textContent = `#${postId}`;
      
      // Add close button
      const closeButton = document.createElement('span');
      closeButton.className = 'close-expanded-post';
      closeButton.textContent = '×';
      closeButton.addEventListener('click', () => {
        expandedPost.remove();
      });
      
      // Add elements to header
      header.appendChild(postNumber);
      header.appendChild(closeButton);
      
      // Add header and content to expanded post
      expandedPost.appendChild(header);
      expandedPost.appendChild(postContent);
      
      // Process quotes in the expanded post
      if (FourX.settings.get('expansion.nested')) {
        const quoteLinks = postContent.querySelectorAll('.quotelink, .quote_link, a[href^="#p"]');
        
        quoteLinks.forEach(quoteLinkInExpanded => {
          const quotedPostId = this.extractQuotedPostId(quoteLinkInExpanded);
          
          if (quotedPostId) {
            this.addQuoteClickListener(quoteLinkInExpanded, quotedPostId);
          }
        });
      }
    },
    
    /**
     * Display an error in the expanded post container
     * @param {HTMLElement} expandedPost - The expanded post container
     * @param {string} errorMessage - The error message to display
     */
    displayExpandedPostError: function(expandedPost, errorMessage) {
      // Clear loading indicator
      expandedPost.innerHTML = '';
      
      // Create error message
      const errorElement = document.createElement('div');
      errorElement.className = 'error';
      errorElement.textContent = errorMessage;
      
      // Add close button
      const closeButton = document.createElement('span');
      closeButton.className = 'close-expanded-post';
      closeButton.textContent = '×';
      closeButton.addEventListener('click', () => {
        expandedPost.remove();
      });
      
      // Add error message and close button to expanded post
      expandedPost.appendChild(errorElement);
      expandedPost.appendChild(closeButton);
    },
    
    /**
     * Add a post to the seen posts list
     * @param {string} postId - The post ID to add
     */
    addToSeenPosts: function(postId) {
      chrome.runtime.sendMessage({
        action: 'addToSeenPosts',
        postId: postId,
        board: FourX.utils.getCurrentBoard()
      });
    },
    
    /**
     * Highlight keywords in posts
     * @param {string} keywords - Comma-separated list of keywords to highlight
     */
    highlightKeywords: function(keywords) {
      if (!keywords || keywords.trim() === '') {
        return;
      }
      
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k !== '');
      
      if (keywordList.length === 0) {
        return;
      }
      
      FourX.debug.time('Highlighting keywords');
      
      // Process each post
      Object.values(postCache).forEach(({ element }) => {
        const postContent = element.querySelector('.post-content, .post_content, .post_body');
        
        if (!postContent) {
          return;
        }
        
        // Check if post contains any keywords
        const postText = postContent.textContent.toLowerCase();
        const foundKeywords = keywordList.filter(keyword => 
          postText.includes(keyword.toLowerCase())
        );
        
        if (foundKeywords.length > 0) {
          // Highlight the post
          element.classList.add('keyword-highlighted');
          
          // Highlight specific keywords in text
          this.highlightTextInElement(postContent, foundKeywords);
        }
      });
      
      FourX.debug.timeEnd('Highlighting keywords');
    },
    
    /**
     * Highlight specific text matches in an element
     * @param {HTMLElement} element - The element to search in
     * @param {string[]} keywords - Array of keywords to highlight
     */
    highlightTextInElement: function(element, keywords) {
      // Only process text nodes
      if (element.nodeType === Node.TEXT_NODE) {
        let content = element.textContent;
        let matches = false;
        
        // Check for keywords
        keywords.forEach(keyword => {
          const regex = new RegExp(`(${keyword})`, 'gi');
          if (regex.test(content)) {
            matches = true;
            content = content.replace(regex, '<span class="keyword-highlight">$1</span>');
          }
        });
        
        if (matches) {
          // Replace text node with highlighted HTML
          const span = document.createElement('span');
          span.innerHTML = content;
          element.parentNode.replaceChild(span, element);
        }
      } else {
        // Process child nodes (skip script and style tags)
        if (element.nodeName !== 'SCRIPT' && element.nodeName !== 'STYLE') {
          Array.from(element.childNodes).forEach(child => {
            this.highlightTextInElement(child, keywords);
          });
        }
      }
    },
    
    /**
     * Set up event listeners for post-related events
     */
    setupPostListeners: function() {
      // Listen for new posts being added to the page
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE && 
                  (node.classList.contains('post') || node.querySelector('.post'))) {
                // Process the new post
                const posts = node.classList.contains('post') ? [node] : node.querySelectorAll('.post');
                posts.forEach(post => this.processPost(post));
                
                // Re-process backlinks
                this.processBacklinks();
              }
            });
          }
        });
      });
      
      // Start observing the thread container
      const threadContainer = document.querySelector('.thread, #thread');
      
      if (threadContainer) {
        observer.observe(threadContainer, { childList: true, subtree: true });
        FourX.debug.log('Post observer started');
      }
    }
  };

  // Add the post processor module to the FourX namespace
  FourX.postProcessor = postProcessor;
})(); 