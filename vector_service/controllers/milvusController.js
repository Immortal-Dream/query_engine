// Import utility for computing embeddings
import {computeEmbedding} from '../utils/Embedding.cjs';
// Import Milvus service functions
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
 * Handle HTTP POST /insertFulltext
 * This function accepts a paper object with fulltext in the request body,
 * generates two embeddings (title+abstract and fulltext) and inserts into Milvus.
 */
export async function insertFulltextPaper(req, res) {
    try {
        const {paper_id, title, link, abstract, fulltext} = req.body;

        logger.info(`Fulltext insert requested for paper_id=${paper_id}, title="${title}"`);

        // Validate required fields
        if (!paper_id || !title || !link || !abstract || !fulltext) {
            logger.warn('Missing required fields');
            return res.status(400).json({error: 'Missing required fields (paper_id, title, link, abstract, fulltext)'});
        }

        // Generate two embeddings: one for title+abstract, one for fulltext
        const titleAbstractEmbedding = await computeEmbedding(`${title} ${abstract}`);
        const fulltextEmbedding = await computeEmbedding(fulltext);

        // Insert the paper with both vectors into Milvus
        const result = await milvusService.fulltextInsert(
            paper_id,
            title,
            link,
            abstract,
            fulltext,
            titleAbstractEmbedding,
            fulltextEmbedding
        );

        logger.info(`Fulltext insert successful for paper_id=${paper_id}`);
        res.json({message: 'Fulltext insert successful', result});
    } catch (err) {
        logger.error(`Fulltext insert failed: ${err.message}`);
        res.status(500).json({error: 'Fulltext insert failed', details: err.message});
    }
}

/**
 * Handle HTTP GET /search
 * This function accepts a text query, computes its vector embedding,
 * and performs a similarity search in Milvus using title+abstract vector.
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
        const result = await milvusService.searchByTitleAbstract(embedding);
        logger.info('Search successful');
        res.json({message: 'Search successful', results: result});
    } catch (err) {
        logger.error(`Search failed: ${err.message}`);
        res.status(500).json({error: 'Search failed', details: err.message});
    }
}

/**
 * Handle HTTP GET /searchFulltext
 * This function accepts a text query, computes its vector embedding,
 * and performs a similarity search in Milvus using fulltext vector.
 */
export async function searchFulltextPapers(req, res) {
    try {
        const {query} = req.query;

        if (!query) {
            return res.status(400).json({error: 'Query parameter is required'});
        }

        // Compute query embedding
        const embedding = await computeEmbedding(query);

        // Perform vector similarity search in Milvus
        const result = await milvusService.searchByFulltext(embedding);
        logger.info('Fulltext search successful');
        res.json({message: 'Fulltext search successful', results: result});
    } catch (err) {
        logger.error(`Fulltext search failed: ${err.message}`);
        res.status(500).json({error: 'Fulltext search failed', details: err.message});
    }
}

/**
 * Handle HTTP GET /hybridSearch
 * This function accepts a text query, computes two vector embeddings,
 * and performs a hybrid search in Milvus using both vectors.
 */
export async function hybridSearchPapers(req, res) {
    try {
        const {query} = req.query;

        if (!query) {
            return res.status(400).json({error: 'Query parameter is required'});
        }

        // Compute both query embeddings - using the same query for both vectors
        const titleAbstractEmbedding = await computeEmbedding(query);
        const fulltextEmbedding = await computeEmbedding(query);

        // Perform hybrid search in Milvus
        const result = await milvusService.hybridSearch(titleAbstractEmbedding, fulltextEmbedding);
        logger.info('Hybrid search successful');
        res.json({message: 'Hybrid search successful', results: result});
    } catch (err) {
        logger.error(`Hybrid search failed: ${err.message}`);
        res.status(500).json({error: 'Hybrid search failed', details: err.message});
    }
}

/**
 * Handle HTTP POST /vectorSearch
 *
 * This endpoint receives a precomputed embedding vector from the client
 * and performs a similarity search in Milvus using title+abstract vector.
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
        const result = await milvusService.searchByTitleAbstract(embedding);

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

/**
 * Handle HTTP POST /batchInsertFulltext
 * Accepts an array of paper records with fulltext and inserts them in batch into Milvus.
 * Computes two embeddings for each paper: one for title+abstract and one for fulltext.
 */
export async function batchFulltextPapers(req, res) {
    try {
        const papers = req.body;

        if (!Array.isArray(papers) || papers.length === 0) {
            return res.status(400).json({ error: 'Request body must be a non-empty array' });
        }

        // Compute both embeddings for each paper
        const papersWithVectors = [];
        for (const paper of papers) {
            const { paper_id, title, link, abstract, fulltext } = paper;

            if (!paper_id || !title || !link || !abstract || !fulltext) {
                return res.status(400).json({
                    error: 'Each paper must include paper_id, title, link, abstract, and fulltext'
                });
            }

            // Generate two embeddings for each paper
            const titleAbstractVector = await computeEmbedding(`${title} ${abstract}`);
            const fulltextVector = await computeEmbedding(fulltext);

            papersWithVectors.push({
                paper_id,
                title,
                link,
                abstract,
                fulltext,
                title_abstract_vector: titleAbstractVector,
                fulltext_vector: fulltextVector
            });
        }

        const result = await milvusService.batchFulltextInsert(papersWithVectors);
        logger.info(`Batch fulltext insert successful. Inserted ${papers.length} records.`);
        res.json({ message: 'Batch fulltext insert successful', inserted: papers.length, result });

    } catch (err) {
        logger.error(`Batch fulltext insert failed: ${err.message}`);
        res.status(500).json({ error: 'Batch fulltext insert failed', details: err.message });
    }
}