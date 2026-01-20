<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
        Title <span class="text-red-500">*</span>
      </label>
      <input
        id="title"
        v-model="formData.title"
        type="text"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        placeholder="Enter project title"
      />
      <p v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</p>
    </div>

    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
        Description
      </label>
      <textarea
        id="description"
        v-model="formData.description"
        rows="4"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        placeholder="Enter project description (optional)"
      ></textarea>
      <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
    </div>

    <div v-if="error" class="text-red-600 text-sm bg-red-50 p-3 rounded-md">
      {{ error }}
    </div>

    <div class="flex gap-3">
      <button
        type="submit"
        :disabled="loading"
        class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span v-if="loading">{{ submitText === 'Create' ? 'Creating...' : 'Updating...' }}</span>
        <span v-else>{{ submitText }}</span>
      </button>
      
      <button
        v-if="showCancel"
        type="button"
        @click="$emit('cancel')"
        class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
      >
        Cancel
      </button>
    </div>
  </form>
</template>

<script>
export default {
  name: 'ProjectForm',
  props: {
    project: {
      type: Object,
      default: null,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: '',
    },
    submitText: {
      type: String,
      default: 'Submit',
    },
    showCancel: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['submit', 'cancel'],
  data() {
    return {
      formData: {
        title: '',
        description: '',
      },
      errors: {},
    }
  },
  watch: {
    project: {
      immediate: true,
      handler(newProject) {
        if (newProject) {
          this.formData = {
            title: newProject.title || '',
            description: newProject.description || '',
          }
        } else {
          this.formData = {
            title: '',
            description: '',
          }
        }
      },
    },
  },
  methods: {
    validate() {
      this.errors = {}
      
      if (!this.formData.title || this.formData.title.trim() === '') {
        this.errors.title = 'Title is required'
        return false
      }

      return true
    },
    handleSubmit() {
      if (!this.validate()) {
        return
      }

      this.$emit('submit', {
        title: this.formData.title.trim(),
        description: this.formData.description?.trim() || null,
      })
    },
  },
}
</script>
