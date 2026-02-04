import { defineStore } from 'pinia'
import axios from 'axios'

const api = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (e) => Promise.reject(e)
)

/**
 * Format date as YYYY-MM-DD for input[type="date"]
 */
function toDateInputValue(d) {
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const useCompletedTaskStore = defineStore('completedTask', {
  state: () => ({
    tasks: [],
    loading: false,
    error: null,
    fromDate: toDateInputValue(new Date()),
    toDate: toDateInputValue(new Date()),
  }),

  getters: {
    defaultFromDate: () => toDateInputValue(new Date()),
    defaultToDate: () => toDateInputValue(new Date()),
  },

  actions: {
    setDates(from, to) {
      this.fromDate = from || toDateInputValue(new Date())
      this.toDate = to || toDateInputValue(new Date())
    },

    async fetchCompletedTasks(fromDate, toDate) {
      this.loading = true
      this.error = null
      const from = fromDate ?? this.fromDate ?? toDateInputValue(new Date())
      const to = toDate ?? this.toDate ?? toDateInputValue(new Date())
      this.fromDate = from
      this.toDate = to

      try {
        const params = new URLSearchParams()
        params.append('task_status', 'partially_completed')
        params.append('from_date', from)
        params.append('to_date', to)
        params.append('show_all', '1')
        const url = `/task?${params.toString()}`
        const response = await api.get(url)
        this.tasks = response.data.data || []
        return { success: true, data: this.tasks }
      } catch (err) {
        this.error = err.response?.data?.error || err.message || 'Failed to fetch completed tasks'
        console.error('Fetch completed tasks error:', err)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },
  },
})
