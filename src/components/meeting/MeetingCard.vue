<template>
  <div
    class="p-4 rounded-lg shadow-sm border border-gray-200 mb-3 bg-white hover:shadow-md transition-shadow cursor-pointer"
    @click="viewMeeting"
  >
    <div class="flex justify-between items-start mb-2">
      <div class="flex-1">
        <h3 class="font-semibold text-gray-800 mb-1">{{ meeting.title || 'Untitled Meeting' }}</h3>
        <div class="flex items-center gap-3 text-sm text-gray-500 mb-2">
          <span v-if="projectName">
            <i class="fas fa-folder mr-1"></i>
            {{ projectName }}
          </span>
          <span>
            <i class="fas fa-calendar mr-1"></i>
            {{ formatDate(meeting.date) }}
          </span>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-2 mb-3">
      <span v-if="meeting.total_tasks > 0" class="px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 transition-colors">
        <i class="fas fa-tasks"></i>
        {{ meeting.total_tasks }} tasks
      </span>
      <span v-if="meeting.total_completed > 0" class="px-3 py-1 bg-green-50 text-green-600 rounded text-sm hover:bg-green-100 transition-colors">
        <i class="fas fa-check"></i>
        {{ meeting.total_completed }} completed
      </span>
      <span v-if="meeting.total_incompleted > 0" class="px-3 py-1 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100 transition-colors">
        <i class="fas fa-times"></i>
        {{ meeting.total_incompleted }} incompleted
      </span>
    </div>

    <p v-if="meeting.description" class="text-sm text-gray-600 mb-3 line-clamp-2">
      {{ meeting.description }}
    </p>

    <div class="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
      <span class="text-xs text-gray-500">
        <i class="fas fa-clock mr-1"></i>
        {{ formatTime(meeting.date) }}
      </span>
      
      <div class="flex gap-2">
        <router-link
          v-if="meeting.projectId"
          :to="{ name: 'meeting-details', params: { projectId: meeting.projectId, meetingId: meeting.id } }"
          @click.stop
          class="px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 transition-colors"
          title="Meeting task details"
        >
          <i class="fas fa-tasks"></i>
        </router-link>
        <button
          @click.stop="editMeeting"
          class="px-3 py-1 bg-gray-50 text-gray-600 rounded text-sm hover:bg-gray-100 transition-colors"
          title="Edit meeting"
        >
          <i class="fas fa-edit"></i>
        </button>
        <button
          @click.stop="deleteMeeting"
          class="px-3 py-1 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100 transition-colors"
          title="Delete meeting"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useProjectStore } from '@stores/project'

export default {
  name: 'MeetingCard',
  props: {
    meeting: {
      type: Object,
      required: true,
    },
  },
  computed: {
    projectStore() {
      return useProjectStore()
    },
    projectName() {
      if (!this.meeting.projectId) return null
      const project = this.projectStore.getProjectById(this.meeting.projectId)
      return project?.title || null
    },
  },
  methods: {
    viewMeeting() {
      this.$router.push({ name: 'meeting-view', params: { id: this.meeting.id } })
    },
    editMeeting() {
      this.$router.push({ name: 'meeting-edit', params: { id: this.meeting.id } })
    },
    deleteMeeting() {
      if (confirm(`Are you sure you want to delete this meeting?`)) {
        this.$emit('delete', this.meeting.id)
      }
    },
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      })
    },
    formatTime(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    },
  },
}
</script>
