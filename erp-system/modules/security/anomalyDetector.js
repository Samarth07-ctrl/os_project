// modules/security/anomalyDetector.js - Security Audit Logger & AI Anomaly Detection
// Demonstrates Unit 1 (System Logs) and AI-Based Assignment 3 (Anomaly Detection in System Logs)

const { AuditLog } = require('../../models');

class AnomalyDetector {
  constructor() {
    this.inMemoryLogs = []; // Rolling buffer of recent 200 logs
    this.ipRequestCounts = new Map(); // IP -> [{ timestamp }]
    this.failedLoginsByIp = new Map(); // IP -> count
    this.threatLevel = 'NORMAL'; // 'NORMAL', 'ELEVATED', 'HIGH_ALERT'
  }

  // Statistical Mean and Standard Deviation Helper
  calculateStats(values) {
    if (values.length === 0) return { mean: 0, stdDev: 0 };
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return { mean, stdDev: Math.sqrt(variance) };
  }

  // Evaluate single log event for anomalies
  evaluateEvent({ user, userName, role, action, ip, endpoint, status, details = {} }) {
    const now = Date.now();
    let anomalyScore = 0;
    const reasons = [];

    // 1. Time-of-Day Anomaly (Late night activity between 1:30 AM and 5:00 AM)
    const hour = new Date().getHours();
    if (hour >= 1 && hour <= 5) {
      anomalyScore += 25;
      reasons.push('Unusual off-hours access (1:00 AM - 5:00 AM)');
    }

    // 2. Request Velocity / Burst Anomaly (Z-score calculation)
    if (!this.ipRequestCounts.has(ip)) this.ipRequestCounts.set(ip, []);
    const ipTimestamps = this.ipRequestCounts.get(ip);
    ipTimestamps.push(now);
    // Keep only last 60 seconds of timestamps
    const recentWindow = ipTimestamps.filter(t => now - t <= 60000);
    this.ipRequestCounts.set(ip, recentWindow);

    const currentRpm = recentWindow.length;
    if (currentRpm > 40) {
      anomalyScore += 45;
      reasons.push(`High request burst rate: ${currentRpm} requests/min (DDoS / Scraper profile)`);
    } else if (currentRpm > 20) {
      anomalyScore += 20;
      reasons.push(`Elevated request rate: ${currentRpm} requests/min`);
    }

    // 3. Brute Force Login Anomaly
    if (action === 'LOGIN_FAILED') {
      const currentFails = (this.failedLoginsByIp.get(ip) || 0) + 1;
      this.failedLoginsByIp.set(ip, currentFails);
      if (currentFails >= 5) {
        anomalyScore += 50;
        reasons.push(`Brute-force credential stuffing detected (${currentFails} consecutive failures)`);
      } else if (currentFails >= 3) {
        anomalyScore += 25;
        reasons.push(`Repeated login failures (${currentFails} failures)`);
      }
    } else if (action === 'LOGIN_SUCCESS') {
      this.failedLoginsByIp.delete(ip);
    }

    // 4. Critical & Privileged Actions
    const criticalActions = ['DELETE_USER', 'MASS_GRADE_MODIFIED', 'BULK_DOWNLOAD', 'PURGE_CACHE'];
    if (criticalActions.includes(action)) {
      anomalyScore += 30;
      reasons.push(`Sensitive operation executed: ${action}`);
    }

    // Cap score at 100
    anomalyScore = Math.min(100, anomalyScore);
    const isAnomaly = anomalyScore >= 45;

    const logEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user: user || null,
      userName: userName || 'Guest',
      role: role || 'anonymous',
      action,
      ip: ip || '127.0.0.1',
      endpoint: endpoint || '',
      status: status || 'SUCCESS',
      anomalyScore,
      isAnomaly,
      anomalyReason: reasons.join('; '),
      details,
      createdAt: new Date()
    };

    // Store in rolling buffer
    this.inMemoryLogs.unshift(logEntry);
    if (this.inMemoryLogs.length > 200) this.inMemoryLogs.pop();

    // Persist to MongoDB asynchronously (non-blocking)
    AuditLog.create(logEntry).catch(() => {});

    // Update overall system threat level
    const recentAnomalies = this.inMemoryLogs.slice(0, 20).filter(l => l.isAnomaly).length;
    if (recentAnomalies >= 5) this.threatLevel = 'HIGH_ALERT';
    else if (recentAnomalies >= 2) this.threatLevel = 'ELEVATED';
    else this.threatLevel = 'NORMAL';

    return logEntry;
  }

  getDashboardData() {
    const total = this.inMemoryLogs.length;
    const anomalies = this.inMemoryLogs.filter(l => l.isAnomaly);
    const avgScore = total === 0 ? 0 : (this.inMemoryLogs.reduce((acc, l) => acc + l.anomalyScore, 0) / total).toFixed(1);

    return {
      threatLevel: this.threatLevel,
      totalAuditedEvents: total,
      totalAnomaliesDetected: anomalies.length,
      averageAnomalyScore: parseFloat(avgScore),
      recentAnomalies: anomalies.slice(0, 10),
      allLogs: this.inMemoryLogs.slice(0, 30)
    };
  }

  // Generate simulated attack vectors to demonstrate anomaly detection to examiners
  simulateAttack(scenario = 'BRUTE_FORCE') {
    const attackLogs = [];
    if (scenario === 'BRUTE_FORCE') {
      for (let i = 1; i <= 6; i++) {
        const log = this.evaluateEvent({
          userName: 'unknown_attacker',
          role: 'anonymous',
          action: 'LOGIN_FAILED',
          ip: '198.51.100.77',
          endpoint: '/api/auth/login',
          status: '401_UNAUTHORIZED',
          details: { attempt: i, targetUser: 'admin@academia.edu' }
        });
        attackLogs.push(log);
      }
    } else if (scenario === 'DATA_SCRAPING') {
      for (let i = 1; i <= 15; i++) {
        const log = this.evaluateEvent({
          userName: 'bot_student',
          role: 'student',
          action: 'BULK_DOWNLOAD',
          ip: '203.0.113.45',
          endpoint: `/api/assignments/bulk-download/${i}`,
          status: '200_OK',
          details: { burstIndex: i }
        });
        attackLogs.push(log);
      }
    } else {
      // Off hours privilege escalation
      const log = this.evaluateEvent({
        userName: 'hacked_faculty',
        role: 'professor',
        action: 'MASS_GRADE_MODIFIED',
        ip: '45.33.32.156',
        endpoint: '/api/assignments/grade-all',
        status: '200_OK',
        details: { alteredGradesCount: 140 }
      });
      attackLogs.push(log);
    }

    return {
      scenario,
      threatLevel: this.threatLevel,
      generatedLogsCount: attackLogs.length,
      attackLogs
    };
  }
}

// Global Singleton Anomaly Detector
const globalAnomalyDetector = new AnomalyDetector();

// Express Middleware to audit incoming requests
const auditMiddleware = (req, res, next) => {
  // Capture sensitive state changes
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    const action = `${req.method}_${req.baseUrl || ''}${req.path || ''}`.replace(/[^A-Za-z0-9_]/g, '_').toUpperCase();
    res.on('finish', () => {
      globalAnomalyDetector.evaluateEvent({
        user: req.user?._id,
        userName: req.user?.name || 'Anonymous',
        role: req.user?.role || 'guest',
        action: action.substring(0, 40),
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1',
        endpoint: req.originalUrl || req.url,
        status: `${res.statusCode}`
      });
    });
  }
  next();
};

module.exports = { AnomalyDetector, globalAnomalyDetector, auditMiddleware };
