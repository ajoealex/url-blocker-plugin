# Privacy Policy

**Last Updated:** December 28, 2025

## Overview

URL Blocker is a browser extension designed to block websites based on URL patterns. This privacy policy explains what data the extension collects, how it's used, and your rights regarding your data.

## Data Collection

### Data Stored Locally

The extension stores the following data locally in your browser using Chrome's storage API:

- **Blocked URL Patterns**: The URL patterns you configure to block websites
- **Reporting Settings**: Whether reporting is enabled and the endpoint URL configuration
- **Auto-Close Settings**: Whether auto-close is enabled and the interval configuration

All settings are stored using `chrome.storage.sync`, which means they may sync across your devices if you're signed into Chrome with sync enabled.

### Data Transmitted

When the **Reporting** feature is enabled:

- **Blocked URL Events**: When a URL is blocked, the extension sends information to your configured endpoint including:
  - The blocked URL
  - Timestamp of when it was blocked
  - Tab ID
  - Request type
  - Request initiator

**Important**: This data is only sent if you explicitly enable the reporting feature and configure an endpoint URL. By default, reporting is disabled.

## How We Use Your Data

- **Blocked URL Patterns**: Used solely to enforce blocking rules in your browser
- **Reporting Data**: Sent to your configured endpoint only when reporting is enabled
- **Settings**: Used to maintain your preferences across browser sessions

## Third-Party Services

This extension does not use any third-party analytics, tracking, or advertising services.

If you enable the reporting feature, you are responsible for the endpoint you configure. We do not control or have access to any data sent to your custom endpoint.

## Data Sharing

We do not share, sell, or transmit your data to any third parties. All data remains:
- On your local device
- Synced via Chrome's built-in sync (if enabled)
- Sent to your custom endpoint (only if you enable reporting)

## Data Security

- All data is stored securely using Chrome's storage APIs
- No data is transmitted over the network except to your configured reporting endpoint
- Network requests to reporting endpoints use standard fetch API with HTTPS support

## Your Rights

You have the right to:
- **Access**: View all your stored patterns and settings through the extension popup
- **Delete**: Remove individual URL patterns or use the Reset button to clear all data
- **Control**: Enable or disable reporting and auto-close features at any time
- **Export**: Extract your data from Chrome's storage using browser developer tools

## Children's Privacy

This extension does not knowingly collect any information from children under 13 years of age.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date at the top of this document.

## Contact

If you have questions about this privacy policy or the extension's data practices, please contact the extension developer through the Chrome Web Store.

## Open Source

This extension is open source. You can review the complete source code to verify our privacy practices.

## Disclaimer

**This extension is not intended for general use. Use with caution.**

The extension provides website blocking capabilities and should be used responsibly and in accordance with applicable laws and regulations.
