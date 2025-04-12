import express from 'express';
import axios from 'axios';
import config from "../utils/config.js";
import { computeEmbedding } from "../utils/embedding.cjs";
import {logger} from "../utils/logger.js";

const router = express.Router();

router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        logger.info(`Processing search query: ${query}`);

        // Generate embedding vector
        const vector_input = await computeEmbedding(query);
        logger.info(`Generated embedding vector of length: ${vector_input.length}`);

        // Call the vector search API using config
        const vectorSearchUrl = `${config.services.vectorSearch.baseUrl}${config.services.vectorSearch.endpoints.search}`;
        const vectorSearchResponse = await axios.post(vectorSearchUrl, {
            embedding: vector_input
        });

        logger.info(`Vector search completed with ${vectorSearchResponse.data.length || 0} results`);

        res.json({
            results: vectorSearchResponse.data,
            message: 'Query processed successfully'
        });
    } catch (error) {
        logger.error('Error processing query:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
