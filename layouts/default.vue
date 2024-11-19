<template>
  <div class="min-h-screen flex flex-col dark:bg-gray-900">
    <AppHeader />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
// No additional setup needed
</script>