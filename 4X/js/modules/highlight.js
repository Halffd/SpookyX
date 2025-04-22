/**
 * Highlight module for the 4X extension
 * Handles keyword highlighting and post marking
 */
(function() {
  // Initialize FourX namespace if it doesn't exist
  window.FourX = window.FourX || {};

  // Highlight module definition
  const highlight = {
    // Store highlighted keywords and their colors
    keywords: [],
    
    // Map of highlighted post IDs
    highlightedPosts: new Map(),
    
    /**
     * Initialize the highlight module
     */
    init: function() {
      if (FourX.debug) {
        FourX.debug.log('Highlight module initializing');
      }
      
      // Load keywords from settings
      this.loadKeywords();
      
      // Process existing posts
      this.processAllPosts();
      
      if (FourX.debug) {
        FourX.debug.log('Highlight module initialized');
      }
    },
    
    /**
     * Load keywords from settings
     */
    loadKeywords: function() {
      if (!FourX.settings) {
        this.keywords = [];
        return;
      }
      
      const keywordsString = FourX.settings.get('postProcessing.highlightKeywords');
      if (!keywordsString) {
        this.keywords = [];
        return;
      }
      
      try {
        // Parse keywords from settings
        // Format: word1:color1,word2:color2
        this.keywords = keywordsString.split(',')
          .map(item => {
            const [keyword, color] = item.split(':').map(s => s.trim());
            return {
              keyword: keyword,
              color: color || '#ffff00', // Default to yellow if no color specified
              regex: new RegExp(`\\b${this.escapeRegExp(keyword)}\\b`, 'i')
            };
          })
          .filter(item => item.keyword && item.keyword.length > 0);
        
        if (FourX.debug) {
          FourX.debug.log(`Loaded ${this.keywords.length} highlight keywords`);
        }
      } catch (error) {
        if (FourX.debug) {
          FourX.debug.error('Error parsing highlight keywords', error);
        }
        this.keywords = [];
      }
    },
    
    /**
     * Escape special characters for use in a RegExp
     * @param {string} string - The string to escape
     * @returns {string} The escaped string
     */
    escapeRegExp: function(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },
    
    /**
     * Process all posts on the page for highlighting
     */
    processAllPosts: function() {
      if (this.keywords.length === 0) {
        return; // Nothing to highlight
      }
      
      if (FourX.debug) {
        FourX.debug.time('highlight.processAllPosts');
      }
      
      // Get all posts
      const posts = document.querySelectorAll('.post, .postContainer, .thread_post, [id^="pc"], .post-wrapper');
      
      // Process each post
      posts.forEach(post => {
        this.processPost(post);
      });
      
      if (FourX.debug) {
        FourX.debug.timeEnd('highlight.processAllPosts');
        FourX.debug.log(`Processed ${posts.length} posts for highlighting`);
      }
    },
    
    /**
     * Process a single post for highlighting
     * @param {Element} postElement - The post element to process
     */
    processPost: function(postElement) {
      if (!postElement || this.keywords.length === 0) {
        return;
      }
      
      // Skip if already processed for highlighting
      if (postElement.hasAttribute('data-4x-highlighted')) {
        return;
      }
      
      try {
        // Mark as processed
        postElement.setAttribute('data-4x-highlighted', 'true');
        
        // Extract text content from post message
        const messageElement = postElement.querySelector('.post-message, .post_body, .body, .message');
        if (!messageElement) {
          return;
        }
        
        const postText = messageElement.textContent;
        
        // Check for matching keywords
        const matches = this.findKeywordMatches(postText);
        if (matches.length > 0) {
          // Apply highlights
          this.applyHighlights(messageElement, matches);
          
          // Get post ID if possible
          let postId = null;
          if (FourX.posts) {
            postId = FourX.posts.getPostId(postElement);
          } else {
            // Fallback to basic ID extraction
            if (postElement.id) {
              const match = postElement.id.match(/(?:p|pc|post-|thread)(\d+)/i);
              if (match && match[1]) {
                postId = match[1];
              }
            }
          }
          
          // Add highlight class to the post for visibility
          postElement.classList.add('4x-highlighted');
          
          // Store in highlighted posts map
          if (postId) {
            this.highlightedPosts.set(postId, matches);
          }
        }
      } catch (error) {
        if (FourX.debug) {
          FourX.debug.error('Error processing post for highlighting', error);
        }
      }
    },
    
    /**
     * Find keyword matches in text
     * @param {string} text - The text to search in
     * @returns {Array} Array of matches with keyword and color
     */
    findKeywordMatches: function(text) {
      const matches = [];
      
      this.keywords.forEach(keywordObj => {
        if (keywordObj.regex.test(text)) {
          matches.push(keywordObj);
        }
      });
      
      return matches;
    },
    
    /**
     * Apply highlights to matched text in an element
     * @param {Element} element - The element containing text to highlight
     * @param {Array} matches - Array of keyword matches
     */
    applyHighlights: function(element, matches) {
      // Skip if no matches or element is not valid
      if (matches.length === 0 || !element) {
        return;
      }
      
      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = element.innerHTML;
      
      // Apply each highlight
      matches.forEach(match => {
        this.highlightTextInElement(tempContainer, match.keyword, match.color);
      });
      
      // Update the original element
      element.innerHTML = tempContainer.innerHTML;
    },
    
    /**
     * Highlight text occurrences in an HTML element
     * @param {Element} element - The element to process
     * @param {string} keyword - The keyword to highlight
     * @param {string} color - The highlight color
     */
    highlightTextInElement: function(element, keyword, color) {
      const nodes = [];
      const regex = new RegExp(`\\b${this.escapeRegExp(keyword)}\\b`, 'i');
      
      // Get all text nodes in the element
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        // Skip nodes that are inside a highlight span
        let parent = node.parentNode;
        let insideHighlight = false;
        while (parent && parent !== element) {
          if (parent.classList && parent.classList.contains('4x-keyword-highlight')) {
            insideHighlight = true;
            break;
          }
          parent = parent.parentNode;
        }
        
        if (!insideHighlight && regex.test(node.textContent)) {
          nodes.push(node);
        }
      }
      
      // Process nodes in reverse order to avoid issues with DOM changes
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const content = node.textContent;
        
        // Create a document fragment to hold the new nodes
        const fragment = document.createDocumentFragment();
        
        // Split on the keyword and create highlighted spans
        let lastIndex = 0;
        let match;
        const reGlobal = new RegExp(`\\b${this.escapeRegExp(keyword)}\\b`, 'gi');
        
        while ((match = reGlobal.exec(content)) !== null) {
          // Add text before match
          if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(
              content.substring(lastIndex, match.index)
            ));
          }
          
          // Add highlighted match
          const span = document.createElement('span');
          span.className = '4x-keyword-highlight';
          span.style.backgroundColor = color;
          span.textContent = match[0];
          fragment.appendChild(span);
          
          lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        if (lastIndex < content.length) {
          fragment.appendChild(document.createTextNode(
            content.substring(lastIndex)
          ));
        }
        
        // Replace the original node with the fragment
        node.parentNode.replaceChild(fragment, node);
      }
    },
    
    /**
     * Check if a post contains any highlighted keywords
     * @param {string} postId - The ID of the post to check
     * @returns {boolean} True if the post is highlighted
     */
    isPostHighlighted: function(postId) {
      return this.highlightedPosts.has(postId);
    },
    
    /**
     * Get highlight info for a post
     * @param {string} postId - The ID of the post
     * @returns {Array|null} Array of keyword matches or null
     */
    getPostHighlightInfo: function(postId) {
      return this.highlightedPosts.get(postId) || null;
    },
    
    /**
     * Add a new keyword for highlighting
     * @param {string} keyword - The keyword to add
     * @param {string} color - The highlight color
     * @returns {boolean} True if added successfully
     */
    addKeyword: function(keyword, color = '#ffff00') {
      if (!keyword || keyword.length === 0) {
        return false;
      }
      
      // Check if keyword already exists
      const exists = this.keywords.some(k => k.keyword.toLowerCase() === keyword.toLowerCase());
      if (exists) {
        return false;
      }
      
      // Add new keyword
      this.keywords.push({
        keyword: keyword,
        color: color,
        regex: new RegExp(`\\b${this.escapeRegExp(keyword)}\\b`, 'i')
      });
      
      // Save to settings
      this.saveKeywords();
      
      // Process posts for new keyword
      this.processAllPosts();
      
      return true;
    },
    
    /**
     * Remove a keyword from highlighting
     * @param {string} keyword - The keyword to remove
     * @returns {boolean} True if removed successfully
     */
    removeKeyword: function(keyword) {
      if (!keyword || keyword.length === 0) {
        return false;
      }
      
      const initialLength = this.keywords.length;
      this.keywords = this.keywords.filter(k => k.keyword.toLowerCase() !== keyword.toLowerCase());
      
      if (this.keywords.length < initialLength) {
        // Save to settings
        this.saveKeywords();
        
        // Re-process posts (remove highlights)
        this.resetHighlights();
        this.processAllPosts();
        
        return true;
      }
      
      return false;
    },
    
    /**
     * Save keywords to settings
     */
    saveKeywords: function() {
      if (!FourX.settings) {
        return;
      }
      
      // Format: word1:color1,word2:color2
      const keywordsString = this.keywords
        .map(k => `${k.keyword}:${k.color}`)
        .join(',');
      
      FourX.settings.set('postProcessing.highlightKeywords', keywordsString);
      FourX.settings.save();
    },
    
    /**
     * Reset all highlights on the page
     */
    resetHighlights: function() {
      // Remove highlight classes from posts
      const highlightedPosts = document.querySelectorAll('.4x-highlighted');
      highlightedPosts.forEach(post => {
        post.classList.remove('4x-highlighted');
        post.removeAttribute('data-4x-highlighted');
      });
      
      // Remove highlight spans
      const highlightSpans = document.querySelectorAll('.4x-keyword-highlight');
      highlightSpans.forEach(span => {
        const parent = span.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(span.textContent), span);
        }
      });
      
      // Clear tracked highlights
      this.highlightedPosts.clear();
    }
  };

  // Add the highlight module to the FourX namespace
  FourX.highlight = highlight;
})(); 