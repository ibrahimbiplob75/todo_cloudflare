<template>
  <div class="rounded-lg border border-gray-200 bg-white p-6">
    <h3 class="text-lg font-bold text-gray-800 mb-4">Member Profit Distribution</h3>

    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="error" class="text-center py-8 text-red-600">
      {{ error }}
    </div>

    <div v-else-if="memberEarnings.length === 0" class="text-center py-8 text-gray-600">
      No members assigned to any roles yet.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b bg-gray-50">
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Member Name</th>
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
            <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">Share %</th>
            <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount Earned</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(earning, index) in memberEarnings"
            :key="index"
            class="border-b hover:bg-gray-50"
          >
            <td class="px-4 py-3 text-gray-800 font-medium">{{ earning.memberName }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                {{ getRoleLabel(earning.role) }}
              </span>
            </td>
            <td class="px-4 py-3 text-center text-gray-700">{{ earning.sharePercentage }}%</td>
            <td class="px-4 py-3 text-right font-semibold text-gray-900">
              {{ formatCurrency(earning.amountEarned) }}
            </td>
          </tr>
          <tr class="bg-gray-50 font-semibold">
            <td colspan="3" class="px-4 py-3 text-right text-gray-800">Total Earnings:</td>
            <td class="px-4 py-3 text-right text-gray-900">{{ formatCurrency(totalEarned) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { formatCurrency, getRoleLabel } from '@utils/revenueHelpers'

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
  name: 'MemberProfitTable',
  props: {
    projectId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const memberEarnings = ref([])
    const loading = ref(true)
    const error = ref(null)
    const allMembers = ref([])

    const totalEarned = computed(() => {
      return memberEarnings.value.reduce((sum, earning) => sum + earning.amountEarned, 0)
    })

    const getMemberName = (userId) => {
      const member = allMembers.value.find(m => m.id === userId)
      return member ? member.name : `User ${userId}`
    }

    const fetchProfitSummary = async () => {
      try {
        loading.value = true
        const response = await api.get(`/project/${props.projectId}/profit-summary`)
        
        const earnings = []
        Object.entries(response.data.assignments).forEach(([role, members]) => {
          members.forEach(member => {
            earnings.push({
              userId: member.userId,
              memberName: getMemberName(member.userId),
              role,
              sharePercentage: member.sharePercentage,
              amountEarned: member.amountEarned,
            })
          })
        })
        
        memberEarnings.value = earnings
      } catch (err) {
        error.value = err.response?.data?.error || 'Failed to load earnings'
      } finally {
        loading.value = false
      }
    }

    const fetchMembers = async () => {
      try {
        const response = await api.get('/users')
        allMembers.value = response.data || []
      } catch (err) {
        console.error('Error fetching members:', err)
      }
    }

    onMounted(() => {
      fetchMembers()
      fetchProfitSummary()
    })

    return {
      memberEarnings,
      loading,
      error,
      totalEarned,
      formatCurrency,
      getRoleLabel,
    }
  },
}
</script>
