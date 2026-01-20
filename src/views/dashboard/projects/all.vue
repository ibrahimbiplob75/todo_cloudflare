<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Projects</h1>
      <router-link
        to="/projects/create"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <i class="fas fa-plus mr-2"></i>
        Create Project
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading && projects.length === 0" class="text-center py-12">
      <p class="text-gray-500">Loading projects...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && projects.length === 0" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-600">{{ error }}</p>
      <button
        @click="fetchProjects(true)"
        class="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </div>

    <!-- Projects List -->
    <div v-else-if="projects.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="project in projects"
        :key="project.id"
        class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        @click="viewProject(project.id)"
      >
        <h3 class="text-xl font-semibold text-gray-800 mb-2">{{ project.title }}</h3>
        <p v-if="project.description" class="text-gray-600 text-sm mb-4 line-clamp-2">
          {{ project.description }}
        </p>
        <p v-else class="text-gray-400 text-sm mb-4 italic">No description</p>
        
        <div class="flex justify-between items-center text-xs text-gray-500">
          <span>
            <i class="fas fa-calendar mr-1"></i>
            {{ formatDate(project.created_at) }}
          </span>
          <div class="flex gap-2">
            <button
              @click.stop="editProject(project.id)"
              class="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button
              @click.stop="confirmDelete(project)"
              class="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-white rounded-lg shadow-md">
      <i class="fas fa-folder-open text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-500 text-lg mb-4">No projects found</p>
      <router-link
        to="/projects/create"
        class="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <i class="fas fa-plus mr-2"></i>
        Create Your First Project
      </router-link>
    </div>
  </div>
</template>

<script>
import { useProjectStore } from '../../stores/project'

export default {
  name: 'ProjectsAllView',
  data() {
    return {
      loading: false,
      error: '',
    }
  },
  computed: {
    projectStore() {
      return useProjectStore()
    },
    projects() {
      return this.projectStore.projects
    },
  },
  async mounted() {
    await this.fetchProjects()
  },
  methods: {
    async fetchProjects(forceRefresh = false) {
      this.loading = true
      this.error = ''
      
      const result = await this.projectStore.fetchProjects(forceRefresh)
      
      if (!result.success) {
        this.error = result.error
      }
      
      this.loading = this.projectStore.loading
    },
    viewProject(id) {
      this.$router.push({ name: 'project-view', params: { id } })
    },
    editProject(id) {
      this.$router.push({ name: 'project-update', params: { id } })
    },
    confirmDelete(project) {
      if (confirm(`Are you sure you want to delete "${project.title}"?`)) {
        this.deleteProject(project.id)
      }
    },
    async deleteProject(id) {
      const result = await this.projectStore.deleteProject(id)
      
      if (result.success) {
        // Refresh list
        await this.fetchProjects(true)
      } else {
        alert(result.error || 'Failed to delete project')
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
  },
}
</script>
