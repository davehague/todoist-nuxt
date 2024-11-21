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
import { ref, onMounted, watch } from "vue";
import { useTaskStore } from "@/stores/useTaskStore";
import { copyTasksToClipboard } from "@/utils/copyTasks";
import { type Task } from "@/types/interfaces";
import { useSectionStore } from "@/stores/useSectionStore";
import { useProjectStore } from "@/stores/useProjectStore";

const taskStore = useTaskStore();
const selectedTask = ref<Task | null>(null);
const searchQuery = ref("");
const sectionStore = useSectionStore();
const projectStore = useProjectStore();

// Update filteredTasks when search query changes
watch(searchQuery, (query) => {
  taskStore.searchQuery = query;
  taskStore.handleSearch();
});

const clearSearch = () => {
  searchQuery.value = "";
};

const handleCopy = async (event: MouseEvent, limit?: number) => {
  await copyTasksToClipboard(taskStore.sortedTasks, limit);
};

onMounted(async () => {
  if (!sectionStore.isLoaded) {
    await sectionStore.fetchSections();
  }
  if (!projectStore.isLoaded) {
    await projectStore.fetchProjects();
  }
  await taskStore.fetchTasks();
});
</script>
