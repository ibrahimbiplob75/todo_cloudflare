<template>
  <div
    class="kanban-column flex-shrink-0 w-72 rounded-xl border-2 transition-all duration-200"
    :class="[
      column.color,
      isDragOver ? 'border-blue-500 ring-2 ring-blue-200 scale-[1.02]' : 'border-transparent',
    ]"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div class="p-3 border-b font-semibold text-gray-700 flex items-center justify-between">
      <span>{{ column.label }}</span>
      <span class="text-xs font-normal bg-white/60 px-2 py-0.5 rounded-full">
        {{ tasks.length }}
      </span>
    </div>
    <div
      class="p-2 min-h-[120px] space-y-2 overflow-y-auto max-h-[calc(100vh-240px)]"
      :data-status="status"
    >
      <div
        v-if="isDragOver && tasks.length === 0"
        class="h-20 rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/50 flex items-center justify-center text-blue-600 text-sm"
      >
        Drop here
      </div>
      <KanbanCard
        v-for="(task, idx) in tasks"
        :key="task.id"
        :task="task"
        :status="status"
        :is-dragging="draggingTaskId === task.id"
        @drop="(e, id) => $emit('drop', e, id)"
        @drag-start="$emit('drag-start', $event)"
        @drag-end="$emit('drag-end')"
      />
    </div>
  </div>
</template>

<script>
import KanbanCard from './KanbanCard.vue'

export default {
  name: 'KanbanColumn',
  components: { KanbanCard },
  props: {
    column: { type: Object, required: true },
    status: { type: String, required: true },
    tasks: { type: Array, default: () => [] },
    isDragOver: { type: Boolean, default: false },
    draggingTaskId: { type: Number, default: null },
  },
  methods: {
    onDragOver(e) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      this.$emit('drag-over')
    },
    onDragLeave() {
      this.$emit('drag-leave')
    },
    onDrop(e, dragedOnCardId = null) {
      e.preventDefault()
      e.stopPropagation()
      if (dragedOnCardId == null) {
        const el = document.elementFromPoint(e.clientX, e.clientY)
        const cardEl = el?.closest('[data-task-id]')
        dragedOnCardId = cardEl ? parseInt(cardEl.dataset.taskId, 10) : null
      }
      this.$emit('drop', e, dragedOnCardId)
    },
  },
}
</script>
