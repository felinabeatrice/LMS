const { prisma } = require('../config/db');

// ─────────────────────────────────────────────────────────
// CREATE COURSE
// POST /api/courses
// Instructor only
// ─────────────────────────────────────────────────────────
const createCourse = async (req, res) => {
  try {
   const { title, description, learning_outcomes, price, is_free, duration, category_id } = req.body;
    const instructor_id = req.user.id;

    if (!title || !description || !duration || !category_id) {
      return res.status(400).json({
        message: 'Required fields: title, description, duration, category_id'
      });
    }

    const category = await prisma.category.findUnique({
      where: { id: parseInt(category_id) }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const coursePrice = is_free ? 0.00 : parseFloat(price) || 0.00;

    if (!is_free && coursePrice <= 0) {
      return res.status(400).json({
        message: 'Paid courses must have a price greater than 0'
      });
    }

    const course = await prisma.course.create({
      data: {
        title:             title.trim(),
        description:       description.trim(),
        learning_outcomes: learning_outcomes
          ? learning_outcomes.trim()
          : null,
        price:        coursePrice,
        is_free:      Boolean(is_free),
        duration:     parseInt(duration),
        status:       'pending',
        instructor_id,
        category_id:  parseInt(category_id),
      },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        category:   { select: { id: true, name: true } },
      }
    });

    return res.status(201).json({
      message: 'Course created. Waiting for admin approval.',
      course,
    });

  } catch (error) {
    console.error('CreateCourse error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// GET ALL APPROVED COURSES
// GET /api/courses
// Public
// Supports: ?category=1 &search=node &page=1 &limit=10
// ─────────────────────────────────────────────────────────
const getAllCourses = async (req, res) => {
  try {
    const {
      category,
      search,
      page = 1,
      limit = 10,
      is_free,
    } = req.query;

    // ── Build filter ───────────────────────────────────
    const where = {
      status: 'approved', // only show approved courses
    };

    if (category) {
      where.category_id = parseInt(category);
    }

    if (is_free !== undefined) {
      where.is_free = is_free === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // ── Pagination ─────────────────────────────────────
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // ── Query ──────────────────────────────────────────
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
        include: {
          instructor: {
            select: { id: true, name: true }
          },
          category: {
            select: { id: true, name: true }
          },
          _count: {
            select: {
              enrollments: true,
              ratings: true,
            }
          },
          ratings: {
            select: { stars: true }
          }
        }
      }),
      prisma.course.count({ where })
    ]);

    // ── Calculate average rating per course ────────────
    const coursesWithRating = courses.map(course => {
      const avgRating = course.ratings.length > 0
        ? course.ratings.reduce((sum, r) => sum + r.stars, 0) / course.ratings.length
        : 0;

      const { ratings, ...rest } = course; // remove raw ratings array

      return {
        ...rest,
        average_rating: parseFloat(avgRating.toFixed(1)),
      };
    });

    return res.status(200).json({
      message: 'Courses fetched successfully',
      courses: coursesWithRating,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      }
    });

  } catch (error) {
    console.error('GetAllCourses error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// GET SINGLE COURSE
// GET /api/courses/:id
// Public
// ─────────────────────────────────────────────────────────
const getSingleCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: {
        instructor: {
          select: { id: true, name: true, email: true }
        },
        category: {
          select: { id: true, name: true }
        },
        ratings: {
          include: {
            student: {
              select: { id: true, name: true }
            }
          },
          orderBy: { created_at: 'desc' }
        },
        _count: {
          select: { enrollments: true }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // ── Access control for non-approved courses ─────────
    if (course.status !== 'approved') {
      const user = req.user;

      // Guest (not logged in) → block
      if (!user) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Admin → always allow
      if (user.role === 'admin') {
        // pass through
      }
      // Instructor → only their OWN course
      else if (
        user.role === 'instructor' &&
        course.instructor_id === user.id
      ) {
        // pass through
      }
      // Everyone else → block
      else {
        return res.status(404).json({ message: 'Course not found' });
      }
    }

    // ── Calculate average rating ────────────────────────
    const avgRating = course.ratings.length > 0
      ? course.ratings.reduce((sum, r) => sum + r.stars, 0) /
        course.ratings.length
      : 0;

    return res.status(200).json({
      message: 'Course fetched successfully',
      course: {
        ...course,
        average_rating: parseFloat(avgRating.toFixed(1)),
      }
    });

  } catch (error) {
    console.error('GetSingleCourse error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// GET MY COURSES
// GET /api/courses/my-courses
// Instructor only
// ─────────────────────────────────────────────────────────
const getMyCourses = async (req, res) => {
  try {
    const instructor_id = req.user.id;

    const courses = await prisma.course.findMany({
      where: { instructor_id },
      orderBy: { created_at: 'desc' },
      include: {
        category: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            enrollments: true,
            ratings: true,
          }
        }
      }
    });

    return res.status(200).json({
      message: 'Your courses fetched successfully',
      courses,
    });

  } catch (error) {
    console.error('GetMyCourses error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// UPDATE COURSE
// PUT /api/courses/:id
// Instructor only — own courses only
// ─────────────────────────────────────────────────────────
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const instructor_id = req.user.id;
    const { title, description, learning_outcomes, price, is_free, duration, category_id } = req.body;
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor_id !== instructor_id) {
      return res.status(403).json({
        message: 'Access denied. This is not your course.'
      });
    }

    const updateData = {};

    if (title)       updateData.title       = title.trim();
    if (description) updateData.description = description.trim();
    if (duration)    updateData.duration    = parseInt(duration);
    if (category_id) updateData.category_id = parseInt(category_id);

    if (learning_outcomes !== undefined) {
      updateData.learning_outcomes = learning_outcomes
        ? learning_outcomes.trim()
        : null;
    }

    if (is_free !== undefined) {
      updateData.is_free = Boolean(is_free);
      updateData.price   = is_free ? 0.00 : parseFloat(price) || course.price;
    }

    updateData.status = 'pending';

    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(id) },
      data:  updateData,
      include: {
        category:   { select: { id: true, name: true } },
        instructor: { select: { id: true, name: true } },
      }
    });

    return res.status(200).json({
      message: 'Course updated. Pending admin re-approval.',
      course:  updatedCourse,
    });

  } catch (error) {
    console.error('UpdateCourse error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE COURSE
// DELETE /api/courses/:id
// Instructor (own) or Admin (any)
// ─────────────────────────────────────────────────────────
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    // ── 1. Find course ─────────────────────────────────
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // ── 2. Permission check ────────────────────────────
    // Admin can delete any course
    // Instructor can only delete own course
    if (role === 'instructor' && course.instructor_id !== userId) {
      return res.status(403).json({
        message: 'Access denied. This is not your course.'
      });
    }

    // ── 3. Delete ──────────────────────────────────────
    await prisma.course.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({ message: 'Course deleted successfully' });

  } catch (error) {
    console.error('DeleteCourse error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// GET PENDING COURSES
// GET /api/courses/pending
// Admin only
// ─────────────────────────────────────────────────────────
const getPendingCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { status: 'pending' },
      orderBy: { created_at: 'asc' }, // oldest first
      include: {
        instructor: {
          select: { id: true, name: true, email: true }
        },
        category: {
          select: { id: true, name: true }
        }
      }
    });

    return res.status(200).json({
      message: 'Pending courses fetched successfully',
      count: courses.length,
      courses,
    });

  } catch (error) {
    console.error('GetPendingCourses error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// APPROVE OR REJECT COURSE
// PATCH /api/courses/:id/status
// Admin only
// Body: { status: "approved" | "rejected" }
// ─────────────────────────────────────────────────────────
const updateCourseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ── 1. Validate status value ───────────────────────
    const allowedStatuses = ['approved', 'rejected'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Status must be approved or rejected'
      });
    }

    // ── 2. Find course ─────────────────────────────────
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // ── 3. Update status ───────────────────────────────
    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } }
      }
    });

    return res.status(200).json({
      message: `Course ${status} successfully`,
      course: updatedCourse,
    });

  } catch (error) {
    console.error('UpdateCourseStatus error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getSingleCourse,
  getMyCourses,
  updateCourse,
  deleteCourse,
  getPendingCourses,
  updateCourseStatus,
};