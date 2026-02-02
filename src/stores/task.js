import { defineStore } from 'pinia'
import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: [],
    currentTask: null,
    loading: false,
    error: null,
    lastFetch: null,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes cache
    
    // Pagination (server-side)
    currentPage: 1,
    lastPage: 1,
    pageSize: 20,
    totalTasks: 0,
    paginationLinks: [],
    from: null,
    to: null,
    
    // Filters
    filters: {
      projectId: null,
      assignedTo: null,
      taskStatus: null,
      priority: null,
      projectMeetingId: null,
      submission_date_from: null,
      submission_date_to: null,
    },
    
    // Soft delete tracking (frontend only)
    deletedTaskIds: new Set(),
  }),

  getters: {
    // Get task by ID
    getTaskById: (state) => (id) => {
      return state.tasks.find((p) => p.id === parseInt(id))
    },

    // Check if cache is still valid
    isCacheValid: (state) => {
      if (!state.lastFetch) return false
      return Date.now() - state.lastFetch < state.cacheTimeout
    },

    // Get visible tasks (excluding soft deleted)
    visibleTasks: (state) => {
      return state.tasks.filter((task) => !state.deletedTaskIds.has(task.id))
    },

    // Tasks for current page (excluding soft-deleted)
    paginatedTasks: (state) => {
      return state.tasks.filter((task) => !state.deletedTaskIds.has(task.id))
    },

    // Check if task is soft deleted
    isDeleted: (state) => (taskId) => {
      return state.deletedTaskIds.has(taskId)
    },
  },

  actions: {
    /**
     * List all tasks with filters and pagination
     * Uses caching for performance
     */
    async fetchTasks(forceRefresh = false, page = 1) {
      if (this.isCacheValid && !forceRefresh && this.tasks.length > 0 && page === this.currentPage) {
        return { success: true, data: this.paginatedTasks }
      }

      this.loading = true
      this.error = null
      this.currentPage = page

      try {
        const params = new URLSearchParams()
        params.append('page', String(page))
        params.append('per_page', String(this.pageSize))
        if (this.filters.projectId) params.append('project_id', this.filters.projectId)
        if (this.filters.assignedTo) params.append('assigned_to', this.filters.assignedTo)
        if (this.filters.taskStatus) params.append('task_status', this.filters.taskStatus)
        if (this.filters.priority) params.append('priority', this.filters.priority)
        if (this.filters.projectMeetingId) params.append('project_meeting_id', this.filters.projectMeetingId)
        if (this.filters.submission_date_from) params.append('submission_date_from', this.filters.submission_date_from)
        if (this.filters.submission_date_to) params.append('submission_date_to', this.filters.submission_date_to)

        const res = await api.get(`/task?${params.toString()}`)
        const data = res.data.data || []
        this.tasks = data
        this.totalTasks = res.data.total ?? 0
        this.currentPage = res.data.current_page ?? page
        this.lastPage = res.data.last_page ?? 1
        this.paginationLinks = res.data.links || []
        this.from = res.data.from ?? null
        this.to = res.data.to ?? null
        this.lastFetch = Date.now()
        return { success: true, data: this.paginatedTasks }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch tasks'
        console.error('Fetch tasks error:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    /**
     * Get single task by ID
     * Checks cache first, then fetches if not found
     */
    async fetchTaskById(id) {
      const taskId = parseInt(id)
      
      // Check cache first
      const cachedTask = this.getTaskById(taskId)
      if (cachedTask && !this.deletedTaskIds.has(taskId)) {
        this.currentTask = cachedTask
        return { success: true, data: cachedTask }
      }

      this.loading = true
      this.error = null

      try {
        const response = await api.get(`/task/${taskId}`)
        const task = response.data.task
        
        // Update cache
        const index = this.tasks.findIndex((p) => p.id === taskId)
        if (index >= 0) {
          this.tasks[index] = task
        } else {
          this.tasks.push(task)
        }
        
        this.currentTask = task
        return { success: true, data: task }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch task'
        console.error('Fetch task error:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    /**
     * Fast create task (only projectId and title)
     */
    async fastCreateTask(projectId, title, projectMeetingId = null) {
      // console.log(arguments);
      
      this.loading = true
      this.error = null

      try {
        const response = await api.post('/task/fast-create', {
          projectId: parseInt(projectId),
          projectMeetingId: projectMeetingId ? parseInt(projectMeetingId) : null,
          title: title.trim(),
        })
        const task = response.data.task
        this.lastFetch = Date.now()
        return { success: true, data: task }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to create task'
        console.error('Fast create task error:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    /**
     * Create new task (full form)
     */
    async createTask(taskData) {
      this.loading = true
      this.error = null

      try {
        const response = await api.post('/task/create', taskData)
        const task = response.data.task
        this.currentTask = task
        this.lastFetch = Date.now()
        return { success: true, data: task }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to create task'
        console.error('Create task error:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    /**
     * Update existing task
     */
    async updateTask(id, taskData) {
      this.loading = true
      this.error = null

      try {
        const response = await api.post(`/task/${id}/update`, taskData)
        const task = response.data.task
        
        // Update cache
        const index = this.tasks.findIndex((p) => p.id === parseInt(id))
        if (index >= 0) {
          this.tasks[index] = task
        }
        
        if (this.currentTask?.id === parseInt(id)) {
          this.currentTask = task
        }
        
        return { success: true, data: task }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to update task'
        console.error('Update task error:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete task via API (soft delete: status = 0)
     */
    async deleteTask(id) {
      const taskId = parseInt(id)
      if (isNaN(taskId)) return { success: false, error: 'Invalid task ID' }
      try {
        await api.post(`/task/${taskId}/delete`)
        return { success: true }
      } catch (error) {
        const err = error.response?.data?.error || error.message || 'Failed to delete task'
        return { success: false, error: err }
      }
    },

    /**
     * Set target date (Add to Todo) - targetDate defaults to now if empty
     */
    async setTargetDate(taskId, targetDate = null) {
      const id = parseInt(taskId)
      if (isNaN(id)) return { success: false, error: 'Invalid task ID' }
      try {
        const response = await api.post('/task/set-target-date', {
          task_id: id,
          target_date: targetDate || null,
        })
        const task = response.data.task
        const index = this.tasks.findIndex((p) => p.id === id)
        if (index >= 0) {
          this.tasks[index] = task
        }
        if (this.currentTask?.id === id) {
          this.currentTask = task
        }
        return { success: true, data: task }
      } catch (error) {
        const err = error.response?.data?.error || error.message || 'Failed to set target date'
        return { success: false, error: err }
      }
    },

    /**
     * Soft delete task (hide from UI, no API)
     */
    softDeleteTask(id) {
      const taskId = parseInt(id)
      this.deletedTaskIds.add(taskId)
      this.tasks = this.tasks.filter((task) => task.id !== taskId)
      this.totalTasks--
      if (this.currentTask?.id === taskId) {
        this.currentTask = null
      }
    },

    /**
     * Restore soft deleted task
     */
    restoreTask(id) {
      const taskId = parseInt(id)
      this.deletedTaskIds.delete(taskId)
      // Task will reappear on next fetch
    },

    /**
     * Set filters
     */
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1 // Reset to first page when filters change
    },

    /**
     * Clear filters
     */
    clearFilters() {
      this.filters = {
        projectId: null,
        assignedTo: null,
        taskStatus: null,
        priority: null,
        projectMeetingId: null,
        submission_date_from: null,
        submission_date_to: null,
      }
      this.currentPage = 1
    },

    /**
     * Go to next page
     */
    async nextPage() {
      if (this.currentPage < this.lastPage) {
        await this.fetchTasks(false, this.currentPage + 1)
      }
    },

    async previousPage() {
      if (this.currentPage > 1) {
        await this.fetchTasks(false, this.currentPage - 1)
      }
    },

    async goToPage(page) {
      if (page >= 1 && page <= this.lastPage) {
        await this.fetchTasks(false, page)
      }
    },

    /**
     * Clear cache
     */
    clearCache() {
      this.tasks = []
      this.currentTask = null
      this.lastFetch = null
      this.deletedTaskIds.clear()
    },

    /**
     * Set current task
     */
    setCurrentTask(task) {
      this.currentTask = task
    },
  },
})
