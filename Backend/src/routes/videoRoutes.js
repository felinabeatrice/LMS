const express = require('express');
const router = express.Router({ mergeParams: true });
// mergeParams → allows access to :id from parent route

const {
  uploadVideo,
  uploadThumbnail,
  streamVideo,
  deleteVideo,
} = require('../controllers/videoController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadVideo: videoUpload, uploadThumbnail: thumbUpload } = require('../config/multer');

// ─────────────────────────────────────────────────────────
// MULTER ERROR HANDLER WRAPPER
// Catches multer errors (file too big, wrong type)
// ─────────────────────────────────────────────────────────
const handleMulterError = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
};

// ─── INSTRUCTOR/ADMIN ONLY ────────────────────────────────
router.post(
  '/upload-video',
  protect,
  authorize('instructor', 'admin'),
  handleMulterError(videoUpload.single('video')),
  uploadVideo
);

router.post(
  '/upload-thumbnail',
  protect,
  authorize('instructor', 'admin'),
  handleMulterError(thumbUpload.single('thumbnail')),
  uploadThumbnail
);

router.delete(
  '/video',
  protect,
  authorize('instructor', 'admin'),
  deleteVideo
);

// ─── PROTECTED — Any logged in user ──────────────────────
router.get(
  '/video',
  protect,
  streamVideo
);

module.exports = router;