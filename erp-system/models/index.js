// models/index.js - All Mongoose Models

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────
// USER MODEL (Professor / Student / Admin)
// ─────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'professor', 'student'], required: true },
  avatar: { type: String, default: null }, // initials-based avatar color
  studentId: { type: String, default: null }, // for students
  department: { type: String, default: null },
  enrolledClassrooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }], // for students
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

// ─────────────────────────────────────────
// CLASSROOM MODEL
// ─────────────────────────────────────────
const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  classCode: { type: String, required: true, unique: true, uppercase: true },
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  semester: { type: String, default: '' },
  academicYear: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  coverColor: { type: String, default: '#4F46E5' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Classroom = mongoose.model('Classroom', classroomSchema);

// ─────────────────────────────────────────
// ASSIGNMENT MODEL
// ─────────────────────────────────────────
const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deadline: { type: Date, required: true },
  totalMarks: { type: Number, required: true, min: 1, max: 1000 },
  allowedExtensions: { type: [String], default: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'zip', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'] },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String, // base64 or URL
    uploadedAt: { type: Date, default: Date.now }
  }],
  isPublished: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);

// ─────────────────────────────────────────
// SUBMISSION MODEL
// ─────────────────────────────────────────
const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  files: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    data: String, // base64 encoded file
    uploadedAt: { type: Date, default: Date.now }
  }],
  notes: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  isLate: { type: Boolean, default: false },
  marksObtained: { type: Number, default: null },
  feedback: { type: String, default: '' },
  gradedAt: { type: Date, default: null },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['submitted', 'graded', 'returned'], default: 'submitted' }
}, { timestamps: true });

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

const Submission = mongoose.model('Submission', submissionSchema);

// ─────────────────────────────────────────
// NOTIFICATION MODEL
// ─────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['assignment', 'grade', 'classroom', 'system'], default: 'system' },
  isRead: { type: Boolean, default: false },
  relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

// ─────────────────────────────────────────
// ELECTIVE / LAB SLOT MODEL (Unit 2: Concurrency & Mutex)
// ─────────────────────────────────────────
const electiveSlotSchema = new mongoose.Schema({
  courseCode: { type: String, required: true, trim: true },
  courseName: { type: String, required: true, trim: true },
  instructor: { type: String, default: 'Dept Faculty' },
  totalCapacity: { type: Number, required: true, min: 1 },
  availableSeats: { type: Number, required: true },
  enrolledStudents: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentName: { type: String, required: true },
    bookedAt: { type: Date, default: Date.now }
  }],
  room: { type: String, default: 'Lab 301' }
}, { timestamps: true });

const ElectiveSlot = mongoose.model('ElectiveSlot', electiveSlotSchema);

// ─────────────────────────────────────────
// CAMPUS RESOURCE MODEL (Unit 4: Deadlocks & Banker's Algorithm)
// ─────────────────────────────────────────
const campusResourceSchema = new mongoose.Schema({
  resourceName: { type: String, required: true, unique: true },
  totalInstances: { type: Number, required: true, min: 1 },
  availableInstances: { type: Number, required: true },
  allocations: [{
    department: { type: String, required: true },
    allocated: { type: Number, default: 0 },
    maxClaim: { type: Number, required: true }
  }]
}, { timestamps: true });

const CampusResource = mongoose.model('CampusResource', campusResourceSchema);

// ─────────────────────────────────────────
// AUDIT LOG MODEL (AI Assignment 3: Anomaly Detection)
// ─────────────────────────────────────────
const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName: { type: String, default: 'Guest' },
  role: { type: String, default: 'anonymous' },
  action: { type: String, required: true },
  endpoint: { type: String, default: '' },
  ip: { type: String, default: '127.0.0.1' },
  status: { type: String, default: 'SUCCESS' },
  anomalyScore: { type: Number, default: 0 },
  isAnomaly: { type: Boolean, default: false },
  anomalyReason: { type: String, default: '' },
  details: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = { User, Classroom, Assignment, Submission, Notification, ElectiveSlot, CampusResource, AuditLog };

