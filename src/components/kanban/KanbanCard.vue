<template>
  <div
    class="kanban-card group cursor-grab active:cursor-grabbing bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all duration-200 hover:border-blue-300"
    :class="{ 'opacity-50 ring-2 ring-blue-400': isDragging }"
    draggable="true"
    :data-task-id="task.id"
    :data-task-serial="task.serial"
    @dragover.prevent
    @drop="onDrop"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <div class="text-sm font-medium text-gray-800 line-clamp-2">
      {{ task.title }} - {{ task.id }}
    </div>
    <div v-if="task.priority" class="mt-1">
      <span
        class="inline-block px-1.5 py-0.5 text-xs rounded"
        :class="priorityClass"
      >
        {{ task.priority }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'KanbanCard',
  props: {
    task: { type: Object, required: true },
    status: { type: String, required: true },
    isDragging: { type: Boolean, default: false },
  },
  computed: {
    priorityClass() {
      const m = { high: 'bg-red-100 text-red-700', urgent: 'bg-orange-100 text-orange-700', mid: 'bg-blue-100 text-blue-700', low: 'bg-gray-100 text-gray-600' }
      return m[this.task.priority] || 'bg-gray-100 text-gray-600'
    },
  },
  methods: {
    onDragStart(e) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('application/json', JSON.stringify({
        taskId: this.task.id,
        task: this.task,
        fromStatus: this.status,
      }))
      e.dataTransfer.setData('text/plain', String(this.task.id))
      this.$emit('drag-start', this.task)
    },
    onDrop(e) {
      e.preventDefault()
      e.stopPropagation()
      this.$emit('drop', e, this.task.id)
    },
    onDragEnd() {
      this.$emit('drag-end')
    },
  },
}
</script>
