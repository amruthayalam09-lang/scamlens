const express = require('express');
const router = express.Router();
const { handleAnalyze, handleAnalyzeUrl, handleAnalyzeEmail, handleStatus } = require('../controllers/analyzeController');

router.post('/analyze', handleAnalyze);
router.post('/analyze-url', handleAnalyzeUrl);
router.post('/analyze-email', handleAnalyzeEmail);
router.get('/status', handleStatus);

module.exports = router;
