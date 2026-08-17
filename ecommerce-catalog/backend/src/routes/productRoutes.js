const express = require('express');
const productController = require('../controllers/productController');
const {
  productCreateRules,
  productUpdateRules,
  productIdRule,
  productQueryRules,
} = require('../middleware/validate');

const router = express.Router();

// GET /api/v1/products?search=&category=&brand=&minPrice=&maxPrice=&sort=&page=&limit=
router.get('/', productQueryRules, productController.getProducts);

// GET /api/v1/products/facets?category=  -> distinct brands + price bounds for filter UI
router.get('/facets', productController.getFacets);

router.get('/:id', productIdRule, productController.getProductById);

router.post('/', productCreateRules, productController.createProduct);

router.patch('/:id', productUpdateRules, productController.updateProduct);

router.delete('/:id', productIdRule, productController.deleteProduct);

module.exports = router;
