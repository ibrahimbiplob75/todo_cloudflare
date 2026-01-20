<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="flex justify-between items-center px-6 py-4">
      <!-- Left: Toggle Button (visible on small screens) -->
      <button
        @click="toggleSidebar"
        class="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Toggle sidebar"
      >
        <i class="fas fa-bars text-gray-600"></i>
      </button>

      <!-- Right: Profile Name and Logout -->
      <div class="flex items-center gap-3 ml-auto">
        <span class="text-gray-700 font-medium">{{ userName }}</span>
        <button
          @click="handleLogout"
          class="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Logout"
        >
          <i class="fas fa-sign-out-alt text-gray-600"></i>
        </button>
      </div>
    </div>
  </header>
</template>

<script>
import { useAuthStore } from '../../stores/auth'
import { useUIStore } from '../../stores/ui'

export default {
  name: 'HeaderComponent',
  computed: {
    userName() {
      return useAuthStore().userName
    },
  },
  methods: {
    toggleSidebar() {
      const uiStore = useUIStore()
      uiStore.toggleSidebar()
    },
    handleLogout() {
      if (confirm('Are you sure you want to logout?')) {
        const authStore = useAuthStore()
        authStore.logout()
        this.$router.push({ name: 'login' })
      }
    },
  },
}
</script>
