import apiClient from './client';

export function fetchCategories(params) {
  return apiClient.get('/categories', { params });
}
