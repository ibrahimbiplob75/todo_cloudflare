<template>
  <div class="rounded-lg border border-gray-200 bg-white p-4">
    <div class="flex items-center justify-between mb-3 gap-3">
      <h2 class="text-lg font-semibold text-gray-800">User Task Status Summary</h2>
      <div class="flex items-center gap-2">
        <select
          v-if="isWatcher"
          v-model="selectedUserId"
          @change="fetchSummary"
          class="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All Users</option>
          <option v-for="u in users" :key="u.userId" :value="String(u.userId)">
            {{ u.userName }}
          </option>
        </select>
        <button
          @click="fetchSummary"
          :disabled="loading"
          class="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-sm text-gray-500">Loading...</div>
    <div v-else-if="error" class="text-sm text-red-600">{{ error }}</div>
    <div v-else-if="filteredUsers.length === 0" class="text-sm text-gray-500">No task statistics found.</div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b text-left text-gray-600">
            <th class="py-2 pr-3">User</th>
            <th class="py-2 pr-3">Total</th>
            <th class="py-2 pr-3">Pending</th>
            <th class="py-2 pr-3">In Progress</th>
            <th class="py-2 pr-3">Completed</th>
            <th class="py-2 pr-3">Failed</th>
            <th class="py-2 pr-3">Hold</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredUsers" :key="row.userId" class="border-b last:border-b-0">
            <td class="py-2 pr-3">
              <div class="font-medium text-gray-800">{{ row.userName }}</div>
              <div class="text-xs text-gray-500">{{ row.email }}</div>
            </td>
            <td class="py-2 pr-3 font-semibold">{{ row.total }}</td>
            <td class="py-2 pr-3">{{ row.pending }}</td>
            <td class="py-2 pr-3">{{ row.inProgress }}</td>
            <td class="py-2 pr-3 text-green-700 font-medium">{{ row.completed }}</td>
            <td class="py-2 pr-3 text-red-700">{{ row.failed }}</td>
            <td class="py-2 pr-3 text-yellow-700">{{ row.hold }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { useAuthStore } from '@stores/auth'

const api = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default {
  name: 'UserTaskStatusSummary',
  data() {
    return {
      users: [],
      loading: false,
      error: null,
      selectedUserId: '',
    }
  },
  computed: {
    authStore() {
      return useAuthStore()
    },
    isWatcher() {
      return this.authStore.isWatcher
    },
    filteredUsers() {
      return this.users
    },
  },
  async mounted() {
    await this.fetchSummary()
  },
  methods: {
    async fetchSummary() {
      this.loading = true
      this.error = null
      try {
        const params = {}
        if (this.isWatcher && this.selectedUserId) {
          params.user_id = this.selectedUserId
        }

        const response = await api.get('/task/user-status-summary', { params })
        this.users = response.data.users || []
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to load user task summary'
        this.users = []
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
