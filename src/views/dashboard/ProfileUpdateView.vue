<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Update Profile</h1>
      <router-link
        to="/profile"
        class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
      >
        <i class="fas fa-arrow-left mr-2"></i>
        Back
      </router-link>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6">
      <form @submit.prevent="handleUpdate" class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter your email"
          />
        </div>

        <div v-if="error" class="text-red-600 text-sm">
          {{ error }}
        </div>

        <div v-if="success" class="text-green-600 text-sm">
          Profile updated successfully!
        </div>

        <div class="flex gap-3">
          <button
            type="submit"
            :disabled="loading"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="loading">Updating...</span>
            <span v-else>Update Profile</span>
          </button>
          
          <router-link
            to="/profile"
            class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../../stores/auth'

export default {
  name: 'ProfileUpdateView',
  data() {
    return {
      formData: {
        name: '',
        email: '',
      },
      error: '',
      success: false,
      loading: false,
    }
  },
  computed: {
    user() {
      return useAuthStore().user
    },
  },
  mounted() {
    if (this.user) {
      this.formData.name = this.user.name || ''
      this.formData.email = this.user.email || ''
    }
  },
  methods: {
    async handleUpdate() {
      this.error = ''
      this.success = false
      this.loading = true

      try {
        const authStore = useAuthStore()
        const userId = authStore.user?.id

        if (!userId) {
          throw new Error('User not found')
        }

        const response = await fetch(`/user/${userId}/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authStore.token}`,
          },
          body: JSON.stringify(this.formData),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Update failed')
        }

        // Update auth store with new user data
        await authStore.fetchProfile()
        
        this.success = true
        
        // Redirect to profile page after 1 second
        setTimeout(() => {
          this.$router.push({ name: 'profile' })
        }, 1000)
      } catch (error) {
        console.error('Update error:', error)
        this.error = error.message || 'Failed to update profile'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
