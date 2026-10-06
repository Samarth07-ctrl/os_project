// routes/resources.js - Campus Resource Allocation using Banker's Algorithm
const express = require('express');
const router = express.Router();
const { globalBanker } = require('../modules/deadlock/bankerEngine');
const { protect } = require('../middleware/auth');

// GET /api/resources/state - Get full Banker's Algorithm matrix state & safe sequence
router.get('/state', protect, (req, res) => {
  res.json({
    success: true,
    data: globalBanker.getCurrentState()
  });
});

// POST /api/resources/request - Attempt allocation using Banker's Request Algorithm
router.post('/request', protect, (req, res) => {
  const { entityIdx, requestVector } = req.body;
  if (entityIdx === undefined || !requestVector || !Array.isArray(requestVector)) {
    return res.status(400).json({ success: false, message: 'Invalid request: entityIdx and requestVector required.' });
  }

  const result = globalBanker.requestResource(parseInt(entityIdx, 10), requestVector.map(Number));
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// POST /api/resources/release - Release allocated resources
router.post('/release', protect, (req, res) => {
  const { entityIdx, releaseVector } = req.body;
  if (entityIdx === undefined || !releaseVector) {
    return res.status(400).json({ success: false, message: 'entityIdx and releaseVector required' });
  }

  const result = globalBanker.releaseResource(parseInt(entityIdx, 10), releaseVector.map(Number));
  res.json(result);
});

// POST /api/resources/reset - Reset matrix to textbook default state
router.post('/reset', protect, (req, res) => {
  globalBanker.resetToDefault();
  res.json({
    success: true,
    message: "Banker's Algorithm matrices reset to default scenario.",
    data: globalBanker.getCurrentState()
  });
});

// POST /api/resources/verify-custom - Custom student matrix safety verification
router.post('/verify-custom', protect, (req, res) => {
  const { allocation, maxClaim, available } = req.body;
  if (!allocation || !maxClaim || !available) {
    return res.status(400).json({ success: false, message: 'allocation, maxClaim, and available matrices required.' });
  }

  const safety = globalBanker.checkSafety(allocation, maxClaim, available);
  res.json({
    success: true,
    safety
  });
});

module.exports = router;
