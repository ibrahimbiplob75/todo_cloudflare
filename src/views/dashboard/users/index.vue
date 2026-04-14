<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">User Management</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1 bg-white rounded-lg shadow-md p-5 h-fit">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Add User</h2>

        <form @submit.prevent="handleCreateUser" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              v-model="form.email"
              type="email"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              v-model="form.password"
              type="text"
              required
              minlength="6"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter password"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              v-model="form.role"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="user">User</option>
              <option value="watcher">Watcher (Admin)</option>
            </select>
          </div>

          <div v-if="formError" class="text-red-600 text-sm">{{ formError }}</div>

          <button
            type="submit"
            :disabled="saving"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ saving ? 'Saving...' : 'Create User' }}
          </button>
        </form>
      </div>

      <div class="lg:col-span-2 bg-white rounded-lg shadow-md p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800">Users</h2>
          <button
            @click="fetchUsers"
            :disabled="loading"
            class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        <div v-if="loading" class="py-8 text-center text-gray-500">Loading users...</div>
        <div v-else-if="error" class="py-8 text-center text-red-600">{{ error }}</div>
        <div v-else-if="users.length === 0" class="py-8 text-center text-gray-500">No users found.</div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-gray-600">
                <th class="py-2 pr-3">Name</th>
                <th class="py-2 pr-3">Email</th>
                <th class="py-2 pr-3">Role</th>
                <th class="py-2 pr-3">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id" class="border-b last:border-b-0">
                <td class="py-3 pr-3">{{ user.name }}</td>
                <td class="py-3 pr-3">{{ user.email }}</td>
                <td class="py-3 pr-3">
                  <select
                    :value="roleDraft[user.id] || user.role || 'user'"
                    @change="(e) => updateRoleDraft(user.id, e.target.value)"
                    class="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="user">User</option>
                    <option value="watcher">Watcher (Admin)</option>
                  </select>
                </td>
                <td class="py-3 pr-3">
                  <button
                    @click="saveRole(user)"
                    :disabled="updatingIds.has(user.id)"
                    class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {{ updatingIds.has(user.id) ? 'Updating...' : 'Save Role' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2'
import { useAuthStore } from '@stores/auth'

export default {
  name: 'UsersManagementView',
  data() {
    return {
      users: [],
      loading: false,
      saving: false,
      error: '',
      formError: '',
      updatingIds: new Set(),
      roleDraft: {},
      form: {
        name: '',
        email: '',
        password: '',
        role: 'user',
      },
    }
  },
  computed: {
    token() {
      return useAuthStore().token || localStorage.getItem('auth_token')
    },
  },
  async mounted() {
    await this.fetchUsers()
  },
  methods: {
    authHeaders() {
      return {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      }
    },
    async fetchUsers() {
      this.loading = true
      this.error = ''
      try {
        const response = await fetch('/user', {
          headers: this.authHeaders(),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch users')
        }
        this.users = data.users || []
        this.roleDraft = this.users.reduce((acc, user) => {
          acc[user.id] = user.role || 'user'
          return acc
        }, {})
      } catch (error) {
        this.error = error.message || 'Failed to fetch users'
      } finally {
        this.loading = false
      }
    },
    updateRoleDraft(userId, role) {
      this.roleDraft = {
        ...this.roleDraft,
        [userId]: role,
      }
    },
    async handleCreateUser() {
      this.saving = true
      this.formError = ''
      try {
        const response = await fetch('/user/create', {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify(this.form),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create user')
        }

        this.form = {
          name: '',
          email: '',
          password: '',
          role: 'user',
        }
        await this.fetchUsers()
        Swal.fire({
          icon: 'success',
          title: 'User created',
          timer: 1500,
          showConfirmButton: false,
        })
      } catch (error) {
        this.formError = error.message || 'Failed to create user'
      } finally {
        this.saving = false
      }
    },
    async saveRole(user) {
      const nextRole = this.roleDraft[user.id] || 'user'
      if (nextRole === (user.role || 'user')) return

      this.updatingIds.add(user.id)
      try {
        const response = await fetch(`/user/${user.id}/update`, {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify({ role: nextRole }),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to update role')
        }

        this.users = this.users.map((u) => {
          if (u.id !== user.id) return u
          return { ...u, role: nextRole }
        })

        Swal.fire({
          icon: 'success',
          title: 'Role updated',
          timer: 1200,
          showConfirmButton: false,
        })
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Update failed',
          text: error.message || 'Failed to update role',
        })
      } finally {
        this.updatingIds.delete(user.id)
      }
    },
  },
}
</script>
