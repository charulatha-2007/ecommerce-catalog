const { validationResult, body, param, query } = require('express-validator');
const mongoose = require('mongoose');

/** Runs after a chain of express-validator checks; short-circuits with 422 on failure. */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

/* ---------------- Product validators ---------------- */

const productCreateRules = [
  body('name').isString().trim().isLength({ min: 2, max: 150 }).withMessage('name must be 2-150 characters'),
  body('sku').isString().trim().isLength({ min: 2, max: 40 }).withMessage('sku must be 2-40 characters'),
  body('category').custom(isObjectId).withMessage('category must be a valid id'),
  body('price').isFloat({ min: 0 }).withMessage('price must be a non-negative number'),
  body('discountPrice').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('discountPrice must be a non-negative number'),
  body('stock').isInt({ min: 0 }).withMessage('stock must be a non-negative integer'),
  body('description').optional().isString().isLength({ max: 3000 }),
  body('brand').optional().isString().isLength({ max: 80 }),
  body('tags').optional().isArray().withMessage('tags must be an array of strings'),
  body('images').optional().isArray().withMessage('images must be an array of URLs'),
  body('images.*').optional().isURL().withMessage('each image must be a valid URL'),
  handleValidation,
];

const productUpdateRules = [
  param('id').custom(isObjectId).withMessage('invalid product id'),
  body('name').optional().isString().trim().isLength({ min: 2, max: 150 }),
  body('category').optional().custom(isObjectId).withMessage('category must be a valid id'),
  body('price').optional().isFloat({ min: 0 }),
  body('discountPrice').optional({ nullable: true }).isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('images.*').optional().isURL(),
  handleValidation,
];

const productIdRule = [param('id').custom(isObjectId).withMessage('invalid product id'), handleValidation];

const productQueryRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice must be a non-negative number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice must be a non-negative number'),
  query('category').optional().custom(isObjectId).withMessage('category must be a valid id'),
  query('sort')
    .optional()
    .isIn(['priceAsc', 'priceDesc', 'newest', 'oldest', 'rating', 'relevance'])
    .withMessage('invalid sort value'),
  query('inStock').optional().isBoolean().withMessage('inStock must be true or false'),
  handleValidation,
];

/* ---------------- Category validators ---------------- */

const categoryCreateRules = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('name must be 2-80 characters'),
  body('description').optional().isString().isLength({ max: 500 }),
  body('parent').optional({ nullable: true }).custom((v) => v === null || isObjectId(v)).withMessage('parent must be a valid id'),
  handleValidation,
];

const categoryIdRule = [param('id').custom(isObjectId).withMessage('invalid category id'), handleValidation];

module.exports = {
  handleValidation,
  productCreateRules,
  productUpdateRules,
  productIdRule,
  productQueryRules,
  categoryCreateRules,
  categoryIdRule,
};
