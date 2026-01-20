<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <HeaderComponent />
    
    <!-- Body Layout -->
    <div class="flex h-[calc(100vh-73px)]">
      <!-- Sidebar -->
      <SidebarComponent />
      
      <!-- Main Content -->
      <main class="flex-1 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script>
import HeaderComponent from '../components/layout/HeaderComponent.vue'
import SidebarComponent from '../components/layout/SidebarComponent.vue'

export default {
  name: 'PrivateLayout',
  components: {
    HeaderComponent,
    SidebarComponent,
  },
}
</script>
