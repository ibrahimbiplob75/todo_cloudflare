<template>
  <div class="rounded-lg border border-gray-200 bg-white p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-bold text-gray-800">Revenue Change History</h3>
      <button
        @click="fetchHistory"
        :disabled="loading"
        class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
      >
        Refresh
      </button>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="error" class="text-center py-8 text-red-600">
      {{ error }}
    </div>

    <div v-else-if="history.length === 0" class="text-center py-8 text-gray-600">
      No changes recorded yet.
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="record in history"
        :key="record.id"
        class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
      >
        <!-- Change Header -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <div
              :class="[
                'w-3 h-3 rounded-full',
                getChangeTypeColor(record.changeType),
              ]"
            ></div>
            <div>
              <h4 class="font-semibold text-gray-800">{{ getChangeTypeLabel(record.changeType) }}</h4>
              <p class="text-sm text-gray-500">{{ formatDate(record.createdAt) }}</p>
            </div>
          </div>
          <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
            By User #{{ record.changedBy }}
          </span>
        </div>

        <!-- Change Details -->
        <div v-if="record.oldData || record.newData" class="space-y-2 mt-3 text-sm">
          <!-- Old Data -->
          <div v-if="record.oldData" class="p-3 bg-red-50 border border-red-200 rounded">
            <p class="font-medium text-red-900 mb-1">Before:</p>
            <div class="text-red-800 space-y-1">
              <div v-for="(value, key) in record.oldData" :key="key" class="flex justify-between">
                <span>{{ formatKeyName(key) }}:</span>
                <strong>{{ formatValue(value, key) }}</strong>
              </div>
            </div>
          </div>

          <!-- New Data -->
          <div v-if="record.newData" class="p-3 bg-green-50 border border-green-200 rounded">
            <p class="font-medium text-green-900 mb-1">After:</p>
            <div class="text-green-800 space-y-1">
              <div v-for="(value, key) in record.newData" :key="key" class="flex justify-between">
                <span>{{ formatKeyName(key) }}:</span>
                <strong>{{ formatValue(value, key) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="total > take" class="flex items-center justify-between mt-6 pt-4 border-t">
        <p class="text-sm text-gray-600">
          Showing {{ skip + 1 }}-{{ Math.min(skip + take, total) }} of {{ total }} changes
        </p>
        <div class="flex gap-2">
          <button
            @click="skip = Math.max(0, skip - take)"
            :disabled="skip === 0"
            class="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            @click="skip += take"
            :disabled="skip + take >= total"
            class="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { getChangeTypeLabel, formatCurrency } from '@utils/revenueHelpers'

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
  name: 'RevenueHistoryTimeline',
  props: {
    projectId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const history = ref([])
    const loading = ref(true)
    const error = ref(null)
    const skip = ref(0)
    const take = ref(20)
    const total = ref(0)

    const getChangeTypeColor = (changeType) => {
      const colors = {
        'amount_change': 'bg-blue-500',
        'expense_change': 'bg-orange-500',
        'assignment_change': 'bg-green-500',
        'settings_change': 'bg-purple-500',
      }
      return colors[changeType] || 'bg-gray-500'
    }

    const formatDate = (dateString) => {
      return new Intl.DateTimeFormat('en-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateString))
    }

    const formatKeyName = (key) => {
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim()
    }

    const formatValue = (value, key) => {
      if (key.includes('Amount') || key.includes('Earned')) {
        return formatCurrency(value)
      }
      if (typeof value === 'number') {
        return value.toFixed(2)
      }
      return String(value)
    }

    const fetchHistory = async () => {
      try {
        loading.value = true
        const response = await api.get(
          `/project/${props.projectId}/revenue-history?skip=${skip.value}&take=${take.value}`
        )
        history.value = response.data.data || []
        total.value = response.data.total || 0
      } catch (err) {
        error.value = err.response?.data?.error || 'Failed to load history'
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchHistory()
    })

    return {
      history,
      loading,
      error,
      skip,
      take,
      total,
      getChangeTypeColor,
      formatDate,
      formatKeyName,
      formatValue,
      getChangeTypeLabel,
      fetchHistory,
    }
  },
}
</script>
