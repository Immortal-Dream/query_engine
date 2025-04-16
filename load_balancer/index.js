const http = require('http');
const httpProxy = require('http-proxy');
const url = require('url');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const HashRing = require('./hashRing');

const PORT = 8080;
const proxy = httpProxy.createProxyServer({});
const configPath = path.join(__dirname, 'config/servers.config.yaml');

let ring = null;

// Load and update the HashRing from YAML config
function loadServersAndUpdateRing() {
    try {
        const file = fs.readFileSync(configPath, 'utf8');
        const config = YAML.parse(file);

        if (Array.isArray(config.nodes) && config.nodes.length > 0) {
            // nodes is array of { address, weight }
            ring = new HashRing(config.nodes);
            const summary = config.nodes.map(n => `${n.address} (${n.weight || 100})`).join(', ');
            console.log(`HashRing updated with ${config.nodes.length} nodes: ${summary}`);
        } else {
            console.warn('⚠️ No valid nodes found in config file.');
        }
    } catch (err) {
        console.error('Failed to parse YAML config:', err.message);
    }
}


// Load once at startup
loadServersAndUpdateRing();

// Hot-reload when config file changes
fs.watchFile(configPath, { interval: 1000 }, () => {
    console.log('🔄 servers.config.yaml changed. Reloading...');
    loadServersAndUpdateRing();
});

// Create HTTP server
const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);

    // Keep the original path exactly as is
    if (!ring) {
        res.writeHead(503);
        res.end('Service unavailable: no backend nodes loaded.');
        return;
    }

    const key = parsedUrl.path;
    // Get a node from the hash ring (can use any consistent key)
    const node = ring.getNode(key);

    // Construct proper target URL with http protocol
    const target = `http://${node}`;

    console.log(`Routing request "${req.url}" to ${target}`);

    // Forward the request keeping the original path and query parameters
    proxy.web(req, res, {
        target,
        changeOrigin: true,
        preserveHeaderKeyCase: true,
        ignorePath: false
    }, err => {
        console.error('Proxy error:', err);
        res.writeHead(502);
        res.end('Bad Gateway: ' + err.message);
    });
});

server.listen(PORT, () => {
    console.log(`Load Balancer running at http://localhost:${PORT}`);
});