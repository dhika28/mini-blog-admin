import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

const routes = [
  { path: '/login', component: () => import('@/views/loginPage.vue') },
  { path: '/', component: () => import('@/views/DashboardPage.vue'), meta: { requiresAuth: true } },
  { path: '/categories', component: () => import('@/views/CategoriesPage.vue'), meta: { requiresAuth: true } },
  { path: '/articles', component: () => import('@/views/ArticlesPage.vue'), meta: { requiresAuth: true } },
  { path: '/users', component: () => import('@/views/UsersPage.vue'), meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

type RouteLocation = ReturnType<typeof router.resolve>

router.beforeEach((to: RouteLocation) => {
  const isAuthenticated = !!localStorage.getItem('token')
  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login'
  }
  return true
})

export default router
