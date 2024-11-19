<template>
  <footer class="border-t dark:border-gray-700">
    <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <span class="text-sm text-gray-500 dark:text-gray-400 italic">
        Using Todoist API Token
      </span>
      <button
        @click="handleChangeToken"
        class="px-4 py-2 text-sm text-red-900 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
      >
        Change API Token
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useTodoist } from "@/composables/useTodoist";

const { handleChangeToken } = useTodoist();
</script>
