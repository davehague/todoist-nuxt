<template>
  <div class="py-4 z-10 w-full border-b dark:border-gray-700">
    <div class="flex flex-wrap gap-2 w-full mx-auto">

      <!-- Search bar -->
      <div class="relative flex-1 w-full md:w-auto">
        <MagnifyingGlassIcon
          class="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
        />
        <input
          type="text"
          :placeholder="`Search ${totalTasks} tasks...`"
          class="w-full pl-10 pr-4 py-2 text-sm border rounded-lg"
          :value="modelValue"
          @input="
            $emit(
              'update:modelValue',
              ($event.target as HTMLInputElement).value
            )
          "
        />
        <!-- Clear button -->
        <button
          v-if="modelValue"
          @click="$emit('clear')"
          class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 border-none"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="flex gap-2 w-full md:w-auto">
        <div class="relative">
          <button
            @click="toggleDropdown"
            :disabled="isCopying"
            class="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <CheckIcon v-if="isCopying" class="h-4 w-4" />
            {{ isCopying ? "Copied!" : "Copy Tasks" }}
            <span class="ml-2">▼</span>
          </button>
          <div
            v-if="showDropdown"
            class="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg"
          >
            <button
              v-for="option in copyOptions"
              :key="option.limit"
              @click="handleCopy($event, option.limit)"
              class="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { MagnifyingGlassIcon, CheckIcon } from "@heroicons/vue/24/outline";

defineProps<{
  modelValue: string;
  totalTasks: number;
}>();

const showDropdown = ref(false);
const isCopying = ref(false);

const copyOptions = [
  { label: "Copy All", limit: undefined },
  { label: "Copy Top 10", limit: 10 },
  { label: "Copy Top 20", limit: 20 },
  { label: "Copy Top 50", limit: 50 },
];

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "clear"): void;
  (e: "changeToken"): void;
  (e: "copy", event: MouseEvent, limit?: number): void;
}>();

const handleCopy = async (event: MouseEvent, limit?: number) => {
  showDropdown.value = false;
  isCopying.value = true;
  emit("copy", event, limit);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  isCopying.value = false;
};
</script>
