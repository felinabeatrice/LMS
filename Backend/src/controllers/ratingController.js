const { prisma } = require('../config/db');

// ─────────────────────────────────────────────────────────────────
// HELPER — Validate stars (0.5 to 5.0 in steps of 0.5)
// ─────────────────────────────────────────────────────────────────
const isValidStars = (stars) => {
  const num = parseFloat(stars);
  if (isNaN(num)) return false;
  if (num < 0.5 || num > 5) return false;
  // Check if multiple of 0.5 (i.e., 0.5, 1.0, 1.5, 2.0, ...)
  return (num * 10) % 5 === 0;
};

// ─────────────────────────────────────────────────────────────────
// SUBMIT RATING
// POST /api/ratings
// ─────────────────────────────────────────────────────────────────
const submitRating = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { course_id, stars, review } = req.body;

    if (!course_id || stars === undefined || stars === null) {
      return res.status(400).json({
        message: 'course_id and stars are required'
      });
    }

    if (!isValidStars(stars)) {
      return res.status(400).json({
        message: 'Stars must be between 0.5 and 5.0 in steps of 0.5'
      });
    }

    const starsNum = parseFloat(stars);

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

    const rating = await prisma.rating.create({
      data: {
        student_id,
        course_id: parseInt(course_id),
        stars: starsNum,
        review: review ? review.trim() : null,
      },
      include: {
        student: { select: { id: true, name: true } },
        course: { select: { id: true, title: true } }
      }
    });

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

// ─────────────────────────────────────────────────────────────────
// EDIT RATING
// PATCH /api/ratings/:id
// ─────────────────────────────────────────────────────────────────
const editRating = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { id } = req.params;
    const { stars, review } = req.body;

    const rating = await prisma.rating.findUnique({
      where: { id: parseInt(id) }
    });

    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    if (rating.student_id !== student_id) {
      return res.status(403).json({
        message: 'Access denied. This is not your rating.'
      });
    }

    const updateData = {};

    if (stars !== undefined && stars !== null) {
      if (!isValidStars(stars)) {
        return res.status(400).json({
          message: 'Stars must be between 0.5 and 5.0 in steps of 0.5'
        });
      }
      updateData.stars = parseFloat(stars);
    }

    if (review !== undefined) {
      updateData.review = review ? review.trim() : null;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: 'Provide stars or review to update'
      });
    }

    const updatedRating = await prisma.rating.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        student: { select: { id: true, name: true } },
        course: { select: { id: true, title: true } }
      }
    });

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

// ─────────────────────────────────────────────────────────────────
// DELETE RATING
// DELETE /api/ratings/:id
// ─────────────────────────────────────────────────────────────────
const deleteRating = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { id } = req.params;

    const rating = await prisma.rating.findUnique({
      where: { id: parseInt(id) }
    });

    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    if (role === 'student' && rating.student_id !== userId) {
      return res.status(403).json({
        message: 'Access denied. This is not your rating.'
      });
    }

    const courseId = rating.course_id;

    await prisma.rating.delete({
      where: { id: parseInt(id) }
    });

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

// ─────────────────────────────────────────────────────────────────
// GET COURSE RATINGS
// GET /api/ratings/course/:courseId
// ─────────────────────────────────────────────────────────────────
const getCourseRatings = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      select: { id: true, title: true, status: true }
    });

    if (!course || course.status !== 'approved') {
      return res.status(404).json({ message: 'Course not found' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where: { course_id: parseInt(courseId) },
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
        include: {
          student: { select: { id: true, name: true } }
        }
      }),
      prisma.rating.count({
        where: { course_id: parseInt(courseId) }
      })
    ]);

    const average = await getAverageRating(parseInt(courseId));
    const distribution = await getStarDistribution(parseInt(courseId));

    return res.status(200).json({
      message: 'Ratings fetched successfully',
      course: { id: course.id, title: course.title },
      stats: {
        average_rating: average,
        total_ratings: total,
        distribution,
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

// ─────────────────────────────────────────────────────────────────
// GET MY RATINGS
// GET /api/ratings/my-ratings
// ─────────────────────────────────────────────────────────────────
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
            instructor: { select: { id: true, name: true } }
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

// ─────────────────────────────────────────────────────────────────
// GET ALL RATINGS (Admin)
// GET /api/ratings
// ─────────────────────────────────────────────────────────────────
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
          student: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true } }
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

// ─────────────────────────────────────────────────────────────────
// HELPER — CALCULATE AVERAGE RATING
// ─────────────────────────────────────────────────────────────────
const getAverageRating = async (courseId) => {
  const result = await prisma.rating.aggregate({
    where: { course_id: courseId },
    _avg: { stars: true },
    _count: { stars: true },
  });

  // Prisma returns Decimal as string, convert to number
  const avgNum = result._avg.stars ? parseFloat(result._avg.stars) : 0;

  return {
    average: parseFloat(avgNum.toFixed(1)),
    total: result._count.stars,
  };
};

// ─────────────────────────────────────────────────────────────────
// HELPER — STAR DISTRIBUTION
// Now groups by star level (rounded to whole star)
// ─────────────────────────────────────────────────────────────────
const getStarDistribution = async (courseId) => {
  const ratings = await prisma.rating.findMany({
    where: { course_id: courseId },
    select: { stars: true }
  });

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  ratings.forEach(r => {
    // Round to nearest whole star for distribution display
    const rounded = Math.round(parseFloat(r.stars));
    if (rounded >= 1 && rounded <= 5) {
      distribution[rounded] = (distribution[rounded] || 0) + 1;
    }
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