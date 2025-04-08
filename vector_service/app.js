import express from 'express';
import http from 'http';
import paperRouter from './routes/paper.js';

const app = express();
app.use(express.json());
app.use('/', paperRouter);

// Port number Setting
const PORT = process.env.PORT || 10086;

// Start the HTTP server
const server = http.createServer(app);
server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
