// modules/storage/dedupStorage.js - Content-Addressable Deduplicated Storage
// Demonstrates Unit 6: File Organization, Secondary Storage Management, and Record Blocking

const crypto = require('crypto');

class DedupStorageEngine {
  constructor() {
    this.storagePool = new Map(); // SHA-256 Hash -> { hash, data, size, mimetype, referenceCount, firstUploadedAt }
    this.filePointers = [];       // [{ fileId, filename, originalName, hash, size, uploadedBy, uploadedAt }]
    this.totalRawUploadedBytes = 0;
  }

  // Compute SHA-256 hash of file content string/buffer
  computeHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // Store a file with automatic deduplication
  storeFile({ originalName, content, mimetype = 'application/octet-stream', uploadedBy = 'System' }) {
    const rawSize = Buffer.byteLength(content, 'utf8');
    const hash = this.computeHash(content);
    this.totalRawUploadedBytes += rawSize;

    let isDuplicate = false;
    if (this.storagePool.has(hash)) {
      // Content already exists! Create a virtual file pointer without saving new physical data
      const entry = this.storagePool.get(hash);
      entry.referenceCount++;
      isDuplicate = true;
    } else {
      // Unique content: store physical payload
      this.storagePool.set(hash, {
        hash,
        data: content,
        size: rawSize,
        mimetype,
        referenceCount: 1,
        firstUploadedAt: new Date()
      });
    }

    const filePointer = {
      fileId: `F-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      filename: `${hash.substring(0, 12)}_${originalName}`,
      originalName,
      hash,
      size: rawSize,
      isDuplicate,
      mimetype,
      uploadedBy,
      uploadedAt: new Date()
    };

    this.filePointers.unshift(filePointer);
    if (this.filePointers.length > 50) this.filePointers.pop();

    return {
      filePointer,
      dedupStatus: isDuplicate ? 'DEDUPLICATED_SAVED_SPACE' : 'NEW_UNIQUE_BLOCK_STORED',
      savings: this.getTelemetry()
    };
  }

  getTelemetry() {
    let physicalBytes = 0;
    for (const [_, item] of this.storagePool) {
      physicalBytes += item.size;
    }

    const savedBytes = Math.max(0, this.totalRawUploadedBytes - physicalBytes);
    const savingsRatio = this.totalRawUploadedBytes === 0 ? 0 : ((savedBytes / this.totalRawUploadedBytes) * 100).toFixed(1);

    return {
      totalUploadedFiles: this.filePointers.length,
      uniquePhysicalBlocks: this.storagePool.size,
      totalRawUploadedBytes: this.totalRawUploadedBytes,
      actualPhysicalBytesStored: physicalBytes,
      savedBytes,
      savingsPercentage: parseFloat(savingsRatio),
      recentFiles: this.filePointers.slice(0, 15)
    };
  }

  seedSampleFiles() {
    const starterTemplate = "/* OS Lab Assignment Starter Template */\n#include <stdio.h>\nint main() { printf('OS Lab'); return 0; }";
    const labManualPdf = "ACADEMIA_ERP_OS_LAB_MANUAL_2026_SEMESTER_DATA_CONTENT_BLOCK_CHUNK";

    // Simulate 5 different students submitting the exact same boilerplate template
    ['Alice Smith', 'Bob Johnson', 'Charlie Brown', 'Diana Prince', 'Evan Wright'].forEach(student => {
      this.storeFile({
        originalName: 'lab1_starter.c',
        content: starterTemplate,
        mimetype: 'text/x-c',
        uploadedBy: student
      });
    });

    // Simulate 3 faculty sharing the same lab manual
    ['Prof. Deshmukh', 'Dr. Verma', 'Prof. Patil'].forEach(faculty => {
      this.storeFile({
        originalName: 'OS_Lab_Manual_Unit3.pdf',
        content: labManualPdf,
        mimetype: 'application/pdf',
        uploadedBy: faculty
      });
    });
  }
}

// Global Singleton Storage Engine
const globalStorage = new DedupStorageEngine();
globalStorage.seedSampleFiles();

module.exports = { DedupStorageEngine, globalStorage };
