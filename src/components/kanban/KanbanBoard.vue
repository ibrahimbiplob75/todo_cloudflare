<template>
  <div class="kanban-board flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
    <KanbanColumn
      v-for="col in columns"
      :key="col.key"
      :column="col"
      :status="col.key"
      :tasks="store.tasksByStatus(col.key)"
      :is-drag-over="dragOverColumn === col.key"
      :dragging-task-id="draggingTaskId"
      @drag-over="dragOverColumn = col.key"
      @drag-leave="dragOverColumn = null"
      @drop="(e, dragedOnCardId) => onDrop(e, col.key, dragedOnCardId)"
      @drag-start="draggingTaskId = $event.id"
      @drag-end="draggingTaskId = null"
    />
  </div>
</template>

<script>
import { useKanbanStore } from "@stores/kanban";
import { COLUMNS } from "@stores/kanban";
import KanbanColumn from "./KanbanColumn.vue";

export default {
  name: "KanbanBoard",
  components: { KanbanColumn },
  data() {
    return {
      dragOverColumn: null,
      draggingTaskId: null,
      lastDragData: null,
      dragging_el_track: {},
    };
  },
  computed: {
    store() {
      return useKanbanStore();
    },
    columns() {
      return COLUMNS;
    },
  },
  methods: {
    async onDrop(e, toStatus, dragedOnCardId = null) {
      this.dragOverColumn = null;
      this.draggingTaskId = null;

      let data;
      try {
        data = JSON.parse(e.dataTransfer.getData("application/json"));
      } catch (_) {
        return;
      }
      const { task, fromStatus } = data;
      if (!task || !fromStatus) return;

      if (this.dragging_el_track.hasOwnProperty("id") && this.dragging_el_track.id === task.id) {
        this.dragging_el_track.count++;
      } else {
        this.dragging_el_track = {
          id: task.id,
          count: 1,
        };
      }

      if (this.dragging_el_track.count == 2) {
        this.dragging_el_track = {
          id: null,
          count: 0,
        };
        return;
      }

      const toList = this.store.tasksByStatus(toStatus);
      const toIndex =
        dragedOnCardId != null
          ? toList.findIndex((t) => t.id === dragedOnCardId)
          : toList.length;
      const insertIndex = toIndex >= 0 ? toIndex : toList.length;

      const sameColumn = fromStatus === toStatus;
      const fromList = this.store.tasksByStatus(fromStatus);
      const fromIdx = fromList.findIndex((t) => t.id === task.id);

      let newSerial = document.querySelector(`[data-task-id="${dragedOnCardId}"]`)?.dataset.taskSerial;
      if (newSerial == null) {
        newSerial = insertIndex + 1;
      }

      // if (sameColumn && fromIdx === insertIndex - 1) return;

      const prevSerial = task.serial;
      const prevStatus = task.taskStatus;
      if (prevStatus === toStatus && prevSerial === newSerial) return;

      this.store.moveTaskLocally(task, fromStatus, toStatus, insertIndex);

      try {
        await this.store.updateTask(task.id, {
          serial: newSerial,
          taskStatus: toStatus,
        });
        await this.store.fetchTasks();
      } catch (err) {
        await this.store.fetchTasks();
        alert(err.response?.data?.error || "Failed to update task");
      }
    },
  },
};
</script>
