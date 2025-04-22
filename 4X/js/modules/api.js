/**
 * 4X API Module
 * Handles interactions with archive site APIs, including fetching posts and replies
 */

(function() {
  'use strict';
  
  // Initialize namespace
  window.FourX = window.FourX || {};
  
  // Cache object for storing fetched posts
  const postCache = {};
  
  // API module
  FourX.API = {
    // Fetch a post by board and post ID
    fetchPost: async function(postId, board) {
      if (!postId) return Promise.reject("Invalid post ID");
      board = board || FourX.utils.getCurrentBoard();
      
      const domain = window.location.hostname;
      let apiUrl = '';
      let parseResponse = null;
      
      // Determine which API to use based on current domain
      if (domain.includes('4plebs.org')) {
        apiUrl = `https://archive.4plebs.org/_/api/chan/post/?board=${board}&num=${postId}`;
        parseResponse = this.parse4PlebsResponse;
      } else if (domain.includes('desuarchive.org') || domain.includes('archived.moe')) {
        apiUrl = `https://${domain}/_/api/chan/post/?board=${board}&num=${postId}`;
        parseResponse = this.parseFoolFuukaResponse;
      } else if (domain.includes('fireden.net')) {
        apiUrl = `https://boards.fireden.net/${board}/thread/${postId}/#${postId}`;
        parseResponse = this.parseFiredenResponse;
      } else if (domain.includes('4channel.org') || domain.includes('4chan.org')) {
        apiUrl = `https://a.4cdn.org/${board}/thread/${postId}.json`;
        parseResponse = this.parse4chanResponse;
      } else {
        // Default to FoolFuuka API for other archives
        apiUrl = `https://${domain}/_/api/chan/post/?board=${board}&num=${postId}`;
        parseResponse = this.parseFoolFuukaResponse;
      }
      
      try {
        if (FourX.settings.get('general.debugMode')) {
          console.log(`[4X] Fetching post: ${postId} from board: ${board}`);
          console.log(`[4X] API URL: ${apiUrl}`);
        }
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          credentials: 'omit',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return parseResponse(data, postId);
      } catch (error) {
        console.error(`[4X] Error fetching post ${postId}:`, error);
        return Promise.reject(error);
      }
    },
    
    // Fetch replies to a post (backlinks)
    fetchReplies: async function(board, postId, retryCount = 0) {
      try {
        const settings = FourX.Settings.getAll();
        
        // Maximum number of retries
        const maxRetries = settings.maxRetries;
        
        // If we've reached the maximum number of retries, give up
        if (retryCount > maxRetries) {
          throw new Error(`Maximum retry count (${maxRetries}) reached for fetchReplies`);
        }
        
        // Configure the API request
        const apiUrl = `${typeof backend_vars !== 'undefined' ? backend_vars.api_url : '/'}_/api/chan/backlinks/`;
        
        // Construct the query parameters
        const params = new URLSearchParams({
          board: board,
          num: postId
        });
        
        // Configure the request options
        const options = {
          method: 'GET',
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          },
          timeout: settings.requestTimeout * 1000
        };
        
        // Make the request
        FourX.Settings.logDebug(`Fetching replies for ${board}:${postId} (attempt ${retryCount + 1})`);
        const response = await fetch(`${apiUrl}?${params.toString()}`, options);
        
        // Check if response is OK
        if (!response.ok) {
          // If we get a 429 (too many requests), wait and retry
          if (response.status === 429) {
            const waitTime = 1000 * (retryCount + 1);
            await FourX.Utils.delay(waitTime);
            return this.fetchReplies(board, postId, retryCount + 1);
          }
          
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        // Parse the response as JSON
        const data = await response.json();
        
        // Check for error in response
        if (data.error) {
          throw new Error(`API error: ${data.error}`);
        }
        
        // Extract post numbers from the response
        const postNumbers = [];
        if (data.backlinks && Array.isArray(data.backlinks)) {
          for (const backlink of data.backlinks) {
            if (backlink.num) {
              postNumbers.push(backlink.num);
            }
          }
        }
        
        FourX.Settings.logDebug(`Found ${postNumbers.length} replies for ${board}:${postId}`);
        return postNumbers;
      } catch (error) {
        // Log the error
        console.error(`Error fetching replies for ${board}:${postId}:`, error);
        
        // If we can retry, do so after a delay
        if (retryCount < settings.maxRetries) {
          const waitTime = 1000 * (retryCount + 1);
          await FourX.Utils.delay(waitTime);
          return this.fetchReplies(board, postId, retryCount + 1);
        }
        
        // Otherwise, rethrow so the caller can handle it
        throw error;
      }
    },
    
    // Fetch a thread by board and thread ID
    fetchThread: async function(threadId, board) {
      board = board || FourX.utils.getCurrentBoard();
      const domain = window.location.hostname;
      let apiUrl = '';
      let parseResponse = null;
      
      // Determine which API to use based on current domain
      if (domain.includes('4plebs.org')) {
        apiUrl = `https://archive.4plebs.org/_/api/chan/thread/?board=${board}&num=${threadId}`;
        parseResponse = this.parse4PlebsThreadResponse;
      } else if (domain.includes('desuarchive.org') || domain.includes('archived.moe')) {
        apiUrl = `https://${domain}/_/api/chan/thread/?board=${board}&num=${threadId}`;
        parseResponse = this.parseFoolFuukaThreadResponse;
      } else {
        // Default to FoolFuuka API
        apiUrl = `https://${domain}/_/api/chan/thread/?board=${board}&num=${threadId}`;
        parseResponse = this.parseFoolFuukaThreadResponse;
      }
      
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Thread API error: ${response.status}`);
        const data = await response.json();
        return parseResponse(data, threadId);
      } catch (error) {
        console.error(`[4X] Error fetching thread ${threadId}:`, error);
        return Promise.reject(error);
      }
    },
    
    // Cache a post for future use
    cachePost: function(board, postId, data) {
      const cacheKey = `${board}:${postId}`;
      
      // Store the post in the cache with a timestamp
      postCache[cacheKey] = {
        data: data,
        timestamp: Date.now()
      };
      
      // Store in backend_vars if available
      if (typeof backend_vars !== 'undefined' && typeof backend_vars.loaded_posts !== 'undefined') {
        backend_vars.loaded_posts[cacheKey] = data;
      }
      
      FourX.Settings.logDebug(`Post cached: ${cacheKey}`);
    },
    
    // Clear the post cache
    clearCache: function() {
      // Reset the cache object
      Object.keys(postCache).forEach(key => delete postCache[key]);
      
      FourX.Settings.logDebug('Post cache cleared');
      return true;
    },
    
    /**
     * Parse 4plebs API response
     */
    parse4PlebsResponse: function(data, postId) {
      if (!data || !data.posts || Object.keys(data.posts).length === 0) {
        throw new Error(`Post ${postId} not found`);
      }
      
      const post = data.posts[postId];
      return {
        id: post.num,
        board: post.board,
        thread_id: post.thread_num,
        time: post.timestamp,
        name: post.name || 'Anonymous',
        trip: post.trip || '',
        subject: post.title || '',
        comment: post.comment || '',
        media: post.media && post.media.media_link ? {
          url: post.media.media_link,
          thumb: post.media.thumb_link,
          filename: post.media.media_filename || '',
          width: post.media.media_w,
          height: post.media.media_h
        } : null,
        source: '4plebs'
      };
    },
    
    /**
     * Parse FoolFuuka-based API response
     */
    parseFoolFuukaResponse: function(data, postId) {
      if (!data || !data.posts || Object.keys(data.posts).length === 0) {
        throw new Error(`Post ${postId} not found`);
      }
      
      const post = data.posts[postId];
      return {
        id: post.num,
        board: post.board,
        thread_id: post.thread_num,
        time: post.timestamp,
        name: post.name || 'Anonymous',
        trip: post.trip || '',
        subject: post.title || '',
        comment: post.comment || '',
        media: post.media ? {
          url: post.media.media_link,
          thumb: post.media.thumb_link,
          filename: post.media.media_filename || '',
          width: post.media.media_w,
          height: post.media.media_h
        } : null,
        source: 'foolfuuka'
      };
    },
    
    /**
     * Parse Fireden site response (HTML scraping)
     */
    parseFiredenResponse: function(html, postId) {
      // This would normally parse HTML to extract post data
      // Simplified for this example:
      return {
        id: postId,
        comment: "Fireden HTML parsing would happen here",
        source: 'fireden'
      };
    },
    
    /**
     * Parse 4chan API response
     */
    parse4chanResponse: function(data, postId) {
      if (!data || !data.posts) {
        throw new Error(`Thread not found`);
      }
      
      // Find post in thread
      const post = data.posts.find(p => p.no.toString() === postId.toString());
      
      if (!post) {
        throw new Error(`Post ${postId} not found in thread`);
      }
      
      return {
        id: post.no,
        board: data.board || window.location.pathname.split('/')[1],
        thread_id: data.posts[0].no,
        time: post.time,
        name: post.name || 'Anonymous',
        trip: post.trip || '',
        subject: post.sub || '',
        comment: post.com || '',
        media: post.filename ? {
          url: `https://i.4cdn.org/${board}/${post.tim}${post.ext}`,
          thumb: `https://i.4cdn.org/${board}/${post.tim}s.jpg`,
          filename: post.filename,
          width: post.w,
          height: post.h
        } : null,
        source: '4chan'
      };
    },
    
    /**
     * Parse 4plebs thread API response
     */
    parse4PlebsThreadResponse: function(data, threadId) {
      if (!data || !data.posts || Object.keys(data.posts).length === 0) {
        throw new Error(`Thread ${threadId} not found`);
      }
      
      const posts = Object.values(data.posts).map(post => {
        return {
          id: post.num,
          board: post.board,
          thread_id: post.thread_num,
          time: post.timestamp,
          name: post.name || 'Anonymous',
          trip: post.trip || '',
          subject: post.title || '',
          comment: post.comment || '',
          media: post.media && post.media.media_link ? {
            url: post.media.media_link,
            thumb: post.media.thumb_link,
            filename: post.media.media_filename || '',
            width: post.media.media_w,
            height: post.media.media_h
          } : null
        };
      });
      
      return {
        thread_id: threadId,
        posts: posts,
        source: '4plebs'
      };
    },
    
    /**
     * Parse FoolFuuka-based thread API response
     */
    parseFoolFuukaThreadResponse: function(data, threadId) {
      if (!data || !data.posts || Object.keys(data.posts).length === 0) {
        throw new Error(`Thread ${threadId} not found`);
      }
      
      const posts = Object.values(data.posts).map(post => {
        return {
          id: post.num,
          board: post.board,
          thread_id: post.thread_num,
          time: post.timestamp,
          name: post.name || 'Anonymous',
          trip: post.trip || '',
          subject: post.title || '',
          comment: post.comment || '',
          media: post.media ? {
            url: post.media.media_link,
            thumb: post.media.thumb_link,
            filename: post.media.media_filename || '',
            width: post.media.media_w,
            height: post.media.media_h
          } : null
        };
      });
      
      return {
        thread_id: threadId,
        posts: posts,
        source: 'foolfuuka'
      };
    }
  };
})(); 