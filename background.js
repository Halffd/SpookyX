// Background service worker for SpookyX extension
console.log('SpookyX background service worker initialized');

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('SpookyX extension installed');
    // Initialize any needed storage here
    chrome.storage.local.set({ 
      'yourPosts': {},
      'lastSeenPosts': {},
      'crosslinkTracker': {},
      'settings': null // Will be populated when settings are first saved
    });
  } else if (details.reason === 'update') {
    console.log('SpookyX extension updated from version ' + details.previousVersion);
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
}); 