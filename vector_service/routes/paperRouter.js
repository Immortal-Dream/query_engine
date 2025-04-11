import express from 'express';
import { insertPaper, searchPapers, batchPapers} from '../controllers/milvusController.js';

const router = express.Router();

router.post('/insert', insertPaper);
router.get('/search', searchPapers);
router.post('/batchInsert', batchPapers);
export default router;
