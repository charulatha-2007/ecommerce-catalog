export default function ProductCard({ product }) {
  const { name, brand, sku, price, discountPrice, images, stock } = product;
  const finalPrice = discountPrice != null ? discountPrice : price;
  const hasDiscount = discountPrice != null && discountPrice < price;
  const image = images && images[0];

  return (
    <article className="product-card">
      <div className="card-media">
        <span className="sku-tag">{sku}</span>
        {hasDiscount && <span className="discount-badge">SALE</span>}
        {image ? (
          <img src={image} alt={name} loading="lazy" />
        ) : (
          <div className="skeleton" style={{ width: '100%', height: '100%' }} />
        )}
      </div>
      <div className="card-body">
        {brand && <span className="card-brand">{brand}</span>}
        <h3 className="card-name">{name}</h3>
        <div className="card-footer">
          <div className="price-block">
            <span className="price-current">${finalPrice.toFixed(2)}</span>
            {hasDiscount && <span className="price-original">${price.toFixed(2)}</span>}
          </div>
          <span className={`stock-dot ${stock > 0 ? '' : 'out'}`}>
            {stock > 0 ? `${stock} left` : 'out of stock'}
          </span>
        </div>
      </div>
    </article>
  );
}
