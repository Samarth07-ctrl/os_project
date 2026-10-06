// routes/jobs.js - API endpoints for OS Background Task Scheduler
const express = require('express');
const router = express.Router();
const { globalScheduler } = require('../modules/scheduler/jobScheduler');
const { protect, restrictTo } = require('../middleware/auth');

// GET /api/jobs/status - Get current scheduler status, running job, ready queue, and Gantt history
router.get('/status', protect, (req, res) => {
  res.json({
    success: true,
    data: globalScheduler.getStatus()
  });
});

// POST /api/jobs/submit - Add a new task to the queue
router.post('/submit', protect, (req, res) => {
  const { title, type, estimatedBurst, priority } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Job title is required.' });
  }

  const job = globalScheduler.addJob({
    title,
    type: type || 'REPORT_GEN',
    estimatedBurst: estimatedBurst || 4,
    priority: priority || 3,
    data: req.body.data || {},
    createdBy: req.user.name
  });

  res.json({
    success: true,
    message: `Job ${job.title} added to queue with priority ${job.priority} and burst ${job.burstTime}`,
    job,
    status: globalScheduler.getStatus()
  });
});

// POST /api/jobs/config - Change scheduling algorithm & time quantum
router.post('/config', protect, (req, res) => {
  const { algorithm, timeQuantum } = req.body;
  try {
    if (algorithm) globalScheduler.setAlgorithm(algorithm, timeQuantum);
    res.json({
      success: true,
      message: `Scheduler updated: Algorithm = ${globalScheduler.algorithm}, Quantum = ${globalScheduler.timeQuantum}`,
      status: globalScheduler.getStatus()
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/jobs/seed - Seed sample jobs for testing/demonstration
router.post('/seed', protect, (req, res) => {
  globalScheduler.seedSampleJobs();
  res.json({
    success: true,
    message: 'Sample OS jobs added to ready queue',
    status: globalScheduler.getStatus()
  });
});

// POST /api/jobs/control - Pause/resume scheduler
router.post('/control', protect, (req, res) => {
  const { action } = req.body; // 'pause', 'resume', 'step'
  if (action === 'pause') globalScheduler.stop();
  else if (action === 'resume') globalScheduler.resume();
  else if (action === 'step') globalScheduler.step();

  res.json({
    success: true,
    status: globalScheduler.getStatus()
  });
});

module.exports = router;
