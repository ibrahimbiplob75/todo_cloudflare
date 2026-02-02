<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Create mode: multiple task items (title + description) with add more / delete -->
    <div v-if="isCreateMode" class="task_list_wrapper space-y-4">
      <div
        v-for="(item, index) in taskItems"
        :key="item._id"
        class="task_list_item relative rounded-lg border border-gray-200 bg-gray-50/50 p-4"
      >
        <button
          type="button"
          class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded transition-colors"
          :class="taskItems.length <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'"
          :disabled="taskItems.length <= 1"
          :title="taskItems.length <= 1 ? 'Keep at least one task' : 'Remove task'"
          @click="removeTaskItem(index)"
        >
          <i class="fas fa-trash-alt text-sm"></i>
        </button>
        <div class="pr-10">
          <label :for="`title-${item._id}`" class="block text-sm font-medium text-gray-700 mb-1">
            Title <span class="text-red-500">*</span>
          </label>
          <input
            :id="`title-${item._id}`"
            v-model="item.title"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter task title"
          />
          <p v-if="errors[`title-${item._id}`]" class="mt-1 text-sm text-red-600">{{ errors[`title-${item._id}`] }}</p>
        </div>
        <div class="mt-3">
          <label :for="`description-${item._id}`" class="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            :id="`description-${item._id}`"
            v-model="item.description"
            rows="3"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter task description (optional)"
          ></textarea>
        </div>
      </div>
      <div>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
          @click="addTaskItem"
        >
          <i class="fas fa-plus mr-2"></i>Add more task
        </button>
      </div>
    </div>

    <!-- Edit mode: single task (title + description) -->
    <div v-else class="task_list_wrapper">
      <div class="task_list_item">
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
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="projectId" class="block text-sm font-medium text-gray-700 mb-1">
          Project
        </label>
        <select
          id="projectId"
          v-model="formData.projectId"
          @change="handleProjectChange"
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

      <div v-if="formData.projectId">
        <label for="projectMeetingId" class="block text-sm font-medium text-gray-700 mb-1">
          Meeting
        </label>
        <select
          id="projectMeetingId"
          v-model="formData.projectMeetingId"
          :disabled="loadingMeetings"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-wait"
        >
          <option :value="null">{{ loadingMeetings ? 'Loading...' : 'No Meeting' }}</option>
          <option v-for="meeting in projectMeetings" :key="meeting.id" :value="meeting.id">
            {{ meeting.title }}
          </option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
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

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="targetDate" class="block text-sm font-medium text-gray-700 mb-1">
          Target Date
        </label>
        <input
          id="targetDate"
          v-model="formData.targetDate"
          type="datetime-local"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
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

    <div v-if="errors._form" class="text-red-600 text-sm bg-red-50 p-3 rounded-md">
      {{ errors._form }}
    </div>
    <div v-else-if="error" class="text-red-600 text-sm bg-red-50 p-3 rounded-md">
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
import { useMeetingStore } from '@stores/meeting'

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
        projectMeetingId: null,
        priority: 'mid',
        taskStatus: 'pending',
        submissionDate: '',
        executionDate: '',
        completionDate: '',
        targetDate: '',
        comment: '',
      },
      taskItems: [],
      taskItemNextId: 0,
      errors: {},
      parentTask: null,
      projectMeetings: [],
      loadingMeetings: false,
    }
  },
  computed: {
    projectStore() {
      return useProjectStore()
    },
    taskStore() {
      return useTaskStore()
    },
    meetingStore() {
      return useMeetingStore()
    },
    projects() {
      return this.projectStore.projects || []
    },
    isSubtask() {
      return this.parentTaskId !== null && this.parentTaskId !== undefined
    },
    isCreateMode() {
      return !this.task
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
            projectMeetingId: newTask.projectMeetingId || null,
            priority: newTask.priority || 'mid',
            taskStatus: newTask.taskStatus || 'pending',
            submissionDate: this.formatDateTimeLocal(newTask.submissionDate),
            executionDate: this.formatDateTimeLocal(newTask.executionDate),
            completionDate: this.formatDateTimeLocal(newTask.completionDate),
            targetDate: this.formatDateTimeLocal(newTask.targetDate),
            comment: newTask.comment || '',
          }
          this.taskItems = []
          if (this.formData.projectId) {
            this.fetchMeetingsByProject()
          }
        } else {
          const inheritedProjectId = this.isSubtask && this.parentTask
            ? this.parentTask.projectId || null
            : null
          this.formData = {
            title: '',
            description: '',
            projectId: inheritedProjectId,
            projectMeetingId: null,
            priority: 'mid',
            taskStatus: 'pending',
            submissionDate: '',
            executionDate: '',
            completionDate: '',
            targetDate: '',
            comment: '',
          }
          this.taskItems = [this.newTaskItem()]
          if (inheritedProjectId) {
            this.fetchMeetingsByProject()
          }
        }
      },
    },
    'formData.projectId': {
      handler(newProjectId) {
        // Fetch meetings when project is set (e.g. from task load or parent); do NOT reset meeting here
        // (meeting is only reset in handleProjectChange when user changes project)
        if (newProjectId) {
          this.fetchMeetingsByProject()
        } else {
          this.formData.projectMeetingId = null
          this.projectMeetings = []
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
    async fetchMeetingsByProject() {
      if (!this.formData.projectId) {
        this.projectMeetings = []
        return
      }

      this.loadingMeetings = true
      try {
        // Set filter and fetch meetings
        this.meetingStore.setFilters({ projectId: this.formData.projectId })
        const result = await this.meetingStore.fetchMeetings(true)
        
        if (result.success) {
          // Sort by id desc as requested
          this.projectMeetings = result.data.sort((a, b) => b.id - a.id)
        } else {
          this.projectMeetings = []
        }
      } catch (error) {
        console.error('Error fetching meetings:', error)
        this.projectMeetings = []
      } finally {
        this.loadingMeetings = false
      }
    },
    handleProjectChange() {
      // Reset meeting when project changes
      this.formData.projectMeetingId = null
      this.fetchMeetingsByProject()
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
    newTaskItem() {
      this.taskItemNextId += 1
      return { _id: this.taskItemNextId, title: '', description: '' }
    },
    addTaskItem() {
      this.taskItems.push(this.newTaskItem())
    },
    removeTaskItem(index) {
      if (this.taskItems.length <= 1) return
      this.taskItems.splice(index, 1)
    },
    validate() {
      this.errors = {}

      if (this.isCreateMode) {
        if (!this.taskItems.length) {
          this.errors._form = 'Add at least one task.'
          return false
        }
        let valid = true
        for (const item of this.taskItems) {
          const key = `title-${item._id}`
          if (!item.title || !String(item.title).trim()) {
            this.errors[key] = 'Title is required'
            valid = false
          }
        }
        return valid
      }

      if (!this.formData.title || this.formData.title.trim() === '') {
        this.errors.title = 'Title is required'
        return false
      }
      return true
    },
    handleSubmit() {
      if (!this.validate()) return

      let projectId = this.formData.projectId || null
      if (this.isSubtask && this.parentTask && !projectId) {
        projectId = this.parentTask.projectId || null
      }

      const shared = {
        projectId,
        projectMeetingId: this.formData.projectMeetingId || null,
        parentTaskId: this.parentTaskId || null,
        priority: this.formData.priority,
        taskStatus: this.formData.taskStatus,
        submissionDate: this.formData.submissionDate || null,
        executionDate: this.formData.executionDate || null,
        completionDate: this.formData.completionDate || null,
        targetDate: this.formData.targetDate || null,
        comment: this.formData.comment?.trim() || null,
      }

      if (this.isCreateMode) {
        const items = this.taskItems.map((item) => ({
          title: String(item.title).trim(),
          description: item.description ? String(item.description).trim() : null,
        }))
        this.$emit('submit', { batch: true, items, shared })
        return
      }

      const submitData = {
        title: this.formData.title.trim(),
        description: this.formData.description?.trim() || null,
        ...shared,
      }
      this.$emit('submit', submitData)
    },
  },
}
</script>
