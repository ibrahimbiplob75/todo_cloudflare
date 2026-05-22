<template>
  <div class="space-y-6">
    <!-- Tabs -->
    <div class="flex gap-2 border-b border-gray-200">
      <button
        @click="activeTab = 'dashboard'"
        :class="[
          'px-4 py-2 font-medium border-b-2 transition',
          activeTab === 'dashboard'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900',
        ]"
      >
        Dashboard
      </button>
      <button
        @click="activeTab = 'members'"
        :class="[
          'px-4 py-2 font-medium border-b-2 transition',
          activeTab === 'members'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900',
        ]"
      >
        Member Earnings
      </button>
      <button
        @click="activeTab = 'history'"
        :class="[
          'px-4 py-2 font-medium border-b-2 transition',
          activeTab === 'history'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900',
        ]"
      >
        History
      </button>
    </div>

    <!-- Dashboard Tab -->
    <div v-if="activeTab === 'dashboard'">
      <RevenueDashboard :key="`dash-${projectId}`" :project-id="projectId" />
    </div>

    <!-- Members Tab -->
    <div v-if="activeTab === 'members'">
      <MemberProfitTable :key="`members-${projectId}`" :project-id="projectId" />
    </div>

    <!-- History Tab -->
    <div v-if="activeTab === 'history'">
      <RevenueHistoryTimeline :key="`history-${projectId}`" :project-id="projectId" />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import RevenueDashboard from '@components/revenue/RevenueDashboard.vue'
import MemberProfitTable from '@components/revenue/MemberProfitTable.vue'
import RevenueHistoryTimeline from '@components/revenue/RevenueHistoryTimeline.vue'

export default {
  name: 'ProjectRevenueView',
  components: { RevenueDashboard, MemberProfitTable, RevenueHistoryTimeline },
  props: {
    projectId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const activeTab = ref('dashboard')

    return {
      activeTab,
    }
  },
}
</script>
