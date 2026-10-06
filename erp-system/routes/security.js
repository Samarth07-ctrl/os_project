// routes/security.js - API endpoints for OS Security Auditing & Anomaly Detection
const express = require('express');
const router = express.Router();
const { globalAnomalyDetector } = require('../modules/security/anomalyDetector');
const { protect, restrictTo } = require('../middleware/auth');

// GET /api/security/dashboard - Get security threat score, anomalies, and audit log stream
router.get('/dashboard', protect, (req, res) => {
  res.json({
    success: true,
    data: globalAnomalyDetector.getDashboardData()
  });
});

// POST /api/security/simulate-attack - Simulate attack vectors for viva demonstration
router.post('/simulate-attack', protect, restrictTo('admin', 'professor'), (req, res) => {
  const { scenario = 'BRUTE_FORCE' } = req.body;
  const result = globalAnomalyDetector.simulateAttack(scenario);
  res.json({
    success: true,
    message: `Simulated attack [${scenario}] executed. Threat detection logged.`,
    result,
    dashboard: globalAnomalyDetector.getDashboardData()
  });
});

module.exports = router;
