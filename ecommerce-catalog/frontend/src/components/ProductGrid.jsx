import ProductCard from './ProductCard';

export default function ProductGrid({ products, loading, error }) {
  if (loading) {
    return (
      <div className="product-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ aspectRatio: '3 / 4' }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-message">
        <strong>Something went wrong</strong>
        {error}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="state-message">
        <strong>No products match these filters</strong>
        Try widening your price range or clearing a filter.
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  );
}
