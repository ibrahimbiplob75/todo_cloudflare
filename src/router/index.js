import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: { middleware: 'public', layout: 'public' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/dashboard/DashboardView.vue'),
      meta: { middleware: 'private', layout: 'private' },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/dashboard/ProfileView.vue'),
      meta: { middleware: 'private', layout: 'private' },
    },
    {
      path: '/profile/update',
      name: 'profile-update',
      component: () => import('../views/dashboard/ProfileUpdateView.vue'),
      meta: { middleware: 'private', layout: 'private' },
    },
    {
      path: '/projects',
      name: 'projects-all',
      component: () => import('../views/dashboard/projects/all.vue'),
      meta: { middleware: 'private', layout: 'private' },
    },
    {
      path: '/projects/create',
      name: 'project-create',
      component: () => import('../views/dashboard/projects/create.vue'),
      meta: { middleware: 'private', layout: 'private' },
    },
    {
      path: '/projects/:id',
      name: 'project-view',
      component: () => import('../views/dashboard/projects/view.vue'),
      meta: { middleware: 'private', layout: 'private' },
    },
    {
      path: '/projects/:id/update',
      name: 'project-update',
      component: () => import('../views/dashboard/projects/update.vue'),
      meta: { middleware: 'private', layout: 'private' },
    },
    {
      path: '/',
      redirect: '/login',
    },
  ],
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Check authentication status
  if (!authStore.isAuthenticated) {
    const hasAuth = await authStore.checkAuth()
    if (!hasAuth && to.meta.middleware === 'private') {
      // Redirect to login if not authenticated
      next({ name: 'login' })
      return
    }
  }

  // Redirect authenticated users away from login page
  if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }

  // Allow navigation
  next()
})

export default router
