/**
 * 4X Observer Module
 * Handles DOM observation and dynamic content updates
 */

(function() {
  'use strict';
  
  // Initialize namespace
  window.FourX = window.FourX || {};
  
  // Observer module
  FourX.Observer = {
    // MutationObserver instance
    observer: null,
    
    // Initialize observer functionality
    init: function() {
      // Create observer instance
      this.observer = new MutationObserver(this.handleMutations.bind(this));
      
      // Configure observer
      const config = {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      };
      
      // Start observing
      this.observer.observe(document.body, config);
      
      FourX.Settings.logDebug('Observer module initialized');
    },
    
    // Handle DOM mutations
    handleMutations: function(mutations) {
      // Process in batches to avoid performance issues
      let newPosts = false;
      let newQuotes = false;
      let newBacklinks = false;
      
      // Process each mutation
      mutations.forEach(mutation => {
        // Only process childList mutations
        if (mutation.type !== 'childList') {
          return;
        }
        
        // Check for new nodes
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            // Ignore non-element nodes
            if (node.nodeType !== Node.ELEMENT_NODE) {
              continue;
            }
            
            // Check for new posts
            if (node.classList && (node.classList.contains('post') || node.querySelector('.post'))) {
              newPosts = true;
            }
            
            // Check for new quotes
            if (node.querySelectorAll) {
              const quotes = node.querySelectorAll('a.post_link:not(.fourx-processed)');
              if (quotes.length > 0) {
                newQuotes = true;
              }
              
              // Check for new backlinks
              const backlinks = node.querySelectorAll('.backlink:not(.fourx-processed)');
              if (backlinks.length > 0) {
                newBacklinks = true;
              }
            }
          }
        }
      });
      
      // Process new content
      this.processNewContent(newPosts, newQuotes, newBacklinks);
    },
    
    // Process new content added to the page
    processNewContent: function(newPosts, newQuotes, newBacklinks) {
      try {
        const settings = FourX.Settings.getAll();
        
        // If keyword highlighting is enabled and new posts were added, highlight them
        if (newPosts && settings.highlightKeywords && settings.keywords.length > 0) {
          FourX.Posts.highlightKeywords();
        }
        
        // If new quotes were added, process them
        if (newQuotes) {
          FourX.Posts.addQuoteClickHandlers();
          
          // If auto-expansion is enabled, expand quotes
          if (settings.autoExpand) {
            FourX.Posts.autoExpandQuotes();
          }
        }
        
        // If new backlinks were added, process them
        if (newBacklinks) {
          FourX.Posts.addBacklinkHoverHandlers();
        }
      } catch (error) {
        console.error('Error processing new content:', error);
      }
    },
    
    // Disconnect observer
    disconnect: function() {
      if (this.observer) {
        this.observer.disconnect();
        FourX.Settings.logDebug('Observer disconnected');
      }
    }
  };
})(); 