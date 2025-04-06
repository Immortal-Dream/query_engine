const http = require('http');
const url = require('url');

const PORT = process.argv[2] || 3001;

http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/api/query') {
        const query = parsedUrl.query.q;

        // Simulate the search results
        const results = [
            {
                title: `Result for "${query}" on port ${PORT}`,
                snippet: 'This is a dummy snippet.',
                url: `http://localhost:${PORT}/some-path`
            }
        ];

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ results }));

    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
}).listen(PORT, () => {
    console.log(`Search backend running on http://localhost:${PORT}`);
});
