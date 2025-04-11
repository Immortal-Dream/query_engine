import express from 'express';
import {insertPaper, searchPapers, batchPapers, vectorSearch} from '../controllers/milvusController.js';

const router = express.Router();

// Insert endpoints
router.post('/insert', insertPaper);
router.post('/batchInsert', batchPapers);
// Query endpoints
router.get('/search', searchPapers);
router.post('/vectorSearch', vectorSearch);
export default router;
