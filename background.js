// Global state for reporting
let reportingEnabled = false;
let reportEndpoint = null;

// Global state for auto-closing tabs
let closeTabEnabled = false;
let closeTabInterval = 5;

// Initialize rules when extension is installed
chrome.runtime.onInstalled.addListener(async () => {
  console.log('URL Blocker installed');
  await updateBlockingRules();
  await initializeReporting();
  await initializeCloseTab();
});

// Initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  await initializeReporting();
  await initializeCloseTab();
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

    // Get current rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(rule => rule.id);

    // Remove all existing rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds
    });

    // Create new rules from patterns - only block main_frame and sub_frame
    const newRules = patterns.map((pattern, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: 'block'
      },
      condition: {
        urlFilter: pattern,
        resourceTypes: [
          'main_frame',
          'sub_frame'
        ]
      }
    }));

    // Add new rules
    if (newRules.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: newRules
      });
    }

    console.log(`Updated blocking rules: ${newRules.length} patterns active`);
  } catch (error) {
    console.error('Error updating blocking rules:', error);
  }
}

// Update rules when storage changes (synced across devices)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.blockedPatterns) {
    updateBlockingRules();
  }
});

// Listen for blocked requests
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(async (details) => {
  console.log('Rule matched debug event:', details);

  if (details.request) {
    const blockedUrl = {
      url: details.request.url,
      timestamp: new Date().toISOString(),
      tabId: details.request.tabId,
      type: details.request.type,
      initiator: details.request.initiator
    };

    // Send report if reporting is enabled
    if (reportingEnabled) {
      console.log('Blocked URL tracked:', blockedUrl);
      await sendImmediateReport(blockedUrl);
    } else {
      console.log('Reporting disabled, not tracking blocked URL');
    }

    // Close tab after interval if enabled
    if (closeTabEnabled && details.request.tabId >= 0) {
      console.log(`Scheduling tab ${details.request.tabId} to close in ${closeTabInterval} seconds`);
      setTimeout(async () => {
        try {
          await chrome.tabs.remove(details.request.tabId);
          console.log(`Closed tab ${details.request.tabId}`);
        } catch (error) {
          console.error(`Error closing tab ${details.request.tabId}:`, error);
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
