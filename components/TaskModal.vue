<template>
  <Dialog :open="!!task" @close="$emit('close')" class="relative z-50">
    <div class="fixed inset-0 bg-black/30 dark:bg-black/50" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel v-if="task" class="mx-auto max-w-2xl w-full rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4" v-html="renderMarkdown(task.content)"></h2>

        <div class="space-y-4">
          <div>
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Project</h4>
            <p class="text-sm text-gray-900 dark:text-gray-100">
              {{ task.project_name }}
              <span v-if="task.section_name"> / {{ task.section_name }}</span>
            </p>
          </div>

          <div v-if="task.description">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Description</h4>
            <p class="text-sm text-gray-900 dark:text-gray-100 prose prose-blue dark:prose-invert"
              v-html="renderMarkdown(task.description)"></p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</h4>
              <select v-model="editedTask.priority"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                @change="handlePriorityChange">
                <option v-for="(p, index) in [4, 3, 2, 1]" :key="p" :value="p">
                  {{ ['High', 'Medium', 'Low', 'None'][index] }}
                </option>
              </select>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</h4>
              <div class="flex items-center gap-2">
                <input type="date" v-model="editedTask.due_date"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  @change="handleDueDateChange">
                <button @click="clearDueDate"
                  class="mt-1 px-2 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                  Clear
                </button>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Created</h4>
              <p class="text-sm text-gray-900 dark:text-gray-100">
                {{ formatTaskDate(task.created_at) }}
              </p>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Status</h4>
              <p class="text-sm text-gray-900 dark:text-gray-100">
                {{ task.is_completed ? "Completed" : "Active" }}
              </p>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">URL</h4>
            <a :href="task.url" target="_blank" rel="noopener noreferrer"
              class="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Open in Todoist
            </a>
          </div>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel } from "@headlessui/vue";
import { ref, onMounted } from 'vue';
import type { Task } from "../types/interfaces";
import { renderMarkdown } from "../utils/markdown";
import { formatTaskDate } from "../utils/dateUtils";
import { useTaskStore } from '../stores/useTaskStore';
import { useProjectStore } from '../stores/useProjectStore';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  task: Task | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const taskStore = useTaskStore();
const projectStore = useProjectStore();
const { projects } = storeToRefs(projectStore);

const editedTask = ref({
  priority: 4,
  due_date: '',
});

onMounted(() => {
  if (props.task) {
    editedTask.value = {
      priority: props.task.priority,
      due_date: props.task.due?.date || '',
    };
  }
});

async function handlePriorityChange() {
  if (!props.task) return;
  try {
    await taskStore.updateTask(props.task.id, {
      priority: editedTask.value.priority,
    });
  } catch (error) {
    console.error('Failed to update priority:', error);
  }
}

async function handleDueDateChange() {
  if (!props.task) return;
  try {
    if (!editedTask.value.due_date) {
      await taskStore.updateTask(props.task.id, { due: undefined });
    } else {
      await taskStore.updateTask(props.task.id, {
        due: {
          date: editedTask.value.due_date,
          is_recurring: false,
          string: editedTask.value.due_date
        },
      });
    }
  } catch (error) {
    console.error('Failed to update due date:', error);
  }
}

async function clearDueDate() {
  if (!props.task) return;
  try {
    editedTask.value.due_date = '';
    await taskStore.updateTask(props.task.id, { due: undefined });
  } catch (error) {
    console.error('Failed to clear due date:', error);
  }
}
</script>
