<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Create Sub Task</h1>
        <p v-if="parentTask" class="text-gray-600 mt-1">
          Parent: <span class="font-semibold">{{ parentTask.title }}</span>
        </p>
      </div>
      <router-link
        :to="{ name: 'task-subtasks', params: { id: taskId } }"
        class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
      >
        <i class="fas fa-arrow-left mr-2"></i>
        Back
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !parentTask" class="text-center py-12">
      <p class="text-gray-500">Loading...</p>
    </div>

    <!-- Form -->
    <div v-else class="bg-white rounded-lg shadow-md p-6">
      <TaskForm
        :parent-task-id="taskId"
        :loading="createLoading"
        :error="createError"
        submit-text="Create Sub Task"
        @submit="handleCreate"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script>
import { useTaskStore } from '@stores/task'
import TaskForm from '@components/task/form.vue'

export default {
  name: 'TaskSubtasksCreateView',
  components: {
    TaskForm,
  },
  data() {
    return {
      loading: false,
      createLoading: false,
      createError: '',
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
  },
  async mounted() {
    await this.fetchParentTask()
  },
  methods: {
    async fetchParentTask() {
      this.loading = true
      const result = await this.taskStore.fetchTaskById(this.taskId)
      if (result.success) {
        this.parentTask = result.data
      }
      this.loading = false
    },
    async handleCreate(taskData) {
      this.createLoading = true
      this.createError = ''

      // Add parentTaskId to the task data
      const taskDataWithParent = {
        ...taskData,
        parentTaskId: this.taskId,
      }

      const result = await this.taskStore.createTask(taskDataWithParent)

      if (result.success) {
        // Redirect to subtasks list
        this.$router.push({ name: 'task-subtasks', params: { id: this.taskId } })
      } else {
        this.createError = result.error || 'Failed to create subtask'
        this.createLoading = false
      }
    },
    handleCancel() {
      this.$router.push({ name: 'task-subtasks', params: { id: this.taskId } })
    },
  },
}
</script>
