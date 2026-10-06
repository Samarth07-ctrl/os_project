// routes/osLab.js - Interactive OS Virtual Lab API routes
const express = require('express');
const router = express.Router();
const {
  simulateCPUScheduling,
  recommendSchedulingAlgorithm,
  simulatePageReplacement,
  globalMockShell
} = require('../modules/simulator/osAlgorithms');
const { protect } = require('../middleware/auth');

// POST /api/os-lab/cpu-schedule - Run CPU scheduling simulation
router.post('/cpu-schedule', protect, (req, res) => {
  const { processes, algorithm = 'FCFS', quantum = 2 } = req.body;
  if (!processes || !Array.isArray(processes)) {
    return res.status(400).json({ success: false, message: 'Array of processes required' });
  }

  const result = simulateCPUScheduling(processes, algorithm, quantum);
  res.json({ success: true, result });
});

// POST /api/os-lab/cpu-recommend - AI CPU Scheduling Recommendation
router.post('/cpu-recommend', protect, (req, res) => {
  const { processes } = req.body;
  if (!processes || !Array.isArray(processes)) {
    return res.status(400).json({ success: false, message: 'Array of processes required' });
  }

  const recommendation = recommendSchedulingAlgorithm(processes);
  res.json({ success: true, recommendation });
});

// POST /api/os-lab/page-replacement - Run Page Replacement simulation
router.post('/page-replacement', protect, (req, res) => {
  const { referenceString, frames = 3 } = req.body;
  if (!referenceString) {
    return res.status(400).json({ success: false, message: 'referenceString required' });
  }

  const result = simulatePageReplacement(referenceString, frames);
  res.json({ success: true, result });
});

// POST /api/os-lab/terminal - Execute command in Mock Linux Shell
router.post('/terminal', protect, (req, res) => {
  const { command } = req.body;
  const output = globalMockShell.execute(command);
  res.json({
    success: true,
    command,
    output,
    processes: globalMockShell.getProcesses()
  });
});

module.exports = router;
