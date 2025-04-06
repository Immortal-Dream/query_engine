const http = require('http');
const httpProxy = require('http-proxy');
const url = require('url');
const HashRing = require('./hashRing');

const PORT = 8080;
const proxy = httpProxy.createProxyServer({});

// Replace with your actual backend node URLs
const servers = [
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003'
];

const ring = new HashRing(servers);

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    if (parsedUrl.pathname === '/api/query') {
        const query = parsedUrl.query.q || 'default';
        const target = ring.getNode(query); // use consistent hash logic

        console.log(`Routing "${query}" to ${target}`);
        proxy.web(req, res, { target }, err => {
            res.writeHead(502);
            res.end('Bad Gateway: ' + err.message);
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Load Balancer running at http://localhost:${PORT}`);
});
