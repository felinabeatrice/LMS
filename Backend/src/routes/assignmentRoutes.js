const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  createAssignment,
  getCourseAssignments,
  deleteAssignment,
} = require('../controllers/assignmentController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadAssignment } = require('../config/multer');

// All routes protected
router.use(protect);

// GET /api/courses/:id/assignments (Student sees if enrolled, Instructor sees all)
router.get('/', getCourseAssignments);

// POST /api/courses/:id/assignments (Instructor only)
router.post(
  '/',
  authorize('instructor', 'admin'),
  uploadAssignment.single('file'),
  createAssignment
);

// DELETE /api/assignments/:id (Instructor only)
router.delete('/:id', authorize('instructor', 'admin'), deleteAssignment);

module.exports = router;