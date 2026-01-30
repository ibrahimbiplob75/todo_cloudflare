<template>
  <div class="h-[calc(100vh-115px)] flex flex-col relative bg-gray-50">
    <!-- Top Bar -->
    <div class="h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
      <div class="font-semibold text-lg text-gray-800">
        Tasks
        <span v-if="totalTasks > 0" class="text-sm text-gray-500 font-normal ml-2">
          ({{ totalTasks }})
        </span>
      </div>

      <button
        @click="showFilterModal = true"
        class="relative text-xl text-gray-600 hover:text-gray-800 transition-colors"
      >
        <i class="fas fa-filter"></i>
        <span
          v-if="activeFilterCount > 0"
          class="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center"
        >
          {{ activeFilterCount }}
        </span>
      </button>
    </div>

    <!-- Task List Section -->
    <div class="flex-1 overflow-y-auto px-0 lg:px-3 py-2">
      <!-- Loading State -->
      <div v-if="loading && tasks.length === 0" class="text-center py-12">
        <p class="text-gray-500">Loading tasks...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error && tasks.length === 0" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-600">{{ error }}</p>
        <button
          @click="fetchTasks(true)"
          class="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>

      <!-- Tasks List -->
      <div v-else-if="paginatedTasks.length > 0">
        <TaskCard
          v-for="task in paginatedTasks"
          :key="task.id"
          :task="task"
          @start="handleStartTask"
          @complete="handleCompleteTask"
          @delete="handleSoftDelete"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <i class="fas fa-tasks text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg mb-2">No tasks found</p>
        <p class="text-gray-400 text-sm">Create your first task using the form below</p>
      </div>

      <!-- Pagination -->
      <div v-if="totalTasks > 0" class="flex flex-col items-center gap-2 mt-4 pb-4">
        <div class="text-sm text-gray-500">
          Showing {{ taskStore.from ?? 0 }}–{{ taskStore.to ?? 0 }} of {{ totalTasks }}
        </div>
        <div v-if="totalPages > 1" class="flex items-center gap-2">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="px-4 py-2 text-sm text-gray-700">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Add Bar -->
    <QuickAddBar
      @add="handleQuickAdd"
      @expand="showTaskFormModal = true"
    />

    <!-- Filter Modal -->
    <FilterModal
      :is-open="showFilterModal"
      :filters="filters"
      @close="showFilterModal = false"
      @apply="handleApplyFilters"
    />

    <!-- Full Task Form Modal -->
    <div
      v-if="showTaskFormModal"
      class="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="showTaskFormModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-800">Create Task</h2>
          <button
            @click="showTaskFormModal = false"
            class="text-gray-500 hover:text-gray-700"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="p-6">
          <TaskForm
            :loading="createLoading || taskStore.loading"
            :error="createError || taskStore.error"
            submit-text="Create"
            @submit="handleCreateTask"
            @cancel="showTaskFormModal = false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useTaskStore } from '@stores/task'
import TaskCard from '@components/task/TaskCard.vue'
import QuickAddBar from '@components/task/QuickAddBar.vue'
import FilterModal from '@components/task/FilterModal.vue'
import TaskForm from '@components/task/form.vue'

