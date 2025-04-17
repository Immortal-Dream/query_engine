import express from 'express';
import {
    insertPaper,
    searchPapers,
    batchPapers,
    vectorSearch,
    insertFulltextPaper,
    batchFulltextPapers
} from '../controllers/milvusController.js';

const router = express.Router();

// Insert endpoints
router.post('/insert', insertPaper);
router.post('/batchInsert', batchPapers);
// Query endpoints
router.get('/search', searchPapers);
router.post('/vectorSearch', vectorSearch);
router.post('/fulltextBatch', batchFulltextPapers);
router.post('/fulltextSingle', insertFulltextPaper);
export default router;
