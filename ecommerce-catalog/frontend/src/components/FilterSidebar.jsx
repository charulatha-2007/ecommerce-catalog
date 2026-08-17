export default function FilterSidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  brands,
  selectedBrand,
  onSelectBrand,
  priceRange,
  onPriceRangeChange,
  onClearAll,
}) {
  return (
    <aside className="sidebar">
      <div className="filter-block">
        <p className="filter-eyebrow">Category</p>
        <ul className="category-list">
          <li className={`category-item ${!selectedCategory ? 'active' : ''}`}>
            <button onClick={() => onSelectCategory(null)}>All products</button>
          </li>
          {categories.map((c) => (
            <li key={c._id} className={`category-item ${selectedCategory === c._id ? 'active' : ''}`}>
              <button onClick={() => onSelectCategory(c._id)}>{c.name}</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="filter-block">
        <p className="filter-eyebrow">Price range</p>
        <div className="price-row">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => onPriceRangeChange({ ...priceRange, min: e.target.value })}
          />
          <span>&ndash;</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => onPriceRangeChange({ ...priceRange, max: e.target.value })}
          />
        </div>
      </div>

      {brands.length > 0 && (
        <div className="filter-block">
          <p className="filter-eyebrow">Brand</p>
          <div className="brand-chips">
            {brands.map((b) => (
              <button
                key={b}
                className={`chip ${selectedBrand === b ? 'active' : ''}`}
                onClick={() => onSelectBrand(selectedBrand === b ? null : b)}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      <button className="clear-btn" onClick={onClearAll}>
        Clear all filters
      </button>
    </aside>
  );
}
