const express = require('express');
const router = express.Router();
const { insertPaper, searchPapers } = require('../controllers/milvusController');

router.post('/insert', insertPaper);
router.get('/search', searchPapers);

module.exports = router;
