<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Meeting Details</h1>
      <div class="flex gap-2">
        <router-link
          v-if="isWatcher"
          :to="{ name: 'meeting-edit', params: { id: meetingId } }"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <i class="fas fa-edit mr-2"></i>
          Edit
        </router-link>
        <router-link
          to="/meetings"
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          <i class="fas fa-arrow-left mr-2"></i>
          Back to Meetings
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !meeting" class="text-center py-12">
      <p class="text-gray-500">Loading meeting...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && !meeting" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-600">{{ error }}</p>
      <button
        @click="fetchMeeting"
        class="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </div>

    <!-- Meeting Details -->
    <div v-else-if="meeting" class="bg-white rounded-lg shadow-md p-6 space-y-6">
      <!-- Header -->
      <div class="border-b border-gray-200 pb-4">
        <div class="flex justify-between items-start mb-2">
          <div>
            <h2 class="text-2xl font-bold text-gray-800 mb-1">
              {{ meeting.title || 'Untitled Meeting' }}
            </h2>
            <div class="flex items-center gap-4 text-sm text-gray-600 mt-2">
              <span>
                <i class="fas fa-calendar mr-1"></i>
                {{ formatDate(meeting.date) }}
              </span>
              <span>
                <i class="fas fa-clock mr-1"></i>
                {{ formatTime(meeting.date) }}
              </span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-4 text-sm text-gray-500 mt-2">
          <span v-if="projectName">
            <i class="fas fa-folder mr-1"></i>
            {{ projectName }}
          </span>
          <span v-if="meeting.slug" class="text-xs bg-gray-100 px-2 py-1 rounded">
            <i class="fas fa-link mr-1"></i>
            {{ meeting.slug }}
          </span>
        </div>
      </div>

      <!-- Description -->
      <div v-if="meeting.description">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Description</h3>
        <p class="text-gray-600 whitespace-pre-wrap">{{ meeting.description }}</p>
      </div>

      <!-- Metadata -->
      <div class="border-t border-gray-200 pt-4 text-sm text-gray-500">
        <div class="flex items-center gap-4">
          <span>
            <i class="fas fa-calendar mr-1"></i>
            Created: {{ formatDateTime(meeting.createdAt) }}
          </span>
          <span>
            <i class="fas fa-clock mr-1"></i>
            Updated: {{ formatDateTime(meeting.updatedAt) }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="border-t border-gray-200 pt-4 flex gap-2">
        <button
          v-if="isWatcher"
          @click="handleDelete"
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <i class="fas fa-trash mr-2"></i>
          Delete Meeting
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useMeetingStore } from '@stores/meeting'
import { useProjectStore } from '@stores/project'
import { useAuthStore } from '@stores/auth'

export default {
  name: 'MeetingViewView',
  data() {
    return {
      loading: false,
      error: '',
    }
  },
  computed: {
    meetingId() {
      return parseInt(this.$route.params.id)
    },
    meetingStore() {
      return useMeetingStore()
    },
    projectStore() {
      return useProjectStore()
    },
    authStore() {
      return useAuthStore()
    },
    isWatcher() {
      return this.authStore.isWatcher
    },
    meeting() {
      return this.meetingStore.currentMeeting || this.meetingStore.getMeetingById(this.meetingId)
    },
    projectName() {
      if (!this.meeting?.projectId) return null
      const project = this.projectStore.getProjectById(this.meeting.projectId)
      return project?.title || null
    },
  },
  async mounted() {
    await this.fetchMeeting()
    // Fetch projects if needed
    if (this.projectStore.projects.length === 0) {
      await this.projectStore.fetchProjects()
    }
  },
  methods: {
    async fetchMeeting() {
      this.loading = true
      this.error = ''

      const result = await this.meetingStore.fetchMeetingById(this.meetingId)

      if (!result.success) {
        this.error = result.error
      }

      this.loading = this.meetingStore.loading
    },
    async handleDelete() {
      if (confirm('Are you sure you want to delete this meeting?')) {
        const result = await this.meetingStore.deleteMeeting(this.meetingId)
        if (result.success) {
          this.$router.push({ name: 'meetings-list' })
        } else {
          alert(result.error || 'Failed to delete meeting')
        }
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    },
    formatTime(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    },
    formatDateTime(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
  },
}
</script>
