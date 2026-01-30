<template>
  <div class="task_block">
    <div class="task_item">
      <div class="icon">
        <i class="far fa-check-square" aria-hidden="true"></i>
      </div>
      <div class="task_details">
        <div class="task_title">{{ task.title }}</div>
        <div class="task_meta">{{ submissionDateFormatted }}{{ projectPart }}</div>
      </div>
    </div>
    <div v-if="task.subtasks && task.subtasks.length > 0" class="subtasks_wrapper">
      <CompletedTask
        v-for="st in task.subtasks"
        :key="st.id"
        :task="st"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'CompletedTask',
  components: {
    CompletedTask: () => import('./CompletedTask.vue'),
  },
  props: {
    task: {
      type: Object,
      required: true,
    },
  },
  computed: {
    submissionDateFormatted() {
      const d = this.task.submissionDate
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
