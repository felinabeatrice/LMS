const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');

// ─────────────────────────────────────────────────────────
// REGISTER
// POST /api/auth/register
// ─────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ── 1. Validate input ──────────────────────────────
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'All fields required: name, email, password, role'
      });
    }

    // ── 2. Validate role ───────────────────────────────
    const allowedRoles = ['student', 'instructor'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: 'Role must be student or instructor'
      });
    }

    // ── 3. Check email exists ──────────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'Email already registered'
      });
    }

    // ── 4. Hash password ───────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 10);

    // ── 5. Create user ─────────────────────────────────
    // Students → approved immediately
    // Instructors → wait for admin
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        is_approved: role === 'student' ? true : false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_approved: true,
        created_at: true,
      }
    });

    // ── 6. Respond ─────────────────────────────────────
    return res.status(201).json({
      message: role === 'instructor'
        ? 'Registered. Waiting for admin approval.'
        : 'Registered successfully.',
      user: newUser
    });

  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

// ─────────────────────────────────────────────────────────
// LOGIN
// POST /api/auth/login
// ─────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── 1. Validate input ──────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    // ── 2. Find user ───────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // ── 3. Check password ──────────────────────────────
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // ── 4. Instructor approval check ───────────────────
    if (user.role === 'instructor' && !user.is_approved) {
      return res.status(403).json({
        message: 'Your account is pending admin approval'
      });
    }

    // ── 5. Generate JWT ────────────────────────────────
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ── 6. Respond ─────────────────────────────────────
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// ─────────────────────────────────────────────────────────
// GET MY PROFILE
// GET /api/auth/me
// Protected route
// ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_approved: true,
        created_at: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });

  } catch (error) {
    console.error('GetMe error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, getMe };