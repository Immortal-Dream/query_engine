import express from 'express';
import http from 'http';
import paperRouter from './routes/paperRouter.js';
import testEmbedding from "./utils/Embedding.cjs";

const app = express();
app.use(express.json());
app.use('/', paperRouter);

// Port number Setting
const PORT = process.env.PORT || 10086;
const { initEmbedder } = testEmbedding;

// Start the server
async function startServer() {
    try {
        // Initialize the embedding model first
        await initEmbedder();

        // Then, start the HTTP server
        const server = http.createServer(app);
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });


    } catch (error) {
        console.error('Server startup failed:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
