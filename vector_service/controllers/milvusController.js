// Import utility for computing embeddings
import {computeEmbedding} from '../utils/Embedding.cjs';
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
        logger.info('Search successful');
        res.json({message: 'Search successful', results: result});
    } catch (err) {
        logger.error(`Search failed: ${err.message}`);
        res.status(500).json({error: 'Search failed', details: err.message});
    }
}

/**
 * Handle HTTP POST /vectorSearch
 *
 * This endpoint receives a precomputed embedding vector from the client
 * and performs a similarity search in Milvus to return the top K most similar results.
 *
 */
export async function vectorSearch(req, res) {
    try {
        const { embedding } = req.body;

        // Validate that the embedding is a non-empty array
        if (!Array.isArray(embedding) || embedding.length !== 768) {
            return res.status(400).json({
                error: 'Invalid embedding: Must be an array of 768 float values'
            });
        }

        // Perform the vector similarity search using Milvus service
        const result = await milvusService.search(embedding);

        res.json({
            message: 'Vector Search successful',
            results: result
        });

    } catch (err) {
        logger.error(`Vector Search failed: ${err.message}`);
        res.status(500).json({
            error: 'Vector Search failed',
            details: err.message
        });
    }
}

/**
 * Handle HTTP POST /batchInsert
 * Accepts an array of paper records and inserts them in batch into Milvus.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
export async function batchPapers(req, res) {
    try {
        const papers = req.body;

        if (!Array.isArray(papers) || papers.length === 0) {
            return res.status(400).json({ error: 'Request body must be a non-empty array' });
        }

        // Compute embedding for each paper
        const papersWithVectors = [];
        for (const paper of papers) {
            const { paper_id, title, link, abstract } = paper;
            // if (!paper_id || !title || !link || !abstract)
            if (!paper_id || !title || !link) {
                return res.status(400).json({ error: 'Each paper must include paper_id, title, link, and abstract' });
            }

            const vector = await computeEmbedding(`${title} ${abstract}`);
            papersWithVectors.push({ paper_id, title, link, abstract, vector });
        }

        const result = await milvusService.batchInsert(papersWithVectors);
        logger.info(`Batch insert successful. Inserted ${papers.length} records.`);
        res.json({ message: 'Batch insert successful', inserted: papers.length, result });

    } catch (err) {
        logger.error(`Batch insert failed: ${err.message}`);
        res.status(500).json({ error: 'Batch insert failed', details: err.message });
    }

}