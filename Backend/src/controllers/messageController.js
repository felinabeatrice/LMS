const { prisma } = require('../config/db');

// Send message (student → instructor)
const sendMessage = async (req, res) => {
  try {
    const sender_id = req.user.id;
    const { receiver_id, course_id, content } = req.body;

    if (!receiver_id || !course_id || !content) {
      return res.status(400).json({
        message: 'receiver_id, course_id and content are required',
      });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: parseInt(course_id) },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Verify student is enrolled in this course
    if (req.user.role === 'student') {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          student_id_course_id: {
            student_id: sender_id,
            course_id: parseInt(course_id),
          },
        },
      });
      if (!enrollment) {
        return res.status(403).json({
          message: 'You must be enrolled in this course to message the instructor',
        });
      }
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        sender_id,
        receiver_id: parseInt(receiver_id),
        course_id: parseInt(course_id),
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
        course: { select: { id: true, title: true } },
      },
    });

    return res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    console.error('SendMessage error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get messages for a course (instructor sees all, student sees own)
const getCourseMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { courseId } = req.params;

    const where = { course_id: parseInt(courseId) };

    // Student only sees their own messages
    if (userRole === 'student') {
      where.OR = [
        { sender_id: userId },
        { receiver_id: userId },
      ];
    }

    // Instructor only sees messages for their own course
    if (userRole === 'instructor') {
      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) },
      });
      if (!course || course.instructor_id !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { created_at: 'asc' },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        course_id: parseInt(courseId),
        receiver_id: userId,
        is_read: false,
      },
      data: { is_read: true },
    });

    return res.status(200).json({
      message: 'Messages fetched successfully',
      messages,
    });
  } catch (error) {
    console.error('GetCourseMessages error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get unread message count per course (for instructor)
const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const counts = await prisma.message.groupBy({
      by: ['course_id'],
      where: {
        receiver_id: userId,
        is_read: false,
      },
      _count: { id: true },
    });

    return res.status(200).json({
      message: 'Unread counts fetched',
      counts: counts.map((c) => ({
        course_id: c.course_id,
        unread: c._count.id,
      })),
    });
  } catch (error) {
    console.error('GetUnreadCounts error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all conversations for current user
const getMyMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { sender_id: userId },
          { receiver_id: userId },
        ],
      },
      orderBy: { created_at: 'desc' },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
        course: { select: { id: true, title: true } },
      },
    });

    // Group by course
    const grouped = {};
    messages.forEach((msg) => {
      if (!grouped[msg.course_id]) {
        grouped[msg.course_id] = {
          course: msg.course,
          messages: [],
          unread: 0,
        };
      }
      grouped[msg.course_id].messages.push(msg);
      if (msg.receiver_id === userId && !msg.is_read) {
        grouped[msg.course_id].unread++;
      }
    });

    return res.status(200).json({
      message: 'Messages fetched successfully',
      conversations: Object.values(grouped),
    });
  } catch (error) {
    console.error('GetMyMessages error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendMessage,
  getCourseMessages,
  getUnreadCounts,
  getMyMessages,
};