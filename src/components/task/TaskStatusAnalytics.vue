<template>
  <div class="task-status-analytics">
    <h2 class="text-lg font-semibold text-gray-800 mb-3">Task Status</h2>
    <div v-if="loading" class="text-gray-500 text-sm">Loading...</div>
    <div v-else-if="error" class="text-red-600 text-sm">{{ error }}</div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <div
        v-for="item in statuses"
        :key="item.status"
        role="button"
        tabindex="0"
        class="rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        :class="statusClasses[item.status] || 'border-gray-200 bg-white'"
        @click="goToStatusTasks(item.status)"
        @keydown.enter="goToStatusTasks(item.status)"
      >
        <div class="font-medium truncate" :class="statusTextClasses[item.status] || 'text-gray-800'">
          {{ item.label }}
        </div>
        <div class="mt-2 text-lg font-semibold" :class="statusTextClasses[item.status] || 'text-gray-600'">
          {{ item.count }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

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
  name: 'TaskStatusAnalytics',
  data() {
    return {
      statuses: [],
      loading: false,
      error: null,
      statusClasses: {
        pending: 'border-gray-200 bg-gray-50',
        in_progress: 'border-blue-200 bg-blue-50',
        completed: 'border-green-200 bg-green-50',
        failed: 'border-red-200 bg-red-50',
        hold: 'border-yellow-200 bg-yellow-50',
      },
      statusTextClasses: {
        pending: 'text-gray-700',
        in_progress: 'text-blue-700',
        completed: 'text-green-700',
        failed: 'text-red-700',
        hold: 'text-yellow-800',
      },
    }
  },
  async mounted() {
    await this.fetchAnalytics()
  },
  methods: {
    goToStatusTasks(taskStatus) {
      this.$router.push({
        path: '/tasks',
        query: { task_status: taskStatus },
      })
    },
    async fetchAnalytics() {
      this.loading = true
      this.error = null
      try {
        const res = await api.get('/task/analytics')
        this.statuses = res.data.statuses || []
      } catch (err) {
        this.error = err.response?.data?.error || err.message || 'Failed to load analytics'
        this.statuses = []
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
