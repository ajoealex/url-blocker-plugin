# URL Blocker Listener

A Node.js Express server that listens for blocked URL requests from a Chrome plugin and stores them in memory.

## Features

- Receives blocked URL requests from Chrome extension
- Stores requests in memory (configurable maximum)
- Provides API to retrieve all or latest blocked URLs
- Health check endpoint
- Cleanup endpoint to clear stored requests

## Installation

```bash
npm install
```

## Configuration

Edit `app.properties` to configure the server:

```properties
# Server port
port=3000

# Maximum number of blocked URL requests to retain in memory
max_requests=10
```

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Building Standalone Executable

This project uses `pkg` to create standalone executables that don't require Node.js to be installed.

### Build for your current platform:
```bash
npm run build
```

### Build for specific platforms:

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

### Running the executable:

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

## API Endpoints

### POST /
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

### GET /
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

### GET /ping
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2025-12-28T02:44:45.437Z"
}
```

### DELETE /cleanup
Clear all stored blocked URL requests.

**Response:**
```json
{
  "message": "All blocked URL requests cleared",
  "clearedCount": 5
}
```

## Usage Example

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

## Notes

- Requests are stored in memory and will be lost when the server restarts
- The server maintains a maximum of `max_requests` entries (configurable in app.properties)
- Newer requests are added to the beginning of the array
- When the maximum is reached, the oldest request is removed
