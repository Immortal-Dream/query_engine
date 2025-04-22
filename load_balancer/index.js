import http from 'http';
import httpProxy from 'http-proxy';
import { parse as parseUrl } from 'url';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import fetch from 'node-fetch';
import HashRing from './hashRing.js';

const PORT            = 8080;
const CONFIG_PATH     = path.join(__dirname, 'config/servers.config.yaml');
const EMBED_API       = '/getEmbedding';
const SEARCH_API      = '/hybridSearch';
const TOP_K           = 5;

const proxy = httpProxy.createProxyServer({});
let   ring  = null;
let   nodes = [];

function loadServers() {
    try {
        const yaml  = fs.readFileSync(CONFIG_PATH, 'utf8');
        const cfg   = YAML.parse(yaml);

        if (Array.isArray(cfg.nodes) && cfg.nodes.length) {
            ring  = new HashRing(cfg.nodes);
            nodes = cfg.nodes.map(n => n.address);
            console.log(`HashRing loaded (${nodes.length} nodes) → ${nodes.join(', ')}`);
        } else {
            console.warn('No backend nodes found in YAML config.');
        }
    } catch (e) {
        console.error('YAML parse error:', e.message);
    }
}
loadServers();
fs.watchFile(CONFIG_PATH, { interval: 1000 }, () => {
    console.log('servers.config.yaml changed – reloading...');
    loadServers();
});

async function getJson(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    if (!res.ok) throw new Error(`${url} → ${res.status} ${res.statusText}`);
    return res.json();
}

const server = http.createServer(async (req, res) => {
    /* ---------- CORS pre‑flight ---------- */
    res.setHeader('Access-Control-Allow-Origin',  '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') return res.writeHead(200).end();

    if (!ring) return res.writeHead(503).end('No backend nodes loaded');

    const { pathname, query } = parseUrl(req.url, true);

    if (pathname === '/metaSearch' && req.method === 'GET') {
        try {
            /* extract query text */
            const q = query.query;
            if (!q) return res.writeHead(400).end('query parameter is required');

            /* pick one node via hash & call /getEmbedding */
            const node     = ring.getNode(q);                       // e.g. "10.0.0.5:10087"
            const embedURL = `http://${node}${EMBED_API}?query=${encodeURIComponent(q)}`;
            const { embeddings } = await getJson(embedURL);
            const { titleAbstractEmbedding, fulltextEmbedding } = embeddings;

            /* broadcast to /hybridSearch on every node (POST) */
            const body = JSON.stringify({ titleAbstractEmbedding, fulltextEmbedding });
            const fetches = nodes.map(addr =>
                getJson(`http://${addr}${SEARCH_API}`, { method: 'POST', body })
                    .catch(e => ({ results: [], _error: e.message }))   // swallow individual failures
            );
            const responses = await Promise.all(fetches);

            /* merge & rank */
            const allHits = responses.flatMap(r => r.results || []);
            const topHits = allHits
                .sort((a, b) => a.score - b.score)   // ascending → best similarity first
                .slice(0, TOP_K);

            res.writeHead(200, { 'Content-Type': 'application/json' })
                .end(JSON.stringify({ message: 'Meta search successful', results: topHits }));
        } catch (e) {
            console.error('Meta search error:', e);
            res.writeHead(502).end(`Meta search failed: ${e.message}`);
        }
        return;    // finished this path
    }

    const key   = pathname;              // hash key
    const node  = ring.getNode(key);
    const target = `http://${node}`;

    console.log(`Proxy "${req.url}" → ${target}`);
    proxy.web(req, res, { target, changeOrigin: true, ignorePath: false }, err => {
        console.error('Proxy error:', err.message);
        res.writeHead(502).end('Bad Gateway');
    });
});

server.listen(PORT, () =>
    console.log(`Load balancer + meta search gateway running on http://localhost:${PORT}`)
);