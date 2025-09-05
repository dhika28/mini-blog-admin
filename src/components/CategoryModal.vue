<template>
  <transition name="modal">
    <div v-if="show" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ category ? 'Edit Category' : 'Create New Category' }}</h2>
          <button class="close-btn" @click="closeModal">
            <span>×</span>
          </button>
        </div>

        <form @submit.prevent="saveCategory" class="modal-form">
          <div class="form-group">
            <label for="name">Name *</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              placeholder="Enter category name"
              required
              class="form-input"
              :class="{ 'has-value': formData.name }"
            />
          </div>

          <div class="form-group">
            <label for="slug">Slug *</label>
            <input
              id="slug"
              v-model="formData.slug"
              type="text"
              placeholder="Enter category slug"
              required
              class="form-input"
              :class="{ 'has-value': formData.slug }"
            />
            <small class="help-text">URL-friendly version of the name</small>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              v-model="formData.description"
              placeholder="Enter category description (optional)"
              rows="4"
              class="form-textarea"
              :class="{ 'has-value': formData.description }"
            ></textarea>
          </div>

          <div class="form-actions">
            <button
              type="button"
              @click="closeModal"
              class="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!isFormValid"
              :class="['btn-submit', { 'disabled': !isFormValid }]"
            >
              <span class="submit-icon">{{ category ? '🔄' : '✨' }}</span>
              {{ category ? 'Update' : 'Create' }} Category
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue';
import type { Category, CategoryCreateRequest, CategoryUpdateRequest } from '@/types';
import type { AxiosError } from 'axios';
import { addCategoryAPI, updateCategoryAPI } from '@/api/categories';

interface Props {
  show: boolean;
  category: Category | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'refresh'): void;
}>();

const formData = ref({
  name: '',
  slug: '',
  description: ''
});

const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0 && formData.value.slug.trim().length > 0;
});

const closeModal = () => {
  formData.value = { name: '', slug: '', description: '' };
  emit('close');
};

// Generate slug automatically from name
watch(() => formData.value.name, (newName) => {
  if (!props.category && newName.trim()) {
    formData.value.slug = newName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
});

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.category) {
      formData.value = {
        name: props.category.name || '',
        slug: props.category.slug || '',
        description: props.category.description || ''
      };
    } else {
      formData.value = { name: '', slug: '', description: '' };
    }

    nextTick(() => {
      const firstInput = document.querySelector('.form-input') as HTMLInputElement;
      if (firstInput) firstInput.focus();
    });
  }
});

const saveCategory = async () => {
  if (!isFormValid.value) {
    alert('Please fill in all required fields (Name and Slug)');
    return;
  }

  const payload: CategoryCreateRequest | CategoryUpdateRequest = {
    name: formData.value.name.trim(),
    slug: formData.value.slug.trim(),
    description: formData.value.description?.trim() || null
  };

  try {
    if (props.category) {
      await updateCategoryAPI(props.category.id, payload as CategoryUpdateRequest);
    } else {
      await addCategoryAPI(payload as CategoryCreateRequest);
    }

    emit('refresh');
    closeModal();
  } catch (err) {
    const axiosErr = err as AxiosError<{ detail?: string }>;
    console.error('Save category error:', axiosErr.response?.data || axiosErr.message);
    alert(`Failed to save category: ${axiosErr.response?.data?.detail || axiosErr.message}`);
  }
};
</script>

<style scoped>
/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-20px);
}

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
  animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
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
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #6a0dad;
  font-size: 0.95rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 1rem 1.25rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: all 0.3s ease;
  background: #faf9ff;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #6a0dad;
  box-shadow: 0 0 0 3px rgba(106, 13, 173, 0.1);
  background: white;
  transform: translateY(-1px);
}

.form-input.has-value,
.form-textarea.has-value {
  border-color: #8a2be2;
  background: white;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

.help-text {
  display: block;
  margin-top: 0.5rem;
  color: #888;
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

.submit-icon {
  font-size: 1.1rem;
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
