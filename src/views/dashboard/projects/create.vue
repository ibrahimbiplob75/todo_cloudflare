<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Create Project</h1>
      <router-link
        to="/projects"
        class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
      >
        <i class="fas fa-arrow-left mr-2"></i>
        Back to Projects
      </router-link>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6">
      <ProjectForm
        :loading="loading"
        :error="error"
        submit-text="Create"
        @submit="handleCreate"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script>
import { useProjectStore } from '../../stores/project'
import ProjectForm from '../../../components/project/form.vue'

export default {
  name: 'ProjectCreateView',
  components: {
    ProjectForm,
  },
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
  },
  methods: {
    async handleCreate(projectData) {
      this.loading = true
      this.error = ''

      const result = await this.projectStore.createProject(projectData)

      if (result.success) {
        // Redirect to project view
        this.$router.push({ name: 'project-view', params: { id: result.data.id } })
      } else {
        this.error = result.error || 'Failed to create project'
        this.loading = false
      }
    },
    handleCancel() {
      this.$router.push({ name: 'projects-all' })
    },
  },
}
</script>
