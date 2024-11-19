<template>
  <div class="max-w-4xl mx-auto p-4">
    <div class="flex items-center gap-2 mb-6">
      <CheckCircleIcon class="h-6 w-6" />
      <h1 class="text-2xl font-bold">Completed Tasks</h1>
    </div>

    <TokenInput v-if="authStore.showTokenInput" :onLoad="loadCompletedTasks" />

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

      <div v-if="taskStore.isLoading" class="text-gray-500 dark:text-gray-400">
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
import { useAuthStore } from "@/stores/useAuthStore";
import { useTaskStore } from "@/stores/useTaskStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useSectionStore } from "@/stores/useSectionStore";
import TokenInput from "@/components/TokenInput.vue";
import TaskList from "@/components/TaskList.vue";
import TaskModal from "@/components/TaskModal.vue";
import type { Task, CompletedTask } from "@/types/interfaces";

const authStore = useAuthStore();
const taskStore = useTaskStore();
const projectStore = useProjectStore();
const sectionStore = useSectionStore();

const selectedDate = ref(new Date().toISOString().split("T")[0]);
const error = ref<string | null>(null);
const selectedTask = ref<Task | null>(null);

const loadCompletedTasks = async () => {
  await Promise.all([
    taskStore.fetchCompletedTasks(),
    projectStore.fetchProjects(),
    sectionStore.fetchSections(),
  ]);
};

const mappedCompletedTasks = computed(() => {
  return filteredCompletedTasks.value.map(
    (task: CompletedTask): Task => ({
      id: task.task_id,
      content: task.content,
      project_id: task.project_id,
      project_name: projectStore.getProjectName(task.project_id),
      section_id: task.section_id || "",
      section_name: task.section_id
        ? sectionStore.getSectionName(task.section_id)
        : "",
      description: "",
      priority: 1,
      created_at: "",
      is_completed: true,
      completed_at: task.completed_at,
      labels: [],
      url: `https://todoist.com/app/task/${task.task_id}`,
    })
  );
});

const filteredCompletedTasks = computed(() => {
  return taskStore.completedTasks.filter((task: CompletedTask) => {
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
  if (taskStore.completedTasks.length === 0 && authStore.apiToken) {
    taskStore.fetchCompletedTasks();
  }
});

// Initialize on mount
onMounted(async () => {
  await authStore.loadToken();
  if (authStore.apiToken) {
    await Promise.all([
      taskStore.fetchCompletedTasks(),
      projectStore.fetchProjects(),
      sectionStore.fetchSections(),
    ]);
  }
});

// Watch for token changes
watch(
  () => authStore.apiToken,
  async (newToken) => {
    if (newToken) {
      await Promise.all([
        taskStore.fetchCompletedTasks(),
        projectStore.fetchProjects(),
        sectionStore.fetchSections(),
      ]);
    }
  }
);
</script>
