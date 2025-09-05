import { ref } from 'vue';

export const token = ref(localStorage.getItem('token') || '');

export function setToken(newToken: string) {
  token.value = newToken;
  localStorage.setItem('token', newToken);
}

export function logout() {
  token.value = '';
  localStorage.removeItem('token');
}
