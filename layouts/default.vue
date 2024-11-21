<template>
  <div class="min-h-screen flex flex-col dark:bg-gray-900">
    <AppHeader v-if="authStore.isAuthenticated" />
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/useAuthStore";
const authStore = useAuthStore();
</script>
