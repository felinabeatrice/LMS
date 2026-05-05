const { prisma } = require('../config/db');

// ─────────────────────────────────────────────────────────────────
// CREATE ASSIGNMENT (Instructor only, own course)
// POST /api/courses/:id/assignments
// ─────────────────────────────────────────────────────────────────
const createAssignment = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const instructorId = req.user.id;
    const { title, description, due_date, max_marks } = req.body;

    // Validation
    if (!title || !description || !due_date) {
      return res.status(400).json({ message: 'Title, description, and due date are required' });
    }

    // Check course exists and belongs to instructor
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor_id !== instructorId) {
      return res.status(403).json({ message: 'Access denied. Not your course.' });
    }

    // Create assignment
    const assignmentData = {
      title: title.trim(),
      description: description.trim(),
      due_date: new Date(due_date),
      max_marks: max_marks ? parseInt(max_marks) : 100,
      course_id: courseId,
    };

    // Add file if uploaded
    if (req.file) {
      assignmentData.file_url = req.file.filename;
    }

    const assignment = await prisma.assignment.create({
      data: assignmentData,
    });

    return res.status(201).json({
      message: 'Assignment created successfully',
      assignment,
    });

  } catch (error) {
    console.error('CreateAssignment error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET COURSE ASSIGNMENTS (Instructor sees all, Student sees if enrolled)
// GET /api/courses/:id/assignments
// ─────────────────────────────────────────────────────────────────
const getCourseAssignments = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Authorization
    let canView = false;

    if (userRole === 'admin') {
      canView = true;
    } else if (userRole === 'instructor') {
      canView = course.instructor_id === userId;
    } else if (userRole === 'student') {
      // Check enrollment with access
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          student_id_course_id: {
            student_id: userId,
            course_id: courseId,
          },
        },
      });
      if (enrollment) {
        // For paid courses, check payment
        if (!course.is_free) {
          const payment = await prisma.payment.findFirst({
            where: {
              student_id: userId,
              course_id: courseId,
              status: 'completed',
              access_granted: true,
            },
          });
          canView = !!payment;
        } else {
          canView = true;
        }
      }
    }

    if (!canView) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignments = await prisma.assignment.findMany({
      where: { course_id: courseId },
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });

    // For instructor, include submission details
    if (userRole === 'instructor' || userRole === 'admin') {
      const assignmentsWithSubmissions = await Promise.all(
        assignments.map(async (a) => {
          const submissions = await prisma.submission.findMany({
            where: { assignment_id: a.id },
            include: {
              student: { select: { id: true, name: true, email: true } },
            },
            orderBy: { submitted_at: 'desc' },
          });
          return { ...a, submissions };
        })
      );
      return res.status(200).json({
        message: 'Assignments fetched',
        assignments: assignmentsWithSubmissions,
      });
    }

    // For students, show their own submission status
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (a) => {
        const mySubmission = await prisma.submission.findUnique({
          where: {
            assignment_id_student_id: {
              assignment_id: a.id,
              student_id: userId,
            },
          },
        });
        
        const now = new Date();
        const dueDate = new Date(a.due_date);
        const isLate = mySubmission ? new Date(mySubmission.submitted_at) > dueDate : false;
        
        return {
          ...a,
          mySubmission: mySubmission || null,
          isLate,
          status: mySubmission ? (mySubmission.marks !== null ? 'graded' : 'submitted') : 'pending',
        };
      })
    );

    return res.status(200).json({
      message: 'Assignments fetched',
      assignments: assignmentsWithStatus,
    });

  } catch (error) {
    console.error('GetCourseAssignments error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────
// DELETE ASSIGNMENT (Instructor only, own course)
// DELETE /api/assignments/:id
// ─────────────────────────────────────────────────────────────────
const deleteAssignment = async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Authorization
    if (userRole === 'instructor' && assignment.course.instructor_id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    return res.status(200).json({ message: 'Assignment deleted successfully' });

  } catch (error) {
    console.error('DeleteAssignment error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createAssignment,
  getCourseAssignments,
  deleteAssignment,
};