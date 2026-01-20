import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isAuthenticated: false,
  }),

  getters: {
    userName: (state) => state.user?.name || '',
    userEmail: (state) => state.user?.email || '',
  },

  actions: {
    async login(email, password) {
      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Login failed')
        }

        const data = await response.json()
        
        this.user = data.user
        this.token = data.token
        this.isAuthenticated = true

        // Store in localStorage for persistence
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        return { success: true }
      } catch (error) {
        console.error('Login error:', error)
        return { success: false, error: error.message }
      }
    },

    async logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    },

    async checkAuth() {
      const token = localStorage.getItem('auth_token')
      const userStr = localStorage.getItem('user')

      if (token && userStr) {
        try {
          // Verify token by fetching profile
          const response = await fetch('/auth/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            this.user = data.user
            this.token = token
            this.isAuthenticated = true
            return true
          } else {
            // Token invalid, clear storage
            this.logout()
            return false
          }
        } catch (error) {
          console.error('Auth check error:', error)
          this.logout()
          return false
        }
      }

      return false
    },

    async fetchProfile() {
      if (!this.token) return

      try {
        const response = await fetch('/auth/profile', {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          this.user = data.user
          localStorage.setItem('user', JSON.stringify(data.user))
          return { success: true, user: data.user }
        } else {
          throw new Error('Failed to fetch profile')
        }
      } catch (error) {
        console.error('Fetch profile error:', error)
        return { success: false, error: error.message }
      }
    },
  },
})
