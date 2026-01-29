<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 z-50 flex items-end md:items-center justify-center"
    @click.self="close"
  >
    <div
      class="bg-white rounded-t-lg md:rounded-lg shadow-xl w-full md:w-96 max-h-[90vh] overflow-y-auto"
    >
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h2 class="text-xl font-bold text-gray-800">Filters</h2>
        <button
          @click="close"
          class="text-gray-500 hover:text-gray-700"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            v-model="localFilters.taskStatus"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option :value="null">All Statuses</option>
            <option v-for="status in statusOptions" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <select
            v-model="localFilters.priority"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option :value="null">All Priorities</option>
            <option v-for="priority in priorityOptions" :key="priority.value" :value="priority.value">
              {{ priority.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Project</label>
          <select
            v-model="localFilters.projectId"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            @change="onProjectChange"
          >
            <option :value="null">All Projects</option>
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.title }}
            </option>
          </select>
        </div>

        <div v-if="localFilters.projectId">
          <label class="block text-sm font-medium text-gray-700 mb-2">Meeting</label>
          <select
            v-model="localFilters.projectMeetingId"
            :disabled="loadingMeetings"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-wait"
          >
            <option :value="null">{{ loadingMeetings ? 'Loading...' : 'All Meetings' }}</option>
            <option v-for="meeting in projectMeetings" :key="meeting.id" :value="meeting.id">
              {{ meeting.title }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Submission date range</label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-gray-500 mb-1">From</label>
              <input
                v-model="localFilters.submission_date_from"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">To</label>
              <input
                v-model="localFilters.submission_date_to"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <div class="flex gap-3 pt-4 border-t">
          <button
            @click="applyFilters"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
          <button
            @click="resetFilters"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useProjectStore } from '@stores/project'
import { useMeetingStore } from '@stores/meeting'

export default {
  name: 'FilterModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
    filters: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['close', 'apply'],
  data() {
    return {
      loadingMeetings: false,
      projectMeetings: [],
      localFilters: {
        taskStatus: null,
        priority: null,
        projectId: null,
        projectMeetingId: null,
        submission_date_from: null,
        submission_date_to: null,
      },
      statusOptions: [
        { value: 'pending', label: 'Pending' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' },
        { value: 'hold', label: 'Hold' },
      ],
      priorityOptions: [
        { value: 'low', label: 'Low' },
        { value: 'mid', label: 'Mid' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
      ],
    }
  },
  computed: {
    projectStore() {
      return useProjectStore()
    },
    meetingStore() {
      return useMeetingStore()
    },
    projects() {
      return this.projectStore.projects || []
    },
  },
  watch: {
    filters: {
      immediate: true,
      handler(newFilters) {
        this.localFilters = { ...newFilters }
      },
    },
    isOpen(newVal) {
      if (newVal) {
        this.localFilters = { ...this.filters }
        this.fetchMeetingsForProject()
      }
    },
    'localFilters.projectId'(projectId) {
      this.fetchMeetingsForProject()
    },
  },
  async mounted() {
    if (this.projects.length === 0) {
      await this.projectStore.fetchProjects()
    }
  },
  methods: {
    async onProjectChange() {
      this.localFilters.projectMeetingId = null
      await this.fetchMeetingsForProject()
    },
    async fetchMeetingsForProject() {
      const projectId = this.localFilters.projectId
      if (!projectId) {
        this.projectMeetings = []
        return
      }
      this.loadingMeetings = true
      try {
        this.meetingStore.setFilters({ projectId })
        const result = await this.meetingStore.fetchMeetings(true)
        this.projectMeetings = result.success ? (result.data || []).sort((a, b) => b.id - a.id) : []
      } catch {
        this.projectMeetings = []
      } finally {
        this.loadingMeetings = false
      }
    },
    close() {
      this.$emit('close')
    },
    applyFilters() {
      this.$emit('apply', { ...this.localFilters })
      this.close()
    },
    resetFilters() {
      this.localFilters = {
        taskStatus: null,
        priority: null,
        projectId: null,
        projectMeetingId: null,
        submission_date_from: null,
        submission_date_to: null,
      }
      this.projectMeetings = []
      this.$emit('apply', { ...this.localFilters })
      this.close()
    },
  },
}
</script>
