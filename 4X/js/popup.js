/**
 * 4X Extension Popup Script
 * Handles interactions with the extension popup
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';
  
  // Get active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  
  // Cache DOM elements
  const settingsBtn = document.getElementById('settings-btn');
  const clearCacheBtn = document.getElementById('clear-cache-btn');
  const statusText = document.getElementById('status-text');
  const versionText = document.getElementById('version-text');
  
  // Handle settings button click
  if (settingsBtn) {
    settingsBtn.addEventListener('click', async () => {
      try {
        // Send message to content script to open settings panel
        await chrome.tabs.sendMessage(activeTab.id, { action: 'openSettings' });
        
        // Close popup
        window.close();
      } catch (error) {
        console.error('Error opening settings:', error);
        displayStatus('Error: Extension not active on this page', 'error');
      }
    });
  }
  
  // Handle clear cache button click
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', async () => {
      try {
        // Send message to content script to clear cache
        const response = await chrome.tabs.sendMessage(activeTab.id, { action: 'clearCache' });
        
        if (response && response.success) {
          displayStatus('Cache cleared successfully', 'success');
        } else {
          displayStatus('Error clearing cache', 'error');
        }
      } catch (error) {
        console.error('Error clearing cache:', error);
        displayStatus('Error: Extension not active on this page', 'error');
      }
    });
  }
  
  // Update version text
  if (versionText) {
    const manifest = chrome.runtime.getManifest();
    versionText.textContent = `v${manifest.version}`;
  }
  
  // Check if the extension is active on the current page
  checkExtensionStatus(activeTab);
  
  // Function to check if the extension is active on the current page
  async function checkExtensionStatus(tab) {
    try {
      // Check if the current site is supported
      const url = new URL(tab.url);
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
      
      const isSupportedSite = supportedDomains.some(domain => url.hostname.includes(domain));
      
      if (!isSupportedSite) {
        displayStatus('Extension not active on this site', 'warning');
        disableButtons();
        return;
      }
      
      // Try to communicate with the content script
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSettings' });
        
        if (response && response.success) {
          displayStatus('Extension active on this page', 'success');
        } else {
          displayStatus('Extension loaded but not active', 'warning');
        }
      } catch (error) {
        // If we can't communicate with the content script, it's not active
        displayStatus('Extension not active on this page', 'warning');
        disableButtons();
      }
    } catch (error) {
      console.error('Error checking extension status:', error);
      displayStatus('Error checking extension status', 'error');
      disableButtons();
    }
  }
  
  // Function to display status messages
  function displayStatus(message, type = 'info') {
    if (!statusText) return;
    
    statusText.textContent = message;
    
    // Remove all status classes
    statusText.classList.remove('status-info', 'status-success', 'status-warning', 'status-error');
    
    // Add appropriate class
    statusText.classList.add(`status-${type}`);
  }
  
  // Function to disable buttons
  function disableButtons() {
    if (settingsBtn) {
      settingsBtn.disabled = true;
      settingsBtn.classList.add('disabled');
    }
    
    if (clearCacheBtn) {
      clearCacheBtn.disabled = true;
      clearCacheBtn.classList.add('disabled');
    }
  }
}); 