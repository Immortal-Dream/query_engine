import express from 'express';
import http from 'http';
import queryRouter from './routes/query.js';
import { logger } from '../vector_service/utils/logger.js';
import testEmbedding from "./utils/embedding.cjs";

const app = express();
app.use(express.json());
app.use('/', queryRouter);

// Port number Setting
const PORT = process.env.PORT || 10087;
const { initEmbedder } = testEmbedding;

// Start the server
async function startServer() {
    try {
        // Initialize the embedding model first
        await initEmbedder();

        const server = http.createServer(app);
        server.listen(PORT, () => {
            logger.info(`Query service running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Query server startup failed:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
