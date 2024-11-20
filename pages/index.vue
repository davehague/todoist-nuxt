<template>
  <div class="p-4 md:p-12">
    <div class="w-full flex flex-col">
      <SearchBar
        v-model="searchQuery"
        :total-tasks="taskStore.tasks.length"
        @clear="clearSearch"
        @copy="handleCopy"
      />
      <FilterBar
        :tasks="taskStore.tasks"
        @update:filters="taskStore.updateFilters"
      />

      <TaskList
        :tasks="taskStore.sortedTasks"
        @select="selectedTask = $event"
      />
      <TaskModal
        v-if="selectedTask"
        :task="selectedTask"
        @close="selectedTask = null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTaskStore } from "@/stores/useTaskStore";
import { copyTasksToClipboard } from "@/utils/copyTasks";
import { type Task } from "@/types/interfaces";

const authStore = useAuthStore();
const taskStore = useTaskStore();
const selectedTask = ref<Task | null>(null);
const searchQuery = ref("");

// Update filteredTasks when search query changes
watch(searchQuery, (query) => {
  if (!query) {
    taskStore.filteredTasks = taskStore.tasks;
  } else {
    taskStore.filteredTasks = taskStore.tasks.filter(
      (task) =>
        task.content.toLowerCase().includes(query.toLowerCase()) ||
        task.project_name.toLowerCase().includes(query.toLowerCase()) ||
        (task.section_name?.toLowerCase().includes(query.toLowerCase()) ??
          false) ||
        (task.due?.date || "").includes(query.toLowerCase())
    );
  }
});

const clearSearch = () => {
  searchQuery.value = "";
};

const handleCopy = async (event: MouseEvent, limit?: number) => {
  await copyTasksToClipboard(taskStore.sortedTasks, limit);
};

onMounted(async () => {
  await taskStore.fetchTasks();
});
</script>
