// routes/storage.js - Storage & Deduplication API endpoints
const express = require('express');
const router = express.Router();
const { globalStorage } = require('../modules/storage/dedupStorage');
const { protect } = require('../middleware/auth');

// GET /api/storage/stats - Get storage deduplication telemetry & savings
router.get('/stats', protect, (req, res) => {
  res.json({
    success: true,
    data: globalStorage.getTelemetry()
  });
});

// POST /api/storage/upload - Upload text/code/data file with deduplication
router.post('/upload', protect, (req, res) => {
  const { originalName, content, mimetype } = req.body;
  if (!originalName || content === undefined) {
    return res.status(400).json({ success: false, message: 'originalName and content required' });
  }

  const result = globalStorage.storeFile({
    originalName,
    content,
    mimetype: mimetype || 'text/plain',
    uploadedBy: req.user.name
  });

  res.json({
    success: true,
    message: result.dedupStatus === 'DEDUPLICATED_SAVED_SPACE'
      ? 'File deduplicated! Reused existing data block without wasting extra storage.'
      : 'New unique file stored successfully.',
    ...result
  });
});

module.exports = router;
