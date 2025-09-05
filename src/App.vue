<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const handleLogout = () => {
  localStorage.removeItem("token")

  router.push("/login")
}
</script>

<template>
  <header v-if="route.fullPath !== '/login'" class="header">
    <div class="container">
      <RouterLink to="/" class="logo">
        <img alt="Vue logo" src="./assets/logo.svg" width="50" height="50" />
        <span>MyApp</span>
      </RouterLink>

      <nav class="nav">
        <RouterLink to="/" class="nav-link">Dashboard</RouterLink>
        <RouterLink to="/categories" class="nav-link">Categories</RouterLink>
        <RouterLink to="/articles" class="nav-link">Articles</RouterLink>
        <RouterLink to="/users" class="nav-link">Users</RouterLink>

        <button class="logout-btn" @click="handleLogout">Logout</button>
      </nav>
    </div>
  </header>

  <main>
    <RouterView :key="route.fullPath" />
  </main>
</template>

<style scoped>
.header {
  background-color: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  padding: 0.5rem 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 1.2rem;
  color: #333;
  text-decoration: none;
}

.logo img {
  margin-right: 0.5rem;
}

.nav {
  display: flex;
  gap: 1rem;
}

.nav-link {
  text-decoration: none;
  color: #555;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #9c49d7;
}

.logout-btn {
  background-color: #6a0dad;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: #9c49d7;
}
</style>
