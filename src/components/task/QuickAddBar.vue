<template>
  <div class="h-[73px] border-t border-gray-200 flex items-center gap-2 px-3 bg-white">
    <select
      v-model="selectedProjectId"
      @change="handleProjectChange"
      class="w-28 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
    >
      <option :value="null">Project</option>
      <option v-for="project in projects" :key="project.id" :value="project.id">
        {{ project.title }}
      </option>
    </select>

    <select
      v-if="selectedProjectId"
      v-model="selectedMeetingId"
      :disabled="loadingMeetings"
      class="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm disabled:bg-gray-100 disabled:cursor-wait"
    >
      <option :value="null">{{ loadingMeetings ? 'Loading...' : 'Meeting' }}</option>
      <option v-for="meeting in meetings" :key="meeting.id" :value="meeting.id">
        {{ meeting.title }}
      </option>
    </select>

    <input
      v-model="taskTitle"
      type="text"
      placeholder="Add a task..."
      class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      @keyup.enter="handleQuickAdd"
      :disabled="loading"
    />

    <button
      @click="handleQuickAdd"
      :disabled="loading || !taskTitle.trim()"
      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <i class="fas fa-plus"></i>
    </button>

    <button
      @click="$emit('expand')"
      class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
      title="Expand form"
    >
      <i class="fas fa-expand"></i>
    </button>
  </div>
</template>

<script>
import { useProjectStore } from '@stores/project'
import { useMeetingStore } from '@stores/meeting'

export default {
  name: 'QuickAddBar',
  emits: ['add', 'expand'],
  data() {
    return {
      taskTitle: '',
      selectedProjectId: null,
      selectedMeetingId: null,
      meetings: [],
      loading: false,
      loadingMeetings: false,
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
  async mounted() {
    // Fetch projects if not already loaded
    if (this.projects.length === 0) {
      await this.projectStore.fetchProjects()
    }
  },
  methods: {
    async handleProjectChange() {
      // Reset meeting selection when project changes
      this.selectedMeetingId = null
      this.meetings = []
      
      // Fetch meetings for selected project
      if (this.selectedProjectId) {
        await this.fetchMeetingsByProject()
      }
    },
    async fetchMeetingsByProject() {
      if (!this.selectedProjectId) {
        this.meetings = []
        return
      }

      this.loadingMeetings = true
      try {
        // Set filter and fetch meetings
        this.meetingStore.setFilters({ projectId: this.selectedProjectId })
        const result = await this.meetingStore.fetchMeetings(true)
        
        if (result.success) {
          // Sort by id desc as requested
          this.meetings = result.data.sort((a, b) => b.id - a.id)
        } else {
          this.meetings = []
        }
      } catch (error) {
        console.error('Error fetching meetings:', error)
        this.meetings = []
      } finally {
        this.loadingMeetings = false
      }
    },
    async handleQuickAdd() {
      if (!this.taskTitle.trim()) return

      const title = this.taskTitle.trim()
      const projectId = this.selectedProjectId

      if (!projectId) {
        alert('Please select a project')
        return
      }

      this.loading = true
      this.$emit('add', { 
        projectId, 
        projectMeetingId: this.selectedMeetingId || null,
        title 
      })
      
      this.taskTitle = ''
      this.loading = false
    },
  },
}
</script>
