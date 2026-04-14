<template>
  <div class="h-[calc(100vh-115px)] flex flex-col relative bg-gray-50">
    <!-- Top Bar -->
    <div class="h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
      <div class="font-semibold text-lg text-gray-800">
        Meetings
        <span v-if="meetings.length > 0" class="text-sm text-gray-500 font-normal ml-2">
          ({{ meetings.length }})
        </span>
      </div>

      <button
        v-if="isWatcher"
        @click="showMeetingFormModal = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
      >
        <i class="fas fa-plus mr-2"></i>
        New Meeting
      </button>
    </div>

    <!-- Meetings List Section -->
    <div class="flex-1 overflow-y-auto px-3 py-2">
      <!-- Loading State -->
      <div v-if="loading && meetings.length === 0" class="text-center py-12">
        <p class="text-gray-500">Loading meetings...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error && meetings.length === 0" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-600">{{ error }}</p>
        <button
          @click="fetchMeetings(true)"
          class="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>

      <!-- Meetings List -->
      <div v-else-if="meetings.length > 0">
        <MeetingCard
          v-for="meeting in meetings"
          :key="meeting.id"
          :meeting="meeting"
          :can-manage="isWatcher"
          @delete="handleDeleteMeeting"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <i class="fas fa-calendar-alt text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg mb-2">No meetings found</p>
        <p class="text-gray-400 text-sm">Create your first meeting using the button above</p>
      </div>
    </div>

    <!-- Meeting Form Modal -->
    <div
      v-if="showMeetingFormModal && isWatcher"
      class="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-50 flex items-center justify-center p-4"
      @click.self="showMeetingFormModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-800">Create Meeting</h2>
          <button
            @click="showMeetingFormModal = false"
            class="text-gray-500 hover:text-gray-700"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="p-6">
          <MeetingForm
            :loading="meetingStore.loading"
            :error="meetingStore.error"
            submit-text="Create"
            @submit="handleCreateMeeting"
            @cancel="showMeetingFormModal = false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useMeetingStore } from '@stores/meeting'
import { useAuthStore } from '@stores/auth'
import MeetingCard from '@components/meeting/MeetingCard.vue'
import MeetingForm from '@components/meeting/MeetingForm.vue'

export default {
  name: 'MeetingsListView',
  components: {
    MeetingCard,
    MeetingForm,
  },
  data() {
    return {
      showMeetingFormModal: false,
    }
  },
  computed: {
    meetingStore() {
      return useMeetingStore()
    },
    authStore() {
      return useAuthStore()
    },
    isWatcher() {
      return this.authStore.isWatcher
    },
    meetings() {
      return this.meetingStore.meetings
    },
    loading() {
      return this.meetingStore.loading
    },
    error() {
      return this.meetingStore.error
    },
  },
  async mounted() {
    await this.fetchMeetings()
  },
  methods: {
    async fetchMeetings(forceRefresh = false) {
      await this.meetingStore.fetchMeetings(forceRefresh)
    },
    async handleCreateMeeting(meetingData) {
      const result = await this.meetingStore.createMeeting(meetingData)
      if (result.success) {
        this.showMeetingFormModal = false
        await this.fetchMeetings(true)
      } else {
        alert(result.error || 'Failed to create meeting')
      }
    },
    async handleDeleteMeeting(meetingId) {
      const result = await this.meetingStore.deleteMeeting(meetingId)
      if (result.success) {
        await this.fetchMeetings(true)
      } else {
        alert(result.error || 'Failed to delete meeting')
      }
    },
  },
}
</script>
