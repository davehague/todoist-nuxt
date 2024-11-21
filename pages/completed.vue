<template>
  <div class="p-4 md:p-12">
    <div class="flex items-center justify-start gap-2 mb-6">
      <CheckCircleIcon class="h-6 w-6 text-gray-900 dark:text-gray-100" />
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        Completed Tasks
      </h1>
    </div>
    <div>
      <div class="mb-6 flex flex-col gap-4">
        <SearchBar
          v-model="searchQuery"
          :total-tasks="taskStore.completedTasks.length"
          @clear="clearSearch"
          @copy="handleCopy"
        />

        <div class="flex justify-between items-center">
          <input
            type="date"
            v-model="selectedDate"
            class="px-4 py-2 border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
          <div class="text-lg text-orange-500">
            {{ displayedTasks.length }} task{{
              displayedTasks.length !== 1 ? "s" : ""
            }}
            completed
          </div>
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
          v-if="displayedTasks.length === 0"
          class="text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          No tasks found
        </div>

        <TaskList
          v-else
          :tasks="displayedTasks"
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
import { parseISO } from "date-fns";
import { CheckCircleIcon } from "@heroicons/vue/24/outline";
import { useTaskStore } from "@/stores/useTaskStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useSectionStore } from "@/stores/useSectionStore";
import { copyTasksToClipboard } from "@/utils/copyTasks";
import TaskList from "@/components/TaskList.vue";
import TaskModal from "@/components/TaskModal.vue";
import SearchBar from "@/components/SearchBar.vue";
import type { Task, CompletedTask } from "@/types/interfaces";

const taskStore = useTaskStore();
const projectStore = useProjectStore();
const sectionStore = useSectionStore();

const selectedDate = ref(new Date().toISOString().split("T")[0]);
const error = ref<string | null>(null);
const selectedTask = ref<Task | null>(null);
const searchQuery = ref("");

const filteredCompletedTasks = computed(() => {
  return taskStore.completedTasks.filter((task: CompletedTask) => {
    if (!task.completed_at) return false;

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
    const taskCompletionDate = new Date(task.completed_at);
    return taskCompletionDate >= utcDate && taskCompletionDate <= utcEndDate;
  });
});

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

const displayedTasks = computed(() => {
  const query = searchQuery.value.toLowerCase();
  if (!query) return mappedCompletedTasks.value;

  return mappedCompletedTasks.value.filter(
    (task) =>
      task.content.toLowerCase().includes(query) ||
      task.project_name.toLowerCase().includes(query) ||
      (task.section_name?.toLowerCase().includes(query) ?? false)
  );
});

const clearSearch = () => {
  searchQuery.value = "";
};

const handleCopy = async (event: MouseEvent, limit?: number) => {
  await copyTasksToClipboard(displayedTasks.value, limit);
};

watch(selectedDate, () => {
  if (taskStore.completedTasks.length === 0) {
    taskStore.fetchCompletedTasks();
  }
});

onMounted(async () => {
  if (!sectionStore.isLoaded) {
    await sectionStore.fetchSections();
  }
  if (!projectStore.isLoaded) {
    await projectStore.fetchProjects();
  }
  if (!taskStore.isLoaded) {
    await taskStore.fetchTasks();
  }
  await taskStore.fetchCompletedTasks();
});
</script>
