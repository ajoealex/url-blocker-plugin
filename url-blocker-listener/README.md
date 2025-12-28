# URL Blocker Project

A comprehensive URL blocking solution consisting of a Chrome browser extension and a reporting server.

## Architecture

```
┌─────────────────────────────────────┐
│   Chrome Browser                    │
│                                     │
│  ┌──────────────────────────────┐   │
│  │  URL Blocker Extension       │   │
│  │  - Pattern Matching          │   │
│  │  - Request Blocking          │   │
│  │  - Tab Management            │   │
│  └──────────────┬───────────────┘   │
│                 │                   │
└─────────────────┼───────────────────┘
                  │ HTTP POST
                  │ (Blocked URL Reports)
                  ▼
         ┌────────────────────┐
         │  Listener Server   │
         │  - Receives Reports│
         │  - Stores in Memory│
         │  - Provides API    │
         └────────────────────┘
```

---

## URL Blocker Plugin

A Chrome Manifest V3 extension that blocks websites based on URL patterns using Chrome's declarativeNetRequest API.

### Features

- **Pattern-based URL Blocking**: Block websites using flexible URL patterns with wildcard support
- **Manifest V3 Compliance**: Uses the latest Chrome extension standard with declarativeNetRequest API
- **Real-time Rule Updates**: Dynamically add/remove blocking rules without restarting the browser
- **Cross-device Synchronization**: Patterns sync across devices via Chrome Sync storage
- **Optional Reporting**: Send blocked URL details to a configured reporting server
- **Server Validation**: Automatic ping check to validate server connectivity before enabling reporting
- **Auto-Close Tabs**: Automatically close tabs that attempt to access blocked content after a configurable delay
- **Pattern Testing**: Test URL patterns before adding them to your block list

### Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `url-blocker-plugin` directory
5. The extension icon should appear in your toolbar

### Usage

1. Click the URL Blocker extension icon
2. Enter a URL pattern (e.g., `*://*.facebook.com/*`)
3. Optionally test the pattern using the URL testing feature
4. Click "Add Pattern" or press Enter
5. The website will be immediately blocked across all tabs

### Pattern Examples

- `*://*.facebook.com/*` - Block all Facebook
- `*://example.com/*` - Block specific domain
- `*://*.youtube.com/watch*` - Block YouTube videos

---

## URL Blocker Listener

A Node.js Express server that listens for blocked URL requests from the Chrome extension and stores them in memory.

### Features

- Receives blocked URL requests from Chrome extension
- Stores requests in memory (configurable maximum)
- Provides API to retrieve all or latest blocked URLs
- Health check endpoint
- Cleanup endpoint to clear stored requests
- Configurable bind interface (localhost, 127.0.0.1, or all interfaces)

### Installation

```bash
npm install
```

### Configuration

Edit `app.properties` to configure the server:

```properties
# Server port
port=9874

# Bind interface (localhost, 127.0.0.1, 0.0.0.0 for all interfaces)
bind_interface=127.0.0.1

# Maximum number of blocked URL requests to retain in memory
max_requests=10
```

### Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### Building Standalone Executable

This project uses `pkg` to create standalone executables that don't require Node.js to be installed.

**Build for your current platform:**
```bash
npm run build
```

**Build for specific platforms:**

**Windows:**
```bash
npm run build:win
```

**Linux:**
```bash
npm run build:linux
```

**macOS:**
```bash
npm run build:macos
```

**All platforms:**
```bash
npm run build:all
```

The executables will be created in the `dist/` folder.

**Running the executable:**

**Windows:**
```bash
cd dist
.\url-blocker-listener.exe
```

**Linux/macOS:**
```bash
cd dist
./url-blocker-listener
```

**Important:** Make sure to copy the `app.properties` file to the same directory as the executable, as it's required for configuration.

### API Endpoints

**POST /**
Receive a blocked URL request from the Chrome plugin.

**Request Body:**
```json
{
  "blockedUrl": {
    "url": "https://example.com",
    "timestamp": "2025-12-28T02:44:45.437Z",
    "tabId": 1772131031,
    "type": "sub_frame",
    "initiator": "https://www.youtube.com"
  },
  "reportedAt": "2025-12-28T02:44:45.437Z"
}
```

**Response:**
```json
{
  "message": "Blocked URL recorded successfully",
  "totalRequests": 5
}
```

**GET /**

Retrieve blocked URL requests.

**Query Parameters:**
- `latest=true` - Returns only the latest request
- No parameters - Returns all requests

**Response (all requests):**
```json
{
  "requests": [
    {
      "url": "https://example.com",
      "timestamp": "2025-12-28T02:44:45.437Z",
      "tabId": 1772131031,
      "type": "sub_frame",
      "initiator": "https://www.youtube.com",
      "reportedAt": "2025-12-28T02:44:45.437Z"
    }
  ],
  "totalRequests": 1
}
```

**Response (latest only):**
```json
{
  "latest": {
    "url": "https://example.com",
    "timestamp": "2025-12-28T02:44:45.437Z",
    "tabId": 1772131031,
    "type": "sub_frame",
    "initiator": "https://www.youtube.com",
    "reportedAt": "2025-12-28T02:44:45.437Z"
  },
  "totalRequests": 1
}
```

**GET /ping**

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2025-12-28T02:44:45.437Z"
}
```

**DELETE /cleanup**

Clear all stored blocked URL requests.

**Response:**
```json
{
  "message": "All blocked URL requests cleared",
  "clearedCount": 5
}
```

### Usage Example

1. Start the server:
   ```bash
   npm start
   ```

2. The Chrome plugin sends blocked URLs to the server:
   ```bash
   curl -X POST http://localhost:3000/ \
     -H "Content-Type: application/json" \
     -d '{
       "blockedUrl": {
         "url": "https://example.com",
         "timestamp": "2025-12-28T02:44:45.437Z",
         "tabId": 1772131031,
         "type": "sub_frame",
         "initiator": "https://www.youtube.com"
       },
       "reportedAt": "2025-12-28T02:44:45.437Z"
     }'
   ```

3. Retrieve all blocked URLs:
   ```bash
   curl http://localhost:3000/
   ```

4. Retrieve only the latest:
   ```bash
   curl http://localhost:3000/?latest=true
   ```

5. Clear all stored requests:
   ```bash
   curl -X DELETE http://localhost:3000/cleanup
   ```

### Notes

- Requests are stored in memory and will be lost when the server restarts
- The server maintains a maximum of `max_requests` entries (configurable in app.properties)
- Newer requests are added to the beginning of the array
- When the maximum is reached, the oldest request is removed
