import express from 'express';
import http from 'http';
import paperRouter from './routes/paper.js';
import { initEmbedder } from './utils/embedding.js';
import { logger } from './utils/logger.js';

const app = express();
app.use(express.json());
app.use('/', paperRouter);

// Port number Setting
const PORT = process.env.PORT || 10086;

// Start the HTTP server
const server = http.createServer(app);
server.listen(PORT, async () => {
    logger.info(`Server running on port ${PORT}`);

    try {
        // Initialize the embedding model
        await initEmbedder();
        logger.info('Embedding model initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize embedding model:', error);
        // You might want to shut down the server if embedding is critical
        // process.exit(1);
    }
});
