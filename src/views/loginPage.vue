<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/api/auth'
import type { AxiosError } from 'axios'

const username = ref('')
const password = ref('')
const router = useRouter()

// State untuk popup
const showPopup = ref(false)
const popupMessage = ref('')
const popupType = ref<'success' | 'error'>('success')

const handleLogin = async (): Promise<void> => {
  try {
    const response = await login(username.value, password.value)

    if (response.access && response.refresh) {
      localStorage.setItem('token', response.access)
      localStorage.setItem('refresh_token', response.refresh)

      // Tampilkan notifikasi sukses
      popupMessage.value = 'Login berhasil!'
      popupType.value = 'success'
      showPopup.value = true

      // Redirect setelah 1 detik
      setTimeout(() => {
        showPopup.value = false
        router.push('/')
      }, 1000)
    } else {
      popupMessage.value = 'Login gagal: response backend tidak valid'
      popupType.value = 'error'
      showPopup.value = true
      console.error('Invalid response structure:', response)
    }
  } catch (err) {
    const error = err as AxiosError
    console.error('Login error detail:', error)

    if (error.response) {
      popupMessage.value = `Login gagal: ${error.response.status} ${error.response.statusText}`
    } else if (error.request) {
      popupMessage.value = 'Login gagal: server tidak merespon (CORS / server down)'
    } else {
      popupMessage.value = `Login gagal: ${error.message}`
    }
    popupType.value = 'error'
    showPopup.value = true
  }
}

</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="login-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V18C3 19.1 3.9 20 5 20H19C20.1 20 21 19.1 21 18V9M19 18H5V3H13V9H19Z" fill="currentColor"/>
          </svg>
        </div>
        <h2 class="login-title">Welcome Back</h2>
        <p class="login-subtitle">Sign in to your account</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <div class="input-container">
            <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
            </svg>
            <input
              v-model="username"
              type="text"
              placeholder="Username"
              required
              class="form-input"
            />
          </div>
        </div>

        <div class="input-group">
          <div class="input-container">
            <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 10V8C6 5.79 7.79 4 10 4H14C16.21 4 18 5.79 18 8V10C19.1 10 20 10.9 20 12V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V12C4 10.9 4.9 10 6 10ZM8 8C8 6.9 8.9 6 10 6H14C15.1 6 16 6.9 16 8V10H8V8Z" fill="currentColor"/>
            </svg>
            <input
              v-model="password"
              type="password"
              placeholder="Password"
              required
              class="form-input"
            />
          </div>
        </div>

        <button type="submit" class="login-button">
          <span>Sign In</span>
          <svg class="button-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.5 7L13.5 12L8.5 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </form>
    </div>

    <!-- Background decoration -->
    <div class="bg-decoration">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>
  </div>
  <!-- Popup notifikasi -->
  <div v-if="showPopup" :class="['popup', popupType]">
    {{ popupMessage }}
  </div>

</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
  position: relative;
  overflow: hidden;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.login-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 20px;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.login-title {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.025em;
}

.login-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
  font-weight: 400;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  position: relative;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #9ca3af;
  z-index: 2;
  transition: color 0.2s ease;
}

.form-input {
  width: 100%;
  padding: 1rem 7rem 1rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  font-size: 1rem;
  background: #fafafa;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.form-input:focus + .input-icon,
.input-container:focus-within .input-icon {
  color: #667eea;
}

.login-button {
  width: 100%;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.login-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
}

.login-button:hover::before {
  left: 100%;
}

.login-button:active {
  transform: translateY(0);
}

.button-icon {
  transition: transform 0.3s ease;
}

.login-button:hover .button-icon {
  transform: translateX(4px);
}

/* Background decoration */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.bg-circle-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: -150px;
  animation-delay: 0s;
}

.bg-circle-2 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  left: -100px;
  animation-delay: 2s;
}

.bg-circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: -75px;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

/* Responsive design */
@media (max-width: 640px) {
  .login-card {
    margin: 1rem;
    padding: 2rem 1.5rem;
  }

  .login-title {
    font-size: 1.75rem;
  }

  .login-icon {
    width: 60px;
    height: 60px;
  }
}
.popup {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
  z-index: 1000;
  animation: fadeInOut 2s forwards;
}

.popup.success {
  background-color: #34d399; /* hijau */
}

.popup.error {
  background-color: #f87171; /* merah */
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-20px); }
  10%, 90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
}

</style>
