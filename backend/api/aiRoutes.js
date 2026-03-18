const express = require('express');
const router = express.Router();
const { generateSummary, generateTags, aiSearch } = require('./aiController');

// AI feature routes
router.post('/summary', generateSummary);
router.post('/tags', generateTags);
router.post('/search', aiSearch);

module.exports = router;
