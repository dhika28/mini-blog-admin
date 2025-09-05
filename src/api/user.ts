import axios from 'axios';
import type { Group } from '@/types';

const API_BASE = 'http://127.0.0.1:8000/admin/api';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No access token found');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}
export interface User {
  id: string;
  username: string;
  email: string;
  groups?: Group[];
  role?: string[]; // For form handling
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  role: string[]; // Array of group IDs
}

export interface UserUpdateRequest extends Partial<UserCreateRequest> {
  password?: string;
}

// Get all groups/roles
export const getGroupsAPI = async (): Promise<Group[]> => {
  try {
    const res = await axios.get(`${API_BASE}/groups/`, {
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
      console.error('Unexpected groups response format:', res.data);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    return [];
  }
};

// API Functions
export const getUsersAPI = async (): Promise<User[]> => {
  const res = await axios.get(`${API_BASE}/user`, {
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

export const getUserAPI = async (id: string): Promise<User> => {
  const res = await axios.get(`${API_BASE}/user/${id}`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const addUserAPI = async (payload: UserCreateRequest): Promise<User> => {
  const res = await axios.post(`${API_BASE}/user`, payload, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const updateUserAPI = async (id: string, payload: UserUpdateRequest): Promise<User> => {
  const res = await axios.put(`${API_BASE}/user/${id}`, payload, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const deleteUserAPI = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE}/user/${id}`, {
    headers: getAuthHeaders()
  });
};
