<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Project Details</h1>
      <div class="flex gap-2">
        <router-link
          :to="{ name: 'project-update', params: { id: projectId } }"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <i class="fas fa-edit mr-2"></i>
          Edit
        </router-link>
        <router-link
          to="/projects"
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          <i class="fas fa-arrow-left mr-2"></i>
          Back to Projects
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !project" class="text-center py-12">
      <p class="text-gray-500">Loading project...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && !project" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-600">{{ error }}</p>
      <button
        @click="fetchProject"
        class="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </div>

    <!-- Project Details -->
    <div v-else-if="project" class="bg-white rounded-lg shadow-md p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">{{ project.title }}</h2>
        <div class="flex items-center gap-4 text-sm text-gray-500">
          <span>
            <i class="fas fa-calendar mr-1"></i>
            Created: {{ formatDate(project.created_at) }}
          </span>
          <span>
            <i class="fas fa-clock mr-1"></i>
            Updated: {{ formatDate(project.updated_at) }}
          </span>
        </div>
      </div>

      <div class="border-t border-gray-200 pt-6">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Description</h3>
        <p v-if="project.description" class="text-gray-600 whitespace-pre-wrap">
          {{ project.description }}
        </p>
        <p v-else class="text-gray-400 italic">No description provided</p>
      </div>

      <div class="mt-6 pt-6 border-t border-gray-200">
        <button
          @click="confirmDelete"
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <i class="fas fa-trash mr-2"></i>
          Delete Project
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useProjectStore } from '../../stores/project'

export default {
  name: 'ProjectViewView',
  data() {
    return {
      loading: false,
      error: '',
    }
  },
  computed: {
    projectId() {
      return parseInt(this.$route.params.id)
    },
    projectStore() {
      return useProjectStore()
    },
    project() {
      return this.projectStore.currentProject || this.projectStore.getProjectById(this.projectId)
    },
  },
  async mounted() {
    await this.fetchProject()
  },
  methods: {
    async fetchProject() {
      this.loading = true
      this.error = ''

      const result = await this.projectStore.fetchProjectById(this.projectId)

      if (!result.success) {
        this.error = result.error
      }

      this.loading = this.projectStore.loading
    },
    confirmDelete() {
      if (confirm(`Are you sure you want to delete "${this.project.title}"? This action cannot be undone.`)) {
        this.deleteProject()
      }
    },
    async deleteProject() {
      const result = await this.projectStore.deleteProject(this.projectId)

      if (result.success) {
        // Redirect to projects list
        this.$router.push({ name: 'projects-all' })
      } else {
        alert(result.error || 'Failed to delete project')
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
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
