const express = require('express');
const categoryController = require('../controllers/categoryController');
const { categoryCreateRules, categoryIdRule } = require('../middleware/validate');

const router = express.Router();

// GET /api/v1/categories?parent=root  (top-level only) or ?parent=<id> (children of a category)
router.get('/', categoryController.getCategories);

router.get('/:id', categoryIdRule, categoryController.getCategoryById);

router.post('/', categoryCreateRules, categoryController.createCategory);

router.patch('/:id', categoryIdRule, categoryController.updateCategory);

router.delete('/:id', categoryIdRule, categoryController.deleteCategory);

module.exports = router;
