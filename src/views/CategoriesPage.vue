<template>
  <div class="categories-container">
    <div class="categories-inner">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">📂</div>
          <div class="header-text">
            <h1>Categories Management</h1>
            <p>Organize your content with beautiful categories</p>
          </div>
        </div>
        <button class="btn-primary" @click="openAddModal">
          <span class="btn-icon">+</span>
          Add New Category
        </button>
      </div>

      <!-- Stats Overview -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon">📁</div>
          <div class="stat-info">
            <div class="stat-number">{{ categories.length }}</div>
            <div class="stat-label">Total Categories</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <div class="stat-number">{{ categoriesWithDescription }}</div>
            <div class="stat-label">With Description</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⚡</div>
          <div class="stat-info">
            <div class="stat-number">{{ recentCategories }}</div>
            <div class="stat-label">Recently Added</div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading categories...</p>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Search and Filters -->
        <div class="content-header">
          <div class="search-box">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search categories..."
              class="search-input"
            />
            <span class="search-icon">🔍</span>
          </div>
          <div class="view-toggle">
            <button
              class="view-btn"
              :class="{ active: viewMode === 'grid' }"
              @click="viewMode = 'grid'"
            >
              Grid
            </button>
            <button
              class="view-btn"
              :class="{ active: viewMode === 'list' }"
              @click="viewMode = 'list'"
            >
              List
            </button>
          </div>

        </div>

        <!-- Categories Grid -->
        <!-- Grid View -->
      <div v-if="viewMode === 'grid' && filteredCategories.length" class="categories-grid">
        <div
          v-for="cat in filteredCategories"
          :key="cat.id"
          class="category-card"
          @mouseenter="hoverItem = cat.id"
          @mouseleave="hoverItem = null"
        >
          <div class="card-header">
            <div class="category-icon">📁</div>
            <div class="category-badge">ID: {{ cat.id.slice(0, 6) }}...</div>
          </div>

          <div class="card-content">
            <h3 class="category-name">{{ cat.name }}</h3>
            <div class="category-slug">
              <span class="slug-label">Slug:</span>
              <code class="slug-value">{{ cat.slug }}</code>
            </div>
            <div v-if="cat.description" class="category-description">
              <p>{{ cat.description }}</p>
            </div>
            <div v-else class="no-description">
              <span>No description provided</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="category-meta">
              <span class="meta-item">
                <span class="meta-icon">📅</span>
                Created recently
              </span>
            </div>

            <div class="card-actions" :class="{ 'visible': hoverItem === cat.id }">
              <button class="btn-edit" @click="openEditModal(cat)">
                <span class="action-icon">✏️</span>
                Edit
              </button>
              <button class="btn-delete" @click="deleteCategory(cat.id)">
                <span class="action-icon">🗑️</span>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else-if="viewMode === 'list' && filteredCategories.length" class="categories-list">
        <div
          v-for="cat in filteredCategories"
          :key="cat.id"
          class="category-list-item"
        >
          <div class="list-left">
            <h3 class="list-name">{{ cat.name }}</h3>
            <div class="list-slug">
              <span class="slug-label">Slug:</span>
              <code class="slug-value">{{ cat.slug }}</code>
            </div>
            <div v-if="cat.description" class="list-description">
              {{ cat.description }}
            </div>
            <div class="list-meta">
              <span>📅 Created recently</span>
            </div>
          </div>
          <div class="list-actions">
            <button class="btn-edit" @click="openEditModal(cat)">✏️ Edit</button>
            <button class="btn-delete" @click="deleteCategory(cat.id)">🗑️ Delete</button>
          </div>
        </div>
      </div>


        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-icon">📂</div>
          <h3>No categories found</h3>
          <p>Get started by creating your first category</p>
          <button class="btn-primary" @click="openAddModal">
            <span class="btn-icon">+</span>
            Create Category
          </button>
        </div>
      </div>
    </div>

    <CategoryModal
      :show="showModal"
      :category="selectedCategory"
      @close="closeModal"
      @refresh="fetchCategories"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import type { Category } from '@/types';
import { getCategoriesAPI, deleteCategoryAPI } from '@/api/categories';
import type { AxiosError } from 'axios';
import CategoryModal from '@/components/CategoryModal.vue';

const categories = ref<Category[]>([]);
const showModal = ref(false);
const selectedCategory = ref<Category | null>(null);
const loading = ref(true);
const hoverItem = ref<string | null>(null);
const searchQuery = ref('');

const viewMode = ref<'grid' | 'list'>('grid')
// Computed properties
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return categories.value;

  return categories.value.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
  );
});

const categoriesWithDescription = computed(() => {
  return categories.value.filter(cat => cat.description && cat.description.trim()).length;
});

const recentCategories = computed(() => {
  // Simple recent count - you can enhance this with actual timestamps
  return Math.min(categories.value.length, 5);
});

const fetchCategories = async () => {
  try {
    loading.value = true;
    const data = await getCategoriesAPI();
    categories.value = data;
  } catch (err) {
    const axiosErr = err as AxiosError<{ detail?: string }>;
    console.error('Failed to fetch categories:', axiosErr.response?.data || axiosErr.message);
    alert('Failed to load categories. Check console.');
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  selectedCategory.value = null;
  showModal.value = true;
};

const openEditModal = (cat: Category) => {
  selectedCategory.value = cat;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedCategory.value = null;
};

const deleteCategory = async (id: string) => {
  if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;

  try {
    await deleteCategoryAPI(id);
    await fetchCategories();
  } catch (err) {
    const axiosErr = err as AxiosError<{ detail?: string }>;
    console.error('Delete category error:', axiosErr.response?.data || axiosErr.message);
    alert(`Failed to delete category: ${axiosErr.response?.data?.detail || axiosErr.message}`);
  }
};

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
.categories-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f4ff 0%, #f0ebff 50%, #e8e2ff 100%);
  padding: 2rem 0;
}

