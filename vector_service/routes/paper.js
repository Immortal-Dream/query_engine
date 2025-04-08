const express = require('express');
const router = express.Router();
const { insertPaper, searchPapers } = require('../controllers/paper');

router.post('/insert', insertPaper);
router.get('/search', searchPapers);

module.exports = router;
