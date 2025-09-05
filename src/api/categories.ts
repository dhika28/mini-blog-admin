import axios from 'axios';
import type { Category, CategoryCreateRequest, CategoryUpdateRequest } from '@/types';

const API_BASE = 'http://127.0.0.1:8000/admin/api';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No access token found');
  return { Authorization: `Bearer ${token}` };
}

export const getCategoriesAPI = async (): Promise<Category[]> => {
  const res = await axios.get(`${API_BASE}/blog/category`, { headers: getAuthHeaders() });

  // Debug struktur response
  console.log('API Response structure:', res.data);

  // Handle berbagai kemungkinan struktur response
  if (Array.isArray(res.data)) {
    return res.data;
  } else if (res.data.categories && Array.isArray(res.data.categories)) {
    return res.data.categories;
  } else if (res.data.results && Array.isArray(res.data.results)) {
    return res.data.results;
  } else if (res.data.data && Array.isArray(res.data.data)) {
    return res.data.data;
  } else {
    console.error('Unexpected API response format:', res.data);
    throw new Error('Unexpected API response format');
  }
};

export const addCategoryAPI = async (payload: CategoryCreateRequest): Promise<Category> => {
  const res = await axios.post(`${API_BASE}/blog/category`, payload, { headers: getAuthHeaders() });
  return res.data;
};

export const updateCategoryAPI = async (id: string, payload: CategoryUpdateRequest): Promise<Category> => {
  const res = await axios.put(`${API_BASE}/blog/category/${id}`, payload, { headers: getAuthHeaders() });
  return res.data;
};

export const deleteCategoryAPI = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE}/blog/category/${id}`, { headers: getAuthHeaders() });
};
