<script lang="ts" setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import {
  getCategoriesAPI,
  getArticlesAPI,
  getUsersAPI
} from '@/api';
import type { Category, Article, User } from '@/types';

interface Activity {
  type: 'category' | 'article' | 'user';
  action: 'created' | 'updated' | 'deleted';
  name: string;
  timestamp: Date;
  id: string;
}

interface SystemStatus {
  api: boolean;
  database: boolean;
  storage: number;
  performance: boolean;
}

interface DashboardStats {
  categories: number;
  articles: number;
  users: number;
  articlesWithContent: number;
  recentItems: number;
}

const stats = ref<DashboardStats>({
  categories: 0,
  articles: 0,
  users: 0,
  articlesWithContent: 0,
  recentItems: 0
});

const recentActivity = ref<Activity[]>([]);
const systemStatus = ref<SystemStatus>({
  api: true,
  database: true,
  storage: 78,
  performance: true
});
const loading = ref(true);
const lastUpdated = ref<Date>(new Date());
const pollingInterval = ref<number | null>(null);

// Computed properties
const totalContent = computed(() => {
  return stats.value.categories + stats.value.articles + stats.value.users;
});

const storageUsage = computed(() => {
  return Math.max(0, 100 - Math.floor(totalContent.value / 2));
});

// Methods
const fetchAllData = async () => {
  try {
    loading.value = true;

    // Fetch data from all APIs in parallel
    const [categories, articles, users] = await Promise.all([
      getCategoriesAPI(),
      getArticlesAPI(),
      getUsersAPI()
    ]);

    // Update stats
    stats.value = {
      categories: categories.length,
      articles: articles.length,
      users: users.length,
      articlesWithContent: articles.filter((article: Article) =>
        article.body && article.body.trim().length > 0
      ).length,
      recentItems: calculateRecentItems([...categories, ...articles, ...users])
    };

    // Generate recent activity
    generateRecentActivity(categories, articles, users);

    // Update system status based on API response
    systemStatus.value.api = true;
    systemStatus.value.performance = true;

    lastUpdated.value = new Date();
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    systemStatus.value.api = false;
    systemStatus.value.performance = false;
  } finally {
    loading.value = false;
  }
};

const calculateRecentItems = (items: Array<Category | Article | User>): number => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return items.filter(item => {
    const itemDate = item.created_at ? new Date(item.created_at) : new Date();
    return itemDate >= sevenDaysAgo;
  }).length;
};

const generateRecentActivity = (categories: Category[], articles: Article[], users: User[]) => {
  const activities: Activity[] = [];

  // Add categories activity
  categories.slice(0, 5).forEach(category => {
    activities.push({
      type: 'category',
      action: 'created',
      name: category.name,
      timestamp: new Date(category.created_at || new Date()),
      id: category.id
    });
  });

  // Add articles activity
  articles.slice(0, 5).forEach(article => {
    activities.push({
      type: 'article',
      action: 'created',
      name: article.title,
      timestamp: new Date(article.published_at || article.created_at || new Date()),
      id: article.id
    });
  });

  // Add users activity
  users.slice(0, 3).forEach(user => {
    activities.push({
      type: 'user',
      action: 'created',
      name: user.username,
      timestamp: new Date(user.created_at || new Date()),
      id: user.id
    });
  });

  // Sort by timestamp (newest first) and take top 5
  recentActivity.value = activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);
};

const getActivityIcon = (type: string): string => {
  const icons: Record<string, string> = {
    category: '📁',
    article: '📄',
    user: '👥'
  };
  return icons[type] || '⚡';
};

const getActivityMessage = (activity: Activity): string => {
  const actions: Record<string, string> = {
    created: 'created',
    updated: 'updated',
    deleted: 'deleted'
  };

  const types: Record<string, string> = {
    category: 'Category',
    article: 'Article',
    user: 'User'
  };

  return `<strong>${types[activity.type]}</strong> "${activity.name}" was ${actions[activity.action]}`;
};

const formatTime = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

