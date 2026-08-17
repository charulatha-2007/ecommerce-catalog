/**
 * Translates a validated Express query object into a MongoDB filter,
 * sort spec, and pagination metadata. Kept separate from the service/
 * controller layer so the query-building logic is unit-testable and
 * reusable across resources.
 */
class ApiFeatures {
  constructor(query) {
    this.query = query;
    this.filter = {};
    this.sort = { createdAt: -1 };
    this.page = 1;
    this.limit = 20;
  }

  /** Free-text search across the weighted text index (name, brand, tags, description). */
  applySearch() {
    if (this.query.search && this.query.search.trim()) {
      this.filter.$text = { $search: this.query.search.trim() };
    }
    return this;
  }

  /** Structured filters: category, brand, price range, stock, active state, tags. */
  applyFilters() {
    const { category, brand, minPrice, maxPrice, inStock, tags, isActive } = this.query;

    if (category) this.filter.category = category;
    if (brand) this.filter.brand = { $regex: `^${escapeRegex(brand)}$`, $options: 'i' };

    if (minPrice || maxPrice) {
      this.filter.price = {};
      if (minPrice) this.filter.price.$gte = Number(minPrice);
      if (maxPrice) this.filter.price.$lte = Number(maxPrice);
    }

    if (inStock === 'true') this.filter.stock = { $gt: 0 };
    if (inStock === 'false') this.filter.stock = { $lte: 0 };

    if (tags) {
      const tagList = Array.isArray(tags) ? tags : String(tags).split(',');
      this.filter.tags = { $in: tagList.map((t) => t.trim().toLowerCase()) };
    }

    // Public listing endpoints default to active-only unless explicitly overridden by an admin caller
    if (isActive !== undefined) {
      this.filter.isActive = isActive === 'true';
    } else {
      this.filter.isActive = true;
    }

    return this;
  }

  /** Whitelisted sort options exposed to the API to avoid arbitrary sort-field injection. */
  applySort() {
    const sortMap = {
      priceAsc: { price: 1 },
      priceDesc: { price: -1 },
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      rating: { ratingAverage: -1 },
      relevance: { score: { $meta: 'textScore' } },
    };

    if (this.query.sort && sortMap[this.query.sort]) {
      this.sort = sortMap[this.query.sort];
    } else if (this.filter.$text) {
      // If free-text searching without an explicit sort, rank by relevance first
      this.sort = { score: { $meta: 'textScore' } };
    }

    return this;
  }

  /** Backend pagination: bounds page/limit and computes skip for an efficient window query. */
  applyPagination() {
    this.page = Math.max(1, parseInt(this.query.page, 10) || 1);
    this.limit = Math.min(100, Math.max(1, parseInt(this.query.limit, 10) || 20));
    this.skip = (this.page - 1) * this.limit;
    return this;
  }

  build() {
    this.applySearch().applyFilters().applySort().applyPagination();
    return {
      filter: this.filter,
      sort: this.sort,
      page: this.page,
      limit: this.limit,
      skip: this.skip,
    };
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = ApiFeatures;
