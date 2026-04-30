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

const {
  protect,
  authorize,
  optionalProtect,
} = require('../middleware/authMiddleware');

// ─── PUBLIC ───────────────────────────────────────────────
router.get('/', getAllCourses);

// ─── ADMIN ONLY ───────────────────────────────────────────
router.get('/pending', protect, authorize('admin'), getPendingCourses);
router.patch('/:id/status', protect, authorize('admin'), updateCourseStatus);

// ─── INSTRUCTOR ONLY ──────────────────────────────────────
router.post('/', protect, authorize('instructor'), createCourse);
router.get('/my-courses', protect, authorize('instructor'), getMyCourses);

// ─── INSTRUCTOR (OWN) OR ADMIN ────────────────────────────
router.put('/:id', protect, authorize('instructor', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);

// ─── SINGLE COURSE — optionalProtect so instructor/admin
//     can see their own pending/rejected courses ──────────
router.get('/:id', optionalProtect, getSingleCourse);

module.exports = router;