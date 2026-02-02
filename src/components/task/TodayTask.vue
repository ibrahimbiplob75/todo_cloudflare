<template>
  <div class="task_block">
    <div class="task_item">
      <div
        :class="['icon', { 'icon--clickable': isIconClickable }]"
        :role="isIconClickable ? 'button' : null"
        :tabindex="isIconClickable ? 0 : -1"
        @click="handleIconClick"
        @keydown.enter.prevent="isIconClickable && handleIconClick()"
        @keydown.space.prevent="isIconClickable && handleIconClick()"
      >
        <i
          :class="task.taskStatus === 'completed' ? 'far fa-check-square' : 'far fa-square'"
          aria-hidden="true"
        ></i>
      </div>
      <div class="task_details">
        <div class="task_title">
          {{ task.title }}
          <i
            class="fas fa-eye fa-xs font-[6px] hover:text-blue-500 cursor-pointer ml-1 !print:hidden"
            @click.stop="$router.push(`/tasks/${task.id}`)"
            title="View task"
          ></i>
        </div>
        <div class="task_meta">
          {{ targetDateFormatted }}
          <span v-if="task.subtasks">
            {{ projectPart }}
          </span>
        </div>
      </div>
    </div>
    <div v-if="task.subtasks && task.subtasks.length > 0" class="subtasks_wrapper">
      <TodayTask
        v-for="st in task.subtasks"
        :key="st.id"
        :task="st"
        @completed="$emit('completed', $event)"
      />
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2'
import { useTaskStore } from '@stores/task'

export default {
  name: 'TodayTask',
  components: {
    TodayTask: () => import('./TodayTask.vue'),
  },
  props: {
    task: {
      type: Object,
      required: true,
    },
  },
  emits: ['completed'],
  computed: {
    isIconClickable() {
      if (this.task.taskStatus === 'completed') return true
      const subs = this.task.subtasks || []
      if (subs.length === 0) return true
      return subs.every((st) => st.taskStatus === 'completed')
    },
    targetDateFormatted() {
      const d = this.task.targetDate || this.task.submissionDate
      if (!d) return ''
      const x = new Date(d)
      if (isNaN(x.getTime())) return ''
      return x.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
    projectPart() {
      const name = this.task.projectName
      if (!name) return ''
      return `, ${name}`
    },
  },
  methods: {
    async handleIconClick() {
      if (!this.isIconClickable) return
      const isCompleted = this.task.taskStatus === 'completed'
      const { isConfirmed } = await Swal.fire({
        title: isCompleted ? 'Mark as in progress?' : 'Mark as completed?',
        text: isCompleted
          ? `Reopen "${this.task.title}"?`
          : `Complete "${this.task.title}"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: isCompleted ? '#2563eb' : '#16a34a',
        cancelButtonColor: '#6b7280',
        confirmButtonText: isCompleted ? 'Yes, reopen' : 'Yes, complete',
      })
      if (!isConfirmed) return
      const taskStore = useTaskStore()
      const payload = isCompleted
        ? {
            taskStatus: 'in_progress',
            completionDate: null,
            executionDate: new Date().toISOString(),
          }
        : {
            taskStatus: 'completed',
            completionDate: new Date().toISOString(),
          }
      const result = await taskStore.updateTask(this.task.id, payload)
      if (result.success) {
        this.$emit('completed', this.task.id)
      } else {
        Swal.fire({ icon: 'error', title: result.error || 'Failed to update task' })
      }
    },
  },
}
</script>

<style scoped>
.task_block {
  margin-bottom: 0;
}
.task_item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.2rem 0;
  border-bottom: 1px solid #e5e7eb;
}
.subtasks_wrapper .task_block:last-child .task_item {
  border-bottom: none;
}
.subtasks_wrapper {
  padding-left: 1.5rem;
  border-left: 1px solid #e5e7eb;
  margin-left: 0.75rem;
}
.icon {
  flex-shrink: 0;
  color: #111;
  font-size: 0.9375rem;
  line-height: 1.2;
}
.icon--clickable {
  cursor: pointer;
  user-select: none;
}
.icon--clickable:hover {
  color: #16a34a;
}
.task_details {
  flex: 1;
  min-width: 0;
}
.task_title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111;
  line-height: 1.3;
}
.task_meta {
  font-size: 0.75rem;
  color: #374151;
  margin-top: 0.1rem;
  line-height: 1.25;
}
</style>
