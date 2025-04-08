const { computeEmbedding } = require('../utils/embedding');
const milvusService = require('../services/milvusService');

exports.insertPaper = async (req, res) => {
    try {
        const { paper_id, title, link, abstract } = req.body;
        if (!paper_id || !title || !link || !abstract) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const embedding = computeEmbedding(`${title} ${abstract}`);
        const result = await milvusService.insert(paper_id, title, link, abstract, embedding);
        res.json({ message: 'Insert successful', result });
    } catch (err) {
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
