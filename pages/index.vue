<template>
    <div class="p-4 md:p-12">
        <div class="flex items-center justify-start gap-2 mb-6">
            <CalendarIcon class="h-6 w-6 text-gray-900 dark:text-gray-100" />
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                Today's Tasks
            </h1>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="w-full">
                <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Project Tasks</h2>
                <TaskList :tasks="projectTasks" @select="selectedTask = $event" />
            </div>
            <div class="w-full">
                <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Other Tasks</h2>
                <TaskList :tasks="nonProjectTasks" @select="selectedTask = $event" />
            </div>
        </div>
        <TaskModal v-if="selectedTask" :task="selectedTask" @close="selectedTask = null" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from "vue";
import { useTaskStore } from "@/stores/useTaskStore";
import { copyTasksToClipboard } from "@/utils/copyTasks";
import { type Task } from "@/types/interfaces";
import { useSectionStore } from "@/stores/useSectionStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { CalendarIcon } from "@heroicons/vue/24/outline";
import { isToday } from "date-fns";
import { SearchBar } from "@/components/SearchBar.vue";
import { FilterBar } from "@/components/FilterBar.vue";

const taskStore = useTaskStore();
const selectedTask = ref<Task | null>(null);
const searchQuery = ref("");
const sectionStore = useSectionStore();
const projectStore = useProjectStore();

const projectTasks = computed(() =>
    taskStore.sortedTasks.filter(task => task.project_name === 'Projects')
);

const nonProjectTasks = computed(() =>
    taskStore.sortedTasks.filter(task => task.project_name !== 'Projects
    ')
    );

// Update filteredTasks when search query changes
watch(searchQuery, (query) => {
    taskStore.searchQuery = query;
    taskStore.handleSearch();
});

watch(selectedTask, (task) => {
    console.log(task);
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

    // Set filter for today's tasks and overdue tasks
    taskStore.setFilter((task) => {
        if (!task.due?.date) return false;
        const taskDate = new Date(task.due.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return isToday(taskDate) || taskDate < today;
    });
});

// Clean up filter when component is unmounted
onUnmounted(() => {
    taskStore.clearFilter();
});
</script>
