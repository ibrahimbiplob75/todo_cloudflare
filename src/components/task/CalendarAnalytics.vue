<template>
  <div class="calendar-analytics">
    <h2 class="text-lg font-semibold text-gray-800 mb-3">Calendar</h2>
    <div v-if="loading" class="text-gray-500 text-sm">Loading...</div>
    <div v-else-if="error" class="text-red-600 text-sm">{{ error }}</div>
    <div v-else>
      <!-- Navigation -->
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          class="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
          @click="prevMonth"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <button
          type="button"
          class="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
          @click="nextMonth"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
        <select
          v-model="selectedYear"
          class="px-2 py-1 border border-gray-300 rounded text-sm"
          @change="onYearChange"
        >
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
        <select
          v-model="selectedMonth"
          class="px-2 py-1 border border-gray-300 rounded text-sm"
          @change="fetchMonthData"
        >
          <option v-for="(m, i) in monthNames" :key="i" :value="i + 1">{{ m }}</option>
        </select>
      </div>

      <!-- Calendar body 300x300 -->
      <div class="calendar-body">
        <!-- Day names row -->
        <div class="calendar-header grid grid-cols-7 text-xs font-medium text-gray-600 text-center">
          <div
            v-for="d in dayNames"
            :key="d"
            class="py-1"
            :class="{ 'calendar-header-friday': d === 'Fri' }"
          >
            {{ d }}
          </div>
        </div>
        <!-- Date grid -->
        <div class="calendar-grid grid grid-cols-7">
          <div
            v-for="(cell, idx) in calendarCells"
            :key="idx"
            class="calendar-cell"
            :class="[cellClasses(cell), { 'calendar-cell-clickable': cell.date && cell.count > 0 }]"
            @click="goToCompletedTasks(cell)"
          >
            <template v-if="cell.date">
              <span class="cell-date">{{ cell.date }}</span>
              <span class="cell-day">{{ cell.dayShort }}</span>
              <span class="cell-count" :class="{ 'cell-count-glow': cell.count > 0 }">{{ cell.count }}</span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const api = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
})
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default {
  name: 'CalendarAnalytics',
  data() {
    const now = new Date()
    return {
      years: [now.getFullYear()],
      selectedYear: now.getFullYear(),
      selectedMonth: now.getMonth() + 1,
      dayNames,
      monthNames,
      countsByDay: {},
      loading: false,
      error: null,
    }
  },
  computed: {
    calendarCells() {
      const year = this.selectedYear
      const month = this.selectedMonth
      const first = new Date(year, month - 1, 1)
      const last = new Date(year, month, 0)
      const firstDow = first.getDay()
      const daysInMonth = last.getDate()

      const cells = []

      // Leading empty cells
      for (let i = 0; i < firstDow; i++) {
        cells.push({ date: null, dayShort: '', count: 0 })
      }

      // Date cells
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d)
        const dayShort = dayNames[date.getDay()]
        const count = this.countsByDay[d] || 0
        cells.push({ date: d, dayShort, count, fullDate: date })
      }

      // Trailing empty to complete last row
      const remainder = cells.length % 7
      if (remainder > 0) {
        for (let i = 0; i < 7 - remainder; i++) {
          cells.push({ date: null, dayShort: '', count: 0 })
        }
      }

      return cells
    },
  },
  async mounted() {
    await this.fetchYears()
    await this.fetchMonthData()
  },
  methods: {
    formatDateYMD(date) {
      const d = new Date(date)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    },
    goToCompletedTasks(cell) {
      if (!cell.date || cell.count <= 0) return
      const dateStr = this.formatDateYMD(cell.fullDate)
      this.$router.push({
        path: '/completed-tasks',
        query: { from: dateStr, to: dateStr },
      })
    },
    cellClasses(cell) {
      if (!cell.date) return 'calendar-cell-empty'
      const classes = []
      if (cell.dayShort === 'Fri') classes.push('calendar-cell-friday')
      const today = new Date()
      if (cell.fullDate && cell.fullDate.toDateString() === today.toDateString()) {
        classes.push('calendar-cell-today')
      }
      return classes.join(' ')
    },
    async fetchYears() {
      this.loading = true
      this.error = null
      try {
        const res = await api.get('/task/calendar-years')
        this.years = res.data.years || [new Date().getFullYear()]
        if (this.years.length === 0) this.years = [new Date().getFullYear()]
        if (!this.years.includes(this.selectedYear)) {
          this.selectedYear = this.years[this.years.length - 1]
        }
      } catch (err) {
        this.error = err.response?.data?.error || err.message || 'Failed to load'
        this.years = [new Date().getFullYear()]
      } finally {
        this.loading = false
      }
    },
    async fetchMonthData() {
      const cacheKey = `task_calendar_${this.selectedYear}_${this.selectedMonth}`
      const CACHE_TTL_MS = 60_000 // 1 minute
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const { data, ts } = JSON.parse(cached) || {}
          if (data && ts && Date.now() - ts < CACHE_TTL_MS) {
            this.countsByDay = data
            return
          }
        } catch (_) {}
      }
      this.loading = true
      this.error = null
      try {
        const res = await api.get('/task/calendar', {
          params: { year: this.selectedYear, month: this.selectedMonth },
        })
        this.countsByDay = res.data || {}
        localStorage.setItem(cacheKey, JSON.stringify({ data: this.countsByDay, ts: Date.now() }))
      } catch (err) {
        this.error = err.response?.data?.error || err.message || 'Failed to load'
        this.countsByDay = {}
      } finally {
        this.loading = false
      }
    },
    onYearChange() {
      this.fetchMonthData()
    },
    prevMonth() {
      if (this.selectedMonth === 1) {
        this.selectedMonth = 12
        this.selectedYear--
      } else {
        this.selectedMonth--
      }
      if (!this.years.includes(this.selectedYear)) {
        this.years.push(this.selectedYear)
        this.years.sort((a, b) => a - b)
      }
      this.fetchMonthData()
    },
    nextMonth() {
      if (this.selectedMonth === 12) {
        this.selectedMonth = 1
        this.selectedYear++
      } else {
        this.selectedMonth++
      }
      if (!this.years.includes(this.selectedYear)) {
        this.years.push(this.selectedYear)
        this.years.sort((a, b) => a - b)
      }
      this.fetchMonthData()
    },
  },
}
</script>

<style scoped>
.calendar-body {
  width: 350px;
  min-height: 300px;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.calendar-header {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}
.calendar-header-friday {
  background: rgba(239, 68, 68, 0.3);
}
.calendar-grid {
  flex: 1;
  background: #fff;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: 50px;
}
.calendar-cell {
  min-width: 0;
  box-sizing: border-box;
  width: 100%;
  height: 50px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  padding: 2px;
}
.calendar-cell-empty {
  background: #f9fafb;
}
.calendar-cell-clickable {
  cursor: pointer;
}
.calendar-cell-clickable:hover {
  background: rgba(147, 197, 253, 0.2);
}
.calendar-cell-friday {
  background: rgba(239, 68, 68, 0.3);
}
.calendar-cell-today {
  border: 2px solid #3b82f6;
  background: rgba(59, 130, 246, 0.3);
}
.cell-date {
  font-weight: 700;
  line-height: 1.1;
}
.cell-day {
  color: #6b7280;
  line-height: 1.1;
}
.cell-count {
  font-weight: 600;
  color: #374151;
  line-height: 1.1;
}
.cell-count-glow {
  color: #16a34a;
  text-shadow: 0 0 4px rgba(22, 163, 74, 0.6), 0 0 8px rgba(22, 163, 74, 0.4);
}
</style>
