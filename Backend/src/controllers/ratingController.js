const { prisma } = require('../config/db');

// ─────────────────────────────────────────────────────────
// SUBMIT RATING
// POST /api/ratings
// Student only — must be enrolled
// Body: { course_id, stars, review }
// ─────────────────────────────────────────────────────────
const submitRating = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { course_id, stars, review } = req.body;

    // ── 1. Validate input ──────────────────────────────
    if (!course_id || !stars) {
      return res.status(400).json({
        message: 'course_id and stars are required'
      });
    }

    // ── 2. Validate stars range ────────────────────────
    const starsNum = parseInt(stars);
    if (isNaN(starsNum) || starsNum < 1 || starsNum > 5) {
      return res.status(400).json({
        message: 'Stars must be a number between 1 and 5'
      });
    }

    // ── 3. Check course exists and is approved ─────────
    const course = await prisma.course.findUnique({
      where: { id: parseInt(course_id) }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.status !== 'approved') {
      return res.status(400).json({
        message: 'Cannot rate an unavailable course'
      });
    }

    // ── 4. Check student is enrolled ───────────────────
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        student_id_course_id: {
          student_id,
          course_id: parseInt(course_id),
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        message: 'You must be enrolled in this course to submit a rating'
      });
    }

    // ── 5. Check already rated ─────────────────────────
    const existingRating = await prisma.rating.findUnique({
      where: {
        student_id_course_id: {
          student_id,
          course_id: parseInt(course_id),
        }
      }
    });

    if (existingRating) {
      return res.status(409).json({
        message: 'You have already rated this course. Edit your existing rating instead.'
      });
    }

    // ── 6. Create rating ───────────────────────────────
    const rating = await prisma.rating.create({
      data: {
        student_id,
        course_id: parseInt(course_id),
        stars: starsNum,
        review: review ? review.trim() : null,
      },
      include: {
        student: {
          select: { id: true, name: true }
        },
        course: {
          select: { id: true, title: true }
        }
      }
    });

    // ── 7. Get updated average ─────────────────────────
    const average = await getAverageRating(parseInt(course_id));

    return res.status(201).json({
      message: 'Rating submitted successfully',
      rating,
      course_average_rating: average,
    });

  } catch (error) {
    console.error('SubmitRating error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// EDIT RATING
// PATCH /api/ratings/:id
// Student only — own rating only
// Body: { stars, review }
// ─────────────────────────────────────────────────────────
const editRating = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { id } = req.params;
    const { stars, review } = req.body;

    // ── 1. Find rating ─────────────────────────────────
    const rating = await prisma.rating.findUnique({
      where: { id: parseInt(id) }
    });

    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    // ── 2. Ownership check ─────────────────────────────
    if (rating.student_id !== student_id) {
      return res.status(403).json({
        message: 'Access denied. This is not your rating.'
      });
    }

    // ── 3. Validate stars if provided ──────────────────
    const updateData = {};

    if (stars !== undefined) {
      const starsNum = parseInt(stars);
      if (isNaN(starsNum) || starsNum < 1 || starsNum > 5) {
        return res.status(400).json({
          message: 'Stars must be between 1 and 5'
        });
      }
      updateData.stars = starsNum;
    }

    if (review !== undefined) {
      updateData.review = review ? review.trim() : null;
    }

    // ── 4. Nothing to update ───────────────────────────
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: 'Provide stars or review to update'
      });
    }

    // ── 5. Update rating ───────────────────────────────
    const updatedRating = await prisma.rating.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        student: {
          select: { id: true, name: true }
        },
        course: {
          select: { id: true, title: true }
        }
      }
    });

    // ── 6. Get updated average ─────────────────────────
    const average = await getAverageRating(rating.course_id);

    return res.status(200).json({
      message: 'Rating updated successfully',
      rating: updatedRating,
      course_average_rating: average,
    });

  } catch (error) {
    console.error('EditRating error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE RATING
// DELETE /api/ratings/:id
// Student (own) or Admin (any)
// ─────────────────────────────────────────────────────────
const deleteRating = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { id } = req.params;

    // ── 1. Find rating ─────────────────────────────────
    const rating = await prisma.rating.findUnique({
      where: { id: parseInt(id) }
    });

    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    // ── 2. Permission check ────────────────────────────
    // Admin can delete any rating
    // Student can only delete own rating
    if (role === 'student' && rating.student_id !== userId) {
      return res.status(403).json({
        message: 'Access denied. This is not your rating.'
      });
    }

    const courseId = rating.course_id;

    // ── 3. Delete ──────────────────────────────────────
    await prisma.rating.delete({
      where: { id: parseInt(id) }
    });

    // ── 4. Get updated average ─────────────────────────
    const average = await getAverageRating(courseId);

    return res.status(200).json({
      message: 'Rating deleted successfully',
      course_average_rating: average,
    });

  } catch (error) {
    console.error('DeleteRating error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// GET COURSE RATINGS
// GET /api/ratings/course/:courseId
// Public
// ─────────────────────────────────────────────────────────
const getCourseRatings = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // ── 1. Check course exists ─────────────────────────
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      select: { id: true, title: true, status: true }
    });

    if (!course || course.status !== 'approved') {
      return res.status(404).json({ message: 'Course not found' });
    }

    // ── 2. Pagination ──────────────────────────────────
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // ── 3. Get ratings ─────────────────────────────────
    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where: { course_id: parseInt(courseId) },
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
        include: {
          student: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.rating.count({
        where: { course_id: parseInt(courseId) }
      })
    ]);

    // ── 4. Calculate stats ─────────────────────────────
    const average = await getAverageRating(parseInt(courseId));
    const distribution = await getStarDistribution(parseInt(courseId));

    return res.status(200).json({
      message: 'Ratings fetched successfully',
      course: { id: course.id, title: course.title },
      stats: {
        average_rating: average,
        total_ratings: total,
        distribution, // { 1: 2, 2: 5, 3: 10, 4: 20, 5: 63 }
      },
      ratings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      }
    });

  } catch (error) {
    console.error('GetCourseRatings error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// GET MY RATINGS
// GET /api/ratings/my-ratings
// Student only
// ─────────────────────────────────────────────────────────
const getMyRatings = async (req, res) => {
  try {
    const student_id = req.user.id;

    const ratings = await prisma.rating.findMany({
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
      message: 'Your ratings fetched successfully',
      count: ratings.length,
      ratings,
    });

  } catch (error) {
    console.error('GetMyRatings error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// GET ALL RATINGS
// GET /api/ratings
// Admin only
// ─────────────────────────────────────────────────────────
const getAllRatings = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
        include: {
          student: {
            select: { id: true, name: true, email: true }
          },
          course: {
            select: { id: true, title: true }
          }
        }
      }),
      prisma.rating.count()
    ]);

    return res.status(200).json({
      message: 'All ratings fetched successfully',
      count: total,
      ratings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      }
    });

  } catch (error) {
    console.error('GetAllRatings error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// HELPER — CALCULATE AVERAGE RATING
// Used internally after every create/update/delete
// ─────────────────────────────────────────────────────────
const getAverageRating = async (courseId) => {
  const result = await prisma.rating.aggregate({
    where: { course_id: courseId },
    _avg: { stars: true },
    _count: { stars: true },
  });

  return {
    average: parseFloat((result._avg.stars || 0).toFixed(1)),
    total: result._count.stars,
  };
};

// ─────────────────────────────────────────────────────────
// HELPER — STAR DISTRIBUTION
// Returns count per star level
// { "1": 2, "2": 5, "3": 10, "4": 20, "5": 63 }
// ─────────────────────────────────────────────────────────
const getStarDistribution = async (courseId) => {
  const ratings = await prisma.rating.findMany({
    where: { course_id: courseId },
    select: { stars: true }
  });

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  ratings.forEach(r => {
    distribution[r.stars] = (distribution[r.stars] || 0) + 1;
  });

  return distribution;
};

module.exports = {
  submitRating,
  editRating,
  deleteRating,
  getCourseRatings,
  getMyRatings,
  getAllRatings,
};