// modules/concurrency/concurrencyManager.js - Mutex & Semaphore Synchronization
// Demonstrates Unit 2: Process Synchronization, Race Conditions, Mutex, and Semaphores

class Mutex {
  constructor(name = 'DefaultMutex') {
    this.name = name;
    this.locked = false;
    this.waitingQueue = [];
    this.lockAcquisitions = 0;
    this.contentions = 0;
  }

  // Acquire lock: if locked, return a promise queued until unlocked
  acquire() {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        this.lockAcquisitions++;
        resolve(() => this.release());
      } else {
        this.contentions++;
        this.waitingQueue.push(() => {
          this.locked = true;
          this.lockAcquisitions++;
          resolve(() => this.release());
        });
      }
    });
  }

  // Release lock and wake up next waiting thread in queue
  release() {
    if (this.waitingQueue.length > 0) {
      const nextInQueue = this.waitingQueue.shift();
      nextInQueue();
    } else {
      this.locked = false;
    }
  }

  getMetrics() {
    return {
      name: this.name,
      isLocked: this.locked,
      waitingThreadsCount: this.waitingQueue.length,
      totalAcquisitions: this.lockAcquisitions,
      totalContentions: this.contentions
    };
  }
}

class CountingSemaphore {
  constructor(initialTokens = 3, name = 'DefaultSemaphore') {
    this.name = name;
    this.tokens = initialTokens;
    this.maxTokens = initialTokens;
    this.waitingQueue = [];
    this.totalAcquires = 0;
  }

  acquire() {
    return new Promise((resolve) => {
      if (this.tokens > 0) {
        this.tokens--;
        this.totalAcquires++;
        resolve(() => this.release());
      } else {
        this.waitingQueue.push(() => {
          this.tokens--;
          this.totalAcquires++;
          resolve(() => this.release());
        });
      }
    });
  }

  release() {
    this.tokens = Math.min(this.maxTokens, this.tokens + 1);
    if (this.waitingQueue.length > 0 && this.tokens > 0) {
      const next = this.waitingQueue.shift();
      next();
    }
  }

  getMetrics() {
    return {
      name: this.name,
      availableTokens: this.tokens,
      maxTokens: this.maxTokens,
      waitingCount: this.waitingQueue.length,
      totalAcquires: this.totalAcquires
    };
  }
}

// Map of Mutexes per Course Slot ID to prevent multi-room locking bottlenecks
const slotMutexes = new Map();

function getSlotMutex(slotId) {
  if (!slotMutexes.has(slotId)) {
    slotMutexes.set(slotId, new Mutex(`SlotMutex-${slotId}`));
  }
  return slotMutexes.get(slotId);
}

module.exports = { Mutex, CountingSemaphore, getSlotMutex };
