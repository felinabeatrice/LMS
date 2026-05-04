const express = require('express');
const router = express.Router();

const {
  createAnnouncement,
  getPlatformAnnouncements,
  getCourseAnnouncements,
  getStudentAnnouncements,
  deleteAnnouncement,
} = require('../controllers/announcementController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Public
router.get('/platform', getPlatformAnnouncements);
router.get('/course/:courseId', getCourseAnnouncements);

// Student
router.get(
  '/student',
  protect,
  authorize('student'),
  getStudentAnnouncements
);

// Admin + Instructor
router.post(
  '/',
  protect,
  authorize('admin', 'instructor'),
  createAnnouncement
);

router.delete(
  '/:id',
  protect,
  authorize('admin', 'instructor'),
  deleteAnnouncement
);

module.exports = router;