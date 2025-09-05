// articles.ts
import axios from 'axios';
import type { Article, ArticleCreateRequest, ArticleUpdateRequest, Category } from '@/types';

const API_BASE = 'http://127.0.0.1:8000/admin/api';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No access token found');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Hapus interface duplikat di sini, gunakan yang dari types.ts

// API Functions
export const getArticlesAPI = async (): Promise<Article[]> => {
  const res = await axios.get(`${API_BASE}/blog/article`, {
    headers: getAuthHeaders()
  });

  // Handle different response structures
  if (Array.isArray(res.data)) {
    return res.data;
  } else if (res.data.results && Array.isArray(res.data.results)) {
    return res.data.results;
  } else if (res.data.data && Array.isArray(res.data.data)) {
    return res.data.data;
  } else {
    console.error('Unexpected API response format:', res.data);
    throw new Error('Unexpected API response format');
  }
};

export const getArticleAPI = async (id: string): Promise<Article> => {
  const res = await axios.get(`${API_BASE}/blog/article/${id}`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const addArticleAPI = async (payload: ArticleCreateRequest): Promise<Article> => {
  const res = await axios.post(`${API_BASE}/blog/article`, payload, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const updateArticleAPI = async (id: string, payload: ArticleUpdateRequest): Promise<Article> => {
  const res = await axios.put(`${API_BASE}/blog/article/${id}`, payload, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const deleteArticleAPI = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE}/blog/article/${id}`, {
    headers: getAuthHeaders()
  });
};

// Get categories for dropdown
export const getCategoriesForArticlesAPI = async (): Promise<Category[]> => {
  const res = await axios.get(`${API_BASE}/blog/category`, {
    headers: getAuthHeaders()
  });

  if (Array.isArray(res.data)) {
    return res.data;
  } else if (res.data.categories && Array.isArray(res.data.categories)) {
    return res.data.categories;
  } else if (res.data.results && Array.isArray(res.data.results)) {
    return res.data.results;
  } else if (res.data.data && Array.isArray(res.data.data)) {
    return res.data.data;
  } else {
    console.error('Unexpected categories response format:', res.data);
    return [];
  }
};
