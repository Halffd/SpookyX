// SpookyX Content Script
// Content script for SpookyX Chrome Extension

// Check if the site is supported
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

// Function to check if jQuery is loaded
function checkJquery() {
  return typeof jQuery !== 'undefined';
}

// Function to load jQuery if it's not already loaded
function loadJquery() {
  return new Promise((resolve, reject) => {
    if (checkJquery()) {
      resolve();
      return;
    }
    
    console.log('SpookyX: jQuery not found, loading it');
    const script = document.createElement('script');
    script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
    script.onload = () => {
      console.log('SpookyX: jQuery loaded successfully');
      resolve();
    };
    script.onerror = () => {
      console.error('SpookyX: Failed to load jQuery');
      reject(new Error('Failed to load jQuery'));
    };
    document.head.appendChild(script);
  });
}

// Function to add settings button to the UI
function addSettingsButton() {
  // Create a settings button element
  const settingsButton = document.createElement('div');
  settingsButton.className = 'spookyx-settings-button';
  settingsButton.innerHTML = '👻 SpookyX';
  settingsButton.title = 'SpookyX Settings';
  
  // Style the button
  settingsButton.style.position = 'fixed';
  settingsButton.style.bottom = '20px';
  settingsButton.style.right = '20px';
  settingsButton.style.background = '#AF3355';
  settingsButton.style.color = 'white';
  settingsButton.style.padding = '10px 15px';
  settingsButton.style.borderRadius = '5px';
  settingsButton.style.cursor = 'pointer';
  settingsButton.style.zIndex = '9999';
  settingsButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  
  // Add click event to open settings
  settingsButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting settings:', chrome.runtime.lastError);
        return;
      }
      
      // Toggle settings panel
      toggleSettingsPanel(response.settings || {});
    });
  });
  
  // Add to document
  document.body.appendChild(settingsButton);
}

// Function to toggle settings panel
function toggleSettingsPanel(currentSettings) {
  // Check if the panel already exists
  let panel = document.getElementById('spookyx-settings-panel');
  
  // If the panel exists, remove it
  if (panel) {
    panel.remove();
    return;
  }
  
  // Create settings panel
  panel = document.createElement('div');
  panel.id = 'spookyx-settings-panel';
  panel.className = 'spookyx-settings-panel';
  
  // Style the panel
  panel.style.position = 'fixed';
  panel.style.bottom = '70px';
  panel.style.right = '20px';
  panel.style.width = '300px';
  panel.style.padding = '15px';
  panel.style.background = '#fff';
  panel.style.borderRadius = '5px';
  panel.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  panel.style.zIndex = '10000';
  
  // Add header to panel
  const header = document.createElement('div');
  header.innerHTML = '<h3 style="margin-top: 0;">SpookyX Settings</h3>';
  panel.appendChild(header);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '10px';
  closeButton.style.right = '10px';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.fontSize = '20px';
  closeButton.style.cursor = 'pointer';
  closeButton.addEventListener('click', () => panel.remove());
  panel.appendChild(closeButton);
  
  // Add settings fields
  const settings = document.createElement('div');
  
  // Enable auto-expanding quotes option
  const autoExpandOption = document.createElement('div');
  autoExpandOption.style.margin = '10px 0';
  
  const autoExpandCheckbox = document.createElement('input');
  autoExpandCheckbox.type = 'checkbox';
  autoExpandCheckbox.id = 'spookyx-auto-expand';
  autoExpandCheckbox.checked = currentSettings.autoExpand || false;
  
  const autoExpandLabel = document.createElement('label');
  autoExpandLabel.htmlFor = 'spookyx-auto-expand';
  autoExpandLabel.textContent = 'Auto-expand quotes on hover';
  autoExpandLabel.style.marginLeft = '5px';
  
  autoExpandOption.appendChild(autoExpandCheckbox);
  autoExpandOption.appendChild(autoExpandLabel);
  settings.appendChild(autoExpandOption);
  
  // Enable highlight posts option
  const highlightOption = document.createElement('div');
  highlightOption.style.margin = '10px 0';
  
  const highlightCheckbox = document.createElement('input');
  highlightCheckbox.type = 'checkbox';
  highlightCheckbox.id = 'spookyx-highlight';
  highlightCheckbox.checked = currentSettings.highlightPosts || false;
  
  const highlightLabel = document.createElement('label');
  highlightLabel.htmlFor = 'spookyx-highlight';
  highlightLabel.textContent = 'Highlight posts containing keywords';
  highlightLabel.style.marginLeft = '5px';
  
  highlightOption.appendChild(highlightCheckbox);
  highlightOption.appendChild(highlightLabel);
  settings.appendChild(highlightOption);
  
  // Keywords field
  const keywordsOption = document.createElement('div');
  keywordsOption.style.margin = '10px 0';
  
  const keywordsLabel = document.createElement('label');
  keywordsLabel.htmlFor = 'spookyx-keywords';
  keywordsLabel.textContent = 'Keywords (comma separated):';
  keywordsLabel.style.display = 'block';
  keywordsLabel.style.marginBottom = '5px';
  
  const keywordsInput = document.createElement('input');
  keywordsInput.type = 'text';
  keywordsInput.id = 'spookyx-keywords';
  keywordsInput.style.width = '100%';
  keywordsInput.style.padding = '5px';
  keywordsInput.style.boxSizing = 'border-box';
  keywordsInput.value = (currentSettings.keywords || []).join(', ');
  
  keywordsOption.appendChild(keywordsLabel);
  keywordsOption.appendChild(keywordsInput);
  settings.appendChild(keywordsOption);
  
  panel.appendChild(settings);
  
  // Add save button
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save Settings';
  saveButton.style.marginTop = '15px';
  saveButton.style.padding = '8px 15px';
  saveButton.style.background = '#AF3355';
  saveButton.style.color = 'white';
  saveButton.style.border = 'none';
  saveButton.style.borderRadius = '3px';
  saveButton.style.cursor = 'pointer';
  
  saveButton.addEventListener('click', () => {
    const newSettings = {
      autoExpand: document.getElementById('spookyx-auto-expand').checked,
      highlightPosts: document.getElementById('spookyx-highlight').checked,
      keywords: document.getElementById('spookyx-keywords').value.split(',').map(k => k.trim()).filter(k => k)
    };
    
    chrome.runtime.sendMessage({ 
      action: 'saveSettings', 
      settings: newSettings 
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error saving settings:', chrome.runtime.lastError);
        return;
      }
      
      if (response && response.success) {
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.textContent = 'Settings saved!';
        successMsg.style.color = 'green';
        successMsg.style.marginTop = '10px';
        successMsg.style.textAlign = 'center';
        panel.appendChild(successMsg);
        
        // Remove success message after 2 seconds
        setTimeout(() => {
          panel.remove();
        }, 2000);
      }
    });
  });
  
  panel.appendChild(saveButton);
  
  // Add to document
  document.body.appendChild(panel);
}

