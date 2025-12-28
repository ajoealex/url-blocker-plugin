// Load and display patterns on popup open
document.addEventListener('DOMContentLoaded', async () => {
  await loadPatterns();
  await loadReportingSettings();
  await loadCloseTabSettings();

  // Hide warning banner after 5 seconds with fade-out
  setTimeout(() => {
    const warningBanner = document.querySelector('.warning-banner');
    if (warningBanner) {
      warningBanner.classList.add('fade-out');
      // Remove from DOM after fade animation completes
      setTimeout(() => {
        warningBanner.style.display = 'none';
      }, 500);
    }
  }, 5000);

  // Add pattern button click handler
  document.getElementById('addPattern').addEventListener('click', addPattern);

  // Allow Enter key to add pattern
  document.getElementById('urlPattern').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addPattern();
    }
  });

  // Reporting checkbox handler
  document.getElementById('reportEnabled').addEventListener('change', toggleReporting);

  // Save endpoint button handler
  document.getElementById('saveEndpoint').addEventListener('click', saveEndpoint);

  // Close tab checkbox handler
  document.getElementById('closeTabEnabled').addEventListener('change', toggleCloseTab);

  // Save close tab button handler
  document.getElementById('saveCloseTab').addEventListener('click', saveCloseTabSettings);

  // Reset button handler
  document.getElementById('resetBtn').addEventListener('click', resetAll);
});

// Load patterns from storage and display them
async function loadPatterns() {
  const result = await chrome.storage.sync.get(['blockedPatterns']);
  const patterns = result.blockedPatterns || [];

  displayPatterns(patterns);
}

// Display patterns in the UI
function displayPatterns(patterns) {
  const patternsList = document.getElementById('patternsList');
  const emptyState = document.getElementById('emptyState');

  patternsList.innerHTML = '';

  if (patterns.length === 0) {
    emptyState.style.display = 'block';
    patternsList.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  patternsList.style.display = 'block';

  patterns.forEach((pattern, index) => {
    const patternItem = document.createElement('div');
    patternItem.className = 'pattern-item';

    const patternText = document.createElement('span');
    patternText.className = 'pattern-text';
    patternText.textContent = pattern;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deletePattern(index));

    patternItem.appendChild(patternText);
    patternItem.appendChild(deleteBtn);
    patternsList.appendChild(patternItem);
  });
}

// Add a new pattern
async function addPattern() {
  const input = document.getElementById('urlPattern');
  const pattern = input.value.trim();

  if (!pattern) {
    showMessage('Please enter a URL pattern', 'error');
    return;
  }

  // Validate pattern format
  if (!isValidPattern(pattern)) {
    showMessage('Invalid pattern format. Use patterns like *://*.example.com/*', 'error');
    return;
  }

  const result = await chrome.storage.sync.get(['blockedPatterns']);
  const patterns = result.blockedPatterns || [];

  // Check for duplicates
  if (patterns.includes(pattern)) {
    showMessage('Pattern already exists', 'error');
    return;
  }

  patterns.push(pattern);
  await chrome.storage.sync.set({ blockedPatterns: patterns });

  // Notify background script to update rules
  chrome.runtime.sendMessage({ action: 'updateRules' });

  input.value = '';
  displayPatterns(patterns);
  showMessage('Pattern added successfully', 'success');
}

// Delete a pattern
async function deletePattern(index) {
  const result = await chrome.storage.sync.get(['blockedPatterns']);
  const patterns = result.blockedPatterns || [];

  patterns.splice(index, 1);
  await chrome.storage.sync.set({ blockedPatterns: patterns });

  // Notify background script to update rules
  chrome.runtime.sendMessage({ action: 'updateRules' });

  displayPatterns(patterns);
  showMessage('Pattern deleted successfully', 'success');
}

