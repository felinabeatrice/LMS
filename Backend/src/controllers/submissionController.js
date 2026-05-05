const { prisma } = require('../config/db');

// ─────────────────────────────────────────────────────────────────
// SUBMIT ASSIGNMENT (Student only, enrolled + paid)
// POST /api/assignments/:assignmentId/submit
// Form-data: file (required), comment (optional)
// ─────────────────────────────────────────────────────────────────
const submitAssignment = async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId);
    const studentId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    // Get assignment with course info
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check enrollment and access
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        student_id_course_id: {
          student_id: studentId,
          course_id: assignment.course_id,
        },
      },
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'You must be enrolled to submit' });
    }

    if (!assignment.course.is_free) {
      const payment = await prisma.payment.findFirst({
        where: {
          student_id: studentId,
          course_id: assignment.course_id,
          status: 'completed',
          access_granted: true,
        },
      });
      if (!payment) {
        return res.status(403).json({ message: 'Payment required for access' });
      }
    }

    // Check if already submitted (for resubmit)
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        assignment_id_student_id: {
          assignment_id: assignmentId,
          student_id: studentId,
        },
      },
    });

    const submissionData = {
      file_url: req.file.filename,
      comment: req.body.comment ? req.body.comment.trim() : null,
      assignment_id: assignmentId,
      student_id: studentId,
    };

    let submission;

    if (existingSubmission) {
      // Resubmit — update existing
      submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          ...submissionData,
          submitted_at: new Date(),
          marks: null,      // reset grade on resubmit
          feedback: null,
          graded_at: null,
        },
      });
    } else {
      // First submission
      submission = await prisma.submission.create({
        data: submissionData,
      });
    }

    return res.status(201).json({
      message: existingSubmission ? 'Assignment resubmitted successfully' : 'Assignment submitted successfully',
      submission,
    });

  } catch (error) {
    console.error('SubmitAssignment error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────
// GRADE SUBMISSION (Instructor only)
// PATCH /api/assignments/:id/grade
// Body: marks, feedback
// ─────────────────────────────────────────────────────────────────
const gradeSubmission = async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);
    const instructorId = req.user.id;
    const { marks, feedback } = req.body;

    if (marks === undefined || marks === null) {
      return res.status(400).json({ message: 'Marks are required' });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { include: { course: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify instructor owns the course
    if (submission.assignment.course.instructor_id !== instructorId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate marks range
    const marksInt = parseInt(marks);
    if (marksInt < 0 || marksInt > submission.assignment.max_marks) {
      return res.status(400).json({
        message: `Marks must be between 0 and ${submission.assignment.max_marks}`,
      });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        marks: marksInt,
        feedback: feedback ? feedback.trim() : null,
        graded_at: new Date(),
      },
    });

    return res.status(200).json({
      message: 'Submission graded successfully',
      submission: updatedSubmission,
    });

  } catch (error) {
    console.error('GradeSubmission error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET MY SUBMISSIONS (Student - all my submissions across courses)
// GET /api/assignments/my-submissions
// ─────────────────────────────────────────────────────────────────
const getMySubmissions = async (req, res) => {
  try {
    const studentId = req.user.id;

    const submissions = await prisma.submission.findMany({
      where: { student_id: studentId },
      orderBy: { submitted_at: 'desc' },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            due_date: true,
            max_marks: true,
            course: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    return res.status(200).json({
      message: 'Submissions fetched',
      submissions,
    });

  } catch (error) {
    console.error('GetMySubmissions error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitAssignment,
  gradeSubmission,
  getMySubmissions,
};