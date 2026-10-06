// modules/deadlock/bankerEngine.js - Dijkstra's Banker's Algorithm for Deadlock Avoidance
// Demonstrates Unit 4: Deadlock Principles, Safe States, and Banker's Algorithm

class BankerSystem {
  constructor() {
    this.resourceTypes = ['Projectors (P)', 'GPU Servers (G)', 'IoT Kits (K)', 'Seminar Halls (H)'];
    this.totalInstances = [6, 4, 10, 2]; // Total physical campus inventory
    this.entities = [
      'P0: Computer Science Dept',
      'P1: AI & Data Science Dept',
      'P2: Electronics Dept',
      'P3: Robotics Research Club',
      'P4: MBA & Management Dept'
    ];

    // Allocation Matrix [Entities x Resources]
    this.allocation = [
      [1, 1, 2, 0], // P0
      [2, 0, 1, 1], // P1
      [0, 1, 3, 0], // P2
      [1, 1, 1, 0], // P3
      [0, 0, 1, 1]  // P4
    ];

    // Max Claim Matrix [Entities x Resources]
    this.maxClaim = [
      [3, 2, 4, 1], // P0
      [3, 1, 3, 1], // P1
      [2, 2, 5, 1], // P2
      [2, 2, 2, 1], // P3
      [1, 1, 2, 1]  // P4
    ];

    this.recalculateAvailable();
  }

  recalculateAvailable() {
    const numRes = this.totalInstances.length;
    this.available = [...this.totalInstances];

    for (let j = 0; j < numRes; j++) {
      let allocatedTotal = 0;
      for (let i = 0; i < this.entities.length; i++) {
        allocatedTotal += this.allocation[i][j];
      }
      this.available[j] -= allocatedTotal;
    }
  }

  getNeedMatrix() {
    const numEntities = this.entities.length;
    const numRes = this.resourceTypes.length;
    const need = [];

    for (let i = 0; i < numEntities; i++) {
      need[i] = [];
      for (let j = 0; j < numRes; j++) {
        need[i][j] = Math.max(0, this.maxClaim[i][j] - this.allocation[i][j]);
      }
    }
    return need;
  }

  // Safety Algorithm
  checkSafety(customAlloc = null, customMax = null, customAvail = null) {
    const alloc = customAlloc || this.allocation;
    const max = customMax || this.maxClaim;
    const avail = customAvail ? [...customAvail] : [...this.available];
    const numEntities = this.entities.length;
    const numRes = this.resourceTypes.length;

    // Calculate Need
    const need = [];
    for (let i = 0; i < numEntities; i++) {
      need[i] = [];
      for (let j = 0; j < numRes; j++) {
        need[i][j] = Math.max(0, max[i][j] - alloc[i][j]);
      }
    }

    const work = [...avail];
    const finish = new Array(numEntities).fill(false);
    const safeSequence = [];
    const stepLog = [];

    stepLog.push(`Initial Available Work Vector: [${work.join(', ')}]`);

    let found;
    do {
      found = false;
      for (let i = 0; i < numEntities; i++) {
        if (!finish[i]) {
          // Check if Need[i] <= Work
          let canExecute = true;
          for (let j = 0; j < numRes; j++) {
            if (need[i][j] > work[j]) {
              canExecute = false;
              break;
            }
          }

          if (canExecute) {
            // Process i can complete and release resources
            for (let j = 0; j < numRes; j++) {
              work[j] += alloc[i][j];
            }
            finish[i] = true;
            safeSequence.push(this.entities[i]);
            stepLog.push(`✅ Entity ${this.entities[i]} executed successfully. Released allocation. New Work: [${work.join(', ')}]`);
            found = true;
          }
        }
      }
    } while (found);

    const isSafe = finish.every(f => f === true);
    if (!isSafe) {
      const deadlocked = this.entities.filter((e, idx) => !finish[idx]);
      stepLog.push(`❌ DEADLOCK WARNING: System cannot satisfy remaining demands for: ${deadlocked.join(', ')}`);
    }

    return {
      isSafe,
      safeSequence: isSafe ? safeSequence : [],
      deadlockedEntities: isSafe ? [] : this.entities.filter((e, idx) => !finish[idx]),
      stepLog,
      finalWorkVector: work
    };
  }

