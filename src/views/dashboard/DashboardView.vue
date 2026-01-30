<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
    
    <div class="bg-white rounded-lg shadow-md p-6">
      <p class="text-gray-600">
        Welcome to your dashboard, <span class="font-semibold text-gray-800">{{ userName }}</span>!
      </p>
      
      <div class="mt-4">
        <TaskProgress />
      </div>

      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <TaskStatusAnalytics />
        <ProjectAnalytics />
        <MeetingAnalytics />
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@stores/auth'
import TaskProgress from '@components/task/TaskProgress.vue'
import TaskStatusAnalytics from '@components/task/TaskStatusAnalytics.vue'
import ProjectAnalytics from '@components/project/ProjectAnalytics.vue'
import MeetingAnalytics from '@components/meeting/MeetingAnalytics.vue'

export default {
  name: 'DashboardView',
  components: { TaskProgress, TaskStatusAnalytics, ProjectAnalytics, MeetingAnalytics },
  computed: {
    userName() {
      return useAuthStore().userName
    },
  },
}
</script>
