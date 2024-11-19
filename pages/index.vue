<template>
  <div class="p-4 md:p-12">
    <TokenInput
      v-if="!taskStore.tasks.length || authStore.showTokenInput"
      :onLoad="taskStore.fetchTasks"
    />

    <div v-else class="w-full flex flex-col">
      <SearchBar
        v-model="taskStore.searchQuery"
        :total-tasks="taskStore.tasks.length"
        @clear="taskStore.clearSearch"
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
import { useAuthStore } from "@/stores/useAuthStore";
import { useTaskStore } from "@/stores/useTaskStore";
import { type Task } from "@/types/interfaces";
import SearchBar from "@/components/SearchBar.vue";
import FilterBar from "@/components/FilterBar.vue";
import TaskList from "@/components/TaskList.vue";
import TaskModal from "@/components/TaskModal.vue";

const authStore = useAuthStore();
const taskStore = useTaskStore();
const selectedTask = ref<Task | null>(null);

const handleCopy = async (event: MouseEvent) => {
  await taskStore.copyToClipboard();
};

onMounted(async () => {
  await authStore.loadToken();
  if (authStore.apiToken) {
    await taskStore.fetchTasks();
  }
});

watch(
  () => authStore.apiToken,
  async (newToken) => {
    if (newToken) {
      await taskStore.fetchTasks();
    }
  }
);
</script>

<style>
.markdown {
  color: rgb(17, 24, 39);
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.markdown a {
  color: rgb(37, 99, 235);
}
.markdown a:hover {
  text-decoration: underline;
}
.markdown p {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}
</style>
