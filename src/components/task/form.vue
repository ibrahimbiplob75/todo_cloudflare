<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
        Title <span class="text-red-500">*</span>
      </label>
      <input
        id="title"
        v-model="formData.title"
        type="text"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        placeholder="Enter task title"
      />
      <p v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</p>
    </div>

    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
        Description
      </label>
      <textarea
        id="description"
        v-model="formData.description"
        rows="3"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        placeholder="Enter task description (optional)"
      ></textarea>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="projectId" class="block text-sm font-medium text-gray-700 mb-1">
          Project
        </label>
        <select
          id="projectId"
          v-model="formData.projectId"
          :disabled="isSubtask"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option :value="null">No Project</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.title }}
          </option>
        </select>
        <p v-if="isSubtask" class="mt-1 text-xs text-gray-500">
          Inherited from parent task
        </p>
      </div>

      <div>
        <label for="priority" class="block text-sm font-medium text-gray-700 mb-1">
          Priority
        </label>
        <select
          id="priority"
          v-model="formData.priority"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="low">Low</option>
          <option value="mid">Mid</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
    </div>

    <div>
      <label for="taskStatus" class="block text-sm font-medium text-gray-700 mb-1">
        Status
      </label>
      <select
        id="taskStatus"
        v-model="formData.taskStatus"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      >
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
        <option value="hold">Hold</option>
      </select>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="submissionDate" class="block text-sm font-medium text-gray-700 mb-1">
          Submission Date
        </label>
        <input
          id="submissionDate"
          v-model="formData.submissionDate"
          type="datetime-local"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div>
        <label for="executionDate" class="block text-sm font-medium text-gray-700 mb-1">
          Execution Date
        </label>
        <input
          id="executionDate"
          v-model="formData.executionDate"
          type="datetime-local"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>
    </div>

    <div>
      <label for="completionDate" class="block text-sm font-medium text-gray-700 mb-1">
        Completion Date
      </label>
      <input
        id="completionDate"
        v-model="formData.completionDate"
        type="datetime-local"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />
    </div>

    <div>
      <label for="comment" class="block text-sm font-medium text-gray-700 mb-1">
        Comment
      </label>
      <textarea
        id="comment"
        v-model="formData.comment"
        rows="2"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        placeholder="Add internal notes (optional)"
      ></textarea>
    </div>

    <div v-if="error" class="text-red-600 text-sm bg-red-50 p-3 rounded-md">
      {{ error }}
    </div>

    <div class="flex gap-3">
      <button
        type="submit"
        :disabled="loading"
        class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span v-if="loading">{{ submitText === 'Create' ? 'Creating...' : 'Updating...' }}</span>
        <span v-else>{{ submitText }}</span>
      </button>
      
      <button
        v-if="showCancel"
        type="button"
        @click="$emit('cancel')"
        class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
      >
        Cancel
      </button>
    </div>
  </form>
</template>

<script>
import { useProjectStore } from '@stores/project'
import { useTaskStore } from '@stores/task'

export default {
  name: 'TaskForm',
  props: {
    task: {
      type: Object,
      default: null,
    },
    parentTaskId: {
      type: Number,
      default: null,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: '',
    },
    submitText: {
      type: String,
      default: 'Submit',
    },
    showCancel: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['submit', 'cancel'],
  data() {
    return {
      formData: {
        title: '',
        description: '',
        projectId: null,
        priority: 'mid',
        taskStatus: 'pending',
        submissionDate: '',
        executionDate: '',
        completionDate: '',
        comment: '',
      },
      errors: {},
      parentTask: null,
    }
  },
  computed: {
    projectStore() {
      return useProjectStore()
    },
    taskStore() {
      return useTaskStore()
    },
    projects() {
      return this.projectStore.projects || []
    },
    isSubtask() {
      return this.parentTaskId !== null && this.parentTaskId !== undefined
    },
  },
  watch: {
    parentTaskId: {
      immediate: true,
      async handler(newParentTaskId) {
        if (newParentTaskId && !this.task) {
          // Fetch parent task to get its projectId
          await this.fetchParentTask()
        }
      },
    },
    parentTask: {
      immediate: true,
      handler(newParentTask) {
        if (newParentTask && this.isSubtask && !this.task) {
          // Set projectId from parent task (only when creating new subtask, not editing)
          this.formData.projectId = newParentTask.projectId || null
        }
      },
    },
    task: {
      immediate: true,
      handler(newTask) {
        if (newTask) {
          this.formData = {
            title: newTask.title || '',
            description: newTask.description || '',
            projectId: newTask.projectId || null,
            priority: newTask.priority || 'mid',
            taskStatus: newTask.taskStatus || 'pending',
            submissionDate: this.formatDateTimeLocal(newTask.submissionDate),
            executionDate: this.formatDateTimeLocal(newTask.executionDate),
            completionDate: this.formatDateTimeLocal(newTask.completionDate),
            comment: newTask.comment || '',
          }
        } else {
          // If creating new subtask, inherit projectId from parent
          const inheritedProjectId = this.isSubtask && this.parentTask 
            ? this.parentTask.projectId || null 
            : null
          
          this.formData = {
            title: '',
            description: '',
            projectId: inheritedProjectId,
            priority: 'mid',
            taskStatus: 'pending',
            submissionDate: '',
            executionDate: '',
            completionDate: '',
            comment: '',
          }
        }
      },
    },
  },
  async mounted() {
    // Fetch projects if not already loaded
    if (this.projects.length === 0) {
      await this.projectStore.fetchProjects()
    }
    
    // If parentTaskId is provided and we don't have parent task yet, fetch it
    if (this.parentTaskId && !this.parentTask) {
      await this.fetchParentTask()
    }
  },
  methods: {
    async fetchParentTask() {
      if (!this.parentTaskId) return
      
      try {
        const result = await this.taskStore.fetchTaskById(this.parentTaskId)
        if (result.success) {
          this.parentTask = result.data
        }
      } catch (error) {
        console.error('Error fetching parent task:', error)
      }
    },
    formatDateTimeLocal(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      return `${year}-${month}-${day}T${hours}:${minutes}`
    },
    validate() {
      this.errors = {}
      
      if (!this.formData.title || this.formData.title.trim() === '') {
        this.errors.title = 'Title is required'
        return false
      }

      return true
    },
    handleSubmit() {
      if (!this.validate()) {
        return
      }

      // Prepare data for submission
      // For subtasks, use parent's projectId if not explicitly set
      let projectId = this.formData.projectId || null
      if (this.isSubtask && this.parentTask && !projectId) {
        projectId = this.parentTask.projectId || null
      }
      
      const submitData = {
        title: this.formData.title.trim(),
        description: this.formData.description?.trim() || null,
        projectId: projectId,
        parentTaskId: this.parentTaskId || null,
        priority: this.formData.priority,
        taskStatus: this.formData.taskStatus,
        submissionDate: this.formData.submissionDate || null,
        executionDate: this.formData.executionDate || null,
        completionDate: this.formData.completionDate || null,
        comment: this.formData.comment?.trim() || null,
      }

      this.$emit('submit', submitData)
    },
  },
}
</script>
