// modules/cache/lruCache.js - In-Memory Cache with LRU & FIFO Replacement Policies
// Demonstrates OS Memory Management & Page Replacement Concepts (Unit 5)

class Node {
  constructor(key, value, size = 1) {
    this.key = key;
    this.value = value;
    this.size = size;
    this.accessedAt = Date.now();
    this.hits = 0;
    this.prev = null;
    this.next = null;
  }
}

class OSCache {
  constructor(capacity = 50, policy = 'LRU') {
    this.capacity = capacity;       // Max number of entries
    this.policy = policy;           // 'LRU' or 'FIFO'
    this.map = new Map();           // Fast O(1) key lookup
    this.head = new Node('HEAD', null); // Doubly Linked List Head (Most Recent)
    this.tail = new Node('TAIL', null); // Doubly Linked List Tail (Least Recent)
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.fifoQueue = [];            // For FIFO eviction policy

    // Telemetry & Metrics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      policy: policy,
      capacity: capacity,
      createdAt: new Date(),
      history: [] // { timestamp, key, action: 'HIT'|'MISS'|'EVICT'|'PUT' }
    };
  }

  // Set replacement policy ('LRU' or 'FIFO')
  setPolicy(policy) {
    if (policy !== 'LRU' && policy !== 'FIFO') throw new Error('Policy must be LRU or FIFO');
    this.policy = policy;
    this.stats.policy = policy;
    this.recordHistory('POLICY_CHANGE', `Switched to ${policy}`);
  }

  // Set maximum capacity
  setCapacity(capacity) {
    this.capacity = Math.max(5, parseInt(capacity, 10) || 50);
    this.stats.capacity = this.capacity;
    while (this.map.size > this.capacity) {
      this.evict();
    }
  }

  // Doubly Linked List Helper: Add node right after head (most recently used)
  _addNode(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  // Doubly Linked List Helper: Remove node from list
  _removeNode(node) {
    const prev = node.prev;
    const next = node.next;
    prev.next = next;
    next.prev = prev;
  }

  // Move node to head (indicates recent access)
  _moveToHead(node) {
    this._removeNode(node);
    this._addNode(node);
  }

  // Evict based on active policy
  evict() {
    let evictedKey = null;
    if (this.policy === 'FIFO') {
      if (this.fifoQueue.length > 0) {
        evictedKey = this.fifoQueue.shift();
        const node = this.map.get(evictedKey);
        if (node) {
          this._removeNode(node);
          this.map.delete(evictedKey);
        }
      }
    } else {
      // LRU: Pop from before tail (least recently used)
      const lruNode = this.tail.prev;
      if (lruNode && lruNode !== this.head) {
        evictedKey = lruNode.key;
        this._removeNode(lruNode);
        this.map.delete(evictedKey);
      }
    }

    if (evictedKey) {
      this.stats.evictions++;
      this.recordHistory('EVICT', evictedKey);
    }
    return evictedKey;
  }

  get(key) {
    if (!this.map.has(key)) {
      this.stats.misses++;
      this.recordHistory('MISS', key);
      return null;
    }

    const node = this.map.get(key);
    node.hits++;
    node.accessedAt = Date.now();
    this.stats.hits++;

    if (this.policy === 'LRU') {
      this._moveToHead(node);
    }

    this.recordHistory('HIT', key);
    return node.value;
  }

  put(key, value) {
    if (this.map.has(key)) {
      const node = this.map.get(key);
      node.value = value;
      node.accessedAt = Date.now();
      if (this.policy === 'LRU') {
        this._moveToHead(node);
      }
      this.recordHistory('UPDATE', key);
      return;
    }

    if (this.map.size >= this.capacity) {
      this.evict();
    }

    const newNode = new Node(key, value);
    this.map.set(key, newNode);
    this._addNode(newNode);
    this.fifoQueue.push(key);
    this.recordHistory('PUT', key);
  }

  purge() {
    this.map.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.fifoQueue = [];
    this.stats.evictions += this.map.size;
    this.recordHistory('PURGE', 'All keys cleared');
  }

  recordHistory(action, key) {
    this.stats.history.unshift({
      timestamp: new Date(),
      action,
      key: String(key).substring(0, 80)
    });
    if (this.stats.history.length > 50) this.stats.history.pop();
  }

  getTelemetry() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total === 0 ? 0 : ((this.stats.hits / total) * 100).toFixed(1);
    
    // Ordered entries (Most Recent to Least Recent)
    const entries = [];
    let curr = this.head.next;
    while (curr && curr !== this.tail) {
      entries.push({
        key: curr.key,
        hits: curr.hits,
        accessedAt: curr.accessedAt,
        sizeApprox: JSON.stringify(curr.value || '').length
      });
      curr = curr.next;
    }

    return {
      policy: this.policy,
      capacity: this.capacity,
      currentSize: this.map.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: parseFloat(hitRate),
      evictions: this.stats.evictions,
      entries,
      recentActivity: this.stats.history.slice(0, 15)
    };
  }
}

// Singleton Cache Instance
const globalCache = new OSCache(50, 'LRU');

module.exports = { OSCache, globalCache };
