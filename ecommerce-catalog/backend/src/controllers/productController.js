const productService = require('../services/productService');

// Wraps async route handlers so thrown/rejected errors reach errorHandler
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getProducts = asyncHandler(async (req, res) => {
  const { items, pagination } = await productService.listProducts(req.query);
  res.status(200).json({ success: true, data: items, pagination });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.status(200).json({ success: true, data: product });
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json({ success: true, data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.status(200).json({ success: true, data: product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.status(200).json({ success: true, message: 'Product deactivated' });
});

const getFacets = asyncHandler(async (req, res) => {
  const facets = await productService.listFacets(req.query.category);
  res.status(200).json({ success: true, data: facets });
});

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getFacets };
