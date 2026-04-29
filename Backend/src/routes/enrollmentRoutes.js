const express = require('express');
const router = express.Router();

const {
  enrollInCourse,
  getMyEnrollments,
  getCourseEnrollments,
  checkEnrollment,
  cancelEnrollment,
} = require('../controllers/enrollmentController');

const { protect, authorize } = require('../middleware/authMiddleware');

// ─── ALL ROUTES REQUIRE LOGIN ──────────────────────────────

// Student only
router.post('/', protect, authorize('student'), enrollInCourse);
router.get('/my-enrollments', protect, authorize('student'), getMyEnrollments);
router.get('/check/:courseId', protect, authorize('student'), checkEnrollment);
router.delete('/:courseId', protect, authorize('student'), cancelEnrollment);

// Instructor or Admin
router.get(
  '/course/:courseId',
  protect,
  authorize('instructor', 'admin'),
  getCourseEnrollments
);

module.exports = router;