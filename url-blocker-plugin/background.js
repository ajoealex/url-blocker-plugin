// Global state for reporting
let reportingEnabled = false;
let reportEndpoint = null;

// Global state for auto-closing tabs
let closeTabEnabled = false;
let closeTabInterval = 5;

// Icon paths
const normalIcon = {
  "16": "img/icons/icon16.png",
  "48": "img/icons/icon48.png",
  "128": "img/icons/icon128.png"
};

const alertIcon = {
  "16": "img/icons/icon-alert16.png",
  "48": "img/icons/icon-alert48.png",
  "128": "img/icons/icon-alert128.png"
};

// Function to blink the icon when a URL is blocked
function blinkIcon() {
  // Set to alert (red) icon
  chrome.action.setIcon({ path: alertIcon });

  // Blink pattern: alert for 300ms, normal for 300ms, alert for 300ms, then back to normal
  setTimeout(() => {
    chrome.action.setIcon({ path: normalIcon });
    setTimeout(() => {
      chrome.action.setIcon({ path: alertIcon });
      setTimeout(() => {
        chrome.action.setIcon({ path: normalIcon });
      }, 300);
    }, 300);
  }, 300);
}

// Initialize rules when extension is installed
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('URL Blocker installed/updated:', details.reason);
  try {
    await updateBlockingRules();
    await initializeReporting();
    await initializeCloseTab();
    console.log('✓ Installation complete');
  } catch (error) {
    console.error('✗ Installation failed:', error);
  }
});

// Initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('Browser started, initializing extension...');
  try {
    await updateBlockingRules();
    await initializeReporting();
    await initializeCloseTab();
    console.log('✓ Startup complete');
  } catch (error) {
    console.error('✗ Startup failed:', error);
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateRules') {
    updateBlockingRules();
  } else if (message.action === 'updateReporting') {
    updateReportingState(message.enabled);
  } else if (message.action === 'updateEndpoint') {
    updateEndpoint(message.url);
  } else if (message.action === 'updateCloseTab') {
    updateCloseTabState(message.enabled);
  } else if (message.action === 'updateCloseTabInterval') {
    updateCloseTabIntervalValue(message.interval);
  }
});

// Update declarativeNetRequest rules based on stored patterns
async function updateBlockingRules() {
  try {
    // Get blocked patterns from storage
    const result = await chrome.storage.sync.get(['blockedPatterns']);
    const patterns = result.blockedPatterns || [];

    // Get current dynamic rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(rule => rule.id);

    // Create new rules from patterns - only block main_frame and sub_frame
    const newRules = patterns.map((pattern, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: 'block'
      },
      condition: {
        regexFilter: pattern,
        resourceTypes: [
          'main_frame',
          'sub_frame'
        ]
      }
    }));

    // Update rules atomically - remove old and add new in single call
    const updateOptions = {};
    if (existingRuleIds.length > 0) {
      updateOptions.removeRuleIds = existingRuleIds;
    }
    if (newRules.length > 0) {
      updateOptions.addRules = newRules;
    }

    // Only call updateDynamicRules if there's something to do
    if (existingRuleIds.length > 0 || newRules.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules(updateOptions);
      console.log(`✓ Updated blocking rules: ${newRules.length} patterns active (dynamic rules - persist across restarts)`);
    } else {
      console.log('⚠ No rules to update');
    }
  } catch (error) {
    console.error('✗ Error updating blocking rules:', error);
  }
}


// Update rules when storage changes (synced across devices)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.blockedPatterns) {
    updateBlockingRules();
  }
});

// Listen for blocked requests using webNavigation API (works in production!)
// When a request is blocked by declarativeNetRequest, webNavigation.onErrorOccurred fires
// with error: "net::ERR_BLOCKED_BY_CLIENT"
chrome.webNavigation.onErrorOccurred.addListener(async (details) => {
  // Check if this error is due to our blocking rules
  if (details.error === 'net::ERR_BLOCKED_BY_CLIENT' &&
      (details.frameId === 0 || details.frameType === 'sub_frame')) {

    console.log('Blocked navigation detected:', details);

    const blockedUrl = {
      url: details.url,
      timestamp: new Date().toISOString(),
      tabId: details.tabId,
      frameId: details.frameId
    };

    // Blink the icon to indicate a URL was blocked
    blinkIcon();

    // Send report if reporting is enabled
    if (reportingEnabled) {
      console.log('Blocked URL tracked:', blockedUrl);
      await sendImmediateReport(blockedUrl);
    } else {
      console.log('Reporting disabled, not tracking blocked URL');
    }

    // Close tab after interval if enabled (only for main frame)
    if (closeTabEnabled && details.frameId === 0 && details.tabId >= 0) {
      console.log(`Scheduling tab ${details.tabId} to close in ${closeTabInterval} seconds`);
      setTimeout(async () => {
        try {
          await chrome.tabs.remove(details.tabId);
          console.log(`Closed tab ${details.tabId}`);
        } catch (error) {
          console.error(`Error closing tab ${details.tabId}:`, error);
        }
      }, closeTabInterval * 1000);
    }
  }
});

// Initialize reporting system
async function initializeReporting() {
  try {
    const result = await chrome.storage.sync.get(['reportingEnabled', 'reportEndpointUrl']);

    reportingEnabled = result.reportingEnabled || false;

    if (result.reportEndpointUrl) {
      reportEndpoint = result.reportEndpointUrl;
    }

    console.log('Reporting initialized:', { enabled: reportingEnabled, endpoint: reportEndpoint });
  } catch (error) {
    console.error('Error initializing reporting:', error);
  }
}

// Update reporting state
function updateReportingState(enabled) {
  reportingEnabled = enabled;
  console.log('Reporting state updated:', enabled);
}

// Update endpoint configuration
function updateEndpoint(url) {
  reportEndpoint = url;
  console.log('Endpoint updated:', { endpoint: reportEndpoint });
}

// Send immediate report when URL is blocked
async function sendImmediateReport(blockedUrl) {
  if (!reportEndpoint) {
    return;
  }

  try {
    const response = await fetch(reportEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        blockedUrl: blockedUrl,
        reportedAt: new Date().toISOString()
      })
    });

    if (response.ok) {
      console.log(`Successfully reported blocked URL to ${reportEndpoint}:`, blockedUrl);
    } else {
      console.error(`Failed to report blocked URL: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending report:', error);
  }
}

// Initialize close tab system
async function initializeCloseTab() {
  try {
    const result = await chrome.storage.sync.get(['closeTabEnabled', 'closeTabInterval']);

    closeTabEnabled = result.closeTabEnabled || false;
    closeTabInterval = result.closeTabInterval || 5;

    console.log('Close tab initialized:', { enabled: closeTabEnabled, interval: closeTabInterval });
  } catch (error) {
    console.error('Error initializing close tab:', error);
  }
}

// Update close tab state
function updateCloseTabState(enabled) {
  closeTabEnabled = enabled;
  console.log('Close tab state updated:', enabled);
}

// Update close tab interval
function updateCloseTabIntervalValue(interval) {
  closeTabInterval = interval;
  console.log('Close tab interval updated:', interval);
}
