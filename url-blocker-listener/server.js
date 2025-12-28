const express = require('express');
const PropertiesReader = require('properties-reader');
const path = require('path');
const fs = require('fs');

// Load configuration from app.properties
// When running as a packaged executable, look for app.properties in the current working directory
// When running as source, look in the same directory as the script
let propertiesPath;

// Check if running as a packaged executable
if (process.pkg) {
  // Running as packaged executable - look in current working directory
  propertiesPath = path.join(process.cwd(), 'app.properties');
} else {
  // Running as source - look in script directory
  propertiesPath = path.join(__dirname, 'app.properties');
}

// Check if properties file exists, use defaults if not
let PORT = 3000;
let MAX_REQUESTS = 10;

if (fs.existsSync(propertiesPath)) {
  const properties = PropertiesReader(propertiesPath);
  PORT = properties.get('port') || 3000;
  MAX_REQUESTS = parseInt(properties.get('max_requests')) || 10;
  console.log(`Loaded configuration from: ${propertiesPath}`);
} else {
  console.log(`Warning: app.properties not found at ${propertiesPath}, using defaults`);
  console.log(`Default port: ${PORT}, Default max_requests: ${MAX_REQUESTS}`);
}

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// In-memory storage for blocked URL requests
let blockedUrlRequests = [];

// POST / - Receive blocked URL from Chrome plugin
app.post('/', (req, res) => {
  try {
    const { blockedUrl, reportedAt } = req.body;

    if (!blockedUrl || !reportedAt) {
      return res.status(400).json({
        error: 'Missing required fields: blockedUrl and reportedAt'
      });
    }

    // Create the request entry
    const requestEntry = {
      ...blockedUrl,
      reportedAt
    };

    // Add to the beginning of the array
    blockedUrlRequests.unshift(requestEntry);

    // Maintain maximum size
    if (blockedUrlRequests.length > MAX_REQUESTS) {
      blockedUrlRequests = blockedUrlRequests.slice(0, MAX_REQUESTS);
    }

    res.status(200).json({
      message: 'Blocked URL recorded successfully',
      totalRequests: blockedUrlRequests.length
    });
  } catch (error) {
    console.error('Error processing blocked URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET / - Retrieve blocked URLs
app.get('/', (req, res) => {
  try {
    const { latest } = req.query;

    if (latest === 'true') {
      // Return only the latest request
      const latestRequest = blockedUrlRequests.length > 0 ? blockedUrlRequests[0] : null;
      return res.status(200).json({
        latest: latestRequest,
        totalRequests: blockedUrlRequests.length
      });
    }

    // Return all requests
    res.status(200).json({
      requests: blockedUrlRequests,
      totalRequests: blockedUrlRequests.length
    });
  } catch (error) {
    console.error('Error retrieving blocked URLs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /ping - Health check endpoint
app.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// DELETE /cleanup - Clear all blocked URL requests
app.delete('/cleanup', (req, res) => {
  try {
    const previousCount = blockedUrlRequests.length;
    blockedUrlRequests = [];

    res.status(200).json({
      message: 'All blocked URL requests cleared',
      clearedCount: previousCount
    });
  } catch (error) {
    console.error('Error cleaning up blocked URLs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`URL Blocker Listener is running on port ${PORT}`);
  console.log(`Maximum requests to retain: ${MAX_REQUESTS}`);
  console.log('Endpoints:');
  console.log(`  POST   / - Receive blocked URL requests`);
  console.log(`  GET    / - Retrieve blocked URLs (use ?latest=true for latest only)`);
  console.log(`  GET    /ping - Health check`);
  console.log(`  DELETE /cleanup - Clear all requests`);
});
