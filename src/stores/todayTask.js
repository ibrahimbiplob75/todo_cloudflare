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

export const useTodayTaskStore = defineStore('todayTask', {
  state: () => ({
    tasks: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchTodayTasks() {
      this.loading = true
      this.error = null

      try {
        const params = new URLSearchParams()
        params.append('is_today_tasks', '1')
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
