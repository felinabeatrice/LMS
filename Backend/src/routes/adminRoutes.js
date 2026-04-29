const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getPendingInstructors,
  approveInstructor,
  deleteUser,
  getDashboardStats,
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require login + admin role
router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/instructors/pending', getPendingInstructors);
router.patch('/instructors/:id/approve', approveInstructor);
router.delete('/users/:id', deleteUser);

module.exports = router;