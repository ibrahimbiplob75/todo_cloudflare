<template>
  <div id="app">
    <PublicLayout v-if="isPublicRoute" />
    <PrivateLayout v-else />
  </div>
</template>

<script>
import PublicLayout from './layouts/PublicLayout.vue'
import PrivateLayout from './layouts/PrivateLayout.vue'

export default {
  name: 'App',
  components: {
    PublicLayout,
    PrivateLayout,
  },
  computed: {
    isPublicRoute() {
      return this.$route.meta.middleware === 'public'
    },
  },
}
</script>
