<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Task Details</h1>
      <div class="flex gap-2">
        <router-link
          :to="{ name: 'task-edit', params: { id: taskId } }"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <i class="fas fa-edit mr-2"></i>
          Edit
        </router-link>
        <router-link
          to="/tasks"
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          <i class="fas fa-arrow-left mr-2"></i>
          Back to Tasks
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !task" class="text-center py-12">
      <p class="text-gray-500">Loading task...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && !task" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-600">{{ error }}</p>
      <button
        @click="fetchTask"
        class="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </div>

    <!-- Task Details -->
    <div v-else-if="task" class="bg-white rounded-lg shadow-md p-6 space-y-6">
      <!-- Header -->
      <div class="border-b border-gray-200 pb-4">
        <div class="flex justify-between items-start mb-2">
          <h2 class="text-2xl font-bold text-gray-800">{{ task.title }}</h2>
          <span
            :class="[
              'px-3 py-1 rounded text-sm font-semibold',
              priorityClasses[task.priority] || 'bg-gray-100 text-gray-700'
            ]"
          >
            {{ task.priority }}
          </span>
        </div>
        <div class="flex items-center gap-4 text-sm text-gray-500 mt-2">
          <span
            :class="[
              'px-2 py-1 rounded font-medium',
              statusClasses[task.taskStatus] || 'bg-gray-100 text-gray-700'
            ]"
          >
            {{ formatStatus(task.taskStatus) }}
          </span>
          <span v-if="projectName">
            <i class="fas fa-folder mr-1"></i>
            {{ projectName }}
          </span>
          <span v-if="meetingName">
            <i class="fas fa-calendar-alt mr-1"></i>
            {{ meetingName }}
          </span>
        </div>
      </div>

      <!-- Description -->
      <div v-if="task.description">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Description</h3>
        <p class="text-gray-600 whitespace-pre-wrap">{{ task.description }}</p>
      </div>

      <!-- Dates Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-if="task.submissionDate">
          <h3 class="text-sm font-medium text-gray-500 mb-1">Submission Date</h3>
          <p class="text-gray-800">{{ formatDateTime(task.submissionDate) }}</p>
        </div>
        <div v-if="task.executionDate">
          <h3 class="text-sm font-medium text-gray-500 mb-1">Execution Date</h3>
          <p class="text-gray-800">{{ formatDateTime(task.executionDate) }}</p>
        </div>
        <div v-if="task.targetDate">
          <h3 class="text-sm font-medium text-gray-500 mb-1">Target Date</h3>
          <p class="text-gray-800">{{ formatDateTime(task.targetDate) }}</p>
        </div>
        <div v-if="task.completionDate">
          <h3 class="text-sm font-medium text-gray-500 mb-1">Completion Date</h3>
          <p class="text-gray-800">{{ formatDateTime(task.completionDate) }}</p>
        </div>
        <div v-if="task.totalDuration !== null && task.totalDuration !== undefined">
          <h3 class="text-sm font-medium text-gray-500 mb-1">Total Duration</h3>
          <p class="text-gray-800">{{ formatDuration(task.totalDuration) }}</p>
        </div>
      </div>

      <!-- Comment -->
      <div v-if="task.comment" class="border-t border-gray-200 pt-4">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Comment</h3>
        <p class="text-gray-600 whitespace-pre-wrap">{{ task.comment }}</p>
      </div>

      <!-- Metadata -->
      <div class="border-t border-gray-200 pt-4 text-sm text-gray-500">
        <div class="flex items-center gap-4">
          <span>
            <i class="fas fa-calendar mr-1"></i>
            Created: {{ formatDateTime(task.createdAt) }}
          </span>
          <span>
            <i class="fas fa-clock mr-1"></i>
            Updated: {{ formatDateTime(task.updatedAt) }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="border-t border-gray-200 pt-4 flex gap-2">
        <button
          v-if="task.taskStatus === 'pending'"
          @click="startTask"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <i class="fas fa-play mr-2"></i>
          Start Work
        </button>
        <button
          v-if="task.executionDate && task.taskStatus !== 'completed'"
          @click="completeTask"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <i class="fas fa-check mr-2"></i>
          Mark Complete
        </button>
        <button
          @click="handleSoftDelete"
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <i class="fas fa-trash mr-2"></i>
          Remove Task
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useTaskStore } from '@stores/task'
import { useProjectStore } from '@stores/project'
import { useMeetingStore } from '@stores/meeting'

