<template>
  <div class="task-block mb-4 pl-4 border-l-2 border-gray-200">
    <div class="task-main">
      <span class="task-checkbox">{{ task.taskStatus === 'completed' ? '☑' : '☐' }}</span>
      <span class="task-title font-medium">
        {{ task.title }} - <span class="text-xs text-gray-500">{{ task.taskStatus }}</span>
      </span>
    </div>
    <div v-if="task.description" class="task-description text-sm text-gray-600 pl-6">
      {{ task.description }}
    </div>
    <div v-if="task.comment" class="task-comment text-sm text-gray-500 pl-6 italic">
      {{ task.comment }}
    </div>
    <div v-if="task.subtasks && task.subtasks.length > 0" class="task-subtasks mt-2 pl-6">
      <p class="text-xs font-medium text-gray-500 mb-1">Subtasks:</p>
      <div
        v-for="st in task.subtasks"
        :key="st.id"
        class="subtask-block pl-4 border-l border-gray-200 mb-2"
      >
        <span class="subtask-checkbox">{{ st.taskStatus === 'completed' ? '☑' : '☐' }}</span>
        <span class="subtask-title">
          {{ st.title }} - <span class="text-xs text-gray-500">{{ st.taskStatus }}</span>
        </span>
        <div v-if="st.description" class="subtask-description text-sm text-gray-500 pl-5">
          {{ st.description }}
        </div>
        <div v-if="st.comment" class="subtask-comment text-sm text-gray-400 pl-5 italic">
          {{ st.comment }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectDetailTask',
  props: {
    task: {
      type: Object,
      required: true,
    },
  },
}
</script>

<style scoped>
.task-block {
  margin-bottom: 1rem;
}
.task-main {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}
.task-checkbox,
.subtask-checkbox {
  flex-shrink: 0;
  font-size: 1rem;
}
.task-title {
  color: #111827;
}
.subtask-title {
  color: #374151;
  font-size: 0.875rem;
}
</style>
