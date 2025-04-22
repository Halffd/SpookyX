// Initialize popup when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on a supported site
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
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
    
    const isSupported = supportedDomains.some(domain => currentTab.url.includes(domain));
    const statusMessage = document.getElementById('status-message');
    
    if (isSupported) {
      statusMessage.textContent = 'Active on current site. SpookyX features are enabled.';
      statusMessage.style.color = '#4CAF50';
    } else {
      statusMessage.textContent = 'Current site is not supported. Visit a supported archive site.';
      statusMessage.style.color = '#999';
    }
  });
  
  // Settings button click event
  document.getElementById('open-settings').addEventListener('click', function() {
    // Try to open settings on the current tab if it's a supported site
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {action: 'openSettings'},
        function(response) {
          if (chrome.runtime.lastError || !response || !response.success) {
            // If we couldn't open settings on the current tab, open the settings page
            chrome.runtime.openOptionsPage();
          }
          window.close(); // Close the popup
        }
      );
    });
  });
}); 