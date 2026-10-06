// modules/scheduler/jobScheduler.js - Background Task Scheduler implementing CPU Scheduling Algorithms
// Demonstrates Unit 3: FCFS, SJF, Priority, and Round Robin scheduling in a real-world task queue

class Job {
  constructor({ id, title, type, estimatedBurst, priority = 3, data = {}, createdBy = 'System' }) {
    this.id = id || `JOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.title = title;
    this.type = type; // 'REPORT_GEN', 'BATCH_NOTIF', 'DATA_EXPORT', 'ANALYTICS_ROLLUP'
    this.burstTime = Math.max(1, parseInt(estimatedBurst, 10) || 5); // Total execution units (e.g. seconds)
    this.remainingTime = this.burstTime;
    this.priority = Math.min(5, Math.max(1, parseInt(priority, 10) || 3)); // 1 (Highest) to 5 (Lowest)
    this.arrivalTime = Date.now();
    this.startTime = null;
    this.finishTime = null;
    this.status = 'READY'; // 'READY', 'RUNNING', 'COMPLETED', 'PAUSED'
    this.data = data;
    this.createdBy = createdBy;
    this.waitingTime = 0;
    this.turnaroundTime = 0;
  }
}

class OSJobScheduler {
  constructor() {
    this.queue = [];            // Ready queue
    this.completed = [];        // Completed jobs history (max 30)
    this.currentJob = null;     // Job currently on CPU
    this.algorithm = 'PRIORITY'; // 'FCFS', 'SJF', 'PRIORITY', 'ROUND_ROBIN'
    this.timeQuantum = 2;       // Quantum in ticks for Round Robin
    this.currentQuantumTick = 0;
    this.isRunning = true;
    this.timer = null;
    this.tickIntervalMs = 1500;  // 1.5s per simulated tick
    this.ganttHistory = [];     // [{ jobTitle, jobId, startTime, endTime, color }]
    this.systemTick = 0;

    // Start background tick loop
    this.start();
  }

  setAlgorithm(algo, quantum = 2) {
    const valid = ['FCFS', 'SJF', 'PRIORITY', 'ROUND_ROBIN'];
    if (!valid.includes(algo)) throw new Error(`Invalid algorithm. Choose: ${valid.join(', ')}`);
    this.algorithm = algo;
    if (quantum) this.timeQuantum = Math.max(1, parseInt(quantum, 10) || 2);
    this.currentQuantumTick = 0;
  }

  addJob({ title, type, estimatedBurst, priority, data, createdBy }) {
    const job = new Job({ title, type, estimatedBurst, priority, data, createdBy });
    this.queue.push(job);
    return job;
  }

  // Pick the next job based on chosen OS CPU Scheduling algorithm
  selectNextJob() {
    if (this.queue.length === 0) return null;

    if (this.algorithm === 'FCFS') {
      // First Come First Served: earliest arrivalTime
      this.queue.sort((a, b) => a.arrivalTime - b.arrivalTime);
      return this.queue.shift();
    }

    if (this.algorithm === 'SJF') {
      // Shortest Job First: lowest remainingTime
      this.queue.sort((a, b) => a.remainingTime - b.remainingTime || a.arrivalTime - b.arrivalTime);
      return this.queue.shift();
    }

    if (this.algorithm === 'PRIORITY') {
      // Priority Scheduling: lowest priority number = highest priority
      this.queue.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime);
      return this.queue.shift();
    }

    if (this.algorithm === 'ROUND_ROBIN') {
      // Round Robin: FIFO queue with quantum time-slice
      return this.queue.shift();
    }

    return this.queue.shift();
  }

  // Single tick execution of the CPU scheduler
  step() {
    this.systemTick++;

    // Update waiting time for all jobs in ready queue
    for (const job of this.queue) {
      job.waitingTime++;
    }

    // Check if we need to schedule a job
    if (!this.currentJob) {
      this.currentJob = this.selectNextJob();
      if (this.currentJob) {
        if (!this.currentJob.startTime) this.currentJob.startTime = Date.now();
        this.currentJob.status = 'RUNNING';
        this.currentQuantumTick = 0;
        this.recordGantt(this.currentJob, 'START');
      }
    }

    if (!this.currentJob) return; // CPU Idle

    // Execute 1 burst unit
    this.currentJob.remainingTime--;
    this.currentQuantumTick++;

    // Did the job finish?
    if (this.currentJob.remainingTime <= 0) {
      this.currentJob.status = 'COMPLETED';
      this.currentJob.finishTime = Date.now();
      this.currentJob.turnaroundTime = Math.max(1, Math.round((this.currentJob.finishTime - this.currentJob.arrivalTime) / 1000));
      this.recordGantt(this.currentJob, 'COMPLETE');
      this.completed.unshift(this.currentJob);
      if (this.completed.length > 40) this.completed.pop();
      this.currentJob = null;
      this.currentQuantumTick = 0;
      return;
    }

    // Round Robin Context Switch if quantum expired
    if (this.algorithm === 'ROUND_ROBIN' && this.currentQuantumTick >= this.timeQuantum) {
      if (this.queue.length > 0) {
        // Preempt current job and put back at end of queue
        this.currentJob.status = 'READY';
        this.recordGantt(this.currentJob, 'PREEMPT');
        this.queue.push(this.currentJob);
        this.currentJob = null;
        this.currentQuantumTick = 0;
      } else {
        // Only 1 job in system, continue executing it
        this.currentQuantumTick = 0;
      }
    }
  }

  recordGantt(job, event) {
    const colorMap = {
      'REPORT_GEN': '#1971C2',
      'BATCH_NOTIF': '#2F9E44',
      'DATA_EXPORT': '#E67700',
      'ANALYTICS_ROLLUP': '#6741D9',
      'SECURITY_SCAN': '#C92A2A'
    };

    this.ganttHistory.unshift({
      tick: this.systemTick,
      timestamp: new Date().toLocaleTimeString(),
      jobId: job.id,
      title: job.title,
      type: job.type,
      color: colorMap[job.type] || '#495057',
      event,
      remaining: job.remainingTime
    });

    if (this.ganttHistory.length > 35) this.ganttHistory.pop();
  }

  start() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.isRunning) {
        this.step();
      }
    }, this.tickIntervalMs);
  }

  stop() {
    this.isRunning = false;
  }

  resume() {
    this.isRunning = true;
  }

  getStatus() {
    const totalJobs = this.completed.length;
    const avgTAT = totalJobs === 0 ? 0 : (this.completed.reduce((acc, j) => acc + j.turnaroundTime, 0) / totalJobs).toFixed(1);
    const avgWT = totalJobs === 0 ? 0 : (this.completed.reduce((acc, j) => acc + j.waitingTime, 0) / totalJobs).toFixed(1);

    return {
      algorithm: this.algorithm,
      timeQuantum: this.timeQuantum,
      isRunning: this.isRunning,
      currentJob: this.currentJob,
      queue: this.queue,
      completedCount: this.completed.length,
      recentCompleted: this.completed.slice(0, 10),
      avgTurnaroundTimeSec: parseFloat(avgTAT),
      avgWaitingTimeTicks: parseFloat(avgWT),
      ganttHistory: this.ganttHistory.slice(0, 20),
      systemTick: this.systemTick
    };
  }

  seedSampleJobs() {
    const sampleJobs = [
      { title: 'Compile Final Semester Grade Cards', type: 'REPORT_GEN', estimatedBurst: 6, priority: 2 },
      { title: 'Send Emergency Campus Alert SMS', type: 'BATCH_NOTIF', estimatedBurst: 2, priority: 1 },
      { title: 'Export Department Timetable Matrix', type: 'DATA_EXPORT', estimatedBurst: 3, priority: 4 },
      { title: 'Weekly Student Performance Rollup', type: 'ANALYTICS_ROLLUP', estimatedBurst: 8, priority: 5 },
      { title: 'Plagiarism & Code Integrity Scan', type: 'SECURITY_SCAN', estimatedBurst: 4, priority: 2 }
    ];

    sampleJobs.forEach(j => this.addJob({ ...j, createdBy: 'Admin System' }));
  }
}

// Global Singleton Scheduler
const globalScheduler = new OSJobScheduler();

module.exports = { OSJobScheduler, globalScheduler };
