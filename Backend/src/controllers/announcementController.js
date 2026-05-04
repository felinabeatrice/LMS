const { prisma } = require('../config/db');

// Create announcement
const createAnnouncement = async (req, res) => {
  try {
    const created_by = req.user.id;
    const userRole = req.user.role;
    const { title, content, course_id } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: 'Title and content are required',
      });
    }

    // Instructor must specify a course they own
    if (userRole === 'instructor') {
      if (!course_id) {
        return res.status(400).json({
          message: 'Instructor must specify a course_id',
        });
      }
      const course = await prisma.course.findUnique({
        where: { id: parseInt(course_id) },
      });
      if (!course || course.instructor_id !== created_by) {
        return res.status(403).json({
          message: 'You can only create announcements for your own courses',
        });
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        created_by,
        course_id: course_id ? parseInt(course_id) : null,
      },
      include: {
        creator: { select: { id: true, name: true, role: true } },
        course: { select: { id: true, title: true } },
      },
    });

    return res.status(201).json({
      message: 'Announcement created successfully',
      announcement,
    });
  } catch (error) {
    console.error('CreateAnnouncement error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get platform-wide announcements (admin created, course_id = null)
const getPlatformAnnouncements = async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { course_id: null },
      orderBy: { created_at: 'desc' },
      include: {
        creator: { select: { id: true, name: true, role: true } },
      },
    });

    return res.status(200).json({
      message: 'Platform announcements fetched',
      announcements,
    });
  } catch (error) {
    console.error('GetPlatformAnnouncements error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get course-specific announcements
const getCourseAnnouncements = async (req, res) => {
  try {
    const { courseId } = req.params;

    const announcements = await prisma.announcement.findMany({
      where: { course_id: parseInt(courseId) },
      orderBy: { created_at: 'desc' },
      include: {
        creator: { select: { id: true, name: true, role: true } },
      },
    });

    return res.status(200).json({
      message: 'Course announcements fetched',
      announcements,
    });
  } catch (error) {
    console.error('GetCourseAnnouncements error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all announcements for a student (platform + enrolled courses)
const getStudentAnnouncements = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get enrolled course IDs
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: studentId },
      select: { course_id: true },
    });
    const courseIds = enrollments.map((e) => e.course_id);

    // Get platform + course announcements
    const [platform, courseAnnouncements] = await Promise.all([
      prisma.announcement.findMany({
        where: { course_id: null },
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          creator: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.announcement.findMany({
        where: { course_id: { in: courseIds } },
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          creator: { select: { id: true, name: true, role: true } },
          course: { select: { id: true, title: true } },
        },
      }),
    ]);

    return res.status(200).json({
      message: 'Announcements fetched',
      platform,
      course: courseAnnouncements,
    });
  } catch (error) {
    console.error('GetStudentAnnouncements error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete announcement
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const announcement = await prisma.announcement.findUnique({
      where: { id: parseInt(id) },
    });

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Admin can delete any, instructor only their own
    if (userRole === 'instructor' && announcement.created_by !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prisma.announcement.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('DeleteAnnouncement error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createAnnouncement,
  getPlatformAnnouncements,
  getCourseAnnouncements,
  getStudentAnnouncements,
  deleteAnnouncement,
};