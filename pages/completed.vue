<template>
  <div class="max-w-4xl mx-auto p-4">
    <div class="flex items-center gap-2 mb-6">
      <CheckCircleIcon class="h-6 w-6" />
      <h1 class="text-2xl font-bold">Completed Tasks</h1>
    </div>

    <div v-if="showTokenInput" class="space-y-6">
      <div class="space-y-6 text-center">
        <div class="space-y-3">
          <p class="text-lg text-gray-600 dark:text-gray-300">
            To get started:
          </p>
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
          v-model="apiToken"
          type="password"
          placeholder="Enter your Todoist API token"
          class="w-full px-6 py-3 text-lg border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
        <button
          @click="fetchCompletedTasks"
          :disabled="isLoading"
          class="w-full px-6 py-3 text-lg bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <svg
            v-if="isLoading"
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
          {{ isLoading ? "Loading Tasks..." : "Load Tasks" }}
        </button>
      </div>
    </div>

    <div v-else>
      <div class="mb-6 flex justify-between items-center">
        <input
          type="date"
          v-model="selectedDate"
          class="px-4 py-2 border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
        <div class="text-lg text-orange-500 dark:text-gray-300">
          {{ filteredCompletedTasks.length }} task{{
            filteredCompletedTasks.length !== 1 ? "s" : ""
          }}
          completed
        </div>
      </div>

      <div v-if="isLoading" class="text-gray-500 dark:text-gray-400">
        Loading tasks...
      </div>

      <div
        v-else-if="error"
        class="text-red-500 p-4 bg-red-50 dark:bg-red-900/50 rounded-lg"
      >
        {{ error }}
      </div>

      <div v-else>
        <div
          v-if="filteredCompletedTasks.length === 0"
          class="text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          No tasks completed on
          {{ format(new Date(selectedDate), "MMMM d, yyyy") }}
        </div>

        <TaskList
          v-else
          :tasks="mappedCompletedTasks"
          @select="selectedTask = $event"
        />

        <TaskModal
          v-if="selectedTask"
          :task="selectedTask"
          @close="selectedTask = null"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { format, parseISO } from "date-fns";
import { CheckCircleIcon } from "@heroicons/vue/24/outline";
import { useTodoist } from "~/composables/useTodoist";
import TaskList from "@/components/TaskList.vue";
import TaskModal from "@/components/TaskModal.vue";
import type { Task, CompletedTask } from "@/types/interfaces";

const selectedDate = ref(new Date().toISOString().split("T")[0]);
const error = ref<string | null>(null);
const selectedTask = ref<Task | null>(null);

const {
  completedTasks,
  isLoading,
  apiToken,
  showTokenInput,
  fetchCompletedTasks,
} = useTodoist();

const mappedCompletedTasks = computed(() => {
  return filteredCompletedTasks.value.map(
    (task: CompletedTask): Task => ({
      id: task.task_id,
      content: task.content,
      project_id: task.project_id,
      project_name: "", // This would need to be fetched separately
      section_id: task.section_id || "",
      section_name: "", // This would need to be fetched separately
      description: "",
      priority: 1,
      created_at: "", // Not available in completed tasks
      is_completed: true,
      completed_at: task.completed_at,
      labels: [],
      url: `https://todoist.com/app/task/${task.task_id}`,
    })
  );
});

const filteredCompletedTasks = computed(() => {
  return completedTasks.value.filter((task: CompletedTask) => {
    if (!task.completed_at) return false;

    // Parse the selected date and get UTC boundaries
    const localDate = parseISO(selectedDate.value);
    const utcDate = new Date(
      Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        0,
        0,
        0,
        0
      )
    );

    const utcEndDate = new Date(
      Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        23,
        59,
        59,
        999
      )
    );

    // Parse the task completion date (already in UTC since it ends with Z)
    const taskCompletionDate = new Date(task.completed_at);

    // Compare in UTC
    return taskCompletionDate >= utcDate && taskCompletionDate <= utcEndDate;
  });
});

// Watch for date changes to refetch tasks if needed
watch(selectedDate, () => {
  if (completedTasks.value.length === 0 && apiToken.value) {
    fetchCompletedTasks();
  }
});

onMounted(async () => {
  if (apiToken.value) {
    await fetchCompletedTasks();
  }
});
</script>
