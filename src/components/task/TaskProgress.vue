<template>
  <div class="task-progress flex items-center gap-4">
    <div v-if="loading" class="text-gray-500 text-sm">Loading...</div>
    <template v-else-if="!error">
      <div class="circle_progress" style="width: 150px; flex-shrink: 0">
        <svg viewBox="0 0 100 100" class="w-full h-auto">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#e5e7eb"
            stroke-width="12"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#7c3aed"
            stroke-width="12"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
            stroke-linecap="round"
            transform="rotate(-90 50 50)"
            class="transition-all duration-500"
          />
        </svg>
        <div class="circle_label">
          <span class="percent">{{ incompletePercent }}%</span>
          <span class="of_total">incomplete</span>
        </div>
      </div>
      <div class="counts text-gray-700">
        <span class="text-2xl font-bold">{{ completed }}/{{ total }}</span>
        <span class="text-sm text-gray-500 ml-1">
          remaining ({{ total - completed }})
        </span>
      </div>
    </template>
    <div v-else class="text-red-600 text-sm">{{ error }}</div>
    <div v-if="!loading && !error" class="completion-cards flex flex-wrap gap-3 ml-auto">
      <div class="card card-today">
        <span class="card-value">{{ todayCompleted }}</span>
        <span class="card-label">Today: {{ todayLabel }}</span>
      </div>
      <div class="card card-week">
        <span class="card-value">{{ thisWeekCompleted }}</span>
        <span class="card-label">Week: {{ weekLabel }}</span>
      </div>
      <div class="card card-month">
        <span class="card-value">{{ thisMonthCompleted }}</span>
        <span class="card-label">This month:{{ monthLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

const api = axios.create({
  baseURL: "/",
  headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const radius = 42;
const circumference = 2 * Math.PI * radius;
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getISOWeekNumber(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function getStartOfISOWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - (day === 0 ? 6 : day - 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getEndOfISOWeek(d) {
  const start = getStartOfISOWeek(d);
  start.setDate(start.getDate() + 6);
  return start;
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default {
  name: "TaskProgress",
  data() {
    return {
      total: 0,
      incomplete: 0,
      completed: 0,
      todayCompleted: 0,
      thisWeekCompleted: 0,
      thisMonthCompleted: 0,
      loading: false,
      error: null,
      circumference,
    };
  },
  computed: {
    incompletePercent() {
      if (this.total === 0) return 0;
      return Math.round((this.incomplete / this.total) * 100);
    },
    strokeDashoffset() {
      if (this.total === 0) return this.circumference;
      const pct = this.incomplete / this.total;
      return this.circumference - pct * this.circumference;
    },
    todayLabel() {
      const now = new Date();
      return `${now.getDate()} ${monthNames[now.getMonth()]}, ${dayNames[now.getDay()]}`;
    },
    monthLabel() {
      return monthNames[new Date().getMonth()];
    },
    weekLabel() {
      const now = new Date();
      const weekNum = getISOWeekNumber(now);
      const start = getStartOfISOWeek(now);
      const end = getEndOfISOWeek(now);
      const fmt = (d) => `${d.getDate()} ${monthNames[d.getMonth()]}`;
      const range =
        start.getMonth() === end.getMonth()
          ? `${start.getDate()}-${end.getDate()} ${monthNames[start.getMonth()]}`
          : `${fmt(start)} - ${fmt(end)}`;
      return `${ordinal(weekNum)} week, ${range}`;
    },
  },
  async mounted() {
    await this.fetchStats();
  },
  methods: {
    async fetchStats() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/task/stats");
        this.total = res.data.total ?? 0;
        this.incomplete = res.data.incomplete ?? 0;
        this.completed = res.data.completed ?? 0;
        this.todayCompleted = res.data.todayCompleted ?? 0;
        this.thisWeekCompleted = res.data.thisWeekCompleted ?? 0;
        this.thisMonthCompleted = res.data.thisMonthCompleted ?? 0;
      } catch (err) {
        this.error =
          err.response?.data?.error || err.message || "Failed to load";
        this.total = 0;
        this.incomplete = 0;
        this.todayCompleted = 0;
        this.thisWeekCompleted = 0;
        this.thisMonthCompleted = 0;
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.circle_progress {
  position: relative;
}
.circle_progress svg {
  display: block;
}
.circle_label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}
.circle_label .percent {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}
.circle_label .of_total {
  display: block;
  font-size: 0.65rem;
  color: #6b7280;
}

.completion-cards {
  margin-left: auto;
}
.card {
  min-width: 80px;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.card-today {
  min-width: 110px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fcd34d;
}
.card-week {
  min-width: 120px;
  background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%);
  border: 1px solid #60a5fa;
}
.card-month {
  background: linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%);
  border: 1px solid #34d399;
}
.card-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}
.card-label {
  display: block;
  font-size: 0.7rem;
  color: #4b5563;
  font-weight: 500;
}
</style>
