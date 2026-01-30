<template>
  <div class="project-details-page h-full overflow-y-auto">
    <div class="no-print header-section mb-6">
      <router-link
        to="/projects"
        class="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
      >
        <i class="fas fa-arrow-left mr-1"></i> Back to Projects
      </router-link>
      <h1 class="text-3xl font-bold text-gray-800">
        Project Task Details
        <span v-if="project" class="text-xl font-normal text-gray-600">
          – {{ project.title }}</span
        >
      </h1>
    </div>

    <div v-if="loadingProject" class="text-center py-12 text-gray-500">
      Loading project...
    </div>
    <div
      v-else-if="errorProject"
      class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600"
    >
      {{ errorProject }}
    </div>

    <template v-else-if="project">
      <!-- Filters -->
      <div class="no-print filters-bar bg-white rounded-lg shadow-md p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Task Status</label
            >
            <div class="flex flex-wrap gap-2">
              <label
                v-for="opt in statusOptions"
                :key="opt.value"
                class="inline-flex items-center gap-1 text-sm"
              >
                <input
                  v-model="filters.taskStatus"
                  type="checkbox"
                  :value="opt.value"
                  class="rounded border-gray-300"
                />
                {{ opt.label }}
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Meeting</label
            >
            <select
              v-model="filters.projectMeetingId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              :disabled="loadingMeetings"
            >
              <option :value="null">
                {{ loadingMeetings ? "Loading..." : "All Meetings" }}
              </option>
              <option v-for="m in meetings" :key="m.id" :value="m.id">
                {{ m.title }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Date Type</label
            >
            <select
              v-model="filters.dateType"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="submission_date">Submission Date</option>
              <option value="completion_date">Completion Date</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Sort By</label
            >
            <select
              v-model="filters.sortBy"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="date_type">Date</option>
              <option value="id">ID</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Sort Order</label
            >
            <select
              v-model="filters.sortOrder"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >From Date</label
            >
            <input
              v-model="filters.fromDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >To Date</label
            >
            <input
              v-model="filters.toDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
        <div class="flex gap-3 mt-4">
          <button
            type="button"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            :disabled="loadingTasks"
            @click="applyFilters"
          >
            {{ loadingTasks ? "Loading..." : "Apply" }}
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
            @click="resetFilters"
          >
            Reset
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
            @click="printReport"
          >
            <i class="fas fa-print mr-1"></i> Print
          </button>
        </div>
        <p v-if="errorTasks" class="text-red-600 text-sm mt-2">
          {{ errorTasks }}
        </p>
      </div>

      <!-- Print area: task list -->
      <div id="print_area" class="print_area bg-white rounded-lg shadow-md p-6">
        <div class="report_header text-center mb-4 no-print-screen">
          <h2 class="report_title text-lg font-bold text-gray-800">
            {{ project.title }} – Task Details
          </h2>
        </div>
        <div
          v-if="loadingTasks && groupedTasks.length === 0"
          class="report_loading"
        >
          Loading tasks...
        </div>
        <div v-else-if="groupedTasks.length === 0" class="report_empty">
          No tasks found for the selected filters.
        </div>
        <div v-else class="report_list">
          <div
            v-for="group in groupedTasks"
            :key="group.dateKey"
            class="date-group mb-6"
          >
            <h2 class="date-header text-lg font-semibold text-gray-800 mb-3">
              {{ group.dateLabel }}
            </h2>

            <!-- Tasks without meeting -->
            <div v-if="group.withoutMeeting.length > 0" class="mb-4 pl-2">
              <p class="text-sm font-medium text-gray-600 mb-2">
                Tasks without meeting
              </p>
              <ProjectDetailTask
                v-for="task in group.withoutMeeting"
                :key="task.id"
                :task="task"
              />
            </div>

            <!-- Tasks grouped by meeting -->
            <div
              v-for="meetingGroup in group.byMeeting"
              :key="meetingGroup.meetingId"
              class="mb-4 pl-2"
            >
              <p class="text-sm font-medium text-gray-600 mb-2">
                Meeting: {{ meetingGroup.meetingName }}
              </p>
              <ProjectDetailTask
                v-for="task in meetingGroup.tasks"
                :key="task.id"
                :task="task"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import axios from "axios";
import { useProjectStore } from "@stores/project";
import ProjectDetailTask from "./ProjectDetailTask.vue";

const api = axios.create({
  baseURL: "/",
  headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "hold", label: "Hold" },
];

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default {
  name: "ProjectDetailsView",
  components: { ProjectDetailTask },
  data() {
    return {
      project: null,
      loadingProject: false,
      errorProject: null,
      loadingTasks: false,
      errorTasks: null,
      loadingMeetings: false,
      meetings: [],
      tasks: [],
      filters: {
        taskStatus: [],
        projectMeetingId: null,
        dateType: "submission_date",
        sortBy: "date_type",
        sortOrder: "asc",
        fromDate: "",
        toDate: "",
      },
      statusOptions,
    };
  },
  computed: {
    projectId() {
      return this.$route.params.id ?? this.$route.params.projectId;
    },
    meetingIdFromRoute() {
      return this.$route.params.meetingId;
    },
    groupedTasks() {
      const dateField =
        this.filters.dateType === "completion_date"
          ? "completionDate"
          : "submissionDate";
      const groups = new Map();

      for (const task of this.tasks) {
        const raw = task[dateField];
        if (!raw) continue;
        const d = new Date(raw);
        const key = d.toISOString().slice(0, 10);
        const label = `${d.getDate()} ${
          monthNames[d.getMonth()]
        } ${d.getFullYear()}`;

        if (!groups.has(key)) {
          groups.set(key, {
            dateKey: key,
            dateLabel: label,
            withoutMeeting: [],
            byMeeting: [],
          });
        }
        const g = groups.get(key);

        if (!task.projectMeetingId) {
          g.withoutMeeting.push(task);
        } else {
          let mg = g.byMeeting.find(
            (m) => m.meetingId === task.projectMeetingId
          );
          if (!mg) {
            mg = {
              meetingId: task.projectMeetingId,
              meetingName: task.meetingName || "Unknown",
              tasks: [],
            };
            g.byMeeting.push(mg);
          }
          mg.tasks.push(task);
        }
      }

      const arr = [...groups.values()];
      const asc = this.filters.sortOrder === "asc";
      arr.sort((a, b) =>
        asc
          ? a.dateKey.localeCompare(b.dateKey)
          : b.dateKey.localeCompare(a.dateKey)
      );
      return arr;
    },
  },
  watch: {
    projectId() {
      this.applyMeetingFromRoute();
      this.fetchProject();
      this.fetchMeetings();
      this.fetchTasks();
    },
    meetingIdFromRoute: {
      handler() {
        this.applyMeetingFromRoute();
        if (this.projectId) {
          this.fetchTasks();
        }
      },
      immediate: true,
    },
  },
  async mounted() {
    this.applyMeetingFromRoute();
    await this.fetchProject();
    await this.fetchMeetings();
    await this.fetchTasks();
  },
  methods: {
    applyMeetingFromRoute() {
      const mid = this.meetingIdFromRoute;
      if (mid) {
        const parsed = parseInt(mid, 10);
        if (!isNaN(parsed)) {
          this.filters.projectMeetingId = parsed;
        }
      } else {
        this.filters.projectMeetingId = null;
      }
    },
    async fetchMeetings() {
      if (!this.projectId) return;
      this.loadingMeetings = true;
      try {
        const res = await api.get("/meeting", {
          params: { project_id: this.projectId },
        });
        this.meetings = res.data?.meetings || [];
      } catch (err) {
        this.meetings = [];
      } finally {
        this.loadingMeetings = false;
      }
    },
    async fetchProject() {
      this.loadingProject = true;
      this.errorProject = null;
      try {
        const store = useProjectStore();
        await store.fetchProjects(true);
        this.project = store.projects.find(
          (p) => String(p.id) === String(this.projectId)
        );
        if (!this.project) {
          const res = await api.get(`/project/${this.projectId}`);
          this.project = res.data?.project || res.data;
        }
      } catch (err) {
        this.errorProject =
          err.response?.data?.error || err.message || "Failed to load project";
      } finally {
        this.loadingProject = false;
      }
    },
    async fetchTasks() {
      this.loadingTasks = true;
      this.errorTasks = null;
      try {
        const params = new URLSearchParams();
        if (this.filters.taskStatus.length > 0) {
          params.set("task_status", this.filters.taskStatus.join(","));
        }
        if (this.filters.projectMeetingId) {
          params.set("project_meeting_id", this.filters.projectMeetingId);
        }
        params.set("date_type", this.filters.dateType);
        params.set("sort_by", this.filters.sortBy);
        params.set("sort_order", this.filters.sortOrder);
        if (this.filters.fromDate)
          params.set("from_date", this.filters.fromDate);
        if (this.filters.toDate) params.set("to_date", this.filters.toDate);

        const res = await api.get(`/project/${this.projectId}/tasks?${params}`);
        this.tasks = res.data?.tasks || [];
      } catch (err) {
        this.errorTasks =
          err.response?.data?.error || err.message || "Failed to load tasks";
        this.tasks = [];
      } finally {
        this.loadingTasks = false;
      }
    },
    applyFilters() {
      this.fetchTasks();
    },
    resetFilters() {
      this.filters = {
        taskStatus: [],
        projectMeetingId: null,
        dateType: "submission_date",
        sortBy: "date_type",
        sortOrder: "asc",
        fromDate: "",
        toDate: "",
      };
      this.fetchTasks();
    },
    printReport() {
      window.print();
    },
  },
};
</script>

<style scoped>
.project-details-page {
  max-width: 56rem;
}
.report_loading,
.report_empty {
  font-size: 0.875rem;
  color: #6b7280;
  padding: 0.75rem 0;
}
.date-group {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
}
.date-group:last-child {
  border-bottom: none;
}
.date-header {
  border-left: 4px solid #3b82f6;
  padding-left: 0.75rem;
}
</style>

<style>
@media print {
  header,
  aside,
  .no-print {
    display: none !important;
  }
  main {
    padding: 0 !important;
    overflow: visible !important;
  }
  .project-details-page {
    max-width: none !important;
  }
  .print_area {
    border: none !important;
    padding: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
  }
}
</style>