// Main initialization function
async function initializeSpookyX() {
  try {
    // Load jQuery if it's not available
    await loadJquery();
    
    // Check if we're on a supported site
    const currentDomain = window.location.hostname;
    if (!supportedDomains.some(domain => currentDomain.includes(domain))) {
      console.log('SpookyX: Current site is not supported');
      return; // Exit early if not on a supported site
    }
    
    console.log('SpookyX: Initializing on', currentDomain);
    
    // Add settings button
    addSettingsButton();
    
    // Get settings from storage
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting settings:', chrome.runtime.lastError);
        return;
      }
      
      const settings = response.settings || {};
      console.log('SpookyX: Loaded settings', settings);
      
      // Apply settings (e.g., auto-expansion, highlighting)
      applySettings(settings);
    });
  } catch (error) {
    console.error('SpookyX initialization failed:', error);
  }
}

// Function to apply settings
function applySettings(settings) {
  // Set up keyword highlighting if enabled
  if (settings.highlightPosts && settings.keywords && settings.keywords.length > 0) {
    setupKeywordHighlighting(settings.keywords);
  }
  
  // Set up auto-expansion if enabled
  if (settings.autoExpand) {
    setupAutoExpansion();
  }
}

// Function to set up keyword highlighting
function setupKeywordHighlighting(keywords) {
  const highlightPosts = () => {
    // Find all posts on the page
    document.querySelectorAll('article.post').forEach(post => {
      // Get the post text content
      const postContent = post.querySelector('.text')?.textContent.toLowerCase() || '';
      
      // Check if the post contains any of the keywords
      const containsKeyword = keywords.some(keyword => 
        postContent.includes(keyword.toLowerCase())
      );
      
      // Highlight the post if it contains a keyword
      if (containsKeyword) {
        post.style.border = '2px solid #FFAA33';
        post.style.backgroundColor = 'rgba(255, 170, 51, 0.1)';
      }
    });
  };
  
  // Run on page load
  highlightPosts();
  
  // Set up a mutation observer to highlight new posts
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check for added posts
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE && 
              (node.matches('article.post') || node.querySelector('article.post'))) {
            highlightPosts();
          }
        });
      }
    }
  });
  
  // Start observing changes to the DOM
  observer.observe(document.body, { childList: true, subtree: true });
}

