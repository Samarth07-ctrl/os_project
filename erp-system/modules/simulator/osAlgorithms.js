// modules/simulator/osAlgorithms.js - Pure OS Algorithms & AI Recommender Engine
// Implements Practicals 1, 2, 4, 8, 9, 10 & AI Assignments 1 & 2

// ════════════════════════════════════════════════════
// 1. CPU SCHEDULING SIMULATOR & AI RECOMMENDER
// ════════════════════════════════════════════════════

function simulateCPUScheduling(processes, algorithm = 'FCFS', quantum = 2) {
  // Deep clone processes
  const procs = processes.map(p => ({
    pid: p.pid || `P${p.id || 1}`,
    at: parseInt(p.arrivalTime ?? p.at, 10) || 0,
    bt: Math.max(1, parseInt(p.burstTime ?? p.bt, 10) || 1),
    rem: Math.max(1, parseInt(p.burstTime ?? p.bt, 10) || 1),
    priority: parseInt(p.priority, 10) || 1,
    ct: 0, tat: 0, wt: 0
  }));

  const n = procs.length;
  if (n === 0) return { gantt: [], procs: [], avgTAT: 0, avgWT: 0 };

  const gantt = [];
  let currentTime = 0;
  let completed = 0;

  if (algorithm === 'FCFS') {
    procs.sort((a, b) => a.at - b.at);
    for (const p of procs) {
      if (currentTime < p.at) {
        gantt.push({ pid: 'IDLE', start: currentTime, end: p.at });
        currentTime = p.at;
      }
      const start = currentTime;
      currentTime += p.bt;
      p.ct = currentTime;
      p.tat = p.ct - p.at;
      p.wt = p.tat - p.bt;
      gantt.push({ pid: p.pid, start, end: currentTime });
    }
  } else if (algorithm === 'SJF_NP') {
    // Shortest Job First (Non-Preemptive)
    const isDone = new Array(n).fill(false);
    while (completed < n) {
      // Find arrived processes not done
      let idx = -1;
      let minBurst = Infinity;
      for (let i = 0; i < n; i++) {
        if (!isDone[i] && procs[i].at <= currentTime) {
          if (procs[i].bt < minBurst) {
            minBurst = procs[i].bt;
            idx = i;
          }
        }
      }
      if (idx === -1) {
        // CPU Idle
        const nextArrival = Math.min(...procs.filter((_, i) => !isDone[i]).map(p => p.at));
        gantt.push({ pid: 'IDLE', start: currentTime, end: nextArrival });
        currentTime = nextArrival;
        continue;
      }

      const p = procs[idx];
      const start = currentTime;
      currentTime += p.bt;
      p.ct = currentTime;
      p.tat = p.ct - p.at;
      p.wt = p.tat - p.bt;
      isDone[idx] = true;
      completed++;
      gantt.push({ pid: p.pid, start, end: currentTime });
    }
  } else if (algorithm === 'SJF_P') {
    // Shortest Remaining Time First (SRTF - Preemptive)
    while (completed < n) {
      let idx = -1;
      let minRem = Infinity;
      for (let i = 0; i < n; i++) {
        if (procs[i].at <= currentTime && procs[i].rem > 0) {
          if (procs[i].rem < minRem) {
            minRem = procs[i].rem;
            idx = i;
          }
        }
      }

      if (idx === -1) {
        currentTime++;
        continue;
      }

      const p = procs[idx];
      const lastEntry = gantt[gantt.length - 1];
      if (lastEntry && lastEntry.pid === p.pid) {
        lastEntry.end++;
      } else {
        gantt.push({ pid: p.pid, start: currentTime, end: currentTime + 1 });
      }

      p.rem--;
      currentTime++;

      if (p.rem === 0) {
        p.ct = currentTime;
        p.tat = p.ct - p.at;
        p.wt = p.tat - p.bt;
        completed++;
      }
    }
  } else if (algorithm === 'PRIORITY_NP') {
    // Priority Non-Preemptive (lower number = higher priority)
    const isDone = new Array(n).fill(false);
    while (completed < n) {
      let idx = -1;
      let bestPrio = Infinity;
      for (let i = 0; i < n; i++) {
        if (!isDone[i] && procs[i].at <= currentTime) {
          if (procs[i].priority < bestPrio) {
            bestPrio = procs[i].priority;
            idx = i;
          }
        }
      }
      if (idx === -1) {
        const nextArrival = Math.min(...procs.filter((_, i) => !isDone[i]).map(p => p.at));
        gantt.push({ pid: 'IDLE', start: currentTime, end: nextArrival });
        currentTime = nextArrival;
        continue;
      }

      const p = procs[idx];
      const start = currentTime;
      currentTime += p.bt;
      p.ct = currentTime;
      p.tat = p.ct - p.at;
      p.wt = p.tat - p.bt;
      isDone[idx] = true;
      completed++;
      gantt.push({ pid: p.pid, start, end: currentTime });
    }
  } else if (algorithm === 'RR') {
    // Round Robin
    const q = Math.max(1, parseInt(quantum, 10) || 2);
    const readyQueue = [];
    const inQueue = new Array(n).fill(false);
    procs.sort((a, b) => a.at - b.at);

    // Initial load
    for (let i = 0; i < n; i++) {
      if (procs[i].at <= currentTime && !inQueue[i]) {
        readyQueue.push(i);
        inQueue[i] = true;
      }
    }

    while (completed < n) {
      if (readyQueue.length === 0) {
        currentTime++;
        for (let i = 0; i < n; i++) {
          if (procs[i].at <= currentTime && !inQueue[i] && procs[i].rem > 0) {
            readyQueue.push(i);
            inQueue[i] = true;
          }
        }
        continue;
      }

      const idx = readyQueue.shift();
      const p = procs[idx];
      const execTime = Math.min(p.rem, q);
      const start = currentTime;
      currentTime += execTime;
      p.rem -= execTime;

      gantt.push({ pid: p.pid, start, end: currentTime });

      // Check newly arrived
      for (let i = 0; i < n; i++) {
        if (procs[i].at <= currentTime && !inQueue[i] && procs[i].rem > 0) {
          readyQueue.push(i);
          inQueue[i] = true;
        }
      }

      if (p.rem > 0) {
        readyQueue.push(idx);
      } else {
        p.ct = currentTime;
        p.tat = p.ct - p.at;
        p.wt = p.tat - p.bt;
        completed++;
      }
    }
  }

  const avgTAT = parseFloat((procs.reduce((s, p) => s + p.tat, 0) / n).toFixed(2));
  const avgWT = parseFloat((procs.reduce((s, p) => s + p.wt, 0) / n).toFixed(2));

  return { algorithm, gantt, procs, avgTAT, avgWT };
}

