# URL Blocker Chrome Extension

A Chrome extension (Manifest V3) that allows you to block websites based on URL patterns configured from a popup interface.

## Features

- Add custom URL patterns to block websites
- Simple and intuitive popup interface
- Blocks main pages and iframes (main_frame and sub_frame)
- Patterns sync across your Chrome browsers
- Real-time blocking without page refresh
- Report blocked URLs to a custom endpoint
- Auto-close blocked tabs after a configurable interval

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top-right corner
3. Click "Load unpacked"
4. Select the `url-blocker-plugin` folder
5. The extension icon will appear in your toolbar

## Creating Icons (Optional)

The extension expects icon files in the `icons` folder. You can create simple placeholder icons or design custom ones:

- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

You can use any online icon generator or image editor to create these. For testing, you can temporarily remove the icon references from `manifest.json`.

## Usage

### Managing Blocked Patterns

1. Click the extension icon in your Chrome toolbar
2. Enter a URL pattern in the input field (see examples below)
3. Click "Add Pattern" or press Enter
4. The pattern will immediately start blocking matching URLs
5. To remove a pattern, click the "Delete" button next to it

### Reporting Blocked URLs

1. Check the "Report blocked URLs" checkbox
2. Enter your endpoint URL (default: `http://localhost:9874`)
3. Click "Save Settings"
4. Each blocked URL will be immediately reported to your endpoint via POST request

The POST request payload format:
```json
{
  "blockedUrl": {
    "url": "https://example.com",
    "timestamp": "2025-12-28T10:30:00.000Z",
    "tabId": 123,
    "type": "main_frame",
    "initiator": "https://referrer.com"
  },
  "reportedAt": "2025-12-28T10:30:00.000Z"
}
```

### Auto-Close Blocked Tabs

1. Check the "Close blocked tabs after interval" checkbox
2. Enter the number of seconds to wait before closing (1-3600, default: 5)
3. Click "Save Settings"
4. Blocked tabs will automatically close after the specified interval

## URL Pattern Examples

- `*://*.facebook.com/*` - Blocks all Facebook domains
- `*://example.com/*` - Blocks a specific domain
- `*://*.youtube.com/watch*` - Blocks YouTube video pages
- `*://*.reddit.com/*` - Blocks all Reddit pages
- `*://twitter.com/*` - Blocks Twitter main domain

## Pattern Syntax

URL patterns follow the Chrome extension match pattern format:

- `*://` - Matches both http and https
- `*.example.com` - Matches all subdomains
- `/*` - Matches any path
- `http://` or `https://` - Matches specific protocol only

## How It Works

The extension uses Chrome's `declarativeNetRequest` API (Manifest V3) to block requests:

1. Patterns are stored in Chrome's sync storage
2. The background service worker converts patterns into blocking rules
3. Rules are applied dynamically without requiring extension reload
4. Only main_frame and sub_frame resource types are blocked (pages and iframes)
5. When a URL is blocked:
   - If reporting is enabled, sends an immediate POST request to the configured endpoint
   - If auto-close is enabled, schedules the tab to close after the configured interval

## Files Structure

- `manifest.json` - Extension configuration
- `popup.html` - Popup interface structure
- `popup.css` - Popup styling
- `popup.js` - Popup logic and pattern management
- `background.js` - Background service worker for URL blocking
- `icons/` - Extension icons

## Permissions

- `storage` - To save blocked URL patterns and settings
- `declarativeNetRequest` - To block network requests
- `declarativeNetRequestFeedback` - To receive notifications about blocked requests
- `tabs` - To close blocked tabs when auto-close is enabled
- `host_permissions: <all_urls>` - To block requests on all websites

## Development

To modify the extension:

1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the URL Blocker extension card
4. Test your changes

## Troubleshooting

- If patterns aren't blocking, check the Chrome DevTools console for errors
- Ensure patterns follow the correct format with protocol and path
- Check that the extension has the required permissions enabled
- Try removing and re-adding the extension if issues persist

## License

Free to use and modify.
