<template>
  <div class="rounded-lg border border-gray-200 bg-white p-6">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Revenue Management Dashboard</h2>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <!-- Total Amount Card -->
      <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
        <div class="text-sm font-medium text-blue-600 mb-1">Total Project Amount</div>
        <div class="text-2xl font-bold text-blue-900">{{ formatCurrency(summary.totalAmount) }}</div>
        <div class="text-xs text-blue-600 mt-2">Project Value</div>
      </div>

      <!-- Expense Card -->
      <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
        <div class="text-sm font-medium text-red-600 mb-1">Total Expenses</div>
        <div class="text-2xl font-bold text-red-900">{{ formatCurrency(summary.expense) }}</div>
        <div class="text-xs text-red-600 mt-2">Project Costs</div>
      </div>

      <!-- Net Revenue Card -->
      <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
        <div class="text-sm font-medium text-green-600 mb-1">Net Revenue</div>
        <div class="text-2xl font-bold text-green-900">{{ formatCurrency(summary.netRevenue) }}</div>
        <div class="text-xs text-green-600 mt-2">Distribution Base</div>
      </div>

      <!-- Company Reserve Card -->
      <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
        <div class="text-sm font-medium text-purple-600 mb-1">Company Reserve</div>
        <div class="text-2xl font-bold text-purple-900">{{ formatCurrency(summary.totalReserve) }}</div>
        <div class="text-xs text-purple-600 mt-2">Reserved for Company</div>
      </div>
    </div>

    <!-- Revenue Distribution Chart -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Revenue Distribution</h3>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Pie Chart -->
        <div class="flex items-center justify-center">
          <div class="w-64 h-64">
            <canvas ref="chartCanvas"></canvas>
          </div>
        </div>

        <!-- Distribution List -->
        <div class="space-y-3">
          <div
            v-for="(amount, role) in summary.breakdown"
            :key="role"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-4 h-4 rounded"
                :style="{ backgroundColor: getRoleColor(role === 'reserve' ? 'reserve' : role) }"
              ></div>
              <div>
                <div class="font-medium text-gray-800">
                  {{ role === 'reserve' ? 'Company Reserve' : getRoleLabel(role) }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ getPercentageForRole(role) }}%
                </div>
              </div>
            </div>
            <div class="font-semibold text-gray-900">{{ formatCurrency(amount) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Assignments Section -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">Role Assignments</h3>
        <button
          v-if="isWatcher"
          @click="showAssignmentModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Assign Members
        </button>
      </div>

      <div class="space-y-4">
        <div
          v-for="assignment in assignments"
          :key="assignment.id"
          class="border border-gray-200 rounded-lg p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="font-semibold text-gray-800">{{ getRoleLabel(assignment.role) }}</h4>
              <p class="text-sm text-gray-600">
                {{ formatCurrency(summary.breakdown[assignment.role]) }}
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <div
              v-for="member in assignment.members"
              :key="member.id"
              class="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200"
            >
              <div>
                <div class="font-medium text-gray-800">{{ getMemberName(member.userId) }}</div>
                <div class="text-sm text-gray-600">Share: {{ member.sharePercentage }}%</div>
              </div>
              <div class="text-right">
                <div class="font-semibold text-gray-900">{{ formatCurrency(member.amountEarned) }}</div>
                <div class="text-xs text-gray-500">earned</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Unused Roles -->
        <div v-if="summary.unusedRoles && summary.unusedRoles.length > 0" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 class="font-semibold text-yellow-900 mb-2">Unused Roles (added to reserve)</h4>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="role in summary.unusedRoles"
              :key="role"
              class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium"
            >
              {{ getRoleLabel(role) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Assignment Modal -->
  <div
    v-if="showAssignmentModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-gray-800">Assign Members to Role</h3>
        <button
          @click="showAssignmentModal = false"
          class="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <form @submit.prevent="submitAssignment" class="space-y-4">
        <!-- Role Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
          <select
            v-model="assignmentForm.role"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">-- Select a role --</option>
            <option
              v-for="role in getRevenueRoles()"
              :key="role.key"
              :value="role.key"
            >
              {{ role.label }}
            </option>
          </select>
        </div>

        <!-- Members Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Assign Members</label>
          <div class="space-y-2">
            <div
              v-for="(member, index) in assignmentForm.members"
              :key="index"
              class="flex gap-2"
            >
              <select
                v-model.number="member.userId"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Select member --</option>
                <option v-for="user in teamMembers" :key="user.id" :value="user.id">
                  {{ user.name }}
                </option>
              </select>
              <input
                v-model.number="member.sharePercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="Share %"
                class="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                v-if="assignmentForm.members.length > 1"
                type="button"
                @click="assignmentForm.members.splice(index, 1)"
                class="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
              >
                Remove
              </button>
            </div>

            <button
              type="button"
              @click="assignmentForm.members.push({ userId: null, sharePercentage: 50 })"
              class="mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              + Add Member
            </button>
          </div>

          <div class="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
            <div class="text-sm text-blue-700">
              Total Share: <strong>{{ totalSharePercentage }}%</strong>
              <span v-if="totalSharePercentage !== 100" class="text-red-600 ml-2">
                (Must equal 100%)
              </span>
            </div>
          </div>
        </div>

        <div class="flex gap-3 justify-end">
          <button
            type="button"
            @click="showAssignmentModal = false"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="totalSharePercentage !== 100 || submittingAssignment"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ submittingAssignment ? 'Assigning...' : 'Assign Members' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@stores/auth'
import {
  formatCurrency,
  getRevenueRoles,
  getRoleLabel,
  getRoleColor,
} from '@utils/revenueHelpers'

const api = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default {
  name: 'RevenueDashboard',
  props: {
    projectId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const authStore = useAuthStore()
    const isWatcher = computed(() => authStore.isWatcher)

    const summary = ref(null)
    const assignments = ref([])
    const teamMembers = ref([])
    const loading = ref(true)
    const error = ref(null)
    const chartCanvas = ref(null)

    const showAssignmentModal = ref(false)
    const submittingAssignment = ref(false)
    const assignmentForm = ref({
      role: '',
      members: [{ userId: null, sharePercentage: 50 }],
    })

    const totalSharePercentage = computed(() => {
      return assignmentForm.value.members.reduce((sum, m) => sum + (m.sharePercentage || 0), 0)
    })

    const getMemberName = (userId) => {
      const member = teamMembers.value.find(m => m.id === userId)
      return member ? member.name : `User ${userId}`
    }

    const getPercentageForRole = (role) => {
      if (role === 'reserve') return '40'
      const roleObj = getRevenueRoles().find(r => r.key === role)
      return roleObj ? roleObj.percentage : '0'
    }

    const fetchSummary = async () => {
      try {
        loading.value = true
        const response = await api.get(`/project/${props.projectId}/profit-summary`)
        summary.value = response.data
        assignments.value = Object.entries(response.data.assignments).map(([role, members]) => ({
          id: role,
          role,
          members,
        }))
        drawChart()
      } catch (err) {
        error.value = err.response?.data?.error || err.message
      } finally {
        loading.value = false
      }
    }

    const fetchTeamMembers = async () => {
      try {
        const response = await api.get('/users')
        teamMembers.value = response.data || []
      } catch (err) {
        console.error('Error fetching team members:', err)
      }
    }

    const drawChart = () => {
      if (!chartCanvas.value || !summary.value) return

      const ctx = chartCanvas.value.getContext('2d')
      const labels = []
      const data = []
      const colors = []

      Object.entries(summary.value.breakdown).forEach(([role, amount]) => {
        labels.push(role === 'reserve' ? 'Company Reserve' : getRoleLabel(role))
        data.push(amount)
        colors.push(getRoleColor(role === 'reserve' ? 'reserve' : role))
      })

      // Simple pie chart drawing (without Chart.js dependency)
      const total = data.reduce((a, b) => a + b, 0)
      const centerX = ctx.canvas.width / 2
      const centerY = ctx.canvas.height / 2
      const radius = Math.min(centerX, centerY) - 20

      let startAngle = -Math.PI / 2
      data.forEach((amount, index) => {
        const sliceAngle = (amount / total) * 2 * Math.PI
        const endAngle = startAngle + sliceAngle

        // Draw slice
        ctx.fillStyle = colors[index]
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, startAngle, endAngle)
        ctx.closePath()
        ctx.fill()

        // Draw border
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw label
        const labelAngle = startAngle + sliceAngle / 2
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7)
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7)

        const percentage = ((amount / total) * 100).toFixed(0)
        ctx.fillStyle = '#000'
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${percentage}%`, labelX, labelY)

        startAngle = endAngle
      })
    }

    const submitAssignment = async () => {
      try {
        submittingAssignment.value = true
        await api.post(`/project/${props.projectId}/revenue/assign`, {
          role: assignmentForm.value.role,
          members: assignmentForm.value.members.map(m => ({
            userId: m.userId,
            sharePercentage: m.sharePercentage,
          })),
        })
        showAssignmentModal.value = false
        assignmentForm.value = {
          role: '',
          members: [{ userId: null, sharePercentage: 50 }],
        }
        await fetchSummary()
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to assign members')
      } finally {
        submittingAssignment.value = false
      }
    }

    onMounted(() => {
      fetchSummary()
      fetchTeamMembers()
    })

    return {
      summary,
      assignments,
      teamMembers,
      loading,
      error,
      chartCanvas,
      isWatcher,
      showAssignmentModal,
      submittingAssignment,
      assignmentForm,
      totalSharePercentage,
      formatCurrency,
      getRevenueRoles,
      getRoleLabel,
      getRoleColor,
      getMemberName,
      getPercentageForRole,
      submitAssignment,
    }
  },
}
</script>
