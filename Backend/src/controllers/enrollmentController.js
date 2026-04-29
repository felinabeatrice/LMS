const { prisma } = require('../config/db');

// ─────────────────────────────────────────────────────────
// ENROLL IN COURSE
// POST /api/enrollments
// Student only
// Body: { course_id }
// ─────────────────────────────────────────────────────────
const enrollInCourse = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { course_id } = req.body;

    // ── 1. Validate input ──────────────────────────────
    if (!course_id) {
      return res.status(400).json({ message: 'course_id is required' });
    }

    // ── 2. Find course ─────────────────────────────────
    const course = await prisma.course.findUnique({
      where: { id: parseInt(course_id) }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // ── 3. Only approved courses can be enrolled ───────
    if (course.status !== 'approved') {
      return res.status(400).json({
        message: 'This course is not available for enrollment'
      });
    }

    // ── 4. Check already enrolled ─────────────────────
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        student_id_course_id: {
          student_id,
          course_id: parseInt(course_id),
        }
      }
    });

    if (existingEnrollment) {
      return res.status(409).json({
        message: 'You are already enrolled in this course'
      });
    }

    // ── 5. Create enrollment ───────────────────────────
    const enrollment = await prisma.enrollment.create({
      data: {
        student_id,
        course_id: parseInt(course_id),
        status: 'active',
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            is_free: true,
            price: true,
          }
        }
      }
    });

    // ── 6. If paid course → create pending payment ─────
    if (!course.is_free) {
      await prisma.payment.create({
        data: {
          student_id,
          course_id: parseInt(course_id),
          amount: course.price,
          status: 'pending',
          access_granted: false,
        }
      });

      return res.status(201).json({
        message: 'Enrolled successfully. Complete payment to access content.',
        enrollment,
        payment_required: true,
        amount: course.price,
      });
    }

    // ── 7. Free course → access granted immediately ────
    return res.status(201).json({
      message: 'Enrolled successfully. You can now access the course.',
      enrollment,
      payment_required: false,
    });

  } catch (error) {
    console.error('EnrollInCourse error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// GET MY ENROLLMENTS
// GET /api/enrollments/my-enrollments
// Student only
// ─────────────────────────────────────────────────────────
const getMyEnrollments = async (req, res) => {
  try {
    const student_id = req.user.id;

    const enrollments = await prisma.enrollment.findMany({
      where: { student_id },
      orderBy: { enrolled_at: 'desc' },
      include: {
        course: {
          include: {
            instructor: {
              select: { id: true, name: true }
            },
            category: {
              select: { id: true, name: true }
            },
            ratings: {
              select: { stars: true }
            },
            _count: {
              select: { enrollments: true }
            }
          }
        }
      }
    });

    // ── Add payment status and avg rating ──────────────
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Check payment for paid courses
        let paymentStatus = null;

        if (!enrollment.course.is_free) {
          const payment = await prisma.payment.findFirst({
            where: {
              student_id,
              course_id: enrollment.course_id,
            },
            select: {
              id: true,
              status: true,
              access_granted: true,
              amount: true,
            }
          });
          paymentStatus = payment;
        }

        // Average rating
        const ratings = enrollment.course.ratings;
        const avgRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
          : 0;

        const { ratings: _, ...courseWithoutRatings } = enrollment.course;

        return {
          ...enrollment,
          course: {
            ...courseWithoutRatings,
            average_rating: parseFloat(avgRating.toFixed(1)),
          },
          payment: paymentStatus,
          has_access: enrollment.course.is_free
            ? true
            : paymentStatus?.access_granted || false,
        };
      })
    );

    return res.status(200).json({
      message: 'Enrollments fetched successfully',
      count: enrichedEnrollments.length,
      enrollments: enrichedEnrollments,
    });

  } catch (error) {
    console.error('GetMyEnrollments error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// GET COURSE ENROLLMENTS
// GET /api/enrollments/course/:courseId
// Instructor (own course) or Admin
// ─────────────────────────────────────────────────────────
const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { id: userId, role } = req.user;

    // ── 1. Find course ─────────────────────────────────
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // ── 2. Instructor can only see own course ──────────
    if (role === 'instructor' && course.instructor_id !== userId) {
      return res.status(403).json({
        message: 'Access denied. This is not your course.'
      });
    }

    // ── 3. Get enrollments ─────────────────────────────
    const enrollments = await prisma.enrollment.findMany({
      where: { course_id: parseInt(courseId) },
      orderBy: { enrolled_at: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return res.status(200).json({
      message: 'Course enrollments fetched successfully',
      course: {
        id: course.id,
        title: course.title,
      },
      count: enrollments.length,
      enrollments,
    });

  } catch (error) {
    console.error('GetCourseEnrollments error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// CHECK ENROLLMENT STATUS
// GET /api/enrollments/check/:courseId
// Student only
// ─────────────────────────────────────────────────────────
const checkEnrollment = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { courseId } = req.params;

    // ── Find enrollment ────────────────────────────────
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        student_id_course_id: {
          student_id,
          course_id: parseInt(courseId),
        }
      }
    });

    if (!enrollment) {
      return res.status(200).json({
        enrolled: false,
        has_access: false,
      });
    }

    // ── Check payment for paid courses ─────────────────
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      select: { is_free: true }
    });

    let hasAccess = course.is_free; // free = always has access

    if (!course.is_free) {
      const payment = await prisma.payment.findFirst({
        where: {
          student_id,
          course_id: parseInt(courseId),
          status: 'completed',
          access_granted: true,
        }
      });
      hasAccess = !!payment;
    }

    return res.status(200).json({
      enrolled: true,
      has_access: hasAccess,
      enrollment,
    });

  } catch (error) {
    console.error('CheckEnrollment error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// CANCEL ENROLLMENT
// DELETE /api/enrollments/:courseId
// Student only — own enrollment only
// ─────────────────────────────────────────────────────────
const cancelEnrollment = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { courseId } = req.params;

    // ── 1. Find enrollment ─────────────────────────────
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        student_id_course_id: {
          student_id,
          course_id: parseInt(courseId),
        }
      }
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // ── 2. Delete enrollment ───────────────────────────
    await prisma.enrollment.delete({
      where: {
        student_id_course_id: {
          student_id,
          course_id: parseInt(courseId),
        }
      }
    });

    // ── 3. Cancel any pending payment ─────────────────
    await prisma.payment.updateMany({
      where: {
        student_id,
        course_id: parseInt(courseId),
        status: 'pending',
      },
      data: { status: 'failed' }
    });

    return res.status(200).json({
      message: 'Enrollment cancelled successfully'
    });

  } catch (error) {
    console.error('CancelEnrollment error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  enrollInCourse,
  getMyEnrollments,
  getCourseEnrollments,
  checkEnrollment,
  cancelEnrollment,
};