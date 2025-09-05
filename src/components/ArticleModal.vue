<template>
  <transition name="modal">
    <div v-if="show" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ article ? 'Edit Article' : 'Create New Article' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <form @submit.prevent="saveArticle" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label for="title">Title *</label>
              <input
                id="title"
                v-model="formData.title"
                type="text"
                placeholder="Enter article title"
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="slug">Slug *</label>
              <input
                id="slug"
                v-model="formData.slug"
                type="text"
                placeholder="Enter article slug"
                required
                class="form-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="read_estimation">Read Estimation (minutes)</label>
              <input
                id="read_estimation"
                v-model.number="formData.read_estimation"
                type="number"
                min="1"
                placeholder="Estimated reading time"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="blog_category">Category</label>
              <select
                id="blog_category"
                v-model="formData.blog_category"
                class="form-input"
              >
                <option value="">Select Category</option>
                <option
                  v-for="cat in categories"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="thumbnail_url">Thumbnail URL</label>
            <input
              id="thumbnail_url"
              v-model="formData.thumbnail_url"
              type="url"
              placeholder="https://example.com/image.jpg"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="body">Content *</label>
            <textarea
              id="body"
              v-model="formData.body"
              placeholder="Write your article content here..."
              rows="8"
              required
              class="form-textarea"
            ></textarea>
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
              {{ article ? 'Update' : 'Create' }} Article
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import type { Article, ArticleCreateRequest, ArticleUpdateRequest, Category } from '@/types';
import type { AxiosError } from 'axios';
import { addArticleAPI, updateArticleAPI, getCategoriesForArticlesAPI } from '@/api/articles';

interface Props {
  show: boolean;
  article: Article | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'refresh'): void;
}>();

const categories = ref<Category[]>([]);
const formData = ref({
  title: '',
  slug: '',
  thumbnail_url: null as string | null,
  read_estimation: null as number | null,
  body: '',
  blog_category: null as string | null
});

const isFormValid = computed(() => {
  return formData.value.title.trim().length > 0 &&
         formData.value.slug.trim().length > 0 &&
         formData.value.body.trim().length > 0;
});

// Load categories
const loadCategories = async () => {
  try {
    categories.value = await getCategoriesForArticlesAPI();
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
};

// Generate slug from title
watch(() => formData.value.title, (newTitle) => {
  if (!props.article && newTitle.trim()) {
    formData.value.slug = newTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
});

// Reset form when modal opens/closes
watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.article) {
      formData.value = {
        title: props.article.title || '',
        slug: props.article.slug || '',
        thumbnail_url: props.article.thumbnail_url,
        read_estimation: props.article.read_estimation,
        body: props.article.body || '',
        blog_category: props.article.blog_category?.id || null
      };
    } else {
      formData.value = {
        title: '',
        slug: '',
        thumbnail_url: null,
        read_estimation: null,
        body: '',
        blog_category: null
      };
    }
  }
});

const closeModal = () => {
  emit('close');
};

const saveArticle = async () => {
  if (!isFormValid.value) {
    alert('Please fill in all required fields (Title, Slug, and Content)');
    return;
  }

  try {
    const payload: ArticleCreateRequest | ArticleUpdateRequest = {
      title: formData.value.title.trim(),
      slug: formData.value.slug.trim(),
      thumbnail_url: formData.value.thumbnail_url,
      read_estimation: formData.value.read_estimation,
      body: formData.value.body.trim(),
      blog_category: formData.value.blog_category
    };

    if (props.article) {
      await updateArticleAPI(props.article.id, payload as ArticleUpdateRequest);
    } else {
      await addArticleAPI(payload as ArticleCreateRequest);
    }

    emit('refresh');
    closeModal();
  } catch (err) {
    const axiosErr = err as AxiosError<{ detail?: string }>;
    console.error('Save article error:', axiosErr.response?.data || axiosErr.message);
    alert(`Failed to save article: ${axiosErr.response?.data?.detail || axiosErr.message}`);
  }
};

onMounted(() => {
  loadCategories();
});
</script>

<style scoped>
/* Modal styles similar to CategoryModal with purple theme */
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
  max-width: 700px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #6a0dad;
}

.form-input, .form-textarea, select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #faf9ff;
}

.form-input:focus, .form-textarea:focus, select:focus {
  outline: none;
  border-color: #6a0dad;
  box-shadow: 0 0 0 3px rgba(106, 13, 173, 0.1);
  background: white;
}

.form-textarea {
  resize: vertical;
  min-height: 150px;
  font-family: inherit;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(106, 13, 173, 0.1);
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  border: 2px solid #6a0dad;
  border-radius: 8px;
  background: transparent;
  color: #6a0dad;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: #6a0dad;
  color: white;
}

.btn-submit {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #6a0dad 0%, #8a2be2 100%);
  color: white;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-submit:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(106, 13, 173, 0.3);
}

.btn-submit.disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 0.5rem;
  }
}
</style>