  // Request Algorithm
  requestResource(entityIdx, requestVector) {
    const numRes = this.resourceTypes.length;
    const need = this.getNeedMatrix();

    if (entityIdx < 0 || entityIdx >= this.entities.length) {
      return { success: false, message: 'Invalid entity index' };
    }

    // Check 1: Request <= Need
    for (let j = 0; j < numRes; j++) {
      if (requestVector[j] > need[entityIdx][j]) {
        return {
          success: false,
          errorType: 'EXCEEDED_MAX_CLAIM',
          message: `Error: Entity requested ${requestVector[j]} of ${this.resourceTypes[j]}, but maximum need is only ${need[entityIdx][j]}.`
        };
      }
    }

    // Check 2: Request <= Available
    for (let j = 0; j < numRes; j++) {
      if (requestVector[j] > this.available[j]) {
        return {
          success: false,
          errorType: 'RESOURCE_UNAVAILABLE',
          message: `Wait: Not enough ${this.resourceTypes[j]} available right now (Requested: ${requestVector[j]}, Available: ${this.available[j]}). Entity must wait.`
        };
      }
    }

    // Tentatively Allocate
    const tempAlloc = this.allocation.map(row => [...row]);
    const tempAvail = [...this.available];

    for (let j = 0; j < numRes; j++) {
      tempAvail[j] -= requestVector[j];
      tempAlloc[entityIdx][j] += requestVector[j];
    }

    // Run Safety Algorithm on hypothetical state
    const safetyCheck = this.checkSafety(tempAlloc, this.maxClaim, tempAvail);

    if (safetyCheck.isSafe) {
      // Safe state confirmed -> Permanently commit allocation
      this.allocation = tempAlloc;
      this.available = tempAvail;
      return {
        success: true,
        message: `Allocation Approved! System remains in a SAFE state with sequence: ${safetyCheck.safeSequence.join(' ➔ ')}`,
        safetyCheck,
        currentState: this.getCurrentState()
      };
    } else {
      // Unsafe state -> Rollback!
      return {
        success: false,
        errorType: 'UNSAFE_STATE_DEADLOCK_HAZARD',
        message: `⚠️ ALLOCATION BLOCKED BY BANKER'S ALGORITHM! Granting this request would lead to an UNSAFE STATE with potential deadlock.`,
        safetyCheck,
        currentState: this.getCurrentState()
      };
    }
  }

  // Release Resources
  releaseResource(entityIdx, releaseVector) {
    const numRes = this.resourceTypes.length;
    for (let j = 0; j < numRes; j++) {
      const rel = Math.min(this.allocation[entityIdx][j], releaseVector[j] || 0);
      this.allocation[entityIdx][j] -= rel;
      this.available[j] += rel;
    }
    return {
      success: true,
      message: 'Resources released back to campus pool',
      currentState: this.getCurrentState()
    };
  }

  resetToDefault() {
    this.allocation = [
      [1, 1, 2, 0],
      [2, 0, 1, 1],
      [0, 1, 3, 0],
      [1, 1, 1, 0],
      [0, 0, 1, 1]
    ];
    this.recalculateAvailable();
  }

  getCurrentState() {
    this.recalculateAvailable();
    const need = this.getNeedMatrix();
    const safety = this.checkSafety();

    return {
      resourceTypes: this.resourceTypes,
      totalInstances: this.totalInstances,
      available: this.available,
      entities: this.entities,
      allocation: this.allocation,
      maxClaim: this.maxClaim,
      need,
      isSafe: safety.isSafe,
      safeSequence: safety.safeSequence,
      stepLog: safety.stepLog
    };
  }
}

// Global Singleton Banker Engine
const globalBanker = new BankerSystem();

module.exports = { BankerSystem, globalBanker };
