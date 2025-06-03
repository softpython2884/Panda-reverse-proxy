
const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch'); // Using node-fetch v2 for CommonJS

const app = express();
const PORT = process.env.PORT || 3001; // Port for this backend server

const tunnelsFilePath = path.join(__dirname, 'tunnels.json');

app.use(cors());
app.use(bodyParser.json());

// --- Helper Functions for Tunnel Management ---
async function getTunnelsData() {
  try {
    const data = await fs.readFile(tunnelsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(tunnelsFilePath, JSON.stringify([]));
      return [];
    }
    console.error('Error reading tunnels file:', error);
    throw error;
  }
}

async function saveTunnelsData(tunnels) {
  try {
    await fs.writeFile(tunnelsFilePath, JSON.stringify(tunnels, null, 2));
  } catch (error) {
    console.error('Error writing tunnels file:', error);
    throw error;
  }
}

// --- API Endpoints for Tunnel Management ---
// These endpoints are expected to be at /api/external-tunnels
const apiRouter = express.Router();

apiRouter.get('/', async (req, res) => {
  try {
    const tunnels = await getTunnelsData();
    // Sort tunnels: subdomain routes first, then path routes
    const sortedTunnels = tunnels.sort((a, b) => {
      if (a.type === 'subdomain' && b.type === 'path') return -1;
      if (a.type === 'path' && b.type === 'subdomain') return 1;
      return a.route.localeCompare(b.route);
    });
    res.json(sortedTunnels);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve tunnels.' });
  }
});

apiRouter.post('/', async (req, res) => {
  try {
    const tunnels = await getTunnelsData();
    const newTunnel = { ...req.body, id: uuidv4(), createdAt: new Date().toISOString() };
    
    // Basic validation
    if (!newTunnel.type || !newTunnel.route || !newTunnel.target) {
      return res.status(400).json({ message: 'Type, route, and target are required.'});
    }
    if (newTunnel.type === 'path' && !newTunnel.route.startsWith('/')) {
      newTunnel.route = `/${newTunnel.route}`;
    }
    try {
      new URL(newTunnel.target);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid target URL format.' });
    }

    tunnels.push(newTunnel);
    await saveTunnelsData(tunnels);
    res.status(201).json(newTunnel);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add tunnel.' });
  }
});

