<template>
  <div class="space-y-6">
    <div class="text-center">
      <div class="space-y-3">
        <ol
          class="text-lg text-gray-600 dark:text-gray-300 list-decimal list-inside space-y-3 bg-white dark:bg-gray-800"
        >
          <li>Go to Todoist Settings → Integrations → Developer</li>
          <li>Copy your API token</li>
          <li>Paste it below to load your tasks</li>
        </ol>
      </div>
    </div>
    <div class="relative">
      <input
        id="token-input"
        v-model="token"
        :type="showPassword ? 'text' : 'password'"
        class="p-2 block w-full rounded-md border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pr-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        :placeholder="placeholder"
      />
      <button
        type="button"
        @click="showPassword = !showPassword"
        class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        <svg
          class="h-5 w-5"
          :class="{ 'text-blue-500': showPassword }"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            v-if="showPassword"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            v-if="showPassword"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
          <path
            v-else
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const token = computed({
  get() {
    return props.modelValue;
  },
  set(value: string) {
    emit("update:modelValue", value);
  },
});

const showPassword = ref(false);
</script>
