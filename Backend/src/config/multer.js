const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─────────────────────────────────────────────────────────
// ENSURE UPLOAD FOLDERS EXIST
// ─────────────────────────────────────────────────────────
const ensureFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

ensureFolder('uploads/videos');
ensureFolder('uploads/thumbnails');

// ─────────────────────────────────────────────────────────
// VIDEO STORAGE CONFIG
// ─────────────────────────────────────────────────────────
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos');
  },
  filename: (req, file, cb) => {
    // Format: course-{courseId}-{timestamp}{ext}
    const ext = path.extname(file.originalname);
    const filename = `course-${req.params.id}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// ─────────────────────────────────────────────────────────
// THUMBNAIL STORAGE CONFIG
// ─────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────
// FILE TYPE FILTERS
// ─────────────────────────────────────────────────────────
const videoFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'video/mkv', 'video/webm', 'video/avi'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // accept file
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

// ─────────────────────────────────────────────────────────
// MULTER INSTANCES
// ─────────────────────────────────────────────────────────
const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  }
});

const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: thumbnailFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  }
});

module.exports = { uploadVideo, uploadThumbnail };