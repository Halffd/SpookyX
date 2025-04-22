// SpookyX Extension
// Enhances functionality of FoolFuuka boards
// Version: 32.50

(function() {
  'use strict';
  
  // Initialize variables
  var linksClicked = [];
  var focused = { 'id': null };
  const inverse = !true;
  var processedPosts = 0;
  
  // Check if we're in a supported site
  const supportedDomains = [
    'archive.4plebs.org',
    'archive.loveisover.me',
    'archive.nyafuu.org',
    'desuarchive.org',
    'cuckchan.org',
    '4ch.be',
    'archive.palanq.win',
    'ch.archive.horse',
    'boards.fireden.net',
    'archived.moe',
    'archiveofsins.com',
    'thebarchive.com',
    'archive.whatisthisimnotgoodwithcomputers.com',
    'magyarchan.net',
    'www.tokyochronos.net',
    'arch.b4k.co',
    'old.sage.moe',
    'arch.b4k.dev'
  ];
  
  const currentDomain = window.location.hostname;
  if (!supportedDomains.some(domain => currentDomain.includes(domain))) {
    console.log('SpookyX: Current site is not supported');
    return; // Exit early if not on a supported site
  }
  
  // Initialize settings and storage variables
  let yourPosts = {};
  let lastSeenPosts = {};
  let crosslinkTracker = {};
  let settings = null;

  // Helper functions
  function adjustColor(currentColor, adjustments) {
    const rgb = currentColor.match(/\d+/g).map(Number); // Extract RGB values

    // Apply adjustments
    rgb[0] = Math.min(255, rgb[0] + adjustments.red);    // Red
    rgb[1] = Math.min(255, rgb[1] + adjustments.green);  // Green
    rgb[2] = Math.min(255, rgb[2] + adjustments.blue);   // Blue

    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  // Function to wait for a specified time
  const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Function to fetch replies with retry logic
  async function fetchRepliesWithRetry(aElem, retryCount = 0) {
    if (retryCount > 3) {
      console.error("Maximum retry attempts reached for fetchReplies");
      return [];
    }

    try {
      const $link = $(aElem);
      const board = $link.data('board') || $link.closest('[data-board]').data('board') || '_';
      const postId = $link.data('post') || $link.attr('href').split('/').pop().replace(/\D/g, '');
      
      if (!postId) {
        console.error("Could not determine post ID");
        return [];
      }
      
      console.log(`Fetching replies for ${board}:${postId}`);
      
      // Construct the API URL
      const repliesUrl = `${typeof backend_vars !== 'undefined' ? backend_vars.api_url : '/'}/_/api/chan/backlinks/`;
      
      // Make the API request
      const response = await jQuery.ajax({
        url: repliesUrl,
        type: 'GET',
        data: { 
          board: board,
          num: postId
        },
        dataType: 'json',
        timeout: 10000,
        beforeSend: function(xhr) {
          // Add headers that might help prevent 403 errors
          xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
          
          // Set a proper referer if possible
          const currentUrl = window.location.href;
          if (currentUrl) {
            xhr.setRequestHeader('Referer', currentUrl);
          }
        }
      });
      
      if (response.error) {
        console.error(`Error fetching replies: ${response.error}`);
        return [];
      }
      
      // Extract post numbers from the response
      const postNumbers = [];
      if (response.backlinks && Array.isArray(response.backlinks)) {
        for (const backlink of response.backlinks) {
          if (backlink.num) {
            postNumbers.push(backlink.num);
          }
        }
      }
      
      console.log(`Found ${postNumbers.length} replies for ${board}:${postId}`);
      return postNumbers;
    } catch (error) {
      console.error(`Error in fetchReplies (attempt ${retryCount + 1}):`, error);
      
      // Wait before retrying
      const waitTime = 1000 * (retryCount + 1);
      await delay(waitTime);
      
      // Retry the request
      return fetchRepliesWithRetry(aElem, retryCount + 1);
    }
  }

  // Function to expand all quotes
  function expandAllQuotes(postElement) {
    console.log("Starting expandAllQuotes on", postElement);

    // Create a container at the bottom of the post for expanded posts
    const $postContainer = $(postElement).closest('.post_wrapper');
    const $expandedContainer = $('<div class="expanded-posts-container"></div>');
    $expandedContainer.css({
        'border': '2px solid #773311',
        'padding': '10px',
        'margin-top': '20px',
        'background-color': 'rgba(0, 0, 0, 0.05)'
    });

    // Add a header to the container
    const $header = $('<div class="expanded-posts-header"></div>');
    $header.html('<h3>Expanded Posts</h3>');
    $header.css({
        'font-weight': 'bold',
        'margin-bottom': '10px',
        'padding-bottom': '5px',
        'border-bottom': '1px solid #773311'
    });

    // Add a close button
    const $closeButton = $('<button class="close-expanded-posts">Close</button>');
    $closeButton.css({
        'float': 'right',
        'border-radius': '5px',
        'color': 'white',
        'background': '#553311',
        'padding': '2px 8px'
    });
    $closeButton.click(function() {
        $expandedContainer.remove();
    });

    $header.prepend($closeButton);
    $expandedContainer.append($header);

    // Add the container to the bottom of the post
    $postContainer.append($expandedContainer);

    // Find all backlinks in the post that haven't been expanded yet
    const backlinks = $(postElement).find('.backlink:not(.expanded-bottom)').toArray();
    console.log("Found backlinks:", backlinks.length);

    if (backlinks.length === 0) {
        console.log("No backlinks to expand");
        $expandedContainer.append('<div class="no-backlinks">No backlinks found to expand</div>');
        return; // No more backlinks to expand
    }

    // Keep track of posts we've already processed
    let processedPosts = new Set();
    
    // Process each backlink with a delay between fetches
    let index = 0;
    let processedCount = 0;

    // Add a status indicator that updates as posts are processed
    const $status = $('<div class="expanded-posts-status"></div>');
    $status.css({
        'margin-top': '10px',
        'font-style': 'italic'
    });
    $expandedContainer.append($status);

    // Update the status periodically
    const statusInterval = setInterval(() => {
        $status.text(`Processed ${processedCount} of ${backlinks.length} posts`);

        if (processedCount >= backlinks.length) {
            clearInterval(statusInterval);
            $status.text(`Completed: ${processedCount} posts expanded`);
        }
    }, 500);

    // Define fetchAndProcessPost function inline to ensure it's available
    async function fetchAndProcessPost(board, postId, $placeholder) {
        console.log(`Fetching and processing post ${board}:${postId}`);
        
        try {
            // Add a loading indicator
            $placeholder.html(`<div class="loading">Loading post ${postId}...</div>`);
            
            // Check if the post is already in the cache
            if (typeof backend_vars !== 'undefined' && 
                typeof backend_vars.loaded_posts !== 'undefined' &&
                typeof backend_vars.loaded_posts[board + ':' + postId] !== 'undefined') {
                
                if (backend_vars.loaded_posts[board + ':' + postId] === false) {
                    // Post doesn't exist
                    $placeholder.html('<div class="error">Post not found in cache</div>');
                    return;
                }
                
                // Use the cached post data
                const data = backend_vars.loaded_posts[board + ':' + postId];
                
                // If we have formatted HTML, use it directly
                if (data.formatted) {
                    $placeholder.html(data.formatted);
                } else {
                    // Otherwise, create a post element manually
                    const postElement = document.createElement('article');
                    postElement.classList.add('post');
                    
                    // Add post header with author and timestamp if available
                    const headerElement = document.createElement('header');
                    const postDataElement = document.createElement('div');
                    postDataElement.classList.add('post_data');
                    
                    // Add author if available
                    if (data.name || data.name_processed) {
                        const authorElement = document.createElement('span');
                        authorElement.classList.add('post_author');
                        authorElement.textContent = data.name_processed || data.name || 'Anonymous';
                        postDataElement.appendChild(authorElement);
                    }
                    
                    // Add timestamp if available
                    if (data.timestamp) {
                        const timestampElement = document.createElement('span');
                        timestampElement.classList.add('time_wrap');
                        const time = document.createElement('time');
                        time.setAttribute('datetime', new Date(data.timestamp * 1000).toISOString());
                        time.textContent = new Date(data.timestamp * 1000).toLocaleString();
                        timestampElement.appendChild(time);
                        postDataElement.appendChild(timestampElement);
                    }
                    
                    headerElement.appendChild(postDataElement);
                    postElement.appendChild(headerElement);
                    
                    // Add post content
                    const contentElement = document.createElement('div');
                    contentElement.classList.add('text');
                    
                    // Use the first available content field
                    const content = data.comment_processed || data.com || data.comment || data.content || 'No content available';
                    contentElement.innerHTML = content;
                    
                    postElement.appendChild(contentElement);
                    
                    // Add the post to the placeholder
                    $placeholder.html(postElement);
                    
                    // Add image if available
                    if (data.media && data.media.media_link) {
                        try {
                            console.log("Adding image from:", data.media.media_link);
                            
                            // Create image container
                            const imageBox = document.createElement('div');
                            imageBox.classList.add('thread_image_box');
                            
                            // Create image element
                            const imageElement = document.createElement('img');
                            imageElement.src = data.media.media_link;
                            imageElement.classList.add('post-image');
                            imageElement.style.width = 'auto';
                            imageElement.style.maxWidth = '100%';
                            imageElement.style.height = 'auto';
                            imageElement.style.maxHeight = '500px';
                            imageElement.style.display = 'block';
                            
                            // Add error handling for the image
                            imageElement.onerror = function() {
                                console.error('Image failed to load:', data.media.media_link);
                                
                                // Try alternative URLs if the original fails
                                const originalSrc = data.media.media_link;
                                let newSrc = originalSrc;
                                
                                // Try different domain variations
                                if (originalSrc.includes('arch-img.b4k.dev')) {
                                    newSrc = originalSrc.replace('arch-img.b4k.dev', 'b4k.co/media');
                                } else if (originalSrc.includes('is2.4chan.org')) {
                                    newSrc = originalSrc.replace('is2.4chan.org', 'i.4cdn.org');
                                } else if (originalSrc.includes('is.4chan.org')) {
                                    newSrc = originalSrc.replace('is.4chan.org', 'i.4cdn.org');
                                }
                                
                                if (newSrc !== originalSrc) {
                                    console.log('Trying alternative image source:', newSrc);
                                    this.src = newSrc;
                                }
                            };
                            
                            // Add the image to the container
                            imageBox.appendChild(imageElement);
                            
                            // Insert the image container before the text
                            const textElement = $placeholder.find('.text')[0];
                            if (textElement) {
                                textElement.parentNode.insertBefore(imageBox, textElement);
                            } else {
                                $placeholder.prepend(imageBox);
                            }
                            
                            console.log("Image element added to post");
                        } catch (error) {
                            console.error('Error creating image element:', error);
                        }
                    }
                }
                
                // Process images in the post
                if (typeof inlineImages === 'function') {
                    setTimeout(() => {
                        inlineImages($placeholder);
                    }, 100);
                }
                
                return;
            }
            
            // Fetch the post data
            const repliesUrl = `${backend_vars.api_url}_/api/chan/post/`;
            const requestData = { board, num: postId };
            
            try {
                const response = await jQuery.ajax({
                    url: repliesUrl,
                    type: 'GET',
                    data: requestData,
                    dataType: 'json',
                    timeout: 15000, // 15 second timeout
                    beforeSend: function(xhr) {
                        // Add headers that might help prevent 403 errors
                        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                        
                        // Set a proper referer if possible
                        const currentUrl = window.location.href;
                        if (currentUrl) {
                            xhr.setRequestHeader('Referer', currentUrl);
                        }
                    }
                });
                
                if (response.error) {
                    $placeholder.html(`<div class="error">Error fetching post: ${response.error}</div>`);
                    return;
                }
                
                // Process the post data
                if (response.formatted) {
                    $placeholder.html(response.formatted);
                } else {
                    // Create a basic post structure
                    const postElement = $('<article class="post"></article>');
                    
                    // Add post content
                    const contentElement = $('<div class="text"></div>');
                    
                    // Use the first available content field
                    const content = response.comment_processed || response.com || response.comment || response.content || 'No content available';
                    contentElement.html(content);
                    
                    postElement.append(contentElement);
                    
                    // Add the post to the placeholder
                    $placeholder.html(postElement);
                    
                    // Add image if available
                    if (response.media && response.media.media_link) {
                        const imageBox = $('<div class="thread_image_box"></div>');
                        const imageElement = $('<img>')
                            .attr('src', response.media.media_link)
                            .css({
                                'width': 'auto',
                                'max-width': '100%',
                                'height': 'auto',
                                'max-height': '500px',
                                'display': 'block'
                            })
                            .addClass('post-image');
                        
                        // Add error handling for the image
                        imageElement.on('error', function() {
                            console.error('Image failed to load:', response.media.media_link);
                            
                            // Try alternative URLs if the original fails
                            const originalSrc = response.media.media_link;
                            let newSrc = originalSrc;
                            
                            // Try different domain variations
                            if (originalSrc.includes('arch-img.b4k.dev')) {
                                newSrc = originalSrc.replace('arch-img.b4k.dev', 'b4k.co/media');
                            } else if (originalSrc.includes('is2.4chan.org')) {
                                newSrc = originalSrc.replace('is2.4chan.org', 'i.4cdn.org');
                            } else if (originalSrc.includes('is.4chan.org')) {
                                newSrc = originalSrc.replace('is.4chan.org', 'i.4cdn.org');
                            }
                            
                            if (newSrc !== originalSrc) {
                                console.log('Trying alternative image source:', newSrc);
                                $(this).attr('src', newSrc);
                            }
                        });
                        
                        imageBox.append(imageElement);
                        $placeholder.prepend(imageBox);
                    }
                }
                
                // Process images in the post
                if (typeof inlineImages === 'function') {
                    setTimeout(() => {
                        inlineImages($placeholder);
                    }, 100);
                }
                
                // Cache the post data for future use
                if (typeof backend_vars !== 'undefined' && typeof backend_vars.loaded_posts !== 'undefined') {
                    backend_vars.loaded_posts[board + ':' + postId] = response;
                }
            } catch (error) {
                console.error(`Error fetching post ${board}:${postId}:`, error);
                $placeholder.html(`<div class="error">Error: ${error.message || 'Unknown error'}</div>`);
            }
        } catch (error) {
            console.error(`Error processing post ${board}:${postId}:`, error);
            $placeholder.html(`<div class="error">Error: ${error.message || 'Unknown error'}</div>`);
        }
    }

    async function processNextBacklink() {
        if (index >= backlinks.length) {
            console.log("All backlinks processed");
            return; // All done
        }

        const link = backlinks[index];
        console.log("Processing backlink", index, link);
        index++;

        try {
            // Skip if already processed
            if ($(link).hasClass('expanded-bottom')) {
                setTimeout(processNextBacklink, 100);
                return;
            }

            // Mark as expanded to prevent duplicate processing
            $(link).addClass('expanded-bottom');

            const $link = $(link);
            const board = $link.data('board');
            const postId = $link.data('post');

            if (!board || !postId) {
                console.error("Missing data attributes on backlink", link);
                setTimeout(processNextBacklink, 100);
                return;
            }

            // Add this post to our processed set
            const postKey = `${board}:${postId}`;
            if (processedPosts.has(postKey)) {
                console.log(`Post ${postKey} already processed, skipping`);
                setTimeout(processNextBacklink, 100);
                return;
            }
            
            processedPosts.add(postKey);

            // Create a placeholder for this post
            const $postPlaceholder = $('<div class="expanded-post" id="expanded-' + postId + '"></div>');
            $postPlaceholder.css({
                'margin-bottom': '15px',
                'padding': '10px',
                'border-left': '3px solid #773311'
            });
            $postPlaceholder.html('<div class="loading">Loading post ' + postId + '...</div>');
            $expandedContainer.append($postPlaceholder);

            // Check if the post is already on the page
            if ($('#p' + postId).length > 0 || $('#' + postId).length > 0) {
                // Clone the existing post
                const $existingPost = $('#p' + postId).length > 0 ? $('#p' + postId) : $('#' + postId);
                const $clonedPost = $existingPost.clone();

                // Update the placeholder with the cloned post
                $postPlaceholder.html($clonedPost.show());

                // Process images in the cloned post
                if (typeof inlineImages === 'function') {
                    setTimeout(() => {
                        inlineImages($postPlaceholder);
                    }, 100);
                }

                processedCount++;
                
                // Continue with the next backlink without waiting
                setTimeout(processNextBacklink, 100);
            }
            // Check if the post is in the backend_vars.loaded_posts
            else if (typeof backend_vars !== 'undefined' &&
                     typeof backend_vars.loaded_posts !== 'undefined' &&
                     typeof backend_vars.loaded_posts[board + ':' + postId] !== 'undefined') {

                if (backend_vars.loaded_posts[board + ':' + postId] === false) {
                    // Post doesn't exist
                    $postPlaceholder.html('<div class="error">Post not found</div>');
                } else {
                    // Use the cached post data
                    const data = backend_vars.loaded_posts[board + ':' + postId];
                    $postPlaceholder.html(data.formatted);

                    // Process images
                    if (typeof inlineImages === 'function') {
                        setTimeout(() => {
                            inlineImages($postPlaceholder);
                        }, 100);
                    }
                }

                processedCount++;
                
                // Continue with the next backlink without waiting
                setTimeout(processNextBacklink, 100);
            }
            // Otherwise, fetch the post
            else {
                await fetchAndProcessPost(board, postId, $postPlaceholder);
                
                // Increment the processed count
                processedCount++;
                
                // Continue with the next backlink after a delay
                setTimeout(processNextBacklink, 500);
            }
        } catch (error) {
            console.error("Error expanding post:", error);
            // Continue with the next one even if there was an error
            setTimeout(processNextBacklink, 500);
        }
    }

    // Start processing backlinks with an initial delay
    setTimeout(processNextBacklink, 500);
  }
  
  // Function to process each post
  async function processPost(post) {
    let id = post.id;
    let rec = false;
    if (id.charAt(0) === 'r') {
        id = id.substring(1);
        rec = true;
    }
    let $p = $(post); // Convert post (HTML element) to a jQuery object

    // Style the OP post
    if ($p.hasClass('post_is_op')) {
        $p.css({
            'border': '2px solid #AF3355', // AF Red color
            'font-weight': (parseFloat($p.css('font-weight')) * 1.1) + 'em' // Increase font weight by 10%
        });
    }

    // Find the first <a> element within the post controls
    let aElem = rec ? $p.find(".post_data > a") : $p.find(".post_controls > a");
    if (aElem.length === 0) return; // Skip if no anchor found

    let href = aElem.get(0).href;
    try {
        // Use the retry function to fetch replies
        let replies = await fetchRepliesWithRetry(aElem);
        // Assuming replies is an array of post numbers
        const repliesElems = replies.map(num => {
            let board = $p.data('board') || '_';
            let el = $(`<a href="https://desuarchive.org/${board}/post/${num}/" class="backlink" data-function="highlight" data-backlink="true" data-board="${board}" data-post="${num}">&gt;&gt;${num}</a>`);
            return el[0]; // Return the DOM element
        });

        // Insert all the anchor elements into the first <a> element found in aElem
        for (let r of repliesElems) {
            aElem.get(0).parentNode.appendChild(r);
        }

        let postData = $(aElem).closest('.post_data'); // Corrected case sensitivity
        if (postData.find('.backlink').length > 0) {
            let backlinks = $('<div class="backlinks" style="font-size: 0.7em; padding: 2px;">Quoted By:</div>');
            postData.after(backlinks);

            postData.find('.backlink').each(function () {
                backlinks.append($(this)); // Use jQuery's append method for each '.backlink'
            });
        }

        console.log("Replies: ", replies, repliesElems);
        console.log(id, href, $p, aElem); // Log info about the post

        // Increment the processed posts counter
        processedPosts++;
    } catch (err) {
        console.error(err);
    }
  }
  
  // Handle Chrome extension message listeners
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openSettings') {
      // Open the settings panel
      // (implementation details would go here)
      sendResponse({success: true});
    }
  });
  
  // Load stored settings from Chrome storage
  function loadSettings() {
    chrome.storage.local.get(['settings', 'yourPosts', 'lastSeenPosts', 'crosslinkTracker'], (result) => {
      if (result.settings) {
        settings = result.settings;
      }
      
      if (result.yourPosts) {
        yourPosts = result.yourPosts;
      }
      
      if (result.lastSeenPosts) {
        lastSeenPosts = result.lastSeenPosts;
      }
      
      if (result.crosslinkTracker) {
        crosslinkTracker = result.crosslinkTracker;
      }
      
      // Initialize the extension after settings are loaded
      initializeExtension();
    });
  }
  
  // Save settings to Chrome storage
  function saveSettings() {
    chrome.storage.local.set({
      'settings': settings,
      'yourPosts': yourPosts,
      'lastSeenPosts': lastSeenPosts,
      'crosslinkTracker': crosslinkTracker
    }, () => {
      console.log('SpookyX settings saved');
    });
  }
  
  // Initialize the extension
  function initializeExtension() {
    // Set up click handlers for expanding quotes
    $(document).on('click', '.backlink', function(e) {
      if (e.shiftKey) {
        e.preventDefault();
        const postElement = $(this).closest('.post');
        expandAllQuotes(postElement[0]);
      }
    });
    
    // Add a custom button for expanding all quotes
    $('.post').each(function() {
      const $post = $(this);
      if ($post.find('.backlink').length > 0) {
        const $controls = $post.find('.post_controls');
        if ($controls.length > 0) {
          const $expandButton = $('<a href="#" class="btnr parent expand-all-quotes">Expand All</a>');
          $expandButton.on('click', function(e) {
            e.preventDefault();
            expandAllQuotes($post[0]);
          });
          $controls.append($expandButton);
        }
      }
    });
    
    // Process posts if on a search page
    const url = document.URL;
    if (url.includes('/search/')) {
      processPosts();
    }
  }
  
  // Process all posts on the page
  async function processPosts() {
    let posts = document.querySelectorAll('article.post'); // Get all posts
    let totalPosts = posts.length;

    const url = document.URL;
    var wait = url.split('/')[2].includes('4plebs') || url.split('/')[2].includes('archived.moe') ? 1000 : 50;
    if(url.split('/')[2].includes('b4k')) {
      wait = 3500;
    }

    // Sequentially process each post with a delay
    for (let i = 0; i < totalPosts; i++) {
      await processPost(posts[i]); // Process each post
      await delay(wait); // Delay between each request to avoid too many requests
    }

    // Repeat until all posts are processed
    if (processedPosts < totalPosts) {
      console.log("Not all posts processed, retrying...");
      await processPosts(); // Call recursively until done
    } else {
      console.log("All posts processed successfully.");
    }
  }
  
  // Start the extension
  $(document).ready(function() {
    console.log('SpookyX extension initialized');
    loadSettings();
  });
})(); 