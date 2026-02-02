<template>
  <div
    class="p-3 rounded-lg shadow-sm border border-gray-200 mb-2 bg-white hover:shadow-md transition-shadow cursor-pointer"
    @click="viewTask"
  >
    <div class="flex justify-between items-start mb-2">
      <h3 class="font-medium text-gray-800 flex-1">{{ task.title }}</h3>
      <span
        :class="[
          'px-2 py-1 rounded text-xs font-semibold',
          priorityClasses[task.priority] || 'bg-gray-100 text-gray-700'
        ]"
      >
        {{ task.priority }}
      </span>
    </div>

    <div v-if="projectName || meetingName" class="text-sm text-gray-500 mb-2 space-y-1">
      <p v-if="projectName">
        <i class="fas fa-folder mr-1"></i>
        {{ projectName }}
      </p>
      <p v-if="meetingName">
        <i class="fas fa-calendar-alt mr-1"></i>
        {{ meetingName }}
      </p>
    </div>

    <div class="flex justify-between items-center mt-2 text-xs">
      <span
        :class="[
          'px-2 py-1 rounded font-medium',
          statusClasses[task.taskStatus] || 'bg-gray-100 text-gray-700'
        ]"
      >
        {{ formatStatus(task.taskStatus) }}
      </span>
      <span v-if="task.submissionDate" class="text-gray-500">
        <i class="fas fa-calendar mr-1"></i>
        {{ formatDate(task.submissionDate) }}
      </span>
    </div>

    <!-- Action buttons based on status -->
    <div class="mt-3 flex gap-2">
      <button
        v-if="task.taskStatus === 'pending'"
        @click.stop="startTask"
        class="flex-1 px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 transition-colors"
      >
        <i class="fas fa-play mr-1"></i>
        Start Work
      </button>
      
      <button
        v-if="task.executionDate && task.taskStatus !== 'completed'"
        @click.stop="completeTask"
        class="flex-1 px-3 py-1 bg-green-50 text-green-600 rounded text-sm hover:bg-green-100 transition-colors"
      >
        <i class="fas fa-check mr-1"></i>
        Mark Complete
      </button>

      <button
        v-if="hasSubtasks"
        @click.stop="viewSubtasks"
        class="px-3 py-1 bg-purple-50 text-purple-600 rounded text-sm hover:bg-purple-100 transition-colors"
        :title="`${task.totalSubTasks || 0} subtasks`"
      >
        <i class="fas fa-sitemap mr-1"></i>
        Sub Tasks ({{ task.totalSubTasks || 0 }}) ({{ task.completionPercent }}%)
      </button>
      
      <button
        v-else
        @click.stop="createSubtask"
        class="px-3 py-1 bg-purple-50 text-purple-600 rounded text-sm hover:bg-purple-100 transition-colors"
        title="Create sub task"
      >
        <i class="fas fa-plus mr-1"></i>
        Create Sub Task
      </button>

      <button
        v-if="task.taskStatus !== 'completed'"
        @click.stop="!isTargetDateToday && addToTodo()"
        :disabled="isTargetDateToday"
        :class="[
          'px-3 py-1 rounded text-sm transition-colors',
          isTargetDateToday
            ? 'bg-amber-100 text-amber-500 cursor-default'
            : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
        ]"
        :title="isTargetDateToday ? 'Already added to todo today' : 'Add to Todo (set target date to today)'"
      >
        <i class="fas fa-list-check mr-1"></i>
        {{ isTargetDateToday ? 'Added into todo' : 'Add to Todo' }}
      </button>

      <button
        @click.stop="editTask"
        class="px-3 py-1 bg-gray-50 text-gray-600 rounded text-sm hover:bg-gray-100 transition-colors"
      >
        <i class="fas fa-edit"></i>
      </button>
      
      <button
        @click.stop="softDeleteTask"
        class="px-3 py-1 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100 transition-colors"
      >
        <i class="fas fa-trash"></i>
      </button>
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2'
import { useProjectStore } from '@stores/project'
import { useMeetingStore } from '@stores/meeting'

export default {
  name: 'TaskCard',
  props: {
    task: {
      type: Object,
      required: true,
    },
  },
  computed: {
    projectStore() {
      return useProjectStore()
    },
    meetingStore() {
      return useMeetingStore()
    },
    projectName() {
      if (this.task.projectName != null) return this.task.projectName
      if (!this.task.projectId) return null
      const project = this.projectStore.getProjectById(this.task.projectId)
      return project?.title ?? null
    },
    meetingName() {
      if (this.task.meetingName != null) return this.task.meetingName
      if (!this.task.projectMeetingId) return null
      const meeting = this.meetingStore.getMeetingById(this.task.projectMeetingId)
      return meeting?.title ?? null
    },
    priorityClasses() {
      return {
        low: 'bg-blue-100 text-blue-700',
        mid: 'bg-yellow-100 text-yellow-700',
        high: 'bg-orange-100 text-orange-700',
        urgent: 'bg-red-100 text-red-700',
      }
    },
    statusClasses() {
      return {
        pending: 'bg-gray-100 text-gray-700',
        in_progress: 'bg-blue-100 text-blue-700',
        completed: 'bg-green-100 text-green-700',
        failed: 'bg-red-100 text-red-700',
        hold: 'bg-yellow-100 text-yellow-700',
      }
    },
    hasSubtasks() {
      return (this.task.totalSubTasks || 0) > 0
    },
    isTargetDateToday() {
      const td = this.task.targetDate
      if (!td) return false
      const d = new Date(td)
      if (isNaN(d.getTime())) return false
      const today = new Date()
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      )
    },
  },
  methods: {
    viewTask() {
      this.$router.push({ name: 'task-view', params: { id: this.task.id } })
    },
    editTask() {
      this.$router.push({ name: 'task-edit', params: { id: this.task.id } })
    },
    viewSubtasks() {
      this.$router.push({ name: 'task-subtasks', params: { id: this.task.id } })
    },
    createSubtask() {
      this.$router.push({ name: 'task-subtasks-create', params: { id: this.task.id } })
    },
    startTask() {
      this.$emit('start', this.task.id)
    },
    completeTask() {
      this.$emit('complete', this.task.id)
    },
    addToTodo() {
      this.$emit('addToTodo', this.task.id)
    },
    async softDeleteTask() {
      const { isConfirmed } = await Swal.fire({
        title: 'Delete task?',
        text: `Are you sure you want to remove "${this.task.title}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete',
      })
      if (isConfirmed) {
        this.$emit('delete', this.task.id)
      }
    },
    formatStatus(status) {
      const statusMap = {
        pending: 'Pending',
        in_progress: 'In Progress',
        completed: 'Completed',
        failed: 'Failed',
        hold: 'Hold',
      }
      return statusMap[status] || status
    },
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    },
  },
}
</script>