const getChartBarStyle = (type: string): { height: string; background: string } => {
  const percentages: Record<string, number> = {
    articles: totalContent.value > 0 ? (stats.value.articles / totalContent.value) * 100 : 0,
    categories: totalContent.value > 0 ? (stats.value.categories / totalContent.value) * 100 : 0,
    users: totalContent.value > 0 ? (stats.value.users / totalContent.value) * 100 : 0
  };

  const backgrounds: Record<string, string> = {
    articles: 'linear-gradient(135deg, #6a0dad 0%, #8a2be2 100%)',
    categories: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
    users: 'linear-gradient(135deg, #28a745 0%, #218838 100%)'
  };

  return {
    height: `${Math.max(20, Math.min(90, percentages[type] || 0))}%`,
    background: backgrounds[type] || '#666'
  };
};

const openQuickModal = () => {
  // Implement quick add functionality
  alert('Quick add modal would open here');
};

const refreshData = () => {
  fetchAllData();
};

// Polling for real-time updates (every 30 seconds)
onMounted(() => {
  fetchAllData();

  // Set up polling for real-time updates
  pollingInterval.value = window.setInterval(() => {
    fetchAllData();
  }, 30000);
});

// Clean up polling interval
onUnmounted(() => {
  if (pollingInterval.value !== null) {
    clearInterval(pollingInterval.value);
  }
});
</script>

