const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  submitAssignment,
  gradeSubmission,
  getMySubmissions,
} = require('../controllers/submissionController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadSubmission } = require('../config/multer');

// All routes require authentication
router.use(protect);

// GET /api/assignments/my-submissions (Student)
router.get('/my-submissions', authorize('student'), getMySubmissions);

// POST /api/assignments/:assignmentId/submit (Student)
router.post(
  '/:assignmentId/submit',
  authorize('student'),
  uploadSubmission.single('file'),
  submitAssignment
);

// PATCH /api/assignments/:id/grade (Instructor)
router.patch('/:id/grade', authorize('instructor', 'admin'), gradeSubmission);

module.exports = router;