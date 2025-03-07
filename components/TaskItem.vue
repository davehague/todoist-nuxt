<template>
  <div
    class="p-4 border rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50 cursor-pointer transition-colors dark:bg-gray-800"
    @click="$emit('click')">
    <div class="flex flex-col gap-1">
      <div class="flex gap-2">
        <span
          class="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/50 dark:text-blue-200 px-2 py-0.5 rounded-full w-fit">
          {{ task.project_name }}
        </span>
        <span v-if="task.section_name"
          class="text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/50 dark:text-purple-200 px-2 py-0.5 rounded-full w-fit">
          {{ task.section_name }}
        </span>
      </div>
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="text-red-600 dark:text-red-400 font-bold">{{ getPriorityIndicator(task.priority) }}</span>
          <h3 class="text-sm font-medium" :class="{
            'text-red-900 dark:text-red-100': taskStatus === 'overdue',
            'text-gray-900 dark:text-white': taskStatus !== 'overdue'
          }" v-html="renderMarkdown(task.content)"></h3>
        </div>
        <div class="flex flex-col items-end">
          <span v-if="task.due" class="text-xs whitespace-nowrap" :class="{
            'text-red-600 dark:text-red-400 font-medium': taskStatus === 'overdue',
            'text-gray-500 dark:text-gray-400': taskStatus !== 'overdue'
          }">
            Due: {{ formattedDueDate }}
            <span v-if="taskStatus === 'overdue'" class="ml-1">(Overdue)</span>
          </span>
          <span v-if="task.created_at" class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            Created: {{ formattedCreatedDate }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from "../types/interfaces";
import { renderMarkdown } from "../utils/markdown";
import { getTaskStatus, getPriorityIndicator } from "../utils/taskUtils";
import { formatTaskDate } from "../utils/dateUtils";

const props = defineProps<{
  task: Task;
}>();

const taskStatus = computed(() => getTaskStatus(props.task));

const formattedDueDate = computed(() => formatTaskDate(props.task.due?.date));
const formattedCreatedDate = computed(() => formatTaskDate(props.task.created_at));

defineEmits<{
  (e: "click"): void;
}>();
</script>
