/**
 * 4X Options Script
 * Handles options page functionality
 */

// Default settings
const defaultSettings = {
  // General
  autoExpand: true,
  hoverDelay: true,
  hoverDelayTime: 500,
  cacheEnable: true,
  cacheDuration: 24,
  
  // Appearance
  darkMode: false,
  compactMode: false,
  fontSize: 'medium',
  highlightColor: '#FFBB77',
  
  // Post Processing
  highlightKeywords: false,
  keywords: [],
  filterMode: false,
  filterWords: [],
  
  // Advanced
  debugMode: false,
  alternativeAPI: false,
  requestTimeout: 15,
  maxRetries: 3
};

// DOM Elements
const elements = {
  // General
  autoExpand: document.getElementById('autoExpand'),
  hoverDelay: document.getElementById('hoverDelay'),
  hoverDelayTime: document.getElementById('hoverDelayTime'),
  cacheEnable: document.getElementById('cacheEnable'),
  cacheDuration: document.getElementById('cacheDuration'),
  
  // Appearance
  darkMode: document.getElementById('darkMode'),
  compactMode: document.getElementById('compactMode'),
  fontSize: document.getElementById('fontSize'),
  highlightColor: document.getElementById('highlightColor'),
  highlightColorValue: document.getElementById('highlightColorValue'),
  
  // Post Processing
  highlightKeywords: document.getElementById('highlightKeywords'),
  keywords: document.getElementById('keywords'),
  filterMode: document.getElementById('filterMode'),
  filterWords: document.getElementById('filterWords'),
  
  // Advanced
  debugMode: document.getElementById('debugMode'),
  alternativeAPI: document.getElementById('alternativeAPI'),
  requestTimeout: document.getElementById('requestTimeout'),
  maxRetries: document.getElementById('maxRetries'),
  
  // Buttons
  saveButton: document.getElementById('saveButton'),
  resetButton: document.getElementById('resetButton'),
  clearCacheButton: document.getElementById('clearCacheButton'),
  themeToggle: document.getElementById('themeToggle'),
  
  // Status
  statusMessage: document.getElementById('statusMessage')
};

// Load settings from storage
function loadSettings() {
  chrome.storage.local.get('settings', (data) => {
    const settings = data.settings || defaultSettings;
    updateFormWithSettings(settings);
    
    if (settings.darkMode) {
      document.body.classList.add('dark-mode');
    }
    
    logDebug('Settings loaded', settings);
  });
}

// Update form inputs with settings values
function updateFormWithSettings(settings) {
  // General
  elements.autoExpand.checked = settings.autoExpand;
  elements.hoverDelay.checked = settings.hoverDelay;
  elements.hoverDelayTime.value = settings.hoverDelayTime;
  elements.cacheEnable.checked = settings.cacheEnable;
  elements.cacheDuration.value = settings.cacheDuration;
  
  // Appearance
  elements.darkMode.checked = settings.darkMode;
  elements.compactMode.checked = settings.compactMode;
  elements.fontSize.value = settings.fontSize;
  elements.highlightColor.value = settings.highlightColor;
  elements.highlightColorValue.textContent = settings.highlightColor;
  
  // Post Processing
  elements.highlightKeywords.checked = settings.highlightKeywords;
  elements.keywords.value = Array.isArray(settings.keywords) ? settings.keywords.join(', ') : '';
  elements.filterMode.checked = settings.filterMode;
  elements.filterWords.value = Array.isArray(settings.filterWords) ? settings.filterWords.join(', ') : '';
  
  // Advanced
  elements.debugMode.checked = settings.debugMode;
  elements.alternativeAPI.checked = settings.alternativeAPI;
  elements.requestTimeout.value = settings.requestTimeout;
  elements.maxRetries.value = settings.maxRetries;
}

// Save settings to storage
function saveSettings() {
  const settings = {
    // General
    autoExpand: elements.autoExpand.checked,
    hoverDelay: elements.hoverDelay.checked,
    hoverDelayTime: parseInt(elements.hoverDelayTime.value) || defaultSettings.hoverDelayTime,
    cacheEnable: elements.cacheEnable.checked,
    cacheDuration: parseInt(elements.cacheDuration.value) || defaultSettings.cacheDuration,
    
    // Appearance
    darkMode: elements.darkMode.checked,
    compactMode: elements.compactMode.checked,
    fontSize: elements.fontSize.value,
    highlightColor: elements.highlightColor.value,
    
    // Post Processing
    highlightKeywords: elements.highlightKeywords.checked,
    keywords: elements.keywords.value.split(',').map(k => k.trim()).filter(k => k),
    filterMode: elements.filterMode.checked,
    filterWords: elements.filterWords.value.split(',').map(w => w.trim()).filter(w => w),
    
    // Advanced
    debugMode: elements.debugMode.checked,
    alternativeAPI: elements.alternativeAPI.checked,
    requestTimeout: parseInt(elements.requestTimeout.value) || defaultSettings.requestTimeout,
    maxRetries: parseInt(elements.maxRetries.value) || defaultSettings.maxRetries
  };
  
  chrome.storage.local.set({ settings }, () => {
    showStatusMessage('Settings saved successfully!', 'success');
    logDebug('Settings saved', settings);
  });
}

