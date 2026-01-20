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

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [],
    currentProject: null,
    loading: false,
    error: null,
    lastFetch: null,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes cache
  }),

  getters: {
    // Get project by ID
    getProjectById: (state) => (id) => {
      return state.projects.find((p) => p.id === parseInt(id))
    },

    // Check if cache is still valid
    isCacheValid: (state) => {
      if (!state.lastFetch) return false
      return Date.now() - state.lastFetch < state.cacheTimeout
    },

    // Get user's projects
    myProjects: (state) => {
      return state.projects.filter((p) => p.creator)
    },
  },

  actions: {
    /**
     * List all projects
     * Uses caching for performance
     */
    async fetchProjects(forceRefresh = false) {
      // Return cached data if valid and not forcing refresh
      if (this.isCacheValid && !forceRefresh && this.projects.length > 0) {
        return { success: true, data: this.projects }
      }

      this.loading = true
      this.error = null

      try {
        const response = await api.get('/project')
        this.projects = response.data.projects || []
        this.lastFetch = Date.now()
        return { success: true, data: this.projects }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch projects'
        console.error('Fetch projects error:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    /**
     * Get single project by ID
     * Checks cache first, then fetches if not found
     */
    async fetchProjectById(id) {
      const projectId = parseInt(id)
      
      // Check cache first
      const cachedProject = this.getProjectById(projectId)
      if (cachedProject) {
        this.currentProject = cachedProject
        return { success: true, data: cachedProject }
      }

      this.loading = true
      this.error = null

      try {
        const response = await api.get(`/project/${projectId}`)
        const project = response.data.project
        
        // Update cache
        const index = this.projects.findIndex((p) => p.id === projectId)
        if (index >= 0) {
          this.projects[index] = project
        } else {
          this.projects.push(project)
        }
        
        this.currentProject = project
        return { success: true, data: project }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch project'
        console.error('Fetch project error:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    /**
     * Create new project
     */
    async createProject(projectData) {
      this.loading = true
      this.error = null

      try {
        const response = await api.post('/project/create', projectData)
        const project = response.data.project
        
        // Add to cache
        this.projects.unshift(project) // Add to beginning
        this.currentProject = project
        
        // Update cache timestamp
        this.lastFetch = Date.now()
        
        return { success: true, data: project }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to create project'
        console.error('Create project error:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    /**
     * Update existing project
     */
    async updateProject(id, projectData) {
      this.loading = true
      this.error = null

      try {
        const response = await api.post(`/project/${id}/update`, projectData)
        const project = response.data.project
        
        // Update cache
        const index = this.projects.findIndex((p) => p.id === parseInt(id))
        if (index >= 0) {
          this.projects[index] = project
        }
        
        if (this.currentProject?.id === parseInt(id)) {
          this.currentProject = project
        }
        
        return { success: true, data: project }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to update project'
        console.error('Update project error:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete project
     */
    async deleteProject(id) {
      this.loading = true
      this.error = null

      try {
        await api.post(`/project/${id}/delete`)
        
        // Remove from cache
        this.projects = this.projects.filter((p) => p.id !== parseInt(id))
        
        if (this.currentProject?.id === parseInt(id)) {
          this.currentProject = null
        }
        
        return { success: true }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to delete project'
        console.error('Delete project error:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    /**
     * Clear cache
     */
    clearCache() {
      this.projects = []
      this.currentProject = null
      this.lastFetch = null
    },

    /**
     * Set current project
     */
    setCurrentProject(project) {
      this.currentProject = project
    },
  },
})