export default {
  name: 'TasksListView',
  components: {
    TaskCard,
    QuickAddBar,
    FilterModal,
    TaskForm,
  },
  data() {
    return {
      showFilterModal: false,
      showTaskFormModal: false,
      createLoading: false,
      createError: '',
    }
  },
  computed: {
    taskStore() {
      return useTaskStore()
    },
    tasks() {
      return this.taskStore.tasks
    },
    paginatedTasks() {
      return this.taskStore.paginatedTasks
    },
    loading() {
      return this.taskStore.loading
    },
    error() {
      return this.taskStore.error
    },
    totalTasks() {
      return this.taskStore.totalTasks
    },
    currentPage() {
      return this.taskStore.currentPage
    },
    totalPages() {
      return this.taskStore.lastPage
    },
    filters() {
      return this.taskStore.filters
    },
    activeFilterCount() {
      let count = 0
      if (this.filters.projectId) count++
      if (this.filters.projectMeetingId) count++
      if (this.filters.taskStatus) count++
      if (this.filters.priority) count++
      if (this.filters.assignedTo) count++
      if (this.filters.submission_date_from && this.filters.submission_date_to) count++
      return count
    },
  },
  watch: {
    showTaskFormModal(isOpen) {
      if (isOpen) this.createError = ''
    },
    '$route.query': {
      handler(query) {
        this.applyProjectFromQuery(query)
        this.fetchTasks(true)
      },
      immediate: true,
    },
  },
  methods: {
    applyProjectFromQuery(query) {
      const projectId = query?.project_id
      const projectMeetingId = query?.project_meeting_id
      const taskStatus = query?.task_status
      const filters = {
        projectId: null,
        projectMeetingId: null,
        taskStatus: null,
      }
      if (projectId != null && projectId !== '') {
        const id = parseInt(projectId, 10)
        if (!isNaN(id)) filters.projectId = id
      }
      if (projectMeetingId != null && projectMeetingId !== '') {
        const mid = parseInt(projectMeetingId, 10)
        if (!isNaN(mid)) filters.projectMeetingId = mid
      }
      const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'hold']
      if (taskStatus && validStatuses.includes(taskStatus)) {
        filters.taskStatus = taskStatus
      }
      this.taskStore.setFilters(filters)
    },
    async fetchTasks(forceRefresh = false, page = undefined) {
      await this.taskStore.fetchTasks(forceRefresh, page ?? this.taskStore.currentPage)
    },
    async handleQuickAdd(data) {
      const result = await this.taskStore.fastCreateTask(data.projectId, data.title, data.projectMeetingId || null)
      if (result.success) {
        await this.fetchTasks(true)
      } else {
        alert(result.error || 'Failed to create task')
      }
    },
    async handleCreateTask(taskData) {
      if (taskData.batch && Array.isArray(taskData.items) && taskData.items.length > 0) {
        this.createLoading = true
        this.createError = ''
        const shared = taskData.shared || {}
        for (const item of taskData.items) {
          const payload = {
            ...shared,
            title: item.title,
            description: item.description ?? null,
          }
          const result = await this.taskStore.createTask(payload)
          if (!result.success) {
            this.createError = result.error || 'Failed to create task'
            this.createLoading = false
            return
          }
        }
        this.createLoading = false
        this.createError = ''
        this.showTaskFormModal = false
        await this.fetchTasks(true)
      } else {
        const result = await this.taskStore.createTask(taskData)
        if (result.success) {
          this.showTaskFormModal = false
          await this.fetchTasks(true)
        } else {
          alert(result.error || 'Failed to create task')
        }
      }
    },
    async handleStartTask(taskId) {
      const result = await this.taskStore.updateTask(taskId, {
        taskStatus: 'in_progress',
        executionDate: new Date().toISOString(),
      })
      if (result.success) {
        await this.fetchTasks(true)
      } else {
        alert(result.error || 'Failed to update task')
      }
    },
    async handleCompleteTask(taskId) {
      const result = await this.taskStore.updateTask(taskId, {
        taskStatus: 'completed',
        completionDate: new Date().toISOString(),
      })
      if (result.success) {
        await this.fetchTasks(true)
      } else {
        alert(result.error || 'Failed to update task')
      }
    },
    async handleSoftDelete(taskId) {
      const result = await this.taskStore.deleteTask(taskId)
      if (result.success) {
        await this.fetchTasks(true)
      } else {
        alert(result.error || 'Failed to delete task')
      }
    },
    handleApplyFilters(newFilters) {
      this.taskStore.setFilters(newFilters)
      this.fetchTasks(true)
    },
    async goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        await this.fetchTasks(false, page)
      }
    },
  },
}
</script>