// Reset settings to defaults
function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    updateFormWithSettings(defaultSettings);
    chrome.storage.local.set({ settings: defaultSettings }, () => {
      showStatusMessage('Settings reset to defaults', 'success');
      logDebug('Settings reset to defaults');
    });
  }
}

// Clear cache
function clearCache() {
  if (confirm('Are you sure you want to clear the post cache?\nThis will remove all cached post data.')) {
    chrome.storage.local.remove(['postCache', 'lastSeenPosts', 'crosslinkTracker'], () => {
      showStatusMessage('Cache cleared successfully', 'success');
      logDebug('Cache cleared');
    });
  }
}

// Show status message
function showStatusMessage(message, type = 'success') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = 'status-message ' + type;
  elements.statusMessage.style.display = 'block';
  
  // Hide message after 3 seconds
  setTimeout(() => {
    elements.statusMessage.style.display = 'none';
  }, 3000);
}

// Toggle dark mode for options page
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  
  // Don't save this to settings, it's just for the options page
  // The actual dark mode setting is controlled by the checkbox
}

// Debug logging
function logDebug(message, data) {
  chrome.storage.local.get('settings', (result) => {
    const settings = result.settings || defaultSettings;
    if (settings.debugMode) {
      console.log(`4X Debug: ${message}`, data);
    }
  });
}

// Update color value display when color input changes
function updateColorDisplay() {
  elements.highlightColorValue.textContent = elements.highlightColor.value;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
  'use strict';
  
  // Update version
  const versionElement = document.getElementById('version');
  const manifest = chrome.runtime.getManifest();
  versionElement.textContent = manifest.version;
  
  // Handle option save button
  document.getElementById('open-options-btn').addEventListener('click', async () => {
    // Get all tabs
    const tabs = await chrome.tabs.query({});
    
    // Find a tab with a supported domain
    const supportedDomains = [
      'archive.4plebs.org',
      'archive.loveisover.me',
      'archived.moe',
      'desuarchive.org',
      'boards.fireden.net',
      'archive.nyafuu.org',
      'archive.rebeccablacktech.com',
      'thebarchive.com',
      'warosu.org',
      'arch.b4k.co',
      'archive.alice.al',
      '4chan.org',
      '4channel.org'
    ];
    
    // Find the first tab with a supported domain
    const supportedTab = tabs.find(tab => {
      try {
        const url = new URL(tab.url);
        return supportedDomains.some(domain => url.hostname.includes(domain));
      } catch (error) {
        return false;
      }
    });
    
    if (supportedTab) {
      // Focus the tab
      await chrome.tabs.update(supportedTab.id, { active: true });
      
      // Focus the window containing the tab
      await chrome.windows.update(supportedTab.windowId, { focused: true });
      
      // Send message to open settings
      chrome.tabs.sendMessage(supportedTab.id, { action: 'openSettings' });
    } else {
      alert('Please open a supported archive website first to access the settings.');
    }
  });
  
  // Handle reset data button
  document.getElementById('reset-data-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all extension data? This cannot be undone.')) {
      chrome.storage.local.clear(() => {
        alert('All extension data has been reset. Please refresh any open archive pages.');
      });
    }
  });
  
  // Load settings
  loadSettings();
});

// Save button
elements.saveButton.addEventListener('click', saveSettings);

// Reset button
elements.resetButton.addEventListener('click', resetSettings);

// Clear cache button
elements.clearCacheButton.addEventListener('click', clearCache);

// Toggle dark mode
elements.themeToggle.addEventListener('click', toggleDarkMode);

// Color picker updates
elements.highlightColor.addEventListener('input', updateColorDisplay);

// Form validation
elements.hoverDelayTime.addEventListener('input', function() {
  const value = parseInt(this.value);
  if (isNaN(value) || value < 0) {
    this.value = 0;
  } else if (value > 2000) {
    this.value = 2000;
  }
});

elements.cacheDuration.addEventListener('input', function() {
  const value = parseInt(this.value);
  if (isNaN(value) || value < 1) {
    this.value = 1;
  } else if (value > 720) {
    this.value = 720;
  }
});

elements.requestTimeout.addEventListener('input', function() {
  const value = parseInt(this.value);
  if (isNaN(value) || value < 5) {
    this.value = 5;
  } else if (value > 60) {
    this.value = 60;
  }
});

elements.maxRetries.addEventListener('input', function() {
  const value = parseInt(this.value);
  if (isNaN(value) || value < 0) {
    this.value = 0;
  } else if (value > 10) {
    this.value = 10;
  }
}); 