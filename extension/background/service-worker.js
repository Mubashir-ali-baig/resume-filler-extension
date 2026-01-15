// Background service worker for Resume Filler extension

// Extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Resume Filler extension installed');
    // Initialize default settings
    chrome.storage.local.set({
      enabled: true,
      autoScan: false
    });
  } else if (details.reason === 'update') {
    console.log('Resume Filler extension updated');
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'log') {
    console.log('[Resume Filler]', request.message);
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open for async response
});

// Log that service worker is loaded
console.log('Resume Filler service worker loaded');
