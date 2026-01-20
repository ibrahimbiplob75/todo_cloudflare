<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Profile</h1>
      <router-link
        to="/profile/update"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <i class="fas fa-edit mr-2"></i>
        Edit Profile
      </router-link>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6">
      <div v-if="loading" class="text-center py-8">
        <p class="text-gray-500">Loading profile...</p>
      </div>

      <div v-else-if="user" class="space-y-4">
        <div class="border-b border-gray-200 pb-4">
          <label class="text-sm font-medium text-gray-500">Name</label>
          <p class="text-lg text-gray-800 mt-1">{{ user.name }}</p>
        </div>

        <div class="border-b border-gray-200 pb-4">
          <label class="text-sm font-medium text-gray-500">Email</label>
          <p class="text-lg text-gray-800 mt-1">{{ user.email }}</p>
        </div>

        <div class="pb-4">
          <label class="text-sm font-medium text-gray-500">Member Since</label>
          <p class="text-lg text-gray-800 mt-1">{{ formatDate(user.createdAt) }}</p>
        </div>
      </div>

      <div v-else class="text-center py-8">
        <p class="text-red-600">Failed to load profile</p>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../../stores/auth'

export default {
  name: 'ProfileView',
  data() {
    return {
      loading: false,
    }
  },
  computed: {
    user() {
      return useAuthStore().user
    },
  },
  async mounted() {
    this.loading = true
    const authStore = useAuthStore()
    await authStore.fetchProfile()
    this.loading = false
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    },
  },
}
</script>
