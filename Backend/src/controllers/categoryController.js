const { prisma } = require('../config/db');

const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { courses: true } }
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

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Category name is required' });
    }
    const existing = await prisma.category.findUnique({
      where: { name: name.trim() }
    });
    if (existing) {
      return res.status(409).json({ message: 'Category already exists' });
    }
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

const updateCategory = async (req, res) => {
  try {
    const { id }   = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const existing = await prisma.category.findUnique({
      where: { name: name.trim() }
    });

    if (existing && existing.id !== parseInt(id)) {
      return res.status(409).json({
        message: 'A category with this name already exists'
      });
    }

    const updated = await prisma.category.update({
      where: { id: parseInt(id) },
      data:  { name: name.trim() },
    });

    return res.status(200).json({
      message:  'Category updated successfully',
      category: updated,
    });

  } catch (error) {
    console.error('UpdateCategory error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // ── Check exists ───────────────────────────────────
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: { select: { courses: true } }
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // ── Block if has courses ───────────────────────────
    if (category._count.courses > 0) {
      return res.status(400).json({
        message: `Cannot delete "${category.name}". It has ${category._count.courses} course(s). Delete all courses in this category first.`
      });
    }

    await prisma.category.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('DeleteCategory error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};