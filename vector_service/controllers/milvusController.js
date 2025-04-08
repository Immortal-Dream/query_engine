const { computeEmbedding } = require('../utils/embedding');
const milvusService = require('../services/milvusService');
const logger = require('../utils/logger');

exports.insertPaper = async (req, res) => {
    try {
        const { paper_id, title, link, abstract } = req.body;
        logger.info(`Insert requested for paper_id=${paper_id}, title="${title}"`);
        if (!paper_id || !title || !link || !abstract) {
            logger.warn('Missing required fields');
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const embedding = computeEmbedding(`${title} ${abstract}`);
        const result = await milvusService.insert(paper_id, title, link, abstract, embedding);
        logger.info(`Insert successful for paper_id=${paper_id}`);
        res.json({ message: 'Insert successful', result });
    } catch (err) {
        logger.error(`Insert failed: ${err.message}`);
        res.status(500).json({ error: 'Insert failed', details: err.message });
    }
};

exports.searchPapers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ error: 'Query parameter is required' });
        const embedding = computeEmbedding(query);
        const result = await milvusService.search(embedding);
        res.json({ message: 'Search successful', results: result });
    } catch (err) {
        res.status(500).json({ error: 'Search failed', details: err.message });
    }
};
