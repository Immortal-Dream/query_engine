import express from 'express';
import { insertPaper, searchPapers } from '../controllers/milvusController.js';

const router = express.Router();

router.post('/insert', insertPaper);
router.get('/search', searchPapers);

export default router;
