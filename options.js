// Default settings
const defaultSettings = {
  autoExpand: true,
  highlightPosts: true,
  keywords: ['important', 'announcement'],
  highlightColor: '#FFAA33',
  quoteColor: '#789922',
  darkMode: false,
  compactMode: false,
  cachePosts: true,
  cacheDuration: 24,
  customCssEnable: false,
  customCss: ''
};

// DOM elements
const elements = {
  autoExpand: document.getElementById('enable-auto-expand'),
  highlightPosts: document.getElementById('enable-keyword-highlight'),
  keywords: document.getElementById('keywords'),
  highlightColor: document.getElementById('highlight-color'),
  quoteColor: document.getElementById('quote-color'),
  darkMode: document.getElementById('dark-mode'),
  compactMode: document.getElementById('compact-mode'),
  cachePosts: document.getElementById('cache-posts'),
  cacheDuration: document.getElementById('cache-duration'),
  customCssEnable: document.getElementById('custom-css-enable'),
  customCss: document.getElementById('custom-css'),
  saveButton: document.getElementById('save-settings'),
  resetButton: document.getElementById('reset-settings'),
  saveMessage: document.getElementById('save-message')
};

// Load settings from storage and populate form
function loadSettings() {
  chrome.storage.local.get('settings', (result) => {
    const settings = result.settings || defaultSettings;
    
    // Update form with saved settings
    elements.autoExpand.checked = settings.autoExpand;
    elements.highlightPosts.checked = settings.highlightPosts;
    elements.keywords.value = (settings.keywords || []).join(', ');
    elements.highlightColor.value = settings.highlightColor || defaultSettings.highlightColor;
    elements.quoteColor.value = settings.quoteColor || defaultSettings.quoteColor;
    elements.darkMode.checked = settings.darkMode;
    elements.compactMode.checked = settings.compactMode;
    elements.cachePosts.checked = settings.cachePosts;
    elements.cacheDuration.value = settings.cacheDuration || defaultSettings.cacheDuration;
    elements.customCssEnable.checked = settings.customCssEnable;
    elements.customCss.value = settings.customCss || '';
    
    console.log('SpookyX: Settings loaded', settings);
  });
}

// Save settings to storage
function saveSettings() {
  // Get values from form
  const settings = {
    autoExpand: elements.autoExpand.checked,
    highlightPosts: elements.highlightPosts.checked,
    keywords: elements.keywords.value.split(',').map(k => k.trim()).filter(k => k),
    highlightColor: elements.highlightColor.value,
    quoteColor: elements.quoteColor.value,
    darkMode: elements.darkMode.checked,
    compactMode: elements.compactMode.checked,
    cachePosts: elements.cachePosts.checked,
    cacheDuration: parseInt(elements.cacheDuration.value) || defaultSettings.cacheDuration,
    customCssEnable: elements.customCssEnable.checked,
    customCss: elements.customCss.value
  };
  
  // Save to storage
  chrome.storage.local.set({ settings }, () => {
    // Check for error
    if (chrome.runtime.lastError) {
      showMessage('Error saving settings: ' + chrome.runtime.lastError.message, false);
      console.error('SpookyX: Error saving settings', chrome.runtime.lastError);
      return;
    }
    
    showMessage('Settings saved successfully!', true);
    console.log('SpookyX: Settings saved', settings);
  });
}

// Reset settings to defaults
function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    // Update form with default settings
    elements.autoExpand.checked = defaultSettings.autoExpand;
    elements.highlightPosts.checked = defaultSettings.highlightPosts;
    elements.keywords.value = defaultSettings.keywords.join(', ');
    elements.highlightColor.value = defaultSettings.highlightColor;
    elements.quoteColor.value = defaultSettings.quoteColor;
    elements.darkMode.checked = defaultSettings.darkMode;
    elements.compactMode.checked = defaultSettings.compactMode;
    elements.cachePosts.checked = defaultSettings.cachePosts;
    elements.cacheDuration.value = defaultSettings.cacheDuration;
    elements.customCssEnable.checked = defaultSettings.customCssEnable;
    elements.customCss.value = defaultSettings.customCss;
    
    // Save defaults to storage
    chrome.storage.local.set({ settings: defaultSettings }, () => {
      showMessage('Settings reset to defaults.', true);
      console.log('SpookyX: Settings reset to defaults');
    });
  }
}

// Display a message to the user
function showMessage(message, isSuccess) {
  elements.saveMessage.textContent = message;
  elements.saveMessage.className = 'save-message ' + (isSuccess ? 'save-success' : 'save-error');
  elements.saveMessage.style.display = 'block';
  
  // Hide the message after 3 seconds
  setTimeout(() => {
    elements.saveMessage.style.display = 'none';
  }, 3000);
}

// Set up event listeners
function setupEventListeners() {
  elements.saveButton.addEventListener('click', saveSettings);
  elements.resetButton.addEventListener('click', resetSettings);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
}); 