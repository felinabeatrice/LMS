const express = require('express');
const router  = express.Router();

const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const { protect, authorize } = require('../middleware/authMiddleware');

// ─── PUBLIC ───────────────────────────────────────────────
router.get('/', getAllCategories);

// ─── ADMIN ONLY ───────────────────────────────────────────
router.post('/',      protect, authorize('admin'), createCategory);
router.patch('/:id',  protect, authorize('admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;