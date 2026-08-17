const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiFeatures = require('../utils/apiFeatures');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Modular service layer: all data-access and business rules for products
 * live here, independent of HTTP concerns, so they're reusable (e.g. from
 * a future GraphQL layer or background job) and easy to unit test.
 */

async function listProducts(query) {
  const { filter, sort, page, limit, skip } = new ApiFeatures(query).build();

  const projection = filter.$text ? { score: { $meta: 'textScore' } } : {};

  const [items, total] = await Promise.all([
    Product.find(filter, projection)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}

async function getProductById(id) {
  const product = await Product.findById(id).populate('category', 'name slug');
  if (!product || !product.isActive) {
    throw new ApiError(404, 'Product not found');
  }
  return product;
}

async function createProduct(payload) {
  const category = await Category.findById(payload.category);
  if (!category) throw new ApiError(400, 'Referenced category does not exist');

  const product = await Product.create(payload);
  return product;
}

async function updateProduct(id, payload) {
  if (payload.category) {
    const category = await Category.findById(payload.category);
    if (!category) throw new ApiError(400, 'Referenced category does not exist');
  }

  const product = await Product.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
    context: 'query',
  });

  if (!product) throw new ApiError(404, 'Product not found');
  return product;
}

async function deleteProduct(id) {
  // Soft delete keeps historical order/analytics data intact
  const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
}

async function listFacets(category) {
  // Powers filter-sidebar UI: distinct brands and price bounds for the current category
  const match = { isActive: true, ...(category ? { category } : {}) };

  const [brands, priceBounds] = await Promise.all([
    Product.distinct('brand', match),
    Product.aggregate([
      { $match: match },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
    ]),
  ]);

  return {
    brands: brands.filter(Boolean).sort(),
    priceRange: priceBounds[0] ? { min: priceBounds[0].min, max: priceBounds[0].max } : { min: 0, max: 0 },
  };
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  listFacets,
};