.categories-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Header Styles */
.page-header {
  background: linear-gradient(135deg, #6a0dad 0%, #8a2be2 100%);
  color: white;
  padding: 3rem;
  border-radius: 24px;
  margin-bottom: 2rem;
  box-shadow: 0 20px 40px rgba(106, 13, 173, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  z-index: 2;
}

.header-icon {
  font-size: 3.5rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.header-text h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.8rem;
  font-weight: 800;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.header-text p {
  margin: 0;
  opacity: 0.9;
  font-size: 1.2rem;
  font-weight: 300;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.btn-primary {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  color: white;
  padding: 1.125rem 2rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  z-index: 2;
}

.btn-primary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2);
}

/* Stats Overview */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(106, 13, 173, 0.1);
  border: 1px solid rgba(106, 13, 173, 0.1);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(106, 13, 173, 0.2);
}

.stat-icon {
  font-size: 3rem;
  color: #6a0dad;
  background: linear-gradient(135deg, #f0ebff 0%, #e8e2ff 100%);
  padding: 1rem;
  border-radius: 16px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: #6a0dad;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #666;
  font-weight: 500;
  font-size: 0.95rem;
}

/* Content Header */
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1.5rem;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 1.125rem 1.5rem 1.125rem 3.5rem;
  border: 2px solid rgba(106, 13, 173, 0.2);
  border-radius: 16px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(106, 13, 173, 0.1);
}

.search-input:focus {
  outline: none;
  border-color: #6a0dad;
  box-shadow: 0 0 0 3px rgba(106, 13, 173, 0.1);
}

.search-icon {
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6a0dad;
  font-size: 1.2rem;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(106, 13, 173, 0.1);
}

.view-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #666;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.view-btn.active {
  background: linear-gradient(135deg, #6a0dad 0%, #8a2be2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(106, 13, 173, 0.3);
}

/* Categories Grid */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}
.categories-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-list-item {
  background: white;
  border: 1px solid rgba(106, 13, 173, 0.1);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}


.category-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(106, 13, 173, 0.1);
  border: 1px solid rgba(106, 13, 173, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.category-card::before {
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

.category-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 50px rgba(106, 13, 173, 0.2);
}

.category-card:hover::before {
  opacity: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 2rem 2rem 1rem;
}

.category-icon {
  font-size: 3rem;
  color: #6a0dad;
}

.category-badge {
  background: rgba(106, 13, 173, 0.1);
  color: #6a0dad;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid rgba(106, 13, 173, 0.2);
}

.card-content {
  padding: 0 2rem;
  flex: 1;
}

.category-name {
  margin: 0 0 1rem 0;
  color: #2d0076;
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.3;
}

.category-slug {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.slug-label {
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.slug-value {
  background: rgba(106, 13, 173, 0.1);
  color: #6a0dad;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  border: 1px solid rgba(106, 13, 173, 0.2);
}

.category-description p {
  margin: 0;
  color: #666;
  line-height: 1.6;
  font-size: 0.95rem;
}

.no-description {
  color: #999;
  font-style: italic;
  font-size: 0.9rem;
  padding: 1rem 0;
}

.card-footer {
  padding: 1.5rem 2rem 2rem;
  border-top: 1px solid rgba(106, 13, 173, 0.1);
}

.category-meta {
  margin-bottom: 1.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #888;
  font-size: 0.85rem;
}

.meta-icon {
  font-size: 1rem;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.card-actions.visible {
  opacity: 1;
  transform: translateY(0);
}

.btn-edit, .btn-delete {
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
}

.btn-edit {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(74, 144, 226, 0.2) 100%);
  color: #4a90e2;
  border: 2px solid rgba(74, 144, 226, 0.3);
}

.btn-edit:hover {
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.3);
}

.btn-delete {
  background: linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(220, 53, 69, 0.2) 100%);
  color: #dc3545;
  border: 2px solid rgba(220, 53, 69, 0.3);
}

.btn-delete:hover {
  background: linear-gradient(135deg, #dc3545 0%, #bd2130 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(220, 53, 69, 0.3);
}

.action-icon {
  font-size: 1.1rem;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 6rem 2rem;
  color: #6a0dad;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #f0ebff;
  border-top: 4px solid #6a0dad;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 2rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 6rem 2rem;
  background: white;
  border-radius: 24px;
  border: 2px dashed rgba(106, 13, 173, 0.3);
  margin: 2rem 0;
  box-shadow: 0 8px 32px rgba(106, 13, 173, 0.1);
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  opacity: 0.7;
  color: #6a0dad;
}

.empty-state h3 {
  margin: 0 0 1rem 0;
  color: #6a0dad;
  font-size: 2rem;
  font-weight: 700;
}

.empty-state p {
  margin: 0 0 3rem 0;
  color: #666;
  font-size: 1.2rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  }
}

@media (max-width: 768px) {
  .categories-inner {
    padding: 0 1rem;
  }

  .page-header {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
    padding: 2rem;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .stats-overview {
    grid-template-columns: 1fr;
  }

  .content-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .categories-grid {
    grid-template-columns: 1fr;
  }

  .card-actions {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 1.5rem;
  }

  .header-text h1 {
    font-size: 2.2rem;
  }

  .category-card {
    padding: 1.5rem;
  }

  .card-header,
  .card-content,
  .card-footer {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .card-actions {
    flex-direction: column;
  }

  .btn-edit,
  .btn-delete {
    width: 100%;
  }
}
</style>
