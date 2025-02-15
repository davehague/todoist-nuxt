<template>
    <div class="p-4 md:p-12">
        <div class="flex items-center justify-start gap-2 mb-6">
            <CalendarIcon class="h-6 w-6 text-gray-900 dark:text-gray-100" />
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                Today's Tasks
            </h1>
            <button v-if="hasOverdueTasks" @click="handleRescheduleOverdue"
                class="ml-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Reschedule all overdue tasks to today">
                <ArrowPathIcon class="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
        </div>

        <!-- Task Summary -->
        <div v-if="!isLoading" class="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Summary</h3>
                <button @click="isExpanded = !isExpanded"
                    class="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                    {{ isExpanded ? 'Show Less' : 'Show More' }}
                </button>
            </div>
            <div v-if="!isExpanded" class="markdown-content text-gray-600 dark:text-gray-400"
                v-html="formattedSummaryPreview">
            </div>
            <transition name="fade">
                <div v-if="isExpanded" class="markdown-content" v-html="formattedSummary"></div>
            </transition>
        </div>
        <div v-else class="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p class="text-gray-500">Generating task summary...</p>
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
import { CalendarIcon, ArrowPathIcon } from "@heroicons/vue/24/outline";
import { isToday } from "date-fns";
import { useTaskSummary } from '@/composables/useTaskSummary';

import { marked } from 'marked';
import '@/assets/css/marked.css'
import { id } from "date-fns/locale";

const taskStore = useTaskStore();
const selectedTask = ref<Task | null>(null);
const searchQuery = ref("");
const sectionStore = useSectionStore();
const projectStore = useProjectStore();
const { isLoading, summary, generateSummary } = useTaskSummary();

const taskSummary = {
    isLoading,
    summary,
    generateSummary
};

const formattedSummary = computed(() => {
    if (!summary.value) return ''
    return marked.parse(summary.value)
})

const isExpanded = ref(false);

const formattedSummaryPreview = computed(() => {
    if (!summary.value) return '';
    const firstLine = summary.value.split('\n')[0];
    const preview = firstLine + (summary.value.length > 100 ? '...' : '');
    return marked.parse(preview);
});

watch(summary, (newSummary) => {
    console.log(newSummary);
});

const projectTasks = computed(() =>
    taskStore.sortedTasks.filter(task => task.project_name === 'Projects')
);

const nonProjectTasks = computed(() =>
    taskStore.sortedTasks.filter(task => task.project_name !== 'Projects')
);

const hasOverdueTasks = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return taskStore.sortedTasks.some(task => {
        if (!task.due?.date) return false;
        // Parse YYYY-MM-DD format properly
        const [year, month, day] = task.due.date.split('-').map(Number);
        const taskDate = new Date(year, month - 1, day); // month is 0-based in JS
        return taskDate < today;
    });
});

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

const handleRescheduleOverdue = async () => {
    console.log('Rescheduling overdue tasks...');
    try {
        await taskStore.rescheduleOverdueTasks();
    } catch (error) {
        console.error('Failed to reschedule tasks:', error);
        // You might want to add error handling UI feedback here
    }
};

// Watch for changes in tasks and regenerate summary
watch([projectTasks, nonProjectTasks], async ([newProjectTasks, newNonProjectTasks], [oldProjectTasks, oldNonProjectTasks]) => {
    if (!newProjectTasks?.length && !newNonProjectTasks?.length) return;

    // Map tasks to only include content and priority
    const simplifiedProjectTasks = newProjectTasks.map(task => ({
        id: task.id,
        content: task.content,
        priority: task.priority
    }));
    const simplifiedNonProjectTasks = newNonProjectTasks.map(task => ({
        id: task.id,
        content: task.content,
        priority: task.priority
    }));

    // Only generate summary on initial load or when tasks actually change
    const isInitialLoad = !oldProjectTasks && !oldNonProjectTasks;
    await taskSummary.generateSummary(
        simplifiedProjectTasks,
        simplifiedNonProjectTasks,
        isInitialLoad
    );
}, { immediate: true });

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

<style>
.markdown-content :deep(p:only-child) {
    margin: 0;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