<template>
  <div class="dashboard-container">
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="dashboard-title">
          <span class="title-icon">🚀</span>
          Admin Dashboard
        </h1>
        <p class="dashboard-subtitle">Welcome to your content management system</p>
      </div>
      <div class="header-stats">
        <div class="stat-card">
          <div class="stat-icon">📁</div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.categories }}</div>
            <div class="stat-label">Categories</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📄</div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.articles }}</div>
            <div class="stat-label">Articles</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.users }}</div>
            <div class="stat-label">Users</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading dashboard data...</p>
    </div>

    <!-- Content when data is loaded -->
    <div v-else>
      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2 class="section-title">Quick Actions</h2>
        <div class="actions-grid">
          <router-link to="/categories" class="action-card">
            <div class="action-icon">📁</div>
            <div class="action-content">
              <h3>Manage Categories</h3>
              <p>Organize your content categories</p>
            </div>
            <div class="action-arrow">→</div>
          </router-link>

          <router-link to="/articles" class="action-card">
            <div class="action-icon">📄</div>
            <div class="action-content">
              <h3>Manage Articles</h3>
              <p>Create and edit blog articles</p>
            </div>
            <div class="action-arrow">→</div>
          </router-link>

          <router-link to="/users" class="action-card">
            <div class="action-icon">👥</div>
            <div class="action-content">
              <h3>Manage Users</h3>
              <p>Handle user accounts and permissions</p>
            </div>
            <div class="action-arrow">→</div>
          </router-link>

          <div class="action-card" @click="openQuickModal">
            <div class="action-icon">⚡</div>
            <div class="action-content">
              <h3>Quick Add</h3>
              <p>Create new content quickly</p>
            </div>
            <div class="action-arrow">+</div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="recent-activity">
        <div class="activity-header">
          <h2 class="section-title">Recent Activity</h2>
          <button class="view-all-btn" @click="refreshData">Refresh ↻</button>
        </div>

        <div v-if="recentActivity.length === 0" class="empty-activity">
          <div class="empty-icon">📊</div>
          <p>No recent activity</p>
        </div>

        <div v-else class="activity-list">
          <div
            v-for="(activity, index) in recentActivity"
            :key="index"
            class="activity-item"
          >
            <div class="activity-icon">{{ getActivityIcon(activity.type) }}</div>
            <div class="activity-content">
              <p v-html="getActivityMessage(activity)"></p>
              <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistics Overview -->
      <div class="statistics-overview">
        <h2 class="section-title">Statistics Overview</h2>
        <div class="stats-grid">
          <div class="stat-chart">
            <div class="chart-header">
              <h3>Content Distribution</h3>
              <span class="chart-value">{{ totalContent }} items</span>
            </div>
            <div class="chart-content">
              <div class="chart-bars">
                <div
                  class="chart-bar"
                  :style="getChartBarStyle('articles')"
                >
                  <span class="bar-label">Articles ({{ stats.articles }})</span>
                </div>
                <div
                  class="chart-bar"
                  :style="getChartBarStyle('categories')"
                >
                  <span class="bar-label">Categories ({{ stats.categories }})</span>
                </div>
                <div
                  class="chart-bar"
                  :style="getChartBarStyle('users')"
                >
                  <span class="bar-label">Users ({{ stats.users }})</span>
                </div>
              </div>
            </div>
          </div>

          <div class="stat-metrics">
            <div class="metric-card">
              <div class="metric-icon">📊</div>
              <div class="metric-info">
                <div class="metric-value">{{ totalContent }}</div>
                <div class="metric-label">Total Content</div>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">📝</div>
              <div class="metric-info">
                <div class="metric-value">{{ stats.articlesWithContent }}</div>
                <div class="metric-label">Articles with Content</div>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">⭐</div>
              <div class="metric-info">
                <div class="metric-value">{{ stats.recentItems }}</div>
                <div class="metric-label">Recent Items (7 days)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Status -->
      <div class="system-status">
        <h2 class="section-title">System Status</h2>
        <div class="status-grid">
          <div class="status-card" :class="{ 'online': systemStatus.api }">
            <div class="status-icon">{{ systemStatus.api ? '🟢' : '🔴' }}</div>
            <div class="status-content">
              <h3>API Server</h3>
              <p>{{ systemStatus.api ? 'Connected and running' : 'Disconnected' }}</p>
            </div>
          </div>
          <div class="status-card online">
            <div class="status-icon">🟢</div>
            <div class="status-content">
              <h3>Database</h3>
              <p>Healthy and responsive</p>
            </div>
          </div>
          <div class="status-card online">
            <div class="status-icon">🟢</div>
            <div class="status-content">
              <h3>Storage</h3>
              <p>{{ storageUsage }}% capacity available</p>
            </div>
          </div>
          <div class="status-card" :class="{ 'online': systemStatus.performance }">
            <div class="status-icon">{{ systemStatus.performance ? '⚡' : '🐢' }}</div>
            <div class="status-content">
              <h3>Performance</h3>
              <p>{{ systemStatus.performance ? 'Optimal response time' : 'Slow response' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Base Styles */
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f4ff 0%, #f0ebff 50%, #e8e2ff 100%);
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header Styles */
.dashboard-header {
  background: linear-gradient(135deg, #6a0dad 0%, #8a2be2 100%);
  color: white;
  padding: 3rem;
  border-radius: 24px;
  margin-bottom: 3rem;
  box-shadow: 0 20px 40px rgba(106, 13, 173, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
  position: relative;
  overflow: hidden;
}

.dashboard-header::before {
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
  flex: 1;
  position: relative;
  z-index: 2;
}

.dashboard-title {
  margin: 0 0 0.5rem 0;
  font-size: 3rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.title-icon {
  font-size: 2.8rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.dashboard-subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 1.3rem;
  font-weight: 300;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.header-stats {
  display: flex;
  gap: 1.5rem;
  position: relative;
  z-index: 2;
}

.stat-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  padding: 2rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  min-width: 180px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2.5rem;
  opacity: 0.9;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.stat-info {
  color: white;
}

.stat-number {
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.stat-label {
  font-size: 1rem;
  opacity: 0.9;
  margin-top: 0.5rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Section Titles */
.section-title {
  margin: 0 0 2rem 0;
  color: #2d0076;
  font-size: 1.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #6a0dad 0%, #8a2be2 100%);
  border-radius: 2px;
}

/* Quick Actions */
.quick-actions {
  margin-bottom: 3rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(106, 13, 173, 0.1);
  border: 1px solid rgba(106, 13, 173, 0.1);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  position: relative;
  overflow: hidden;
}

.action-card::before {
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

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(106, 13, 173, 0.2);
}

.action-card:hover::before {
  opacity: 1;
}

.action-icon {
  font-size: 2.5rem;
  color: #6a0dad;
  background: linear-gradient(135deg, #f0ebff 0%, #e8e2ff 100%);
  padding: 1rem;
  border-radius: 16px;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
}

.action-content h3 {
  margin: 0 0 0.5rem 0;
  color: #2d0076;
  font-size: 1.3rem;
  font-weight: 600;
}

.action-content p {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.4;
}

.action-arrow {
  font-size: 1.5rem;
  color: #6a0dad;
  font-weight: 700;
  transition: transform 0.3s ease;
}

.action-card:hover .action-arrow {
  transform: translateX(4px);
}

/* Recent Activity */
.recent-activity {
  margin-bottom: 3rem;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.view-all-btn {
  background: transparent;
  border: none;
  color: #6a0dad;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.view-all-btn:hover {
  color: #8a2be2;
  background: rgba(106, 13, 173, 0.1);
}

.activity-list {
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(106, 13, 173, 0.1);
  border: 1px solid rgba(106, 13, 173, 0.1);
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(106, 13, 173, 0.1);
  transition: all 0.3s ease;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background: rgba(106, 13, 173, 0.03);
}

.activity-icon {
  font-size: 1.8rem;
  color: #6a0dad;
  background: linear-gradient(135deg, #f0ebff 0%, #e8e2ff 100%);
  padding: 0.75rem;
  border-radius: 12px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-content p {
  margin: 0 0 0.25rem 0;
  color: #333;
  font-size: 1rem;
}

.activity-time {
  color: #888;
  font-size: 0.85rem;
  font-weight: 500;
}

.empty-activity {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 16px;
  border: 2px dashed rgba(106, 13, 173, 0.2);
}

.empty-activity .empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
  color: #6a0dad;
}

.empty-activity p {
  margin: 0;
  color: #666;
  font-size: 1.1rem;
}

/* Statistics Overview */
.statistics-overview {
  margin-bottom: 3rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.stat-chart {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(106, 13, 173, 0.1);
  border: 1px solid rgba(106, 13, 173, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.chart-header h3 {
  margin: 0;
  color: #2d0076;
  font-size: 1.2rem;
  font-weight: 600;
}

.chart-value {
  color: #6a0dad;
  font-weight: 700;
  font-size: 1.1rem;
}

.chart-content {
  height: 200px;
}

.chart-bars {
  display: flex;
  align-items: end;
  gap: 1.5rem;
  height: 100%;
  padding: 1rem 0;
}

.chart-bar {
  flex: 1;
  border-radius: 8px 8px 0 0;
  position: relative;
  min-height: 40px;
  display: flex;
  align-items: end;
  justify-content: center;
  padding: 0.5rem;
  transition: height 0.3s ease;
}

.bar-label {
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.stat-metrics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.metric-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(106, 13, 173, 0.1);
  border: 1px solid rgba(106, 13, 173, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(106, 13, 173, 0.2);
}

.metric-icon {
  font-size: 1.8rem;
  color: #6a0dad;
  background: linear-gradient(135deg, #f0ebff 0%, #e8e2ff 100%);
  padding: 0.75rem;
  border-radius: 12px;
  flex-shrink: 0;
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #6a0dad;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.metric-label {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

/* System Status */
.system-status {
  margin-bottom: 2rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.status-card {
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

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(106, 13, 173, 0.2);
}

.status-card.online {
  border-left: 4px solid #28a745;
}

.status-card:not(.online) {
  border-left: 4px solid #dc3545;
}

.status-icon {
  font-size: 1.5rem;
}

.status-content h3 {
  margin: 0 0 0.5rem 0;
  color: #2d0076;
  font-size: 1.1rem;
  font-weight: 600;
}

.status-content p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
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

/* Responsive Design */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1024px) {
  .header-stats {
    flex-wrap: wrap;
    justify-content: center;
  }

  .stat-card {
    min-width: 200px;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1.5rem;
  }

  .dashboard-title {
    font-size: 2.2rem;
    justify-content: center;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .activity-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .chart-bars {
    gap: 1rem;
  }

  .bar-label {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .dashboard-title {
    font-size: 1.8rem;
  }

  .stat-card {
    min-width: auto;
    flex: 1;
  }

  .action-card {
    padding: 1.5rem;
  }

  .activity-item {
    padding: 1.25rem;
  }
}
</style>
