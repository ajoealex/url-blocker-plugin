# URL Blocker - Information & Documentation

## About

URL Blocker is a browser extension that allows you to block websites based on URL patterns. The extension provides real-time blocking with visual feedback and optional reporting capabilities.

## Features

### 1. URL Pattern Blocking
- Block websites using flexible URL patterns
- Supports wildcards for domain and path matching
- Blocks both main frames and sub-frames (iframes)
- Real-time rule updates

### 2. Visual Feedback
- Extension icon blinks when a URL is blocked
- Provides immediate visual confirmation of blocking activity

### 3. Reporting (Optional)
- Send blocked URL events to a custom endpoint
- Includes timestamp, URL, tab ID, and request details
- Server validation with ping endpoint
- Can be enabled/disabled at any time

### 4. Auto-Close Tabs (Optional)
- Automatically close tabs that contain blocked content
- Configurable delay interval (1-3600 seconds)
- Useful for enforcing strict access policies

### 5. Settings Management
- Sync settings across devices (via Chrome Sync)
- Reset button to clear all rules and settings
- Import/export capabilities through browser storage

## Pattern Examples

### Basic Patterns
```
*://*.facebook.com/*          - Block all Facebook
*://example.com/*              - Block specific domain
*://*.youtube.com/watch*       - Block YouTube videos only
```

### Advanced Patterns
```
*://*.reddit.com/r/*/         - Block all subreddit pages
*://*/admin/*                  - Block all admin pages
*://*.example.com/login*       - Block login pages on a domain
```

## Permissions

The extension requires the following permissions:

- **storage**: To save your blocked patterns and settings
- **declarativeNetRequest**: To block URLs matching your patterns
- **declarativeNetRequestFeedback**: To receive feedback when rules are matched
- **tabs**: To manage tabs (for auto-close feature)
- **host_permissions (<all_urls>)**: To apply blocking rules to all websites

## Data Storage

All data is stored locally using Chrome's storage API:

| Data Type | Storage Location | Sync Enabled |
|-----------|-----------------|--------------|
| Blocked Patterns | chrome.storage.sync | Yes |
| Reporting Settings | chrome.storage.sync | Yes |
| Auto-Close Settings | chrome.storage.sync | Yes |

## Reporting Endpoint

If you enable reporting, your endpoint must:

1. **Accept POST requests** at the configured URL with JSON payload:
   ```json
   {
     "blockedUrl": {
       "url": "https://example.com/page",
       "timestamp": "2025-12-28T10:00:00.000Z",
       "tabId": 123,
       "type": "main_frame",
       "initiator": "https://referrer.com"
     },
     "reportedAt": "2025-12-28T10:00:00.000Z"
   }
   ```

2. **Provide a /ping endpoint** for validation:
   - Method: GET
   - Response format:
     ```json
     {
       "status": "ok",
       "message": "Server is running",
       "timestamp": "2025-12-28T10:00:00.000Z"
     }
     ```

## Technical Details

### Architecture
- **Manifest Version**: 3
- **Service Worker**: background.js handles blocking logic
- **Popup Interface**: HTML/CSS/JS for user interaction
- **Blocking Method**: declarativeNetRequest API (Chrome's native blocking)

### Performance
- Rules are compiled by Chrome's engine (very fast)
- No page script injection required
- Minimal memory footprint
- No impact on browsing speed

### Limitations
- Maximum of ~5000 dynamic rules (Chrome limit)
- Pattern syntax follows Chrome's URL filter format
- Cannot block chrome:// or chrome-extension:// URLs (browser restriction)

## Troubleshooting

### Blocking Not Working
1. Check if the pattern is correctly formatted
2. Verify the pattern appears in the "Blocked Patterns" list
3. Reload the extension from chrome://extensions
4. Check browser console for errors

### Icon Not Blinking
1. Ensure icons are in the correct location (img/icons/)
2. Reload the extension
3. Check if blocking is actually occurring (try console logs)

### Reporting Not Working
1. Verify the endpoint URL is correct
2. Test the /ping endpoint manually
3. Check if reporting is enabled (checkbox)
4. Ensure the server is running and accessible
5. Check browser console and server logs

### Auto-Close Not Working
1. Verify auto-close is enabled
2. Check the interval setting
3. Ensure tabs are not pinned (pinned tabs may be protected)

## Security Considerations

### Important Warnings

- **Not for general use**: This extension has powerful capabilities and should only be used by those who understand its implications
- **Endpoint security**: If using reporting, ensure your endpoint is secure (HTTPS recommended)
- **Pattern testing**: Test patterns carefully to avoid blocking critical sites
- **Reset capability**: Use the Reset button if you accidentally block important sites

### Best Practices

1. **Test patterns first**: Try patterns on non-critical sites before deploying
2. **Use HTTPS**: Configure reporting endpoints with HTTPS
3. **Regular backups**: Export your settings periodically
4. **Access control**: Limit who can modify extension settings
5. **Monitor reports**: Review blocked URL reports regularly

## Use Cases

### Acceptable Use Cases
- Parental controls on family computers
- Productivity enhancement (blocking distracting sites)
- Research and testing
- Development and debugging
- Educational purposes

### Restricted Use Cases
- Enterprise/corporate environments (consult IT policies)
- Shared computers (respect other users' rights)
- Any use that violates terms of service or laws

## Version History

### Version 1.0.0
- Initial release
- URL pattern blocking
- Icon blink feedback
- Optional reporting
- Auto-close tabs feature
- Reset functionality
- Warning banner

## Support

For issues, questions, or contributions:
- Review the source code
- Check existing issues
- Contact the developer

## License

Please refer to the LICENSE file in the repository.

## Disclaimer

This extension is provided "as is" without warranty of any kind. Use at your own risk. The developers are not responsible for any misuse or damages resulting from the use of this extension.
