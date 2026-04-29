const { prisma } = require('../config/db');

// ─────────────────────────────────────────────────────────
// GET ALL CATEGORIES
// GET /api/categories
// Public
// ─────────────────────────────────────────────────────────
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { courses: true } // how many courses per category
        }
      }
    });

    return res.status(200).json({
      message: 'Categories fetched successfully',
      categories,
    });

  } catch (error) {
    console.error('GetAllCategories error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// CREATE CATEGORY
// POST /api/categories
// Admin only
// ─────────────────────────────────────────────────────────
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    // ── 1. Validate ────────────────────────────────────
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // ── 2. Check duplicate ─────────────────────────────
    const existing = await prisma.category.findUnique({
      where: { name: name.trim() }
    });

    if (existing) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    // ── 3. Create ──────────────────────────────────────
    const category = await prisma.category.create({
      data: { name: name.trim() }
    });

    return res.status(201).json({
      message: 'Category created successfully',
      category,
    });

  } catch (error) {
    console.error('CreateCategory error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE CATEGORY
// DELETE /api/categories/:id
// Admin only
// ─────────────────────────────────────────────────────────
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // ── 1. Check exists ────────────────────────────────
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // ── 2. Delete ──────────────────────────────────────
    await prisma.category.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({ message: 'Category deleted successfully' });

  } catch (error) {
    console.error('DeleteCategory error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  deleteCategory,
};