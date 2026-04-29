const { prisma } = require('../config/db');

// ─────────────────────────────────────────────────────────
// PROCESS PAYMENT (FAKE)
// POST /api/payments/:paymentId/pay
// Student only — own payment only
// ─────────────────────────────────────────────────────────
const processPayment = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { paymentId } = req.params;

    // ── 1. Find payment ────────────────────────────────
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(paymentId) },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            price: true,
            is_free: true,
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // ── 2. Ownership check ─────────────────────────────
    if (payment.student_id !== student_id) {
      return res.status(403).json({
        message: 'Access denied. This is not your payment.'
      });
    }

    // ── 3. Already paid check ──────────────────────────
    if (payment.status === 'completed') {
      return res.status(400).json({
        message: 'This payment has already been completed'
      });
    }

    // ── 4. Free course check ───────────────────────────
    if (payment.course.is_free) {
      return res.status(400).json({
        message: 'This course is free. No payment needed.'
      });
    }

    // ── 5. Process payment (fake) ──────────────────────
    // In production → Stripe/PayPal API call here
    // We just mark it as completed
    const updatedPayment = await prisma.payment.update({
      where: { id: parseInt(paymentId) },
      data: {
        status: 'completed',
        access_granted: true,
      },
      include: {
        course: {
          select: { id: true, title: true, price: true }
        }
      }
    });

    return res.status(200).json({
      message: 'Payment successful. You now have full access to the course.',
      payment: updatedPayment,
    });

  } catch (error) {
    console.error('ProcessPayment error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// GET MY PAYMENTS
// GET /api/payments/my-payments
// Student only
// ─────────────────────────────────────────────────────────
const getMyPayments = async (req, res) => {
  try {
    const student_id = req.user.id;

    const payments = await prisma.payment.findMany({
      where: { student_id },
      orderBy: { created_at: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail_url: true,
            instructor: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    return res.status(200).json({
      message: 'Payments fetched successfully',
      count: payments.length,
      payments,
    });

  } catch (error) {
    console.error('GetMyPayments error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// GET ALL PAYMENTS
// GET /api/payments
// Admin only
// ─────────────────────────────────────────────────────────
const getAllPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        course: {
          select: { id: true, title: true, price: true }
        }
      }
    });

    // ── Calculate total revenue ────────────────────────
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return res.status(200).json({
      message: 'All payments fetched successfully',
      count: payments.length,
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      payments,
    });

  } catch (error) {
    console.error('GetAllPayments error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// GET PAYMENT BY ID
// GET /api/payments/:paymentId
// Student (own) or Admin
// ─────────────────────────────────────────────────────────
const getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { id: userId, role } = req.user;

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(paymentId) },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        course: {
          select: { id: true, title: true, price: true }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // ── Student can only see own payment ───────────────
    if (role === 'student' && payment.student_id !== userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    return res.status(200).json({
      message: 'Payment fetched successfully',
      payment,
    });

  } catch (error) {
    console.error('GetPaymentById error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  processPayment,
  getMyPayments,
  getAllPayments,
  getPaymentById,
};