<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import type { User } from '@/types';
import { getUsersAPI, deleteUserAPI } from '@/api/user';
import UserModal from '@/components/UserModal.vue';

const users = ref<User[]>([]);
const modalVisible = ref(false);
const selectedUser = ref<User | null>(null);
const loading = ref(true);
const hoverCard = ref<string | null>(null);
const searchQuery = ref('');

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return users.value;

  return users.value.filter(user =>
    user.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (user.groups && user.groups.some(group =>
      group.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    ))
  );
});

const usersWithRoles = computed(() => {
  return users.value.filter(user => user.groups && user.groups.length > 0).length;
});

const adminUsers = computed(() => {
  return users.value.filter(user =>
    user.groups && user.groups.some(group =>
      group.name.toLowerCase().includes('admin')
    )
  ).length;
});

const fetchUsers = async () => {
  try {
    loading.value = true;
    users.value = await getUsersAPI();
  } catch (err) {
    console.error('Failed to fetch users:', err);
    alert('Failed to load users. Check console.');
  } finally {
    loading.value = false;
  }
};

const openModal = (user: User | null) => {
  selectedUser.value = user;
  modalVisible.value = true;
};

const closeModal = () => {
  modalVisible.value = false;
  selectedUser.value = null;
};

const deleteUser = async (id: string) => {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

  try {
    await deleteUserAPI(id);
    await fetchUsers();
  } catch (err) {
    console.error('Delete user error:', err);
    alert('Failed to delete user. Check console.');
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="dashboard-title">
          <span class="title-icon">👥</span>
          Users Management
        </h1>
        <p class="dashboard-subtitle">Manage system users and permissions</p>
      </div>
      <div class="header-stats">
        <div class="stat-card">
          <div class="stat-icon">👤</div>
          <div class="stat-info">
            <div class="stat-number">{{ users.length }}</div>
            <div class="stat-label">Total Users</div>
          </div>
        </div>
      </div>
    </div>
    <div class="dashboard-actions">
      <button class="btn-primary" @click="openModal(null)">
        <span class="btn-icon">+</span>
        Add New User
      </button>
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search users..."
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading users...</p>
    </div>
    <div v-else-if="filteredUsers.length === 0" class="empty-state">
      <div class="empty-icon">👥</div>
      <h3>No users found</h3>
      <p>Get started by creating your first user</p>
      <button class="btn-primary" @click="openModal(null)">
        <span class="btn-icon">+</span>
        Create User
      </button>
    </div>
    <div v-else class="users-grid">
      <div
        v-for="user in filteredUsers"
        :key="user.id"
        class="user-card"
        @mouseenter="hoverCard = user.id"
        @mouseleave="hoverCard = null"
      >
        <div class="card-header">
          <div class="user-avatar">
            <span class="avatar-icon">👤</span>
          </div>
          <div class="user-info">
            <h3 class="user-name">{{ user.username }}</h3>
            <p class="user-email">{{ user.email }}</p>
          </div>
          <span class="user-badge">ID: {{ user.id.slice(0, 8) }}...</span>
        </div>

        <div class="card-content">
          <div class="user-roles">
            <h4>Roles</h4>
            <div v-if="user.groups && user.groups.length" class="roles-list">
              <span
                v-for="group in user.groups"
                :key="group.id"
                class="role-tag"
              >
                {{ group.name }}
              </span>
            </div>
            <div v-else class="no-roles">
              <span>No roles assigned</span>
            </div>
          </div>
        </div>

        <div class="card-actions" :class="{ 'visible': hoverCard === user.id }">
          <button class="btn-edit" @click="openModal(user)">
            <span class="action-icon">✏️</span>
            Edit
          </button>
          <button class="btn-delete" @click="deleteUser(user.id)">
            <span class="action-icon">🗑️</span>
            Delete
          </button>
        </div>
      </div>
    </div>
    <div class="dashboard-footer">
      <div class="footer-stats">
        <div class="footer-stat">
          <span class="stat-value">{{ users.length }}</span>
          <span class="stat-label">Total Users</span>
        </div>
        <div class="footer-stat">
          <span class="stat-value">{{ usersWithRoles }}</span>
          <span class="stat-label">With Roles</span>
        </div>
        <div class="footer-stat">
          <span class="stat-value">{{ adminUsers }}</span>
          <span class="stat-label">Admins</span>
        </div>
      </div>
    </div>

    <UserModal
      :show="modalVisible"
      :user="selectedUser"
      @close="closeModal"
      @refresh="fetchUsers"
    />
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f4ff 0%, #f0ebff 50%, #e8e2ff 100%);
  padding: 2rem;
  font-family: 'Inter', sans-serif;
  color: #2d0076;
}

.dashboard-header {
  background: linear-gradient(135deg, #6a0dad 0%, #8a2be2 100%);
  color: white;
  padding: 2.5rem;
  border-radius: 20px;
  margin-bottom: 2rem;
  box-shadow: 0 10px 40px rgba(106, 13, 173, 0.35);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
  transition: transform 0.3s ease;
}

.dashboard-header:hover {
  transform: scale(1.01);
}

.dashboard-title {
  font-size: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dashboard-subtitle {
  margin-top: 0.5rem;
  font-size: 1rem;
  opacity: 0.9;
}

.dashboard-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #6a0dad 0%, #8a2be2 100%);
  color: white;
  border: none;
  padding: 0.8rem 1.4rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 6px 20px rgba(106, 13, 173, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(106, 13, 173, 0.4);
  background: linear-gradient(135deg, #7b1fb0 0%, #9d4be7 100%);
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 0.7rem 1rem 0.7rem 2.5rem;
  border: 2px solid rgba(106, 13, 173, 0.2);
  border-radius: 12px;
  outline: none;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.search-input:focus {
  border-color: #6a0dad;
  box-shadow: 0 0 0 3px rgba(106, 13, 173, 0.2);
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6a0dad;
  font-size: 1rem;
}

/* User Cards */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.user-card {
  background: white;
  padding: 2rem;
  border-radius: 18px;
  box-shadow: 0 6px 20px rgba(106, 13, 173, 0.15);
  border: 1px solid rgba(106, 13, 173, 0.15);
  transition: all 0.35s ease;
  position: relative;
  overflow: hidden;
}

.user-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #6a0dad 0%, #8a2be2 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.user-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 14px 36px rgba(106, 13, 173, 0.25);
}

.user-card:hover::before {
  opacity: 1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6a0dad 0%, #8a2be2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 6px 16px rgba(106, 13, 173, 0.3);
}

.avatar-icon {
  font-size: 2rem;
  color: white;
}

.user-name {
  margin: 0 0 0.25rem 0;
  color: #2d0076;
  font-size: 1.2rem;
  font-weight: 600;
}

.user-email {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.user-badge {
  background: rgba(106, 13, 173, 0.08);
  color: #6a0dad;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.user-roles h4 {
  margin: 0 0 1rem 0;
  color: #6a0dad;
  font-size: 1rem;
  font-weight: 600;
}

.roles-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.role-tag {
  background: rgba(106, 13, 173, 0.1);
  color: #6a0dad;
  padding: 0.45rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid rgba(106, 13, 173, 0.2);
  transition: background 0.3s ease, color 0.3s ease;
}

.role-tag:hover {
  background: #6a0dad;
  color: white;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  opacity: 0;
  transform: translateY(12px);
  transition: all 0.3s ease;
}

.card-actions.visible {
  opacity: 1;
  transform: translateY(0);
}

.btn-edit, .btn-delete {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  flex: 1;
  justify-content: center;
}

.btn-edit {
  background: rgba(74, 144, 226, 0.08);
  color: #4a90e2;
  border: 1px solid rgba(74, 144, 226, 0.25);
}

.btn-edit:hover {
  background: #4a90e2;
  color: white;
  transform: translateY(-2px);
}

.btn-delete {
  background: rgba(220, 53, 69, 0.08);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.25);
}

.btn-delete:hover {
  background: #dc3545;
  color: white;
  transform: translateY(-2px);
}

/* Footer Stats */
.dashboard-footer {
  background: white;
  border-radius: 16px;
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 20px rgba(106, 13, 173, 0.1);
  margin-top: 2rem;
}

.footer-stats {
  display: flex;
  justify-content: space-around;
  text-align: center;
  gap: 1.5rem;
}

.footer-stat .stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #6a0dad;
  display: block;
}

.footer-stat .stat-label {
  font-size: 0.9rem;
  color: #555;
}

/* Responsive */
@media (max-width: 768px) {
  .users-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .user-info {
    text-align: center;
  }

  .card-actions {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

