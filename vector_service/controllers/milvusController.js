// Import utility for computing embeddings
import {computeEmbedding} from '../utils/embedding.js';
// Import Milvus service functions (insert/search)
import * as milvusService from '../services/milvusService.js';
// Import logging utility
import {logger} from '../utils/logger.js';

/**
 * Handle HTTP POST /insert
 * This function accepts a paper object in the request body,
 * generates its embedding vector, and inserts it into Milvus.
 */
export async function insertPaper(req, res) {
    try {
        const {paper_id, title, link, abstract} = req.body;

        logger.info(`Insert requested for paper_id=${paper_id}, title="${title}"`);

        // Validate required fields
        if (!paper_id || !title || !link || !abstract) {
            logger.warn('Missing required fields');
            return res.status(400).json({error: 'Missing required fields'});
        }

        // Generate vector embedding using title + abstract
        const embedding = await computeEmbedding(`${title} ${abstract}`);

        // Insert the paper into Milvus
        const result = await milvusService.insert(paper_id, title, link, abstract, embedding);

        logger.info(`Insert successful for paper_id=${paper_id}`);
        res.json({message: 'Insert successful', result});
    } catch (err) {
        logger.error(`Insert failed: ${err.message}`);
        res.status(500).json({error: 'Insert failed', details: err.message});
    }
}

/**
 * Handle HTTP GET /search
 * This function accepts a text query, computes its vector embedding,
 * and performs a similarity search in Milvus for top 5 papers.
 */
export async function searchPapers(req, res) {
    try {
        const {query} = req.query;

        if (!query) {
            return res.status(400).json({error: 'Query parameter is required'});
        }

        // Compute query embedding
        const embedding = await computeEmbedding(query);

        // Perform vector similarity search in Milvus
        const result = await milvusService.search(embedding);

        res.json({message: 'Search successful', results: result});
    } catch (err) {
        logger.error(`Search failed: ${err.message}`);
        res.status(500).json({error: 'Search failed', details: err.message});
    }
}
