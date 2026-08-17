const Category = require('../models/Category');
const Product = require('../models/Product');
const { ApiError } = require('../middleware/errorHandler');

async function listCategories({ parent } = {}) {
  const filter = { isActive: true };
  if (parent === 'root') filter.parent = null;
  else if (parent) filter.parent = parent;

  return Category.find(filter).sort({ name: 1 }).lean();
}

async function getCategoryById(id) {
  const category = await Category.findById(id);
  if (!category || !category.isActive) throw new ApiError(404, 'Category not found');
  return category;
}

async function createCategory(payload) {
  if (payload.parent) {
    const parent = await Category.findById(payload.parent);
    if (!parent) throw new ApiError(400, 'Referenced parent category does not exist');
  }
  return Category.create(payload);
}

async function updateCategory(id, payload) {
  const category = await Category.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new ApiError(404, 'Category not found');
  return category;
}

async function deleteCategory(id) {
  const inUse = await Product.exists({ category: id, isActive: true });
  if (inUse) throw new ApiError(409, 'Cannot delete a category that still has active products');

  const category = await Category.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!category) throw new ApiError(404, 'Category not found');
  return category;
}

module.exports = { listCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
