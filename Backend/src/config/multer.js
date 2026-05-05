const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─────────────────────────────────────────────────────────────────
// ENSURE UPLOAD FOLDERS EXIST
// ─────────────────────────────────────────────────────────────────
const ensureFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

ensureFolder('uploads/videos');
ensureFolder('uploads/thumbnails');
ensureFolder('uploads/assignments');   // NEW
ensureFolder('uploads/submissions');   // NEW

// ─────────────────────────────────────────────────────────────────
// VIDEO STORAGE CONFIG
// ─────────────────────────────────────────────────────────────────
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `course-${req.params.id}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// ─────────────────────────────────────────────────────────────────
// THUMBNAIL STORAGE CONFIG
// ─────────────────────────────────────────────────────────────────
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/thumbnails');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `thumb-${req.params.id}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// ─────────────────────────────────────────────────────────────────
// ASSIGNMENT STORAGE CONFIG (Instructor's instructions file)
// ─────────────────────────────────────────────────────────────────
const assignmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/assignments');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `assignment-${req.params.id}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// ─────────────────────────────────────────────────────────────────
// SUBMISSION STORAGE CONFIG (Student's submitted file)
// ─────────────────────────────────────────────────────────────────
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/submissions');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // assignmentId-timestamp-originalName
    const filename = `sub-${req.params.assignmentId}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// ─────────────────────────────────────────────────────────────────
// FILE TYPE FILTERS
// ─────────────────────────────────────────────────────────────────
const videoFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'video/mkv', 'video/webm', 'video/avi'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, MKV, WEBM, AVI allowed.'), false);
  }
};

const thumbnailFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP allowed.'), false);
  }
};

// Assignment instructions: PDF only (optional)
const assignmentFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files allowed for assignment instructions.'), false);
  }
};

// Student submission: Any file type, max 10MB
const submissionFilter = (req, file, cb) => {
  // Accept any file type
  cb(null, true);
};

// ─────────────────────────────────────────────────────────────────
// MULTER INSTANCES
// ─────────────────────────────────────────────────────────────────
const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: thumbnailFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadAssignment = multer({
  storage: assignmentStorage,
  fileFilter: assignmentFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadSubmission = multer({
  storage: submissionStorage,
  fileFilter: submissionFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = { 
  uploadVideo, 
  uploadThumbnail, 
  uploadAssignment,    // NEW
  uploadSubmission     // NEW
};