apiRouter.put('/:id', async (req, res) => {
  try {
    const tunnels = await getTunnelsData();
    const tunnelId = req.params.id;
    const tunnelIndex = tunnels.findIndex(t => t.id === tunnelId);

    if (tunnelIndex === -1) {
      return res.status(404).json({ message: 'Tunnel not found.' });
    }

    const updatedTunnelData = { ...req.body };
    // Basic validation
    if (!updatedTunnelData.type || !updatedTunnelData.route || !updatedTunnelData.target) {
      return res.status(400).json({ message: 'Type, route, and target are required.'});
    }
    if (updatedTunnelData.type === 'path' && !updatedTunnelData.route.startsWith('/')) {
      updatedTunnelData.route = `/${updatedTunnelData.route}`;
    }
     try {
      new URL(updatedTunnelData.target);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid target URL format.' });
    }


    tunnels[tunnelIndex] = { ...tunnels[tunnelIndex], ...updatedTunnelData };
    await saveTunnelsData(tunnels);
    res.json(tunnels[tunnelIndex]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update tunnel.' });
  }
});

apiRouter.delete('/:id', async (req, res) => {
  try {
    let tunnels = await getTunnelsData();
    const tunnelId = req.params.id;
    const initialLength = tunnels.length;
    tunnels = tunnels.filter(t => t.id !== tunnelId);

    if (tunnels.length === initialLength) {
      return res.status(404).json({ message: 'Tunnel not found.' });
    }

    await saveTunnelsData(tunnels);
    res.status(200).json({ message: 'Tunnel deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete tunnel.' });
  }
});

app.use('/api/external-tunnels', apiRouter);


// --- Basic Proxy Logic ---
// This server (panda.nationquest.fr) will perform the proxying.
app.all('*', async (req, res) => {
  const tunnels = await getTunnelsData();
  const host = req.hostname; // e.g., 'sub.panda.nationquest.fr' or 'panda.nationquest.fr'
  const path = req.path;     // e.g., '/mypath'

  let matchedTunnel = null;
  let targetFullUrl = null;

  // 1. Check for subdomain tunnels
  for (const tunnel of tunnels) {
    if (tunnel.type === 'subdomain' && host === tunnel.route) {
      matchedTunnel = tunnel;
      try {
        targetFullUrl = new URL(tunnel.target);
        const originalPathAndQuery = path + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
        targetFullUrl.pathname = (targetFullUrl.pathname.endsWith('/') ? targetFullUrl.pathname.slice(0, -1) : targetFullUrl.pathname) + (originalPathAndQuery.startsWith('/') ? originalPathAndQuery : '/' + originalPathAndQuery);
      } catch(e) {
        console.error(\`[Proxy Error] Invalid target URL for subdomain tunnel \${tunnel.route}: \${tunnel.target}\`);
        targetFullUrl = null; // Invalidate
      }
      break;
    }
  }

  // 2. If no subdomain match, check for path-based tunnels (assuming this server runs on MAIN_APP_DOMAIN)
  if (!matchedTunnel) {
    for (const tunnel of tunnels) {
      if (tunnel.type === 'path' && path.startsWith(tunnel.route)) {
         // Ensure it's not an API path for this server itself
        if (path.startsWith('/api/external-tunnels')) continue;

        matchedTunnel = tunnel;
        try {
            targetFullUrl = new URL(tunnel.target);
            const remainingPath = path.substring(tunnel.route.length);
            const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
            targetFullUrl.pathname = (targetFullUrl.pathname.endsWith('/') ? targetFullUrl.pathname.slice(0, -1) : targetFullUrl.pathname) + (remainingPath.startsWith('/') ? remainingPath : '/' + remainingPath) + queryString;
        } catch(e) {
            console.error(\`[Proxy Error] Invalid target URL for path tunnel \${tunnel.route}: \${tunnel.target}\`);
            targetFullUrl = null; // Invalidate
        }
        break;
      }
    }
  }

  if (matchedTunnel && targetFullUrl) {
    console.log(\`[\${new Date().toISOString()}] [PANDA Server Proxy] Request for \${host}\${path} matched tunnel ID \${matchedTunnel.id}. Proxying to \${targetFullUrl.toString()}\`);
    try {
      const proxyRequestHeaders = { ...req.headers };
      delete proxyRequestHeaders['host']; // Use target's host
      
      // Add X-Forwarded-* headers
      proxyRequestHeaders['X-Forwarded-Host'] = host;
      proxyRequestHeaders['X-Forwarded-For'] = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
      proxyRequestHeaders['X-Forwarded-Proto'] = req.protocol;

      const proxyResponse = await fetch(targetFullUrl.toString(), {
        method: req.method,
        headers: proxyRequestHeaders,
        body: (req.method !== 'GET' && req.method !== 'HEAD') ? req : undefined, // Pass stream for POST/PUT etc.
        redirect: 'manual',
      });

      res.status(proxyResponse.status);
      proxyResponse.headers.forEach((value, name) => {
        // Avoid setting 'transfer-encoding' if content-length is also present, can cause issues
        if (name.toLowerCase() === 'transfer-encoding' && proxyResponse.headers.has('content-length')) {
          return;
        }
        res.setHeader(name, value);
      });
      
      proxyResponse.body.pipe(res); // Stream the body back

    } catch (error) {
      console.error(\`[\${new Date().toISOString()}] [PANDA Server Proxy] Error proxying to \${targetFullUrl.toString()}:\`, error);
      res.status(502).send('Bad Gateway - Proxy Error');
    }
  } else {
    // If no tunnel matched, and it's not an API call for this server, it's a 404
    // (Or, if this server also hosts static files for panda.nationquest.fr, handle that here)
    if (!path.startsWith('/api/external-tunnels')) {
        console.log(\`[\${new Date().toISOString()}] [PANDA Server Proxy] No tunnel match for \${host}\${path}\`);
        res.status(404).send('Not Found - No PANDA tunnel configured for this route.');
    } else {
        // This means the request was for /api/external-tunnels/* but didn't match a specific CRUD route.
        // This case should ideally be handled by the apiRouter, but as a fallback:
        res.status(404).send('API endpoint not found.');
    }
  }
});

app.listen(PORT, () => {
  console.log(\`PANDA Server (serverwebsr) listening on port \${PORT}\`);
  console.log('This server should run on https://panda.nationquest.fr/');
  console.log('It provides API endpoints at /api/external-tunnels');
  console.log('And handles the actual reverse proxying.');
});
