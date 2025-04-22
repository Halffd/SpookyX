/**
 * 4X UI Module
 * Handles user interface components like settings panel and buttons
 */

(function() {
  'use strict';
  
  // Initialize namespace
  window.FourX = window.FourX || {};
  
  // UI module
  FourX.UI = {
    // Initialize UI components
    init: function() {
      // Add settings button to the page
      this.addSettingsButton();
      
      FourX.Settings.logDebug('UI module initialized');
    },
    
    // Add settings button to the page
    addSettingsButton: function() {
      const button = document.createElement('div');
      button.className = 'fourx-settings-button';
      button.innerHTML = '4X';
      button.title = '4X Settings';
      button.addEventListener('click', this.toggleSettingsPanel);
      document.body.appendChild(button);
      
      FourX.Settings.logDebug('Settings button added');
    },
    
    // Toggle settings panel visibility
    toggleSettingsPanel: function() {
      // Check if panel already exists
      let panel = document.getElementById('fourx-settings-panel');
      
      // If panel exists, remove it
      if (panel) {
        panel.remove();
        return;
      }
      
      // Get current settings
      const currentSettings = FourX.Settings.getAll();
      
      // Create and show settings panel
      FourX.UI.createSettingsPanel(currentSettings);
    },
    
    // Create settings panel
    createSettingsPanel: function(currentSettings) {
      const panel = document.createElement('div');
      panel.id = 'fourx-settings-panel';
      panel.className = 'fourx-settings-panel';
      
      // Add header
      const header = document.createElement('div');
      header.innerHTML = '<h2>4X Settings</h2>';
      panel.appendChild(header);
      
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '10px';
      closeButton.style.right = '10px';
      closeButton.style.background = 'none';
      closeButton.style.border = 'none';
      closeButton.style.fontSize = '24px';
      closeButton.style.cursor = 'pointer';
      closeButton.addEventListener('click', () => panel.remove());
      panel.appendChild(closeButton);
      
      // Add settings form (simplified for brevity)
      const form = document.createElement('div');
      form.innerHTML = `
        <div class="setting-group">
          <h3>Post Expansion</h3>
          <div class="setting">
            <input type="checkbox" id="setting-auto-expand" ${currentSettings.autoExpand ? 'checked' : ''}>
            <label for="setting-auto-expand">Automatically expand quotes on hover</label>
          </div>
        </div>
        
        <div class="setting-group">
          <h3>Appearance</h3>
          <div class="setting">
            <input type="checkbox" id="setting-dark-mode" ${currentSettings.darkMode ? 'checked' : ''}>
            <label for="setting-dark-mode">Dark mode</label>
          </div>
          <div class="setting">
            <input type="checkbox" id="setting-compact-mode" ${currentSettings.compactMode ? 'checked' : ''}>
            <label for="setting-compact-mode">Compact mode</label>
          </div>
        </div>
        
        <div class="setting-group">
          <h3>Post Highlighting</h3>
          <div class="setting">
            <input type="checkbox" id="setting-highlight-keywords" ${currentSettings.highlightKeywords ? 'checked' : ''}>
            <label for="setting-highlight-keywords">Highlight posts with keywords</label>
          </div>
          <div class="setting">
            <label for="setting-keywords">Keywords (comma separated):</label>
            <input type="text" id="setting-keywords" value="${(currentSettings.keywords || []).join(', ')}">
          </div>
        </div>
        
        <div class="setting-group">
          <h3>Advanced Settings</h3>
          <div class="setting">
            <input type="checkbox" id="setting-debug-mode" ${currentSettings.debugMode ? 'checked' : ''}>
            <label for="setting-debug-mode">Debug mode</label>
          </div>
          <div class="setting">
            <input type="checkbox" id="setting-cache-enable" ${currentSettings.cacheEnable ? 'checked' : ''}>
            <label for="setting-cache-enable">Enable post caching</label>
          </div>
        </div>
      `;
      panel.appendChild(form);
      
      // Add save button
      const saveButton = document.createElement('button');
      saveButton.textContent = 'Save Settings';
      saveButton.style.marginTop = '20px';
      saveButton.style.padding = '8px 16px';
      saveButton.style.backgroundColor = '#553311';
      saveButton.style.color = 'white';
      saveButton.style.border = 'none';
      saveButton.style.borderRadius = '4px';
      saveButton.style.cursor = 'pointer';
      
      saveButton.addEventListener('click', () => {
        // Get values from form
        const settings = FourX.Settings.getAll();
        
        // Update settings with form values
        settings.autoExpand = document.getElementById('setting-auto-expand').checked;
        settings.darkMode = document.getElementById('setting-dark-mode').checked;
        settings.compactMode = document.getElementById('setting-compact-mode').checked;
        settings.highlightKeywords = document.getElementById('setting-highlight-keywords').checked;
        settings.keywords = document.getElementById('setting-keywords').value.split(',').map(k => k.trim()).filter(k => k);
        settings.debugMode = document.getElementById('setting-debug-mode').checked;
        settings.cacheEnable = document.getElementById('setting-cache-enable').checked;
        
        // Save settings
        FourX.Settings.current = settings;
        FourX.Settings.save().then(() => {
          // Show success message
          const message = document.createElement('div');
          message.textContent = 'Settings saved!';
          message.style.color = 'green';
          message.style.marginTop = '10px';
          panel.appendChild(message);
          
          // Apply settings
          // We'll use an event to notify listeners
          const event = new CustomEvent('4X:settingsChanged', { detail: settings });
          document.dispatchEvent(event);
          
          // Close panel after a delay
          setTimeout(() => {
            panel.remove();
          }, 1500);
        });
      });
      
      panel.appendChild(saveButton);
      
      // Add to page
      document.body.appendChild(panel);
    },
    
    // Show a notification message
    showNotification: function(message, type = 'info', duration = 3000) {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `fourx-notification fourx-notification-${type}`;
      notification.textContent = message;
      
      // Style the notification
      notification.style.position = 'fixed';
      notification.style.bottom = '70px';
      notification.style.right = '20px';
      notification.style.padding = '10px 15px';
      notification.style.borderRadius = '4px';
      notification.style.zIndex = '10000';
      notification.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      
      // Set colors based on type
      if (type === 'error') {
        notification.style.backgroundColor = '#f44336';
        notification.style.color = 'white';
      } else if (type === 'success') {
        notification.style.backgroundColor = '#4caf50';
        notification.style.color = 'white';
      } else {
        notification.style.backgroundColor = '#2196f3';
        notification.style.color = 'white';
      }
      
      // Add to body
      document.body.appendChild(notification);
      
      // Remove after duration
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        
        // Remove completely after fade out
        setTimeout(() => {
          notification.remove();
        }, 500);
      }, duration);
    }
  };
})(); 