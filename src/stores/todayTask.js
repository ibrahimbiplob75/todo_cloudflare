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

function toDateInputValue(d) {
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const useTodayTaskStore = defineStore('todayTask', {
  state: () => ({
    tasks: [],
    loading: false,
    error: null,
    fromDate: toDateInputValue(new Date()),
    toDate: toDateInputValue(new Date()),
  }),

  actions: {
    setDates(from, to) {
      this.fromDate = from || toDateInputValue(new Date())
      this.toDate = to || toDateInputValue(new Date())
    },

    async fetchTodayTasks(fromDate, toDate) {
      this.loading = true
      this.error = null
      const from = fromDate ?? this.fromDate ?? toDateInputValue(new Date())
      const to = toDate ?? this.toDate ?? toDateInputValue(new Date())
      this.fromDate = from
      this.toDate = to

      try {
        const params = new URLSearchParams()
        params.append('target_date_from', from)
        params.append('target_date_to', to)
        params.append('show_all', '1')
        const url = `/task?${params.toString()}`
        const response = await api.get(url)
        this.tasks = response.data.data || []
        return { success: true, data: this.tasks }
      } catch (err) {
        this.error = err.response?.data?.error || err.message || 'Failed to fetch today tasks'
        console.error('Fetch today tasks error:', err)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },
  },
})