// Validate URL pattern
function isValidPattern(pattern) {
  // Basic validation for URL match patterns
  // Should contain protocol and path
  const hasProtocol = pattern.startsWith('*://') || pattern.startsWith('http://') || pattern.startsWith('https://');
  const hasPath = pattern.includes('/');

  return hasProtocol && hasPath && pattern.length > 5;
}

// Show temporary message
function showMessage(text, type) {
  // Remove existing message if any
  const existingMsg = document.querySelector('.message');
  if (existingMsg) {
    existingMsg.remove();
  }

  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.textContent = text;

  document.querySelector('.container').insertBefore(
    message,
    document.querySelector('.add-pattern')
  );

  setTimeout(() => {
    message.remove();
  }, 3000);
}

// Load reporting settings from storage
async function loadReportingSettings() {
  const result = await chrome.storage.sync.get(['reportingEnabled', 'reportEndpointUrl']);

  const reportEnabled = result.reportingEnabled || false;
  const endpointUrl = result.reportEndpointUrl || 'http://localhost:9874';

  document.getElementById('reportEnabled').checked = reportEnabled;
  document.getElementById('endpointUrl').value = endpointUrl;

  // Show/hide endpoint config based on checkbox state
  document.getElementById('endpointConfig').style.display = reportEnabled ? 'block' : 'none';
}

// Toggle reporting on/off
async function toggleReporting(e) {
  const enabled = e.target.checked;
  const endpointConfig = document.getElementById('endpointConfig');

  if (enabled) {
    endpointConfig.style.display = 'block';

    // Check if endpoint is configured
    const result = await chrome.storage.sync.get(['reportEndpointUrl']);
    if (!result.reportEndpointUrl) {
      showMessage('Please configure the endpoint below', 'error');
      // Don't enable reporting yet, but keep checkbox checked and form visible
      await chrome.storage.sync.set({ reportingEnabled: false });
      return;
    }
  } else {
    endpointConfig.style.display = 'none';
  }

  await chrome.storage.sync.set({ reportingEnabled: enabled });

  // Notify background script
  chrome.runtime.sendMessage({
    action: 'updateReporting',
    enabled: enabled
  });

  showMessage(enabled ? 'Reporting enabled' : 'Reporting disabled', 'success');
}

// Save endpoint configuration
async function saveEndpoint() {
  const url = document.getElementById('endpointUrl').value.trim();

  if (!url) {
    showMessage('Please enter an endpoint URL', 'error');
    return;
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (e) {
    showMessage('Please enter a valid URL (e.g., https://example.com/api/blocked-urls)', 'error');
    return;
  }

  // If checkbox is checked, do a ping check to validate server access
  const isChecked = document.getElementById('reportEnabled').checked;
  if (isChecked) {
    showMessage('Validating server connection...', 'success');

    const pingSuccess = await pingServer(url);
    if (!pingSuccess) {
      showMessage('Server validation failed. Please check the endpoint URL and ensure the server is running.', 'error');
      return;
    }
  }

  await chrome.storage.sync.set({
    reportEndpointUrl: url
  });

  // Notify background script to update endpoint
  chrome.runtime.sendMessage({
    action: 'updateEndpoint',
    url: url
  });

  // If checkbox is checked, enable reporting now that endpoint is configured
  if (isChecked) {
    await chrome.storage.sync.set({ reportingEnabled: true });

    chrome.runtime.sendMessage({
      action: 'updateReporting',
      enabled: true
    });

    showMessage('Settings saved and reporting enabled', 'success');
  } else {
    showMessage('Settings saved successfully', 'success');
  }
}

// Ping server to validate connection
async function pingServer(baseUrl) {
  try {
    // Extract base URL and append /ping endpoint
    const urlObj = new URL(baseUrl);
    const pingUrl = `${urlObj.protocol}//${urlObj.host}/ping`;

    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Ping failed with status:', response.status);
      return false;
    }

    const data = await response.json();

    // Validate response format
    if (data.status === 'ok' && data.message && data.timestamp) {
      console.log('Server ping successful:', data);
      return true;
    } else {
      console.error('Invalid ping response format:', data);
      return false;
    }
  } catch (error) {
    console.error('Error pinging server:', error);
    return false;
  }
}

