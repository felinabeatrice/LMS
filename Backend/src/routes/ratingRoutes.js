const express = require('express');
const router = express.Router();

const {
  submitRating,
  editRating,
  deleteRating,
  getCourseRatings,
  getMyRatings,
  getAllRatings,
} = require('../controllers/ratingController');

const { protect, authorize } = require('../middleware/authMiddleware');

// ─── PUBLIC ───────────────────────────────────────────────
router.get('/course/:courseId', getCourseRatings);

// ─── STUDENT ONLY ─────────────────────────────────────────
router.post('/', protect, authorize('student'), submitRating);
router.get('/my-ratings', protect, authorize('student'), getMyRatings);
router.patch('/:id', protect, authorize('student'), editRating);

// ─── STUDENT (OWN) OR ADMIN ───────────────────────────────
router.delete('/:id', protect, authorize('student', 'admin'), deleteRating);

// ─── ADMIN ONLY ───────────────────────────────────────────
router.get('/', protect, authorize('admin'), getAllRatings);

module.exports = router;