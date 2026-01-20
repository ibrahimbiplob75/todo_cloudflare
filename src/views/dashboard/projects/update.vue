<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Update Project</h1>
      <router-link
        :to="{ name: 'project-view', params: { id: projectId } }"
        class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
      >
        <i class="fas fa-arrow-left mr-2"></i>
        Back
      </router-link>
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

    <!-- Form -->
    <div v-else-if="project" class="bg-white rounded-lg shadow-md p-6">
      <ProjectForm
        :project="project"
        :loading="updateLoading"
        :error="updateError"
        submit-text="Update"
        @submit="handleUpdate"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script>
import { useProjectStore } from '../../stores/project'
import ProjectForm from '../../../components/project/form.vue'

export default {
  name: 'ProjectUpdateView',
  components: {
    ProjectForm,
  },
  data() {
    return {
      loading: false,
      updateLoading: false,
      error: '',
      updateError: '',
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
    async handleUpdate(projectData) {
      this.updateLoading = true
      this.updateError = ''

      const result = await this.projectStore.updateProject(this.projectId, projectData)

      if (result.success) {
        // Redirect to project view
        this.$router.push({ name: 'project-view', params: { id: this.projectId } })
      } else {
        this.updateError = result.error || 'Failed to update project'
        this.updateLoading = false
      }
    },
    handleCancel() {
      this.$router.push({ name: 'project-view', params: { id: this.projectId } })
    },
  },
}
</script>
