/**
 * 4X Settings Module
 * Handles loading, saving, and managing settings
 */

(function() {
  'use strict';
  
  // Initialize namespace
  window.FourX = window.FourX || {};
  
  // Default settings
  const defaultSettings = {
    // General settings
    autoExpand: false,
    showBacklinks: true,
    hoverPreview: true,
    hoverDelay: 300,
    
    // Appearance
    darkMode: false,
    compactMode: false,
    
    // Post Highlighting
    highlightKeywords: false,
    keywords: [],
    
    // Advanced settings
    debugMode: false,
    cacheEnable: true,
    cacheDuration: 24, // hours
    requestTimeout: 15, // seconds
    maxRetries: 3,
    batchSize: 5,
    batchDelay: 500
  };
  
  // Settings module
  FourX.Settings = {
    // Current settings
    current: { ...defaultSettings },
    
    // Load settings from storage
    load: function() {
      return new Promise((resolve, reject) => {
        try {
          chrome.storage.local.get('settings', (data) => {
            if (data && data.settings) {
              this.current = { ...defaultSettings, ...data.settings };
              this.logDebug('Settings loaded');
            } else {
              this.current = { ...defaultSettings };
              this.logDebug('No saved settings found, using defaults');
            }
            resolve(this.current);
          });
        } catch (error) {
          console.error('Error loading settings:', error);
          this.current = { ...defaultSettings };
          reject(error);
        }
      });
    },
    
    // Save settings to storage
    save: function() {
      return new Promise((resolve, reject) => {
        try {
          chrome.storage.local.set({ settings: this.current }, () => {
            this.logDebug('Settings saved');
            resolve(true);
          });
        } catch (error) {
          console.error('Error saving settings:', error);
          reject(error);
        }
      });
    },
    
    // Update settings
    update: function(newSettings) {
      this.current = { ...this.current, ...newSettings };
      return this.save();
    },
    
    // Get all settings
    getAll: function() {
      return { ...this.current };
    },
    
    // Reset settings to defaults
    resetToDefaults: function() {
      this.current = { ...defaultSettings };
      return this.save();
    },
    
    // Log debug messages if debug mode is enabled
    logDebug: function(message, data) {
      if (this.current.debugMode) {
        if (data) {
          console.log(`4X Debug: ${message}`, data);
        } else {
          console.log(`4X Debug: ${message}`);
        }
      }
    }
  };
})(); 