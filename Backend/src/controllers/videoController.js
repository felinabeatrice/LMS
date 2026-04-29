const fs = require('fs');
const path = require('path');
const { prisma } = require('../config/db');

// ─────────────────────────────────────────────────────────
// UPLOAD VIDEO
// POST /api/courses/:id/upload-video
// Instructor only — own course only
// Form-data: video (file)
// ─────────────────────────────────────────────────────────
const uploadVideo = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const instructorId = req.user.id;

    // ── 1. Check file was uploaded ─────────────────────
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    // ── 2. Find course ─────────────────────────────────
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      // Delete uploaded file if course not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Course not found' });
    }

    // ── 3. Ownership check ─────────────────────────────
    if (course.instructor_id !== instructorId) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        message: 'Access denied. This is not your course.'
      });
    }

    // ── 4. Delete old video if exists ──────────────────
    if (course.video_url) {
      const oldVideoPath = path.join('uploads/videos', course.video_url);
      if (fs.existsSync(oldVideoPath)) {
        fs.unlinkSync(oldVideoPath);
        console.log('🗑️ Old video deleted:', course.video_url);
      }
    }

    // ── 5. Save new video path to DB ───────────────────
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        video_url: req.file.filename, // store only filename
      },
      select: {
        id: true,
        title: true,
        video_url: true,
        status: true,
      }
    });

    return res.status(200).json({
      message: 'Video uploaded successfully',
      course: updatedCourse,
      video: {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      }
    });

  } catch (error) {
    // Clean up file if error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('UploadVideo error:', error.message);
    return res.status(500).json({ message: 'Server error during upload' });
  }
};

// ─────────────────────────────────────────────────────────
// UPLOAD THUMBNAIL
// POST /api/courses/:id/upload-thumbnail
// Instructor only — own course only
// Form-data: thumbnail (file)
// ─────────────────────────────────────────────────────────
const uploadThumbnail = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const instructorId = req.user.id;

    // ── 1. Check file uploaded ─────────────────────────
    if (!req.file) {
      return res.status(400).json({ message: 'No thumbnail file uploaded' });
    }

    // ── 2. Find course ─────────────────────────────────
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Course not found' });
    }

    // ── 3. Ownership check ─────────────────────────────
    if (course.instructor_id !== instructorId) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        message: 'Access denied. This is not your course.'
      });
    }

    // ── 4. Delete old thumbnail if exists ──────────────
    if (course.thumbnail_url) {
      const oldThumbPath = path.join('uploads/thumbnails', course.thumbnail_url);
      if (fs.existsSync(oldThumbPath)) {
        fs.unlinkSync(oldThumbPath);
        console.log('🗑️ Old thumbnail deleted:', course.thumbnail_url);
      }
    }

    // ── 5. Save thumbnail to DB ────────────────────────
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        thumbnail_url: req.file.filename,
      },
      select: {
        id: true,
        title: true,
        thumbnail_url: true,
      }
    });

    return res.status(200).json({
      message: 'Thumbnail uploaded successfully',
      course: updatedCourse,
      thumbnail: {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      }
    });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('UploadThumbnail error:', error.message);
    return res.status(500).json({ message: 'Server error during upload' });
  }
};

// ─────────────────────────────────────────────────────────
// STREAM VIDEO
// GET /api/courses/:id/video
// Must be enrolled OR instructor OR admin
// ─────────────────────────────────────────────────────────
const streamVideo = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    // ── 1. Find course ─────────────────────────────────
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course || !course.video_url) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // ── 2. Access control ──────────────────────────────
    // Admin → always allowed
    // Instructor → only their own course
    // Student → must be enrolled

    if (userRole === 'instructor' && course.instructor_id !== userId) {
      return res.status(403).json({
        message: 'Access denied.'
      });
    }

    if (userRole === 'student') {
      // Check enrollment
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          student_id_course_id: {
            student_id: userId,
            course_id: courseId,
          }
        }
      });

      if (!enrollment) {
        return res.status(403).json({
          message: 'You must enroll in this course to watch the video.'
        });
      }

      // For paid courses → check payment
      if (!course.is_free) {
        const payment = await prisma.payment.findFirst({
          where: {
            student_id: userId,
            course_id: courseId,
            status: 'completed',
            access_granted: true,
          }
        });

        if (!payment) {
          return res.status(403).json({
            message: 'Please complete payment to access this video.'
          });
        }
      }
    }

    // ── 3. Build video file path ───────────────────────
    const videoPath = path.join(
      __dirname,
      '../../uploads/videos',
      course.video_url
    );

    // ── 4. Check file exists ───────────────────────────
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: 'Video file not found on server' });
    }

    // ── 5. Get file size ───────────────────────────────
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // ── 6. Stream with range support ──────────────────
    // Range = allows video seeking (jump to minute 5 etc)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileStream = fs.createReadStream(videoPath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });

      fileStream.pipe(res);

    } else {
      // No range → send whole file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });

      fs.createReadStream(videoPath).pipe(res);
    }

  } catch (error) {
    console.error('StreamVideo error:', error.message);
    return res.status(500).json({ message: 'Server error during streaming' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE VIDEO
// DELETE /api/courses/:id/video
// Instructor (own) or Admin
// ─────────────────────────────────────────────────────────
const deleteVideo = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    // ── 1. Find course ─────────────────────────────────
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // ── 2. Permission check ────────────────────────────
    if (userRole === 'instructor' && course.instructor_id !== userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // ── 3. Check video exists ──────────────────────────
    if (!course.video_url) {
      return res.status(404).json({ message: 'No video found for this course' });
    }

    // ── 4. Delete file from disk ───────────────────────
    const videoPath = path.join('uploads/videos', course.video_url);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    // ── 5. Clear from DB ───────────────────────────────
    await prisma.course.update({
      where: { id: courseId },
      data: { video_url: null }
    });

    return res.status(200).json({ message: 'Video deleted successfully' });

  } catch (error) {
    console.error('DeleteVideo error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  uploadVideo,
  uploadThumbnail,
  streamVideo,
  deleteVideo,
};