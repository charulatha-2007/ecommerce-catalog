export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, hasPrevPage, hasNextPage } = pagination;

  // Show a compact window of page numbers around the current page
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="page-btn" disabled={!hasPrevPage} onClick={() => onPageChange(page - 1)}>
        &larr;
      </button>
      {start > 1 && (
        <>
          <button className="page-btn" onClick={() => onPageChange(1)}>
            1
          </button>
          {start > 2 && <span>&hellip;</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          className={`page-btn ${p === page ? 'active' : ''}`}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span>&hellip;</span>}
          <button className="page-btn" onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </button>
        </>
      )}
      <button className="page-btn" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)}>
        &rarr;
      </button>
    </nav>
  );
}
