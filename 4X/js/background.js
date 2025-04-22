// Background service worker for 4X extension
console.log('4X background service worker initialized');

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('4X extension installed');
    // Initialize any needed storage here
    chrome.storage.local.set({ 
      'yourPosts': {},
      'lastSeenPosts': {},
      'crosslinkTracker': {},
      'settings': null // Will be populated when settings are first saved
    });
  } else if (details.reason === 'update') {
    console.log('4X extension updated from version ' + details.previousVersion);
  }
});

// Message listener for communication with content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    chrome.storage.local.get('settings', (data) => {
      sendResponse({settings: data.settings});
    });
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === 'saveSettings') {
    chrome.storage.local.set({settings: message.settings}, () => {
      sendResponse({success: true});
    });
    return true;
  }
  
  if (message.action === 'getYourPosts') {
    chrome.storage.local.get('yourPosts', (data) => {
      sendResponse({yourPosts: data.yourPosts || {}});
    });
    return true;
  }
  
  if (message.action === 'saveYourPosts') {
    chrome.storage.local.set({yourPosts: message.yourPosts}, () => {
      sendResponse({success: true});
    });
    return true;
  }
  
  if (message.action === 'getLastSeenPosts') {
    chrome.storage.local.get('lastSeenPosts', (data) => {
      sendResponse({lastSeenPosts: data.lastSeenPosts || {}});
    });
    return true;
  }
  
  if (message.action === 'saveLastSeenPosts') {
    chrome.storage.local.set({lastSeenPosts: message.lastSeenPosts}, () => {
      sendResponse({success: true});
    });
    return true;
  }
  
  if (message.action === 'getCrosslinkTracker') {
    chrome.storage.local.get('crosslinkTracker', (data) => {
      sendResponse({crosslinkTracker: data.crosslinkTracker || {}});
    });
    return true;
  }
  
  if (message.action === 'saveCrosslinkTracker') {
    chrome.storage.local.set({crosslinkTracker: message.crosslinkTracker}, () => {
      sendResponse({success: true});
    });
    return true;
  }
}); 