<template>
  <div class="task-completion-chart">
    <h2 class="text-lg font-semibold text-gray-800 mb-3">Completed Tasks This Month</h2>
    <div v-if="loading" class="text-gray-500 text-sm">Loading...</div>
    <div v-else-if="error" class="text-red-600 text-sm">{{ error }}</div>
    <div v-else class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js'
import axios from 'axios'

Chart.register(...registerables)

const api = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
})
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default {
  name: 'TaskCompletionChart',
  data() {
    const now = new Date()
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      countsByDay: {},
      loading: false,
      error: null,
      chartInstance: null,
    }
  },
  computed: {
    lastDay() {
      return new Date(this.year, this.month, 0).getDate()
    },
    chartData() {
      const data = []
      for (let d = 1; d <= this.lastDay; d++) {
        data.push({ day: d, count: this.countsByDay[d] || this.countsByDay[String(d)] || 0 })
      }
      return data
    },
    labels() {
      const mon = monthNames[this.month - 1]
      return this.chartData.map((d) => `${d.day} ${mon}`)
    },
    values() {
      return this.chartData.map((d) => d.count)
    },
    avgCount() {
      const total = this.chartData.reduce((s, d) => s + d.count, 0)
      return this.chartData.length ? total / this.chartData.length : 0
    },
  },
  watch: {
    countsByDay: {
      handler() {
        this.$nextTick(() => this.renderChart())
      },
      deep: true,
    },
  },
  async mounted() {
    await this.loadData()
  },
  beforeUnmount() {
    this.destroyChart()
  },
  methods: {
    async loadData() {
      const cacheKey = `task_calendar_${this.year}_${this.month}`
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
          params: { year: this.year, month: this.month },
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
    destroyChart() {
      if (this.chartInstance) {
        this.chartInstance.destroy()
        this.chartInstance = null
      }
    },
    renderChart() {
      this.destroyChart()
      const canvas = this.$refs.chartCanvas
      if (!canvas || this.chartData.length === 0) return

      const datasets = [
        {
          label: 'Completed',
          data: this.values,
          fill: true,
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.15)',
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 4,
        },
      ]

      if (this.avgCount > 0) {
        datasets.push({
          label: `Avg ${this.avgCount.toFixed(1)}`,
          data: this.labels.map(() => this.avgCount),
          borderColor: '#059669',
          borderDash: [4, 4],
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
        })
      }

      this.chartInstance = new Chart(canvas, {
        type: 'line',
        data: {
          labels: this.labels,
          datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index',
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
          },
          scales: {
            x: {
              display: true,
              title: {
                display: false,
              },
              grid: {
                display: false,
              },
              ticks: {
                maxTicksLimit: 12,
              },
            },
            y: {
              display: true,
              beginAtZero: true,
              title: {
                display: false,
              },
              grid: {
                color: '#e5e7eb',
              },
            },
          },
        },
      })
    },
  },
}
</script>

<style scoped>
.chart-container {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  background: #fff;
  height: 280px;
}
.chart-container canvas {
  display: block;
}
</style>
