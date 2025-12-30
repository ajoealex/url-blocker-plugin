# Permission Justifications

This document explains why each permission is required for the Tab URL Blocker 404 extension.

## Required Permissions

### 1. `storage`
**Purpose:** Store user configuration (blocked URL patterns, reporting settings, auto-close settings)
**Usage:**
- Save blocked regex patterns across browser sessions
- Persist user preferences for reporting and auto-close features
- Sync settings across devices using Chrome sync

### 2. `declarativeNetRequest`
**Purpose:** Block websites matching user-defined regex patterns
**Usage:**
- Core blocking functionality
- Create dynamic blocking rules based on user-provided regex patterns
- Block navigation to URLs matching patterns in main_frame and sub_frame contexts

### 3. `webNavigation`
**Purpose:** Detect when URLs are blocked to provide user feedback and reporting
**Usage:**
- Listen for `onErrorOccurred` events with error code `net::ERR_BLOCKED_BY_CLIENT`
- Trigger visual feedback (icon blink) when blocking occurs
- Enable optional reporting feature (send blocked URL to user-configured endpoint)
- Support auto-close tab feature (close tabs that navigate to blocked URLs)
**Why needed:** `declarativeNetRequest` blocks silently without notifications. `webNavigation.onErrorOccurred` is the only production-compatible way to detect when our blocking rules take effect.

### 4. `tabs`
**Purpose:** Support auto-close tab feature
**Usage:**
- Close tabs that navigate to blocked URLs (when auto-close feature is enabled)
- Get current tab URL for pattern testing feature

### 5. `host_permissions: ["<all_urls>"]`
**Purpose:** Allow blocking rules to apply to all websites
**Usage:**
- Required by `declarativeNetRequest` to block URLs across all domains
- User can create patterns matching any website
**Why broad permission:** Users need flexibility to block any website with custom regex patterns. Restricting to specific domains would defeat the purpose of a customizable URL blocker.

## Privacy Statement

- **No data collection:** This extension does not collect, store, or transmit any user data except when the user explicitly enables the optional reporting feature.
- **Optional reporting:** Users can optionally configure a custom endpoint URL to receive notifications when URLs are blocked. This is disabled by default and requires manual configuration.
- **Local storage only:** All settings and patterns are stored locally in Chrome's sync storage. Nothing is sent to external servers unless explicitly configured by the user.
- **No analytics:** No analytics, tracking, or telemetry of any kind.
- **Open source:** Full source code is available for review.

## Security Considerations

1. **Regex patterns:** Users have full control over what patterns to block. The extension does not include any pre-configured blocking rules.
2. **User-controlled reporting:** The reporting endpoint is entirely user-configured. No default endpoint is provided.
3. **No remote code execution:** The extension does not fetch or execute any remote code.
4. **No cookie/credential access:** The extension does not access cookies, passwords, or credentials.

## Questions?

If you have questions about these permissions or privacy concerns, please open an issue on the GitHub repository.
