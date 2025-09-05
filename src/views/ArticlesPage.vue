<template>
  <div class="dashboard-container">
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="dashboard-title">
          <span class="title-icon">📝</span>
          Articles Dashboard
        </h1>
        <p class="dashboard-subtitle">Manage your blog articles efficiently</p>
      </div>
      <div class="header-stats">
        <div class="stat-card">
          <div class="stat-icon">📄</div>
          <div class="stat-info">
            <div class="stat-number">{{ articles.length }}</div>
            <div class="stat-label">Total Articles</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard Actions -->
    <div class="dashboard-actions">
      <button class="btn-primary" @click="openModal(null)">
        <span class="btn-icon">+</span>
        Add New Article
      </button>
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search articles..."
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading articles...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredArticles.length === 0" class="empty-state">
      <div class="empty-icon">📄</div>
      <h3>No articles found</h3>
      <p>Get started by creating your first article</p>
      <button class="btn-primary" @click="openModal(null)">
        <span class="btn-icon">+</span>
        Create Article
      </button>
    </div>

    <!-- Articles Grid -->
    <div v-else class="articles-grid">
      <div
        v-for="article in filteredArticles"
        :key="article.id"
        class="article-card"
        @mouseenter="hoverCard = article.id"
        @mouseleave="hoverCard = null"
      >
        <!-- Thumbnail Section -->
        <div v-if="article.thumbnail_url" class="article-thumbnail">
          <img
            :src="article.thumbnail_url"
            :alt="article.title"
            class="thumbnail-image"
            @error="handleImageError"
          />
        </div>

        <div v-else class="article-thumbnail-placeholder">
          <span class="thumbnail-icon">🖼️</span>
          <p>No thumbnail</p>
        </div>

        <div class="card-content">
          <div class="card-header">
            <h3 class="article-title">{{ article.title }}</h3>
            <span class="article-badge">ID: {{ article.id.slice(0, 8) }}...</span>
          </div>

          <div class="article-meta">
            <div class="meta-item">
              <span class="meta-icon">👤</span>
              <span class="meta-value">{{ article.author }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">📂</span>
              <span class="meta-value">{{ article.blog_category?.name || 'Uncategorized' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">⏱️</span>
              <span class="meta-value">{{ article.read_estimation || 'N/A' }} min</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">📅</span>
              <span class="meta-value">{{ formatDate(article.published_at) }}</span>
            </div>
          </div>

          <div class="article-preview">
            <p class="preview-text">{{ truncateText(article.body, 120) }}</p>
            <span class="read-more">Read more...</span>
          </div>

          <div class="article-slug">
            <span class="slug-label">Slug:</span>
            <code class="slug-value">{{ article.slug }}</code>
          </div>
        </div>

        <div class="card-actions" :class="{ 'visible': hoverCard === article.id }">
          <button class="btn-edit" @click="openModal(article)">
            <span class="action-icon">✏️</span>
            Edit
          </button>
          <button class="btn-delete" @click="deleteArticle(article.id)">
            <span class="action-icon">🗑️</span>
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Stats Footer -->
    <div class="dashboard-footer">
      <div class="footer-stats">
        <div class="footer-stat">
          <span class="stat-value">{{ articles.length }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="footer-stat">
          <span class="stat-value">{{ articlesWithCategory }}</span>
          <span class="stat-label">With Category</span>
        </div>
        <div class="footer-stat">
          <span class="stat-value">{{ publishedArticles }}</span>
          <span class="stat-label">Published</span>
        </div>
        <div class="footer-stat">
          <span class="stat-value">{{ articlesWithThumbnail }}</span>
          <span class="stat-label">With Thumbnail</span>
        </div>
      </div>
    </div>

    <!-- Modal Component -->
    <ArticleModal
      :show="modalVisible"
      :article="selectedArticle"
      @close="closeModal"
      @refresh="fetchArticles"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import type { Article } from '@/types';
import { getArticlesAPI, deleteArticleAPI } from '@/api/articles';
import ArticleModal from '@/components/ArticleModal.vue';

const articles = ref<Article[]>([]);
const modalVisible = ref(false);
const selectedArticle = ref<Article | null>(null);
const loading = ref(true);
const hoverCard = ref<string | null>(null);
const searchQuery = ref('');

// Computed properties
const filteredArticles = computed(() => {
  if (!searchQuery.value.trim()) return articles.value;

  return articles.value.filter(article =>
    article.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    article.slug.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    article.body.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (article.blog_category?.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
  );
});

const articlesWithCategory = computed(() => {
  return articles.value.filter(article => article.blog_category).length;
});

const publishedArticles = computed(() => {
  return articles.value.filter(article => article.published_at).length;
});

const articlesWithThumbnail = computed(() => {
  return articles.value.filter(article => article.thumbnail_url).length;
});

// Methods
const fetchArticles = async () => {
  try {
    loading.value = true;
    articles.value = await getArticlesAPI();
  } catch (err) {
    console.error('Failed to fetch articles:', err);
    alert('Failed to load articles. Check console.');
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Not published';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const truncateText = (text: string, length: number) => {
  if (!text) return 'No content';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  img.parentElement?.classList.add('error');
};

const openModal = (article: Article | null) => {
  selectedArticle.value = article;
  modalVisible.value = true;
};

const closeModal = () => {
  modalVisible.value = false;
  selectedArticle.value = null;
};

const deleteArticle = async (id: string) => {
  if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) return;

  try {
    await deleteArticleAPI(id);
    await fetchArticles();
  } catch (err) {
    console.error('Delete article error:', err);
    alert('Failed to delete article. Check console.');
  }
};

onMounted(() => {
  fetchArticles();
});
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f4ff 0%, #f0ebff 50%, #e8e2ff 100%);
  padding: 2rem;
}

/* Header Styles */
.dashboard-header {
  background: linear-gradient(135deg, #6a0dad 0%, #8a2be2 100%);
  color: white;
  padding: 2.5rem;
  border-radius: 20px;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(106, 13, 173, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
}

.header-content {
  flex: 1;
}

.dashboard-title {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-icon {
  font-size: 2.2rem;
}

.dashboard-subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 1.1rem;
  font-weight: 300;
}

.header-stats {
  display: flex;
  gap: 1.5rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 1.5rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 180px;
}

.stat-icon {
  font-size: 2.5rem;
  opacity: 0.9;
}

.stat-info {
  color: white;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 0.25rem;
  color: white;
}

/* Actions Section */
.dashboard-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.btn-primary {
  background: linear-gradient(135deg, #6a0dad 0%, #8a2be2 100%);
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 16px rgba(106, 13, 173, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(106, 13, 173, 0.4);
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 1rem 1.5rem 1rem 3rem;
  border: 2px solid rgba(106, 13, 173, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #6a0dad;
  box-shadow: 0 0 0 3px rgba(106, 13, 173, 0.1);
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6a0dad;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem;
  color: #6a0dad;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f0ebff;
  border-top: 4px solid #6a0dad;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  border: 2px dashed rgba(106, 13, 173, 0.3);
  margin: 2rem 0;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.7;
}

.empty-state h3 {
  margin: 0 0 1rem 0;
  color: #6a0dad;
  font-size: 1.5rem;
}

.empty-state p {
  margin: 0 0 2rem 0;
  color: #666;
  font-size: 1.1rem;
}

/* Articles Grid */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.article-card {
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

.article-card::before {
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

.article-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 48px rgba(106, 13, 173, 0.2);
}

.article-card:hover::before {
  opacity: 1;
}

/* Thumbnail Styles */
.article-thumbnail {
  height: 200px;
  overflow: hidden;
  position: relative;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.article-card:hover .thumbnail-image {
  transform: scale(1.05);
}

.article-thumbnail-placeholder {
  height: 200px;
  background: linear-gradient(135deg, #f0ebff 0%, #e8e2ff 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8a2be2;
}

.thumbnail-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  opacity: 0.7;
}

.article-thumbnail-placeholder p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Card Content */
.card-content {
  padding: 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.article-title {
  margin: 0;
  color: #2d0076;
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.3;
  flex: 1;
}

.article-badge {
  background: rgba(106, 13, 173, 0.1);
  color: #6a0dad;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

/* Meta Information */
.article-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(106, 13, 173, 0.05);
  border-radius: 8px;
}

.meta-icon {
  font-size: 1rem;
  color: #6a0dad;
}

.meta-value {
  color: #555;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Article Preview */
.article-preview {
  position: relative;
}

.preview-text {
  margin: 0;
  color: #666;
  line-height: 1.6;
  font-size: 0.95rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.read-more {
  color: #6a0dad;
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 0.5rem;
  display: inline-block;
}

/* Slug */
.article-slug {
  background: rgba(106, 13, 173, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(106, 13, 173, 0.2);
}

.slug-label {
  display: block;
  font-weight: 600;
  color: #6a0dad;
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
}

.slug-value {
  color: #555;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  word-break: break-all;
}

/* Card Actions */
.card-actions {
  display: flex;
  gap: 0.75rem;
  padding: 0 2rem 2rem;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.card-actions.visible {
  opacity: 1;
  transform: translateY(0);
}

.btn-edit, .btn-delete {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
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
  background: rgba(74, 144, 226, 0.1);
  color: #4a90e2;
  border: 2px solid rgba(74, 144, 226, 0.3);
}

.btn-edit:hover {
  background: #4a90e2;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.btn-delete {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  border: 2px solid rgba(220, 53, 69, 0.3);
}

.btn-delete:hover {
  background: #dc3545;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.action-icon {
  font-size: 1rem;
}

/* Footer Stats */
.dashboard-footer {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(106, 13, 173, 0.1);
  margin-top: 3rem;
}

.footer-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
}

.footer-stat {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f4ff 0%, #f0ebff 100%);
  border-radius: 16px;
  border: 2px solid rgba(106, 13, 173, 0.1);
}

.stat-value {
  display: block;
  font-size: 2.5rem;
  font-weight: 800;
  color: #6a0dad;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-label {
  display: block;
  color: #666;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .footer-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .articles-grid {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1.5rem;
  }

  .dashboard-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .articles-grid {
    grid-template-columns: 1fr;
  }

  .article-meta {
    grid-template-columns: 1fr;
  }

  .footer-stats {
    grid-template-columns: 1fr;
  }

  .card-actions {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .dashboard-container {
    padding: 1rem;
  }

  .card-content {
    padding: 1.5rem;
  }

  .card-header {
    flex-direction: column;
    gap: 1rem;
  }

  .article-badge {
    align-self: flex-start;
  }
}
</style>
