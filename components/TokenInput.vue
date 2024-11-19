<template>
  <div class="w-full max-w-6xl mx-auto space-y-6">
    <div class="space-y-6 text-center">
      <div class="space-y-3">
        <p class="text-lg text-gray-600 dark:text-gray-300">To get started:</p>
        <ol
          class="text-lg text-gray-600 dark:text-gray-300 list-decimal list-inside space-y-3"
        >
          <li>Go to Todoist Settings → Integrations → Developer</li>
          <li>Copy your API token</li>
          <li>Paste it below to load your tasks</li>
        </ol>
      </div>
    </div>

    <div class="space-y-2">
      <input
        type="password"
        v-model="tokenInput"
        placeholder="Enter your Todoist API token"
        class="w-full px-6 py-3 text-lg border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
      />
      <button
        @click="handleLoad"
        :disabled="authStore.isLoading"
        class="w-full px-6 py-3 text-lg bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        <svg
          v-if="authStore.isLoading"
          class="animate-spin h-5 w-5"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
            fill="none"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {{ authStore.isLoading ? "Loading Tasks..." : "Load Tasks" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/useAuthStore";

const props = defineProps<{
  onLoad: () => Promise<void>;
}>();

const authStore = useAuthStore();
const tokenInput = ref("");

const handleLoad = async () => {
  if (!tokenInput.value) return;

  try {
    await authStore.setToken(tokenInput.value);
    await props.onLoad();
  } catch (error) {
    console.error("Failed to load tasks:", error);
    // Token will be automatically cleared by error handling in stores
  }
};
</script>
