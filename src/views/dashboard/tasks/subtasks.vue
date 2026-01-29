<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Sub Tasks</h1>
        <p v-if="parentTask" class="text-gray-600 mt-1">
          Parent: <span class="font-semibold">{{ parentTask.title }}</span>
        </p>
      </div>
      <div class="flex gap-2">
        <router-link
          :to="{ name: 'task-subtasks-create', params: { id: taskId } }"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <i class="fas fa-plus mr-2"></i>
          Create Sub Task
        </router-link>
        <router-link
          :to="{ name: 'task-view', params: { id: taskId } }"
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          <i class="fas fa-arrow-left mr-2"></i>
          Back to Task
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && subtasks.length === 0" class="text-center py-12">
      <p class="text-gray-500">Loading subtasks...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && subtasks.length === 0" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-600">{{ error }}</p>
      <button
        @click="fetchSubtasks"
        class="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </div>

    <!-- Subtasks List -->
    <div v-else-if="subtasks.length > 0" class="space-y-2">
      <TaskCard
        v-for="subtask in subtasks"
        :key="subtask.id"
        :task="subtask"
        @start="handleStartTask"
        @complete="handleCompleteTask"
        @delete="handleSoftDelete"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-white rounded-lg shadow-md">
      <i class="fas fa-tasks text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-500 text-lg mb-2">No subtasks yet</p>
      <p class="text-gray-400 text-sm mb-4">Create your first subtask to get started</p>
      <router-link
        :to="{ name: 'task-subtasks-create', params: { id: taskId } }"
        class="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <i class="fas fa-plus mr-2"></i>
        Create Sub Task
      </router-link>
    </div>
  </div>
</template>

<script>
import { useTaskStore } from '@stores/task'
import TaskCard from '@components/task/TaskCard.vue'

export default {
  name: 'TaskSubtasksView',
  components: {
    TaskCard,
  },
  data() {
    return {
      loading: false,
      error: '',
      parentTask: null,
    }
  },
  computed: {
    taskId() {
      return parseInt(this.$route.params.id)
    },
    taskStore() {
      return useTaskStore()
    },
    subtasks() {
      return this.taskStore.tasks || []
    },
  },
  async mounted() {
    await this.fetchParentTask()
    await this.fetchSubtasks()
  },
  methods: {
    async fetchParentTask() {
      const result = await this.taskStore.fetchTaskById(this.taskId)
      if (result.success) {
        this.parentTask = result.data
      }
    },
    async fetchSubtasks() {
      this.loading = true
      this.error = ''

      try {
        // Fetch subtasks using API
        const token = localStorage.getItem('auth_token')
        const response = await fetch(`/task/${this.taskId}/subtasks`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch subtasks')
        }

        const data = await response.json()
        // Update task store with subtasks
        this.taskStore.tasks = data.subtasks || []
        this.taskStore.totalTasks = data.subtasks?.length || 0
      } catch (error) {
        this.error = error.message || 'Failed to fetch subtasks'
      } finally {
        this.loading = false
      }
    },
    async handleStartTask(taskId) {
      const result = await this.taskStore.updateTask(taskId, {
        taskStatus: 'in_progress',
        executionDate: new Date().toISOString(),
      })
      if (result.success) {
        await this.fetchSubtasks()
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
        await this.fetchSubtasks()
      } else {
        alert(result.error || 'Failed to update task')
      }
    },
    async handleSoftDelete(taskId) {
      const result = await this.taskStore.deleteTask(taskId)
      if (result.success) {
        await this.fetchSubtasks()
      } else {
        alert(result.error || 'Failed to delete task')
      }
    },
  },
}
</script>
