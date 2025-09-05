import axios from 'axios'

const API_URL = 'http://127.0.0.1:8000/api/auth/login' // URL backend benar

export async function login(username: string, password: string) {
  const response = await axios.post(
    API_URL,
    { username, password },
    { headers: { "Content-Type": "application/json" } }
  )

  // log response untuk memastikan struktur JSON
  console.log('Backend response:', response.data)

  // sesuaikan akses token sesuai struktur response backend
  // misal backend mengembalikan { success: true, data: { access, refresh } }
  const data = response.data.data || response.data  // fallback ke data langsung

  if (!data.access || !data.refresh) {
    throw new Error('Invalid response structure from backend')
  }

  // ✅ simpan token di localStorage
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);

  return {
    access: data.access,
    refresh: data.refresh,
  }
}

// tambahan fungsi untuk mendapatkan headers Authorization
export function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No access token found');
  return { Authorization: `Bearer ${token}` };
}
