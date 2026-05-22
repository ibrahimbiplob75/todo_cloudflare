<template>
  <div class="rounded-lg border border-gray-200 bg-white p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Revenue Distribution Settings</h2>
      <div v-if="lastUpdated" class="text-sm text-gray-600">
        Last updated: {{ formatDate(lastUpdated) }}
      </div>
    </div>

    <div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
      {{ error }}
    </div>

    <div v-if="success" class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
      Settings updated successfully!
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">Loading settings...</p>
    </div>

    <form v-else @submit.prevent="submitSettings" class="space-y-6">
      <!-- Settings Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Quotation Creation -->
        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <label class="block text-sm font-medium text-gray-800 mb-2">
            Quotation Creation
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="formData.quotationPercentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span class="text-lg font-semibold text-gray-700">%</span>
          </div>
          <p class="mt-2 text-xs text-gray-600">Amount: {{ formatCurrency(getAmount(formData.quotationPercentage)) }}</p>
        </div>

        <!-- Marketing Support -->
        <div class="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <label class="block text-sm font-medium text-gray-800 mb-2">
            Marketing Support
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="formData.marketingPercentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span class="text-lg font-semibold text-gray-700">%</span>
          </div>
          <p class="mt-2 text-xs text-gray-600">Amount: {{ formatCurrency(getAmount(formData.marketingPercentage)) }}</p>
        </div>

        <!-- Graphics Work -->
        <div class="p-4 bg-pink-50 border border-pink-200 rounded-lg">
          <label class="block text-sm font-medium text-gray-800 mb-2">
            Graphics Work
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="formData.graphicsPercentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span class="text-lg font-semibold text-gray-700">%</span>
          </div>
          <p class="mt-2 text-xs text-gray-600">Amount: {{ formatCurrency(getAmount(formData.graphicsPercentage)) }}</p>
        </div>

        <!-- Client Hunting/Achieving -->
        <div class="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <label class="block text-sm font-medium text-gray-800 mb-2">
            Client Hunting/Achieving
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="formData.clientHuntPercentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span class="text-lg font-semibold text-gray-700">%</span>
          </div>
          <p class="mt-2 text-xs text-gray-600">Amount: {{ formatCurrency(getAmount(formData.clientHuntPercentage)) }}</p>
        </div>

        <!-- Quality Assurance (QA) -->
        <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
          <label class="block text-sm font-medium text-gray-800 mb-2">
            Quality Assurance (QA)
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="formData.qaPercentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span class="text-lg font-semibold text-gray-700">%</span>
          </div>
          <p class="mt-2 text-xs text-gray-600">Amount: {{ formatCurrency(getAmount(formData.qaPercentage)) }}</p>
        </div>

        <!-- Secondary Major Work -->
        <div class="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
          <label class="block text-sm font-medium text-gray-800 mb-2">
            Secondary Major Work
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="formData.secondaryPercentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span class="text-lg font-semibold text-gray-700">%</span>
          </div>
          <p class="mt-2 text-xs text-gray-600">Amount: {{ formatCurrency(getAmount(formData.secondaryPercentage)) }}</p>
        </div>

        <!-- Core Work -->
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <label class="block text-sm font-medium text-gray-800 mb-2">
            Core Work
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="formData.corePercentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span class="text-lg font-semibold text-gray-700">%</span>
          </div>
          <p class="mt-2 text-xs text-gray-600">Amount: {{ formatCurrency(getAmount(formData.corePercentage)) }}</p>
        </div>

        <!-- Company Reserve -->
        <div class="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <label class="block text-sm font-medium text-gray-800 mb-2">
            Company Reserve
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="formData.reservePercentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span class="text-lg font-semibold text-gray-700">%</span>
          </div>
          <p class="mt-2 text-xs text-gray-600">Amount: {{ formatCurrency(getAmount(formData.reservePercentage)) }}</p>
        </div>
      </div>

      <!-- Total Validation -->
      <div
        :class="[
          'p-4 rounded-lg border',
          totalPercentage === 100
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200',
        ]"
      >
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-semibold" :class="totalPercentage === 100 ? 'text-green-900' : 'text-red-900'">
              Total Distribution
            </h4>
            <p :class="totalPercentage === 100 ? 'text-green-700' : 'text-red-700'">
              All percentages must sum to 100%
            </p>
          </div>
          <div class="text-3xl font-bold" :class="totalPercentage === 100 ? 'text-green-900' : 'text-red-900'">
            {{ totalPercentage.toFixed(2) }}%
          </div>
        </div>
      </div>

      <!-- Example Calculation -->
      <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 class="font-semibold text-blue-900 mb-2">Example Calculation</h4>
        <p class="text-sm text-blue-700 mb-3">
          Based on a project with BDT 100,000 total amount and BDT 10,000 expense (net revenue: BDT 90,000):
        </p>
        <div class="space-y-1 text-sm font-medium text-blue-800">
          <div>Quotation: {{ formatCurrency(getAmount(formData.quotationPercentage, 90000)) }}</div>
          <div>Marketing: {{ formatCurrency(getAmount(formData.marketingPercentage, 90000)) }}</div>
          <div>Graphics: {{ formatCurrency(getAmount(formData.graphicsPercentage, 90000)) }}</div>
          <div>Client Hunt: {{ formatCurrency(getAmount(formData.clientHuntPercentage, 90000)) }}</div>
          <div>QA: {{ formatCurrency(getAmount(formData.qaPercentage, 90000)) }}</div>
          <div>Secondary: {{ formatCurrency(getAmount(formData.secondaryPercentage, 90000)) }}</div>
          <div>Core: {{ formatCurrency(getAmount(formData.corePercentage, 90000)) }}</div>
          <div class="pt-2 border-t border-blue-300">
            Reserve: {{ formatCurrency(getAmount(formData.reservePercentage, 90000)) }}
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 justify-end pt-6 border-t border-gray-200">
        <button
          type="button"
          @click="resetForm"
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          Reset
        </button>
        <button
          type="submit"
          :disabled="totalPercentage !== 100 || submitting"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {{ submitting ? 'Saving...' : 'Save Settings' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { formatCurrency } from '@utils/revenueHelpers'

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
  name: 'RevenueSettingsPage',
  setup() {
    const formData = ref({
      quotationPercentage: 2,
      marketingPercentage: 5,
      graphicsPercentage: 5,
      clientHuntPercentage: 5,
      qaPercentage: 8,
      secondaryPercentage: 10,
      corePercentage: 25,
      reservePercentage: 40,
    })

    const originalData = ref({ ...formData.value })
    const loading = ref(false)
    const submitting = ref(false)
    const error = ref(null)
    const success = ref(false)
    const lastUpdated = ref(null)

    const totalPercentage = computed(() => {
      return (
        formData.value.quotationPercentage +
        formData.value.marketingPercentage +
        formData.value.graphicsPercentage +
        formData.value.clientHuntPercentage +
        formData.value.qaPercentage +
        formData.value.secondaryPercentage +
        formData.value.corePercentage +
        formData.value.reservePercentage
      )
    })

    const getAmount = (percentage, baseAmount = 100000) => {
      const netRevenue = baseAmount - (baseAmount * 0.1) // 10% expense
      return (netRevenue * percentage) / 100
    }

    const formatDate = (date) => {
      return new Intl.DateTimeFormat('en-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(date))
    }

    const fetchSettings = async () => {
      try {
        loading.value = true
        const response = await api.get('/revenue/settings')
        formData.value = {
          quotationPercentage: response.data.quotationPercentage,
          marketingPercentage: response.data.marketingPercentage,
          graphicsPercentage: response.data.graphicsPercentage,
          clientHuntPercentage: response.data.clientHuntPercentage,
          qaPercentage: response.data.qaPercentage,
          secondaryPercentage: response.data.secondaryPercentage,
          corePercentage: response.data.corePercentage,
          reservePercentage: response.data.reservePercentage,
        }
        originalData.value = { ...formData.value }
        lastUpdated.value = response.data.updatedAt
      } catch (err) {
        error.value = err.response?.data?.error || 'Failed to load settings'
      } finally {
        loading.value = false
      }
    }

    const submitSettings = async () => {
      try {
        submitting.value = true
        error.value = null
        success.value = false

        await api.put('/revenue/settings', formData.value)

        originalData.value = { ...formData.value }
        success.value = true
        lastUpdated.value = new Date().toISOString()

        setTimeout(() => {
          success.value = false
        }, 3000)
      } catch (err) {
        error.value = err.response?.data?.error || 'Failed to save settings'
      } finally {
        submitting.value = false
      }
    }

    const resetForm = () => {
      formData.value = { ...originalData.value }
      error.value = null
      success.value = false
    }

    onMounted(() => {
      fetchSettings()
    })

    return {
      formData,
      loading,
      submitting,
      error,
      success,
      lastUpdated,
      totalPercentage,
      getAmount,
      formatDate,
      formatCurrency,
      submitSettings,
      resetForm,
    }
  },
}
</script>
