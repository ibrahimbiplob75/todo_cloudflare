<template>
  <div class="kanban-page p-4">
    <h1 class="text-2xl font-bold text-gray-800 mb-4">Kanban Board</h1>

    <KanbanFilters
      ref="filtersRef"
      class="mb-6"
    />

    <div v-if="store.loading && !hasTasks" class="text-center py-12 text-gray-500">
      Loading...
    </div>
    <div v-else-if="store.error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
      {{ store.error }}
    </div>
    <div v-else class="overflow-x-auto">
      <KanbanBoard />
    </div>
  </div>
</template>

<script>
import { useKanbanStore } from '@stores/kanban'
import KanbanFilters from '@components/kanban/KanbanFilters.vue'
import KanbanBoard from '@components/kanban/KanbanBoard.vue'

export default {
  name: 'KanbanView',
  components: { KanbanFilters, KanbanBoard },
  computed: {
    store() {
      return useKanbanStore()
    },
    hasTasks() {
      const t = this.store.tasks
      return Object.values(t).some((arr) => Array.isArray(arr) && arr.length > 0)
    },
  },
  async mounted() {
    await this.store.fetchProjects()
    if (this.store.projects.length > 0) {
      if (!this.store.selectedProjectId) {
        this.store.selectedProjectId = this.store.projects[0].id
        await this.store.fetchMeetings(this.store.selectedProjectId)
      }
    }
    await this.store.fetchTasks()
  },
}
</script>
