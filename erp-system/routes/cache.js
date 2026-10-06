// routes/cache.js - API endpoints & Middleware for OS In-Memory Cache (LRU / FIFO)
const express = require('express');
const router = express.Router();
const { globalCache } = require('../modules/cache/lruCache');
const { protect, restrictTo } = require('../middleware/auth');

// Middleware to cache GET responses
const cacheMiddleware = (ttlMs = 60000) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();
    
    // Key based on URL and user role/id if authenticated
    const userPart = req.user ? `${req.user.role}:${req.user._id}` : 'anon';
    const cacheKey = `API:${req.originalUrl || req.url}:${userPart}`;

    const cached = globalCache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Policy', globalCache.policy);
      return res.json(cached);
    }

    res.setHeader('X-Cache', 'MISS');
    // Hook res.json to capture and store response in cache
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful JSON responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        globalCache.put(cacheKey, body);
      }
      return originalJson(body);
    };

    next();
  };
};

// GET /api/cache/stats - Get real-time cache telemetry
router.get('/stats', protect, (req, res) => {
  const telemetry = globalCache.getTelemetry();
  res.json({
    success: true,
    telemetry
  });
});

// POST /api/cache/config - Update policy or capacity
router.post('/config', protect, restrictTo('admin', 'professor'), (req, res) => {
  const { policy, capacity } = req.body;
  try {
    if (policy) globalCache.setPolicy(policy);
    if (capacity) globalCache.setCapacity(capacity);
    res.json({
      success: true,
      message: `Cache updated: Policy=${globalCache.policy}, Capacity=${globalCache.capacity}`,
      telemetry: globalCache.getTelemetry()
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/cache/purge - Clear all cache entries
router.post('/purge', protect, restrictTo('admin', 'professor'), (req, res) => {
  globalCache.purge();
  res.json({
    success: true,
    message: 'Cache purged successfully',
    telemetry: globalCache.getTelemetry()
  });
});

// GET /api/cache/benchmark - Benchmark Database vs Cache Latency
router.get('/benchmark', protect, async (req, res) => {
  const { Classroom } = require('../models');

  // Benchmark DB fetch
  const t0 = process.hrtime.bigint();
  const dbResult = await Classroom.find().limit(20).lean();
  const t1 = process.hrtime.bigint();
  const dbLatencyMs = Number(t1 - t0) / 1e6;

  // Put in cache and benchmark cache fetch
  const key = 'BENCHMARK_CLASSROOMS';
  globalCache.put(key, dbResult);

  const t2 = process.hrtime.bigint();
  const cachedResult = globalCache.get(key);
  const t3 = process.hrtime.bigint();
  const cacheLatencyMs = Number(t3 - t2) / 1e6;

  const speedup = (dbLatencyMs / (cacheLatencyMs || 0.001)).toFixed(1);

  res.json({
    success: true,
    benchmark: {
      dbLatencyMs: parseFloat(dbLatencyMs.toFixed(3)),
      cacheLatencyMs: parseFloat(cacheLatencyMs.toFixed(3)),
      speedupFactor: `${speedup}x faster`,
      itemsFetched: dbResult.length,
      policy: globalCache.policy
    }
  });
});

module.exports = { router, cacheMiddleware };
