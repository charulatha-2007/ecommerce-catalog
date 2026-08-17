import apiClient from './client';

/** Fetch a paginated, filtered, sorted product list. Params map 1:1 to backend query params. */
export function fetchProducts(params) {
  return apiClient.get('/products', { params });
}

export function fetchProductById(id) {
  return apiClient.get(`/products/${id}`);
}

/** Distinct brands + price bounds for the current category, used to build the filter sidebar. */
export function fetchFacets(category) {
  return apiClient.get('/products/facets', { params: category ? { category } : {} });
}
