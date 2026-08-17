import { useEffect, useState, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import FilterSidebar from '../components/FilterSidebar';
import ProductGrid from '../components/ProductGrid';
import Pagination from '../components/Pagination';
import { fetchProducts, fetchFacets } from '../api/products';
import { fetchCategories } from '../api/categories';

const DEFAULT_STATE = {
  search: '',
  category: null,
  brand: null,
  priceRange: { min: '', max: '' },
  sort: 'newest',
  page: 1,
};

export default function Catalog() {
  const [filters, setFilters] = useState(DEFAULT_STATE);
  const [categories, setCategories] = useState([]);
  const [facets, setFacets] = useState({ brands: [] });
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Categories load once
  useEffect(() => {
    fetchCategories({ parent: 'root' })
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  // Facets (brands / price bounds) reload whenever the active category changes
  useEffect(() => {
    fetchFacets(filters.category)
      .then((res) => setFacets(res.data))
      .catch(() => setFacets({ brands: [] }));
  }, [filters.category]);

  // Products reload whenever any filter/sort/page changes
  const loadProducts = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = {
      page: filters.page,
      limit: 12,
      sort: filters.sort,
    };
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.brand) params.brand = filters.brand;
    if (filters.priceRange.min) params.minPrice = filters.priceRange.min;
    if (filters.priceRange.max) params.maxPrice = filters.priceRange.max;

    fetchProducts(params)
      .then((res) => {
        setProducts(res.data);
        setPagination(res.pagination);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const update = (patch) => setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="wordmark">
          Ledger<span>.</span>
        </span>
        <span className="tagline">Catalog / Manifest</span>
        <SearchBar initialValue={filters.search} onSearch={(search) => update({ search })} />
      </header>

      <div className="layout">
        <FilterSidebar
          categories={categories}
          selectedCategory={filters.category}
          onSelectCategory={(category) => update({ category })}
          brands={facets.brands || []}
          selectedBrand={filters.brand}
          onSelectBrand={(brand) => update({ brand })}
          priceRange={filters.priceRange}
          onPriceRangeChange={(priceRange) => update({ priceRange })}
          onClearAll={() => setFilters(DEFAULT_STATE)}
        />

        <main className="main">
          <div className="result-bar">
            <span className="result-count">
              {loading ? (
                'Searching…'
              ) : (
                <>
                  <strong>{pagination?.total ?? 0}</strong> item{pagination?.total === 1 ? '' : 's'}
                  {filters.search && <> for &ldquo;{filters.search}&rdquo;</>}
                </>
              )}
            </span>
            <select
              className="sort-select"
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value })}
            >
              <option value="newest">Newest first</option>
              <option value="priceAsc">Price: low to high</option>
              <option value="priceDesc">Price: high to low</option>
              <option value="rating">Top rated</option>
              {filters.search && <option value="relevance">Best match</option>}
            </select>
          </div>

          <ProductGrid products={products} loading={loading} error={error} />

          <Pagination pagination={pagination} onPageChange={(page) => update({ page })} />
        </main>
      </div>
    </div>
  );
}