// Load close tab settings from storage
async function loadCloseTabSettings() {
  const result = await chrome.storage.sync.get(['closeTabEnabled', 'closeTabInterval']);

  const closeEnabled = result.closeTabEnabled || false;
  const closeInterval = result.closeTabInterval || 5;

  document.getElementById('closeTabEnabled').checked = closeEnabled;
  document.getElementById('closeTabInterval').value = closeInterval;

  // Show/hide close tab config based on checkbox state
  document.getElementById('closeTabConfig').style.display = closeEnabled ? 'block' : 'none';
}

// Toggle close tab on/off
async function toggleCloseTab(e) {
  const enabled = e.target.checked;
  const closeTabConfig = document.getElementById('closeTabConfig');

  if (enabled) {
    closeTabConfig.style.display = 'block';

    // Check if interval is configured
    const result = await chrome.storage.sync.get(['closeTabInterval']);
    if (!result.closeTabInterval) {
      showMessage('Please configure the interval below', 'error');
      // Don't enable close tab yet, but keep checkbox checked and form visible
      await chrome.storage.sync.set({ closeTabEnabled: false });
      return;
    }
  } else {
    closeTabConfig.style.display = 'none';
  }

  await chrome.storage.sync.set({ closeTabEnabled: enabled });

  // Notify background script
  chrome.runtime.sendMessage({
    action: 'updateCloseTab',
    enabled: enabled
  });

  showMessage(enabled ? 'Auto-close enabled' : 'Auto-close disabled', 'success');
}

// Save close tab configuration
async function saveCloseTabSettings() {
  const interval = parseInt(document.getElementById('closeTabInterval').value.trim());

  // Validate interval
  if (!interval || interval < 1 || interval > 3600) {
    showMessage('Please enter a valid interval (1-3600 seconds)', 'error');
    return;
  }

  await chrome.storage.sync.set({
    closeTabInterval: interval
  });

  // Notify background script to update interval
  chrome.runtime.sendMessage({
    action: 'updateCloseTabInterval',
    interval: interval
  });

  // If checkbox is checked, enable close tab now that interval is configured
  const isChecked = document.getElementById('closeTabEnabled').checked;
  if (isChecked) {
    await chrome.storage.sync.set({ closeTabEnabled: true });

    chrome.runtime.sendMessage({
      action: 'updateCloseTab',
      enabled: true
    });

    showMessage('Settings saved and auto-close enabled', 'success');
  } else {
    showMessage('Settings saved successfully', 'success');
  }
}

// Reset all settings and rules
async function resetAll() {
  // Confirm with user
  const confirmed = confirm('Are you sure you want to reset all settings and rules? This action cannot be undone.');

  if (!confirmed) {
    return;
  }

  try {
    // Clear all storage
    await chrome.storage.sync.clear();

    // Reset UI to default state
    document.getElementById('urlPattern').value = '';
    document.getElementById('reportEnabled').checked = false;
    document.getElementById('endpointUrl').value = 'http://localhost:9874';
    document.getElementById('endpointConfig').style.display = 'none';
    document.getElementById('closeTabEnabled').checked = false;
    document.getElementById('closeTabInterval').value = '5';
    document.getElementById('closeTabConfig').style.display = 'none';

    // Clear patterns display
    displayPatterns([]);

    // Notify background script to update rules
    chrome.runtime.sendMessage({ action: 'updateRules' });
    chrome.runtime.sendMessage({ action: 'updateReporting', enabled: false });
    chrome.runtime.sendMessage({ action: 'updateCloseTab', enabled: false });

    showMessage('All settings and rules have been reset', 'success');
  } catch (error) {
    console.error('Error resetting settings:', error);
    showMessage('Error resetting settings', 'error');
  }
}
