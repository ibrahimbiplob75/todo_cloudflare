<template>
  <!-- Backdrop (visible on small screens when sidebar is open) -->
  <div
    v-if="sidebarOpen"
    @click="closeSidebar"
    class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity"
  ></div>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed md:static top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out',
      'w-64 max-w-[300px]',
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
          <i :class="['fas', item.icon, 'w-5']"></i>
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
import { useAuthStore } from '../../stores/auth'
import { useUIStore } from '../../stores/ui'

export default {
  name: 'SidebarComponent',
  data() {
    return {
      navigationItems: [
        { name: 'dashboard', label: 'Home', to: '/dashboard', icon: 'fa-home' },
        { name: 'profile', label: 'Profile', to: '/profile', icon: 'fa-user' },
        { name: 'project', label: 'Project', to: '#', icon: 'fa-folder', disabled: true },
        { name: 'todo', label: 'Todo', to: '#', icon: 'fa-tasks', disabled: true },
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
      return this.$route.path === route
    },
  },
}
</script>
