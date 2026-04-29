const express = require('express');
const router = express.Router();

const {
  processPayment,
  getMyPayments,
  getAllPayments,
  getPaymentById,
} = require('../controllers/paymentController');

const { protect, authorize } = require('../middleware/authMiddleware');

// ─── STUDENT ROUTES ───────────────────────────────────────
router.post(
  '/:paymentId/pay',
  protect,
  authorize('student'),
  processPayment
);

router.get(
  '/my-payments',
  protect,
  authorize('student'),
  getMyPayments
);

// ─── ADMIN ROUTES ─────────────────────────────────────────
router.get(
  '/',
  protect,
  authorize('admin'),
  getAllPayments
);

// ─── STUDENT (OWN) OR ADMIN ───────────────────────────────
router.get(
  '/:paymentId',
  protect,
  authorize('student', 'admin'),
  getPaymentById
);

module.exports = router;