// Function to set up auto-expansion of quotes
function setupAutoExpansion() {
  // Delegate event handling to the document
  $(document).on('mouseenter', '.backlink:not(.expanded-hover)', function() {
    const $link = $(this);
    $link.addClass('expanded-hover');
    
    const board = $link.data('board');
    const postId = $link.data('post');
    
    if (!board || !postId) {
      return;
    }
    
    // Create a preview container
    const $preview = $('<div class="post-preview"></div>');
    $preview.css({
      position: 'absolute',
      zIndex: 1000,
      border: '1px solid #773311',
      borderRadius: '5px',
      padding: '10px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      maxWidth: '500px',
      maxHeight: '400px',
      overflow: 'auto'
    });
    
    // Position the preview near the link
    const linkRect = $link[0].getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    $preview.css({
      top: (linkRect.bottom + scrollTop) + 'px',
      left: (linkRect.left + scrollLeft) + 'px'
    });
    
    // Add loading indicator
    $preview.html('<div class="loading">Loading preview...</div>');
    
    // Add preview to the document
    $('body').append($preview);
    
    // Add mouse leave handler
    $link.add($preview).on('mouseleave', function() {
      // Use setTimeout to prevent flickering
      setTimeout(() => {
        if (!$preview.is(':hover') && !$link.is(':hover')) {
          $preview.remove();
          $link.removeClass('expanded-hover');
        }
      }, 100);
    });
    
    // Check if the post exists on the page
    if ($('#p' + postId).length > 0 || $('#' + postId).length > 0) {
      const $existingPost = $('#p' + postId).length > 0 ? $('#p' + postId) : $('#' + postId);
      const $clonedPost = $existingPost.clone();
      $preview.html($clonedPost.show());
      return;
    }
    
    // Check if the post exists in cache
    if (typeof backend_vars !== 'undefined' && 
        typeof backend_vars.loaded_posts !== 'undefined' &&
        typeof backend_vars.loaded_posts[board + ':' + postId] !== 'undefined') {
      
      if (backend_vars.loaded_posts[board + ':' + postId] === false) {
        $preview.html('<div class="error">Post not found</div>');
      } else {
        const data = backend_vars.loaded_posts[board + ':' + postId];
        if (data.formatted) {
          $preview.html(data.formatted);
        } else {
          // Create basic post layout
          $preview.html(`
            <article class="post">
              <div class="text">${data.comment_processed || data.comment || data.content || 'No content available'}</div>
            </article>
          `);
          
          // Add image if available
          if (data.media && data.media.media_link) {
            const $imageBox = $('<div class="thread_image_box"></div>');
            const $image = $('<img>')
              .attr('src', data.media.media_link)
              .css({
                width: 'auto',
                maxWidth: '100%',
                height: 'auto',
                maxHeight: '200px',
                display: 'block'
              });
            $imageBox.append($image);
            $preview.find('article.post').prepend($imageBox);
          }
        }
      }
      return;
    }
    
    // Fetch the post if not cached
    const repliesUrl = `${backend_vars?.api_url || '/'}/_/api/chan/post/`;
    $.ajax({
      url: repliesUrl,
      type: 'GET',
      data: { board, num: postId },
      dataType: 'json',
      timeout: 5000,
      success: function(response) {
        if (response.error) {
          $preview.html(`<div class="error">Error: ${response.error}</div>`);
          return;
        }
        
        if (response.formatted) {
          $preview.html(response.formatted);
        } else {
          // Create basic post layout
          $preview.html(`
            <article class="post">
              <div class="text">${response.comment_processed || response.comment || response.content || 'No content available'}</div>
            </article>
          `);
          
          // Add image if available
          if (response.media && response.media.media_link) {
            const $imageBox = $('<div class="thread_image_box"></div>');
            const $image = $('<img>')
              .attr('src', response.media.media_link)
              .css({
                width: 'auto',
                maxWidth: '100%',
                height: 'auto',
                maxHeight: '200px',
                display: 'block'
              });
            $imageBox.append($image);
            $preview.find('article.post').prepend($imageBox);
          }
        }
        
        // Cache the post
        if (typeof backend_vars !== 'undefined' && typeof backend_vars.loaded_posts !== 'undefined') {
          backend_vars.loaded_posts[board + ':' + postId] = response;
        }
      },
      error: function(xhr, status, error) {
        $preview.html(`<div class="error">Error: ${error || 'Failed to load post'}</div>`);
      }
    });
  });
}

// Start the extension
document.addEventListener('DOMContentLoaded', initializeSpookyX);

// Also run initialization if the document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initializeSpookyX();
} 