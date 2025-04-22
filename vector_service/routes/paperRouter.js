import express from 'express';
import {
    insertPaper,
    searchPapers,
    batchPapers,
    vectorSearch,
    insertFulltextPaper,
    batchFulltextPapers,
    getEmbedding, hybridSearchPapers
} from '../controllers/milvusController.js';

const router = express.Router();

// Insert endpoints
router.post('/insert', insertPaper);
router.post('/batchInsert', batchPapers);
// Query endpoints
router.get('/search', searchPapers);
router.post('/vectorSearch', vectorSearch);
router.post('/hybridSearch', hybridSearchPapers);
router.post('/fulltextBatch', batchFulltextPapers);
router.post('/fulltextSingle', insertFulltextPaper);
router.get('/getEmbedding', getEmbedding)
export default router;
