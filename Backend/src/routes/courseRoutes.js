const express = require('express');
const router = express.Router();

const {
  createCourse,
  getAllCourses,
  getSingleCourse,
  getMyCourses,
  updateCourse,
  deleteCourse,
  getPendingCourses,
  updateCourseStatus,
} = require('../controllers/courseController');

const { protect, authorize } = require('../middleware/authMiddleware');

// ─── PUBLIC ROUTES ────────────────────────────────────────
router.get('/', getAllCourses);

// ─── PROTECTED ROUTES ─────────────────────────────────────

// Admin only
router.get('/pending', protect, authorize('admin'), getPendingCourses);
router.patch('/:id/status', protect, authorize('admin'), updateCourseStatus);

// Instructor only
router.post('/', protect, authorize('instructor'), createCourse);
router.get('/my-courses', protect, authorize('instructor'), getMyCourses);

// Instructor (own) or Admin
router.put('/:id', protect, authorize('instructor', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);

// Public - but needs optional auth for status check
router.get('/:id', getSingleCourse);

module.exports = router;