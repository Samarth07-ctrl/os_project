// routes/concurrency.js - Concurrency Control & Mutex Seat Booking
const express = require('express');
const router = express.Router();
const { ElectiveSlot } = require('../models');
const { getSlotMutex } = require('../modules/concurrency/concurrencyManager');
const { protect } = require('../middleware/auth');

// Seed default elective slots if empty
async function ensureSeedSlots() {
  const count = await ElectiveSlot.countDocuments();
  if (count === 0) {
    await ElectiveSlot.insertMany([
      {
        courseCode: 'CS401',
        courseName: 'Advanced Distributed Systems & Cloud',
        instructor: 'Dr. A. Verma',
        totalCapacity: 6,
        availableSeats: 6,
        enrolledStudents: [],
        room: 'Lab 402 (High Compute)'
      },
      {
        courseCode: 'AI302',
        courseName: 'Deep Learning & Neural Networks',
        instructor: 'Dr. P. Sharma',
        totalCapacity: 8,
        availableSeats: 8,
        enrolledStudents: [],
        room: 'Nvidia GPU Center'
      },
      {
        courseCode: 'DS305',
        courseName: 'Operating System Internals & Linux Kernel',
        instructor: 'Prof. R. Deshmukh',
        totalCapacity: 5,
        availableSeats: 5,
        enrolledStudents: [],
        room: 'OS Virtualization Lab'
      }
    ]);
  }
}

// GET /api/concurrency/slots - List all course/lab slots
router.get('/slots', protect, async (req, res) => {
  try {
    await ensureSeedSlots();
    const slots = await ElectiveSlot.find().sort({ courseCode: 1 });
    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/concurrency/book - Book a seat with Mutex protection
router.post('/book', protect, async (req, res) => {
  const { slotId } = req.body;
  if (!slotId) return res.status(400).json({ success: false, message: 'slotId required' });

  const mutex = getSlotMutex(slotId);
  const releaseLock = await mutex.acquire(); // Acquire OS Mutex Lock

  const startTime = Date.now();
  try {
    const slot = await ElectiveSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    // Check if already enrolled
    const already = slot.enrolledStudents.some(s => s.studentName === req.user.name);
    if (already) {
      return res.status(400).json({ success: false, message: 'You have already booked this slot!' });
    }

    if (slot.availableSeats <= 0) {
      return res.status(409).json({
        success: false,
        message: 'Registration Full: No seats remaining in this slot.',
        contention: mutex.getMetrics()
      });
    }

    // Critical section work (simulating DB transaction latency)
    await new Promise(r => setTimeout(r, 60));

    slot.availableSeats -= 1;
    slot.enrolledStudents.push({
      studentId: req.user._id,
      studentName: req.user.name,
      bookedAt: new Date()
    });
    await slot.save();

    res.json({
      success: true,
      message: `Seat booked successfully for ${slot.courseName}!`,
      slot,
      lockMetrics: {
        ...mutex.getMetrics(),
        criticalSectionTimeMs: Date.now() - startTime
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    releaseLock(); // Always release lock in finally block
  }
});

// POST /api/concurrency/benchmark - Live race condition demonstration
router.post('/benchmark', protect, async (req, res) => {
  const { mode = 'WITH_MUTEX', concurrentRequests = 15 } = req.body;
  
  // Create or reset a temporary test slot with 4 seats
  let testSlot = await ElectiveSlot.findOne({ courseCode: 'TEST-CONCURRENCY' });
  if (!testSlot) {
    testSlot = new ElectiveSlot({
      courseCode: 'TEST-CONCURRENCY',
      courseName: 'Concurrent Race-Condition Test Lab',
      totalCapacity: 4,
      availableSeats: 4,
      enrolledStudents: []
    });
  } else {
    testSlot.availableSeats = 4;
    testSlot.enrolledStudents = [];
  }
  await testSlot.save();

  const slotId = testSlot._id.toString();
  const mutex = getSlotMutex(slotId);
  const results = [];
  const startAll = Date.now();

  // Helper simulation for a single student booking
  const simulateBooking = async (studentIdx, useMutex) => {
    let release = () => {};
    if (useMutex) {
      release = await mutex.acquire();
    }
    try {
      // Read current state
      const s = await ElectiveSlot.findById(slotId);
      // Simulate processing delay where race conditions typically strike
      await new Promise(r => setTimeout(r, Math.floor(Math.random() * 40) + 20));

      if (s.availableSeats > 0) {
        s.availableSeats -= 1;
        s.enrolledStudents.push({
          studentName: `Concurrent-Student-${studentIdx}`,
          bookedAt: new Date()
        });
        await s.save();
        return { student: `Student-${studentIdx}`, success: true, seatsLeftAfter: s.availableSeats };
      } else {
        return { student: `Student-${studentIdx}`, success: false, reason: 'No seats left (Safe rejection)' };
      }
    } catch (err) {
      return { student: `Student-${studentIdx}`, success: false, reason: err.message };
    } finally {
      if (useMutex) release();
    }
  };

  // Fire all concurrent requests simultaneously
  const promises = [];
  for (let i = 1; i <= concurrentRequests; i++) {
    promises.push(simulateBooking(i, mode === 'WITH_MUTEX'));
  }

  const outcomes = await Promise.all(promises);
  const finalSlot = await ElectiveSlot.findById(slotId);
  const totalBooked = finalSlot.enrolledStudents.length;
  const isOverbooked = totalBooked > finalSlot.totalCapacity;

  res.json({
    success: true,
    benchmark: {
      mode,
      concurrentRequests,
      slotCapacity: finalSlot.totalCapacity,
      totalSuccessfulBookings: totalBooked,
      finalAvailableSeats: finalSlot.availableSeats,
      isOverbooked,
      overbookedBy: isOverbooked ? totalBooked - finalSlot.totalCapacity : 0,
      totalTimeMs: Date.now() - startAll,
      explanation: isOverbooked
        ? `⚠️ RACE CONDITION DETECTED! Without Mutex synchronization, ${totalBooked} students booked a slot that only has ${finalSlot.totalCapacity} seats!`
        : `✅ ZERO RACE CONDITIONS! Mutex synchronization strictly preserved the capacity limit of ${finalSlot.totalCapacity} seats.`,
      lockMetrics: mutex.getMetrics(),
      detailedOutcomes: outcomes
    }
  });
});

module.exports = router;
