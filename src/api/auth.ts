import axios from 'axios'

const API_URL = 'http://127.0.0.1:8000/api/auth/login'

export async function login(username: string, password: string) {
  const response = await axios.post(
    API_URL,
    { username, password },
    { headers: { "Content-Type": "application/json" } }
  )

  console.log('Backend response:', response.data)

  const data = response.data.data || response.data

  if (!data.access || !data.refresh) {
    throw new Error('Invalid response structure from backend')
  }

  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);

  return {
    access: data.access,
    refresh: data.refresh,
  }
}
export function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No access token found');
  return { Authorization: `Bearer ${token}` };
}
