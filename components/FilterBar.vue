<template>
  <div class="flex flex-wrap gap-2 w-full py-2 border-b dark:border-gray-700">
    <!-- Project and Section Filter -->
    <select
      v-model="selectedProjectSection"
      class="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
      @change="emitFilters"
    >
      <option value="">All Projects</option>
      <optgroup
        v-for="project in projectsWithSections"
        :key="project.name"
        :label="project.name"
      >
        <option :value="project.name">{{ project.name }}</option>
        <option
          v-for="section in project.sections"
          :key="section"
          :value="`${project.name} > ${section}`"
        >
          {{ project.name }} > {{ section }}
        </option>
      </optgroup>
    </select>

    <!-- Due Date Filter -->
    <select
      v-model="selectedDueFilter"
      class="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
      @change="emitFilters"
    >
      <option value="all">All Due Dates</option>
      <option value="today">Due Today</option>
      <option value="has_due">Has Due Date</option>
      <option value="no_due">No Due Date</option>
    </select>

    <!-- Labels Filter -->
    <select
      v-model="selectedLabel"
      class="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
      @change="emitFilters"
    >
      <option value="">All Labels</option>
      <option v-for="label in uniqueLabels" :key="label" :value="label">
        {{ label }}
      </option>
    </select>

    <!-- Sort Order -->
    <select
      v-model="selectedSort"
      class="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
      @change="emitFilters"
    >
      <option value="created_desc">Created Date (Newest)</option>
      <option value="created_asc">Created Date (Oldest)</option>
      <option value="due_desc">Due Date (Latest)</option>
      <option value="due_asc">Due Date (Earliest)</option>
      <option value="project">Project Name</option>
      <option value="content">Content</option>
    </select>

    <!-- Reset Button -->
    <button
      @click="resetFilters"
      class="px-3 py-2 text-sm rounded-lg bg-gray-500 dark:bg-gray-700 text-white dark:text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 transition-colors"
    >
      Reset Filters
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Task } from "../types/interfaces";

const props = defineProps<{
  tasks: Task[];
}>();

const selectedDueFilter = ref("all");
const selectedLabel = ref("");
const selectedSort = ref("created_desc");
const selectedProjectSection = ref("");

const emit = defineEmits<{
  (
    e: "update:filters",
    filters: {
      dueFilter: string;
      label: string;
      sort: string;
      projectSection: string;
    }
  ): void;
}>();

const uniqueLabels = computed(() => {
  const labels = new Set<string>();
  props.tasks.forEach((task) => {
    task.labels?.forEach((label) => labels.add(label));
  });
  return Array.from(labels).sort();
});

const projectsWithSections = computed(() => {
  const projectMap = new Map<string, Set<string>>();

  props.tasks.forEach((task) => {
    if (!projectMap.has(task.project_name)) {
      projectMap.set(task.project_name, new Set());
    }
    if (task.section_name) {
      projectMap.get(task.project_name)?.add(task.section_name);
    }
  });

  return Array.from(projectMap.entries())
    .map(([name, sections]) => ({
      name,
      sections: Array.from(sections).sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

const emitFilters = () => {
  emit("update:filters", {
    dueFilter: selectedDueFilter.value,
    label: selectedLabel.value,
    sort: selectedSort.value,
    projectSection: selectedProjectSection.value,
  });
};

const resetFilters = () => {
  selectedDueFilter.value = "all";
  selectedLabel.value = "";
  selectedSort.value = "created_desc";
  selectedProjectSection.value = "";
  emitFilters();
};
</script>
