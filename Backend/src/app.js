const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes         = require('./routes/authRoutes');
const courseRoutes        = require('./routes/courseRoutes');
const categoryRoutes     = require('./routes/categoryRoutes');
const videoRoutes        = require('./routes/videoRoutes');
const enrollmentRoutes   = require('./routes/enrollmentRoutes');
const paymentRoutes      = require('./routes/paymentRoutes');
const ratingRoutes       = require('./routes/ratingRoutes');
const adminRoutes        = require('./routes/adminRoutes');
const contactRoutes      = require('./routes/contactRoutes');
const messageRoutes      = require('./routes/messageRoutes');
const announcementRoutes = require('./routes/announcementRoutes');

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── STATIC FILES ─────────────────────────────────────────
app.use(
  '/uploads/thumbnails',
  express.static(path.join(__dirname, '../uploads/thumbnails'))
);

// ─── HEALTH CHECK ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'LMS API is running',
    status: 'healthy',
    version: '1.0.0',
  });
});

// ─── ROUTES ───────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/courses',       courseRoutes);
app.use('/api/categories',    categoryRoutes);
app.use('/api/courses/:id',   videoRoutes);
app.use('/api/enrollments',   enrollmentRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/ratings',       ratingRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/contact',       contactRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/announcements', announcementRoutes);

// ─── 404 HANDLER ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

module.exports = app;