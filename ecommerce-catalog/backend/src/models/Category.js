const mongoose = require('mongoose');
const slugify = require('slugify');

/**
 * Category-based data modeling.
 * Categories support an optional parent reference so the catalog can express
 * a hierarchy (e.g. Electronics -> Laptops -> Gaming Laptops) without needing
 * a separate table per level.
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function generateSlug(next) {
  if (this.name && (this.isModified('name') || !this.slug)) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Compound index to quickly list active subcategories of a given parent
categorySchema.index({ parent: 1, isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);
