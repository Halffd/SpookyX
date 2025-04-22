/**
 * 4X Utils Module
 * Common utility functions used across the extension
 */

(function() {
  'use strict';
  
  // Initialize namespace
  window.FourX = window.FourX || {};
  
  // Utils module
  FourX.Utils = {
    // Create a promise that resolves after a delay
    delay: function(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Adjust a color's RGB values
    adjustColor: function(currentColor, adjustments) {
      try {
        // Parse the color if it's a hex string
        if (typeof currentColor === 'string' && currentColor.startsWith('#')) {
          const r = parseInt(currentColor.substr(1, 2), 16);
          const g = parseInt(currentColor.substr(3, 2), 16);
          const b = parseInt(currentColor.substr(5, 2), 16);
          currentColor = { r, g, b };
        }
        
        // Apply adjustments
        const newColor = {
          r: Math.min(255, Math.max(0, currentColor.r + (adjustments.r || 0))),
          g: Math.min(255, Math.max(0, currentColor.g + (adjustments.g || 0))),
          b: Math.min(255, Math.max(0, currentColor.b + (adjustments.b || 0)))
        };
        
        // Convert back to hex
        return '#' + 
          ((1 << 24) + (newColor.r << 16) + (newColor.g << 8) + newColor.b)
            .toString(16).slice(1);
      } catch (error) {
        console.error('Error adjusting color:', error);
        return currentColor;
      }
    },
    
    // Generate a random string of specified length
    randomString: function(length = 8) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },
    
    // Check if a string is a valid JSON
    isJsonString: function(str) {
      try {
        JSON.parse(str);
        return true;
      } catch (e) {
        return false;
      }
    },
    
    // Get relative time string from timestamp
    getRelativeTime: function(timestamp) {
      try {
        // If timestamp is a string, convert to number
        if (typeof timestamp === 'string') {
          timestamp = parseInt(timestamp, 10) * 1000; // Convert to milliseconds
        } else if (typeof timestamp === 'number' && timestamp < 10000000000) {
          timestamp *= 1000; // Convert to milliseconds if needed
        }
        
        const now = Date.now();
        const diff = now - timestamp;
        
        // Calculate time units
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);
        
        // Return the appropriate string based on the time difference
        if (years > 0) {
          return years === 1 ? '1 year ago' : `${years} years ago`;
        } else if (months > 0) {
          return months === 1 ? '1 month ago' : `${months} months ago`;
        } else if (days > 0) {
          return days === 1 ? '1 day ago' : `${days} days ago`;
        } else if (hours > 0) {
          return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
        } else if (minutes > 0) {
          return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
        } else {
          return seconds <= 10 ? 'just now' : `${seconds} seconds ago`;
        }
      } catch (error) {
        console.error('Error formatting relative time:', error);
        return 'Unknown time';
      }
    },
    
    // Extract post ID from various formats
    extractPostId: function(input) {
      try {
        // If input is a number, return it
        if (typeof input === 'number') {
          return input.toString();
        }
        
        // If input is a string
        if (typeof input === 'string') {
          // Try to extract post ID from URL
          if (input.includes('#')) {
            const hashPart = input.split('#').pop();
            if (/^\d+$/.test(hashPart)) {
              return hashPart;
            }
          }
          
          // Try to extract post ID from href attribute (e.g. /thread/1234#5678)
          const match = input.match(/([a-z]+\/\d+)?#(\d+)/);
          if (match && match[2]) {
            return match[2];
          }
          
          // Try to extract post ID directly (e.g. "12345678")
          if (/^\d+$/.test(input)) {
            return input;
          }
        }
        
        // If input is an element with data-post attribute
        if (input && input.getAttribute && input.getAttribute('data-post')) {
          return input.getAttribute('data-post');
        }
        
        // If input is an element with id attribute starting with "post_"
        if (input && input.id && input.id.startsWith('post_')) {
          return input.id.substring(5);
        }
        
        return null;
      } catch (error) {
        console.error('Error extracting post ID:', error);
        return null;
      }
    },
    
    // Get the current board from URL or meta tag
    getCurrentBoard: function() {
      try {
        // Try to get board from URL
        const boardMatch = window.location.pathname.match(/\/([a-zA-Z0-9]+)\/thread\/\d+/);
        if (boardMatch && boardMatch[1]) {
          return boardMatch[1];
        }
        
        // Try to get board from meta tag
        const metaBoard = document.querySelector('meta[name="board"]');
        if (metaBoard && metaBoard.content) {
          return metaBoard.content;
        }
        
        // Try to get board from global backend_vars
        if (typeof backend_vars !== 'undefined' && backend_vars.board) {
          return backend_vars.board;
        }
        
        // Default to '_'
        return '_';
      } catch (error) {
        console.error('Error getting current board:', error);
        return '_';
      }
    },
    
    // Sanitize HTML to prevent XSS
    sanitizeHtml: function(html) {
      try {
        if (!html) return '';
        
        // Create a temporary div to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Remove script tags
        const scripts = tempDiv.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        
        // Remove unsafe attributes
        const allElements = tempDiv.querySelectorAll('*');
        const unsafeAttributes = [
          'onclick', 'onload', 'onmouseover', 'onmouseout', 'onmousedown', 
          'onmouseup', 'onerror', 'onkeydown', 'onkeypress', 'onkeyup'
        ];
        
        allElements.forEach(el => {
          unsafeAttributes.forEach(attr => {
            if (el.hasAttribute(attr)) {
              el.removeAttribute(attr);
            }
          });
        });
        
        return tempDiv.innerHTML;
      } catch (error) {
        console.error('Error sanitizing HTML:', error);
        return '';
      }
    }
  };
})(); 