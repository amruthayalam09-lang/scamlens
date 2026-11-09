const express = require('express');
const router = express.Router();
const {
  handleAnalyze,
  handleAnalyzeUrl,
  handleAnalyzeEmail,
  handleAnalyzeScreenshot,
  handleChat,
  handleStatus
} = require('../controllers/analyzeController');

router.post('/analyze', handleAnalyze);
router.post('/analyze-url', handleAnalyzeUrl);
router.post('/analyze-email', handleAnalyzeEmail);
router.post('/analyze-screenshot', handleAnalyzeScreenshot);
router.post('/chat', handleChat);
router.post('/assistant', handleChat);
router.get('/status', handleStatus);

module.exports = router;
