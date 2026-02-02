<template>
  <!-- Backdrop (visible on small screens when sidebar is open) -->
  <div
    v-if="sidebarOpen"
    @click="closeSidebar"
    class="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 z-40 md:hidden transition-opacity"
  ></div>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed md:static top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out',
      'w-64 max-w-[300px] min-w-[250px]',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    ]"
  >
    <div class="flex flex-col h-full">
      <!-- Top Section: Navigation -->
      <nav class="flex-1 p-4 space-y-2">
        <router-link
          v-for="item in navigationItems"
          :key="item.name"
          :to="item.disabled ? '#' : item.to"
          @click="(e) => handleNavClick(e, item)"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
            isActive(item.to) 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-gray-700 hover:bg-gray-100',
            item.disabled ? 'opacity-50 cursor-not-allowed' : ''
          ]"
        >
          <i :class="[...(item.icon.includes(' ') ? item.icon.split(' ') : ['fas', item.icon]), 'w-5']"></i>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Bottom Section: Logout -->
      <div class="p-4 border-t border-gray-200">
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <i class="fas fa-sign-out-alt w-5"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script>
import { useAuthStore } from '@stores/auth'
import { useUIStore } from '@stores/ui'

export default {
  name: 'SidebarComponent',
  data() {
    return {
      navigationItems: [
        { name: 'dashboard', label: 'Home', to: '/dashboard', icon: 'fa-home' },
        { name: 'profile', label: 'Profile', to: '/profile', icon: 'fa-user' },
        { name: 'project', label: 'Projects', to: '/projects', icon: 'fa-folder', disabled: false },
        { name: 'meetings', label: 'Meetings', to: '/meetings', icon: 'fa-calendar-alt', disabled: false },
        { name: 'tasks', label: 'Tasks', to: '/tasks', icon: 'fa-tasks', disabled: false },
        { name: 'today-tasks', label: 'Today Tasks', to: '/today-tasks', icon: 'far fa-square', disabled: false },
        { name: 'completed-tasks', label: 'Completed Tasks', to: '/completed-tasks', icon: 'fa-check-square', disabled: false },
        { name: 'kanban', label: 'Kanban Board', to: '/kanban-board', icon: 'fa-columns', disabled: false },
      ],
    }
  },
  computed: {
    sidebarOpen() {
      return useUIStore().sidebarOpen
    },
  },
  methods: {
    closeSidebar() {
      const uiStore = useUIStore()
      uiStore.closeSidebar()
    },
    handleNavClick(event, item) {
      // Prevent navigation for disabled items
      if (item.disabled || item.to === '#') {
        event.preventDefault()
        return
      }
      
      // Close sidebar on mobile after navigation
      if (window.innerWidth < 768) {
        this.closeSidebar()
      }
    },
    handleLogout() {
      if (confirm('Are you sure you want to logout?')) {
        const authStore = useAuthStore()
        authStore.logout()
        this.closeSidebar()
        this.$router.push({ name: 'login' })
      }
    },
    isActive(route) {
      // Exact match
      if (this.$route.path === route) return true
      
      // For projects routes, check if path starts with /projects
      if (route === '/projects' && this.$route.path.startsWith('/projects')) {
        return true
      }
      
      // For tasks routes, check if path starts with /tasks
      if (route === '/tasks' && this.$route.path.startsWith('/tasks')) {
        return true
      }
      
      // For meetings routes, check if path starts with /meetings
      if (route === '/meetings' && this.$route.path.startsWith('/meetings')) {
        return true
      }

      if (route === '/today-tasks' && this.$route.path.startsWith('/today-tasks')) {
        return true
      }
      if (route === '/completed-tasks' && this.$route.path.startsWith('/completed-tasks')) {
        return true
      }
      if (route === '/kanban-board' && this.$route.path.startsWith('/kanban-board')) {
        return true
      }

      return false
    },
  },
}
</script>
