const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  uploadVideo,
  uploadThumbnail,
  streamVideo,
  deleteVideo,
} = require('../controllers/videoController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadVideo: videoUpload, uploadThumbnail: thumbUpload } = require('../config/multer');

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

// ─── INSTRUCTOR/ADMIN ──────────────────────────────
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

// ─── STREAM VIDEO — uses query token ──────────────
router.get('/video', protect, streamVideo);

module.exports = router;