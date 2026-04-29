const { prisma } = require('../config/db');

// ─────────────────────────────────────────────────────────
// GET ALL USERS
// GET /api/admin/users
// Admin only
// ─────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          is_approved: true,
          created_at: true,
          _count: {
            select: {
              courses: true,
              enrollments: true,
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return res.status(200).json({
      message: 'Users fetched successfully',
      count: total,
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      }
    });

  } catch (error) {
    console.error('GetAllUsers error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// GET PENDING INSTRUCTORS
// GET /api/admin/instructors/pending
// Admin only
// ─────────────────────────────────────────────────────────
const getPendingInstructors = async (req, res) => {
  try {
    const instructors = await prisma.user.findMany({
      where: {
        role: 'instructor',
        is_approved: false,
      },
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_approved: true,
        created_at: true,
      }
    });

    return res.status(200).json({
      message: 'Pending instructors fetched successfully',
      count: instructors.length,
      instructors,
    });

  } catch (error) {
    console.error('GetPendingInstructors error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// APPROVE INSTRUCTOR
// PATCH /api/admin/instructors/:id/approve
// Admin only
// ─────────────────────────────────────────────────────────
const approveInstructor = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'instructor') {
      return res.status(400).json({
        message: 'User is not an instructor'
      });
    }

    if (user.is_approved) {
      return res.status(400).json({
        message: 'Instructor is already approved'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { is_approved: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_approved: true,
      }
    });

    return res.status(200).json({
      message: 'Instructor approved successfully',
      user: updatedUser,
    });

  } catch (error) {
    console.error('ApproveInstructor error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// REJECT / DELETE USER
// DELETE /api/admin/users/:id
// Admin only
// ─────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        message: 'You cannot delete your own account'
      });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('DeleteUser error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// GET DASHBOARD STATS
// GET /api/admin/stats
// Admin only
// ─────────────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      pendingInstructors,
      totalCourses,
      approvedCourses,
      pendingCourses,
      totalEnrollments,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'student' } }),
      prisma.user.count({ where: { role: 'instructor' } }),
      prisma.user.count({ where: { role: 'instructor', is_approved: false } }),
      prisma.course.count(),
      prisma.course.count({ where: { status: 'approved' } }),
      prisma.course.count({ where: { status: 'pending' } }),
      prisma.enrollment.count(),
      prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true }
      }),
    ]);

    return res.status(200).json({
      message: 'Dashboard stats fetched successfully',
      stats: {
        users: {
          total: totalUsers,
          students: totalStudents,
          instructors: totalInstructors,
          pending_instructors: pendingInstructors,
        },
        courses: {
          total: totalCourses,
          approved: approvedCourses,
          pending: pendingCourses,
        },
        enrollments: totalEnrollments,
        revenue: parseFloat(
          (totalRevenue._sum.amount || 0).toFixed(2)
        ),
      }
    });

  } catch (error) {
    console.error('GetDashboardStats error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  getPendingInstructors,
  approveInstructor,
  deleteUser,
  getDashboardStats,
};