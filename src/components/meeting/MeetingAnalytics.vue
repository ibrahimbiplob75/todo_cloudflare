<template>
  <div class="meeting-analytics">
    <h2 class="text-lg font-semibold text-gray-800 mb-3">Meeting Analytics</h2>
    <div v-if="loading" class="text-gray-500 text-sm">Loading...</div>
    <div v-else-if="error" class="text-red-600 text-sm">{{ error }}</div>
    <div v-else-if="meetings.length === 0" class="text-gray-500 text-sm">No meetings with incomplete tasks.</div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      <div
        v-for="meeting in meetings"
        :key="meeting.id"
        role="button"
        tabindex="0"
        class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        @click="goToMeetingTasks(meeting)"
        @keydown.enter="goToMeetingTasks(meeting)"
      >
        <div class="font-medium text-gray-800 truncate" :title="meeting.title">
          {{ meeting.title }}
        </div>
        <div class="mt-2 text-sm text-gray-500 font-medium">
          {{ meeting.completedCount }}/{{ meeting.totalCount }}
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
  name: 'MeetingAnalytics',
  data() {
    return {
      meetings: [],
      loading: false,
      error: null,
    }
  },
  async mounted() {
    await this.fetchAnalytics()
  },
  methods: {
    goToMeetingTasks(meeting) {
      this.$router.push({
        path: '/tasks',
        query: {
          project_id: meeting.projectId,
          project_meeting_id: meeting.id,
        },
      })
    },
    async fetchAnalytics() {
      this.loading = true
      this.error = null
      try {
        const res = await api.get('/meeting/analytics')
        this.meetings = res.data.meetings || []
      } catch (err) {
        this.error = err.response?.data?.error || err.message || 'Failed to load analytics'
        this.meetings = []
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