// AI Algorithm Recommendation based on Workload Characteristics (AI Assignment 1)
function recommendSchedulingAlgorithm(processes) {
  if (!processes || processes.length === 0) return { recommended: 'FCFS', reason: 'No processes supplied' };

  const burstTimes = processes.map(p => parseInt(p.burstTime ?? p.bt, 10) || 1);
  const n = burstTimes.length;
  const meanBurst = burstTimes.reduce((a, b) => a + b, 0) / n;
  const variance = burstTimes.reduce((a, b) => a + Math.pow(b - meanBurst, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Check priority spread
  const priorities = processes.map(p => parseInt(p.priority, 10) || 1);
  const hasDistinctPriorities = new Set(priorities).size > 1;

  let recommendation = '';
  let reason = '';
  let recommendedQuantum = null;

  if (hasDistinctPriorities) {
    recommendation = 'PRIORITY_NP';
    reason = 'Workload has explicitly defined priority constraints. Priority scheduling guarantees mission-critical tasks execute first.';
  } else if (stdDev > 4) {
    // High burst time variance -> SJF or Round Robin
    recommendation = 'SJF_P';
    reason = `High burst time variance (StdDev=${stdDev.toFixed(1)}). Preemptive SJF (SRTF) mathematically minimizes average waiting time by preventing long jobs from blocking short ones.`;
  } else if (meanBurst > 8) {
    recommendation = 'RR';
    recommendedQuantum = Math.round(meanBurst / 3) || 2;
    reason = `Long average jobs (${meanBurst.toFixed(1)} units). Round Robin with time quantum = ${recommendedQuantum} ensures fairness and prevents starvation.`;
  } else {
    recommendation = 'FCFS';
    reason = `Uniform, lightweight tasks (StdDev=${stdDev.toFixed(1)}). FCFS has zero scheduling overhead and context-switch penalty.`;
  }

  // Run benchmark comparison across all algorithms
  const benchmark = {
    FCFS: simulateCPUScheduling(processes, 'FCFS'),
    SJF_NP: simulateCPUScheduling(processes, 'SJF_NP'),
    SJF_P: simulateCPUScheduling(processes, 'SJF_P'),
    RR: simulateCPUScheduling(processes, 'RR', recommendedQuantum || 2),
    PRIORITY_NP: simulateCPUScheduling(processes, 'PRIORITY_NP')
  };

  return {
    recommended: recommendation,
    reason,
    recommendedQuantum,
    workloadMetrics: {
      processCount: n,
      meanBurst: parseFloat(meanBurst.toFixed(1)),
      stdDev: parseFloat(stdDev.toFixed(1)),
      hasPriorities: hasDistinctPriorities
    },
    benchmarkComparison: benchmark
  };
}

// ════════════════════════════════════════════════════
// 2. PAGE REPLACEMENT SIMULATOR (FIFO, LRU, OPTIMAL)
// ════════════════════════════════════════════════════

function simulatePageReplacement(refString, numFrames = 3) {
  const pages = Array.isArray(refString) ? refString : String(refString).trim().split(/\s+/).map(Number);
  const fCount = Math.max(1, parseInt(numFrames, 10) || 3);

  // Helper simulator
  const runAlgorithm = (algo) => {
    const frames = [];
    const steps = [];
    let hits = 0;
    let faults = 0;
    const lruTracker = new Map(); // page -> lastUsedIndex

    pages.forEach((p, idx) => {
      let isHit = false;
      let evicted = null;

      if (frames.includes(p)) {
        isHit = true;
        hits++;
      } else {
        faults++;
        if (frames.length < fCount) {
          frames.push(p);
        } else {
          // Need eviction
          if (algo === 'FIFO') {
            evicted = frames.shift();
            frames.push(p);
          } else if (algo === 'LRU') {
            // Find least recently used page in frames
            let oldestIdx = Infinity;
            let evictVal = frames[0];
            for (const f of frames) {
              const lastUsed = lruTracker.get(f) ?? -1;
              if (lastUsed < oldestIdx) {
                oldestIdx = lastUsed;
                evictVal = f;
              }
            }
            evicted = evictVal;
            const fIndex = frames.indexOf(evicted);
            frames[fIndex] = p;
          } else if (algo === 'OPTIMAL') {
            // Find page that won't be used for longest time in future
            let farthestFuture = -1;
            let evictVal = frames[0];
            for (const f of frames) {
              let nextUse = Infinity;
              for (let k = idx + 1; k < pages.length; k++) {
                if (pages[k] === f) {
                  nextUse = k;
                  break;
                }
              }
              if (nextUse > farthestFuture) {
                farthestFuture = nextUse;
                evictVal = f;
              }
            }
            evicted = evictVal;
            const fIndex = frames.indexOf(evicted);
            frames[fIndex] = p;
          }
        }
      }

      lruTracker.set(p, idx);

      steps.push({
        step: idx + 1,
        page: p,
        frames: [...frames],
        isHit,
        evicted
      });
    });

    const total = pages.length;
    const faultRate = total === 0 ? 0 : parseFloat(((faults / total) * 100).toFixed(1));
    const hitRate = total === 0 ? 0 : parseFloat(((hits / total) * 100).toFixed(1));

    return {
      algorithm: algo,
      totalPages: total,
      framesCount: fCount,
      pageHits: hits,
      pageFaults: faults,
      faultRate,
      hitRate,
      steps
    };
  };

  return {
    referenceString: pages,
    framesCount: fCount,
    FIFO: runAlgorithm('FIFO'),
    LRU: runAlgorithm('LRU'),
    OPTIMAL: runAlgorithm('OPTIMAL')
  };
}

// ════════════════════════════════════════════════════
// 3. MOCK LINUX SHELL & PROCESS TREE SIMULATOR
// ════════════════════════════════════════════════════

class MockLinuxShell {
  constructor() {
    this.processes = [
      { pid: 1, ppid: 0, name: 'systemd / init', state: 'RUNNING' },
      { pid: 104, ppid: 1, name: 'academia-erp-server', state: 'RUNNING' },
      { pid: 105, ppid: 1, name: 'mongod', state: 'SLEEPING' },
      { pid: 210, ppid: 104, name: 'bash', state: 'RUNNING' }
    ];
    this.nextPid = 220;
    this.currentDir = '/var/www/academia-erp';
  }

  execute(cmdStr) {
    const parts = (cmdStr || '').trim().split(/\s+/);
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        return `Available OS commands:\n  ls, pwd, date, whoami, ps, top, fork, zombie, orphan, pstree, kill <pid>, echo <text>`;

      case 'pwd':
        return this.currentDir;

      case 'whoami':
        return 'student@academia-os-lab:~$';

      case 'date':
        return new Date().toUTCString();

      case 'ls':
        return `drwxr-xr-x  models/\ndrwxr-xr-x  modules/\ndrwxr-xr-x  public/\ndrwxr-xr-x  routes/\n-rw-r--r--  server.js\n-rw-r--r--  package.json\n-rw-r--r--  .env`;

      case 'ps':
      case 'top':
        return `PID\tPPID\tSTAT\tCOMMAND\n` +
          this.processes.map(p => `${p.pid}\t${p.ppid}\t${p.state.padEnd(8)}\t${p.name}`).join('\n');

      case 'fork': {
        const parent = this.processes.find(p => p.name === 'bash') || this.processes[0];
        const childPid = this.nextPid++;
        this.processes.push({
          pid: childPid,
          ppid: parent.pid,
          name: `child_process_${childPid}`,
          state: 'RUNNING'
        });
        return `[FORK SYSCALL]: Forked child process with PID ${childPid} from parent PID ${parent.pid}.\nParent returned child PID ${childPid}, Child returned 0.`;
      }

      case 'zombie': {
        const childPid = this.nextPid++;
        this.processes.push({
          pid: childPid,
          ppid: 210,
          name: `defunct_proc_${childPid}`,
          state: 'ZOMBIE (Defunct)'
        });
        return `[ZOMBIE STATE]: Created process PID ${childPid}. Process exited, but parent (PID 210) has not executed wait() syscall.\nProcess table entry remains preserved.`;
      }

      case 'orphan': {
        const childPid = this.nextPid++;
        this.processes.push({
          pid: childPid,
          ppid: 1, // Adopted by init PID 1
          name: `orphaned_daemon_${childPid}`,
          state: 'ORPHAN (Adopted by PID 1)'
        });
        return `[ORPHAN STATE]: Parent terminated unexpectedly. Child process PID ${childPid} has been adopted by init (PID 1).`;
      }

      case 'pstree': {
        let tree = `init(1)\n ├─ academia-erp-server(104)\n │   └─ bash(210)\n`;
        const children = this.processes.filter(p => p.pid > 210);
        children.forEach((c, idx) => {
          const isLast = idx === children.length - 1;
          tree += ` │       ${isLast ? '└─' : '├─'} ${c.name}(${c.pid}) [${c.state}]\n`;
        });
        tree += ` └─ mongod(105)\n`;
        return tree;
      }

      case 'kill': {
        const targetPid = parseInt(args[0], 10);
        if (!targetPid) return 'Usage: kill <pid>';
        if (targetPid === 1) return 'kill: Operation not permitted: Cannot kill init';
        const idx = this.processes.findIndex(p => p.pid === targetPid);
        if (idx === -1) return `kill: (${targetPid}) - No such process`;
        const killed = this.processes.splice(idx, 1)[0];
        return `[SIGTERM/SIGKILL]: Process ${killed.name} (PID ${targetPid}) terminated.`;
      }

      default:
        return cmd ? `bash: ${cmd}: command not found. Type 'help' for available OS commands.` : '';
    }
  }

  getProcesses() {
    return [...this.processes];
  }
}

const globalMockShell = new MockLinuxShell();

module.exports = {
  simulateCPUScheduling,
  recommendSchedulingAlgorithm,
  simulatePageReplacement,
  globalMockShell
};