export default {
  name: 'TaskViewView',
  data() {
    return {
      loading: false,
      error: '',
    }
  },
  computed: {
    taskId() {
      return parseInt(this.$route.params.id)
    },
    taskStore() {
      return useTaskStore()
    },
    projectStore() {
      return useProjectStore()
    },
    meetingStore() {
      return useMeetingStore()
    },
    task() {
      return this.taskStore.currentTask || this.taskStore.getTaskById(this.taskId)
    },
    projectName() {
      if (this.task?.projectName != null) return this.task.projectName
      if (!this.task?.projectId) return null
      const project = this.projectStore.getProjectById(this.task.projectId)
      return project?.title ?? null
    },
    meetingName() {
      if (this.task?.meetingName != null) return this.task.meetingName
      if (!this.task?.projectMeetingId) return null
      const meeting = this.meetingStore.getMeetingById(this.task.projectMeetingId)
      return meeting?.title ?? null
    },
    priorityClasses() {
      return {
        low: 'bg-blue-100 text-blue-700',
        mid: 'bg-yellow-100 text-yellow-700',
        high: 'bg-orange-100 text-orange-700',
        urgent: 'bg-red-100 text-red-700',
      }
    },
    statusClasses() {
      return {
        pending: 'bg-gray-100 text-gray-700',
        in_progress: 'bg-blue-100 text-blue-700',
        completed: 'bg-green-100 text-green-700',
        failed: 'bg-red-100 text-red-700',
        hold: 'bg-yellow-100 text-yellow-700',
      }
    },
  },
  async mounted() {
    await this.fetchTask()
    // Fetch projects if needed
    if (this.projectStore.projects.length === 0) {
      await this.projectStore.fetchProjects()
    }
    // Fetch meetings if needed
    if (this.meetingStore.meetings.length === 0) {
      await this.meetingStore.fetchMeetings()
    }
  },
  methods: {
    async fetchTask() {
      this.loading = true
      this.error = ''

      const result = await this.taskStore.fetchTaskById(this.taskId)

      if (!result.success) {
        this.error = result.error
      }

      this.loading = this.taskStore.loading
    },
    async startTask() {
      const result = await this.taskStore.updateTask(this.taskId, {
        taskStatus: 'in_progress',
        executionDate: new Date().toISOString(),
      })
      if (result.success) {
        await this.fetchTask()
      } else {
        alert(result.error || 'Failed to update task')
      }
    },
    async completeTask() {
      const result = await this.taskStore.updateTask(this.taskId, {
        taskStatus: 'completed',
        completionDate: new Date().toISOString(),
      })
      if (result.success) {
        await this.fetchTask()
      } else {
        alert(result.error || 'Failed to update task')
      }
    },
    handleSoftDelete() {
      if (confirm(`Are you sure you want to remove "${this.task.title}"?`)) {
        this.taskStore.softDeleteTask(this.taskId)
        this.$router.push({ name: 'tasks-list' })
      }
    },
    formatStatus(status) {
      const statusMap = {
        pending: 'Pending',
        in_progress: 'In Progress',
        completed: 'Completed',
        failed: 'Failed',
        hold: 'Hold',
      }
      return statusMap[status] || status
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
    formatDuration(minutes) {
      if (!minutes) return 'N/A'
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      if (hours > 0) {
        return `${hours}h ${mins}m`
      }
      return `${mins}m`
    },
  },
}
</script>
