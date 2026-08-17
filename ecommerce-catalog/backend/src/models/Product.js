const mongoose = require('mongoose');
const slugify = require('slugify');

/**
 * Product schema.
 *
 * Indexing strategy (see bottom of file):
 *  - A text index on name/description/brand/tags powers free-text search ($text).
 *  - A compound index on (category, price) supports the very common
 *    "browse a category, sort/filter by price" query without a collection scan.
 *  - Single-field indexes on brand, isActive, createdAt support common filters/sorts.
 *  - A unique index on sku enforces catalog integrity and gives O(log n) lookups.
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    slug: {
      type: String,
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: '',
    },
    brand: {
      type: String,
      trim: true,
      maxlength: 80,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
      validate: {
        validator: function (value) {
          return value == null || value <= this.price;
        },
        message: 'Discount price cannot exceed the base price',
      },
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
      set: (tags) => tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
    },
    attributes: {
      // Flexible key/value bag for category-specific specs, e.g. { color: 'red', size: 'M' }
      type: Map,
      of: String,
      default: {},
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.every((url) => /^https?:\/\/.+/i.test(url)),
        message: 'Each image must be a valid URL',
      },
    },
    ratingAverage: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
      set: (v) => Math.round(v * 10) / 10,
    },
    ratingCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

productSchema.pre('validate', function generateSlug(next) {
  if (this.name && (this.isModified('name') || !this.slug)) {
    this.slug = `${slugify(this.name, { lower: true, strict: true })}-${this.sku ? this.sku.toLowerCase() : Date.now()}`;
  }
  next();
});

// Virtual: effective selling price (discount price if present, else base price)
productSchema.virtual('finalPrice').get(function () {
  return this.discountPrice != null ? this.discountPrice : this.price;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

/* ---------------------- Indexes ---------------------- */

// Full-text search across the fields shoppers actually search by, weighted
// so a match in the name matters more than one in the description.
productSchema.index(
  { name: 'text', description: 'text', brand: 'text', tags: 'text' },
  { weights: { name: 10, brand: 5, tags: 4, description: 1 }, name: 'ProductTextIndex' }
);

// Category browsing + price sort/filter (covers the most common storefront query)
productSchema.index({ category: 1, price: 1 });

// Category browsing + newest first (common default sort)
productSchema.index({ category: 1, createdAt: -1 });

// Straight price range filtering/sorting
productSchema.index({ price: 1 });

// Active + stock, used for "in stock only" storefront filters
productSchema.index({ isActive: 1, stock: 1 });

module.exports = mongoose.model('Product', productSchema);
