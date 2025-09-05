<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import type { User, UserCreateRequest, UserUpdateRequest, Group } from '@/types';
import type { AxiosError } from 'axios';
import { addUserAPI, updateUserAPI, getGroupsAPI } from '@/api/user';

interface Props {
  show: boolean;
  user: User | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'refresh'): void;
}>();

const groups = ref<Group[]>([]);
const formData = ref({
  username: '',
  email: '',
  password: '',
  role: [] as string[]
});

const isFormValid = computed(() => {
  return formData.value.username.trim().length > 0 &&
         formData.value.email.trim().length > 0 &&
         (props.user ? true : formData.value.password.length > 0);
});

// Load groups
const loadGroups = async () => {
  try {
    groups.value = await getGroupsAPI();
  } catch (err) {
    console.error('Failed to load groups:', err);
  }
};

// Reset form when modal opens/closes
watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.user) {
      formData.value = {
        username: props.user.username || '',
        email: props.user.email || '',
        password: '',
        role: props.user.groups?.map(group => group.id) || []
      };
    } else {
      formData.value = {
        username: '',
        email: '',
        password: '',
        role: []
      };
    }
  }
});

const closeModal = () => {
  emit('close');
};

const saveUser = async () => {
  if (!isFormValid.value) {
    alert('Please fill in all required fields (Username, Email, and Password for new users)');
    return;
  }

  try {
    const payload: UserCreateRequest | UserUpdateRequest = {
      username: formData.value.username.trim(),
      email: formData.value.email.trim(),
      role: formData.value.role
    };

    // Only include password if provided
    if (formData.value.password) {
      payload.password = formData.value.password;
    }

    if (props.user) {
      await updateUserAPI(props.user.id, payload as UserUpdateRequest);
    } else {
      await addUserAPI(payload as UserCreateRequest);
    }

    emit('refresh');
    closeModal();
  } catch (err) {
    const axiosErr = err as AxiosError<{ detail?: string }>;
    console.error('Save user error:', axiosErr.response?.data || axiosErr.message);
    alert(`Failed to save user: ${axiosErr.response?.data?.detail || axiosErr.message}`);
  }
};

onMounted(() => {
  loadGroups();
});
</script>

<template>
  <transition name="modal">
    <div v-if="show" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ user ? 'Edit User' : 'Create New User' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <form @submit.prevent="saveUser" class="modal-form">
          <div class="form-group">
            <label for="username">Username *</label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              placeholder="Enter username"
              required
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="email">Email *</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="Enter email address"
              required
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="password">{{ user ? 'New Password' : 'Password' }} *</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              :placeholder="user ? 'Leave blank to keep current password' : 'Enter password'"
              :required="!user"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="role">Roles</label>
            <div class="roles-grid">
              <label
                v-for="group in groups"
                :key="group.id"
                class="role-checkbox"
              >
                <input
                  type="checkbox"
                  :value="group.id"
                  v-model="formData.role"
                  class="checkbox-input"
                />
                <span class="checkbox-label">{{ group.name }}</span>
              </label>
            </div>
            <small class="help-text">Select roles for this user</small>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-cancel">
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!isFormValid"
              :class="['btn-submit', { 'disabled': !isFormValid }]"
            >
              {{ user ? 'Update' : 'Create' }} User
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(106, 13, 173, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(106, 13, 173, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 2rem 1.5rem;
  border-bottom: 1px solid rgba(106, 13, 173, 0.1);
  background: linear-gradient(135deg, #f8f4ff 0%, #f0ebff 100%);
  border-radius: 20px 20px 0 0;
}

.modal-header h2 {
  margin: 0;
  color: #6a0dad;
  font-size: 1.5rem;
  font-weight: 700;
}

.close-btn {
  background: rgba(106, 13, 173, 0.1);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #6a0dad;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(106, 13, 173, 0.2);
  transform: rotate(90deg);
}

.modal-form {
  padding: 2rem;
}

.form-group {
  margin-bottom: 2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #6a0dad;
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 1rem 1.25rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: all 0.3s ease;
  background: #faf9ff;
}

.form-input:focus {
  outline: none;
  border-color: #6a0dad;
  box-shadow: 0 0 0 3px rgba(106, 13, 173, 0.1);
  background: white;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.role-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(106, 13, 173, 0.05);
  border-radius: 8px;
  border: 2px solid rgba(106, 13, 173, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.role-checkbox:hover {
  background: rgba(106, 13, 173, 0.1);
  border-color: #6a0dad;
}

.role-checkbox:has(.checkbox-input:checked) {
  background: rgba(106, 13, 173, 0.2);
  border-color: #6a0dad;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  accent-color: #6a0dad;
}

.checkbox-label {
  font-weight: 500;
  color: #333;
}

.help-text {
  display: block;
  color: #666;
  font-size: 0.85rem;
  font-style: italic;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(106, 13, 173, 0.1);
}

.btn-cancel {
  padding: 1rem 2rem;
  border: 2px solid #6a0dad;
  border-radius: 12px;
  background: transparent;
  color: #6a0dad;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: #6a0dad;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(106, 13, 173, 0.3);
}

.btn-submit {
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #6a0dad 0%, #8a2be2 100%);
  color: white;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 16px rgba(106, 13, 173, 0.3);
}

.btn-submit:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(106, 13, 173, 0.4);
}

.btn-submit.disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Responsive design */
@media (max-width: 600px) {
  .modal-content {
    margin: 0.5rem;
    max-width: none;
  }

  .modal-header {
    padding: 1.5rem 1.5rem 1rem;
  }

  .modal-form {
    padding: 1.5rem;
  }

  .roles-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-submit {
    width: 100%;
    justify-content: center;
  }
}
</style>
