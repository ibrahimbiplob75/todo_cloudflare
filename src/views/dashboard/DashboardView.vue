<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
    
    <div class="bg-white rounded-lg shadow-md p-6">
      <p class="text-gray-600">
        Welcome to your dashboard, <span class="font-semibold text-gray-800">{{ userName }}</span>!
      </p>
      
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-blue-50 rounded-lg">
          <h3 class="font-semibold text-blue-800 mb-2">Profile</h3>
          <p class="text-sm text-blue-600">Manage your profile information</p>
        </div>
        
        <div class="p-4 bg-gray-50 rounded-lg opacity-50">
          <h3 class="font-semibold text-gray-600 mb-2">Projects</h3>
          <p class="text-sm text-gray-500">Coming soon</p>
        </div>
        
        <div class="p-4 bg-gray-50 rounded-lg opacity-50">
          <h3 class="font-semibold text-gray-600 mb-2">Todos</h3>
          <p class="text-sm text-gray-500">Coming soon</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../../stores/auth'

export default {
  name: 'DashboardView',
  computed: {
    userName() {
      return useAuthStore().userName
    },
  },
}
</script>
