<template>
  <Dialog :open="!!task" @close="$emit('close')" class="relative z-50">
    <div class="fixed inset-0 bg-black/30 dark:bg-black/50" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel v-if="task" class="mx-auto max-w-2xl w-full rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
        <div class="flex items-center gap-4 mb-4">
          <button v-if="!task.is_completed" @click="handleTaskComplete"
            class="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500 flex items-center justify-center"
            :class="{ 'opacity-50': isLoading }">
            <span v-if="isLoading" class="animate-spin">⌛</span>
          </button>
          <button v-else @click="handleTaskReopen"
            class="w-6 h-6 rounded-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 flex items-center justify-center text-white"
            :class="{ 'opacity-50': isLoading }">
            <span v-if="isLoading" class="animate-spin">⌛</span>
            <span v-else>✓</span>
          </button>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white" :class="{ 'line-through': task.is_completed }"
            v-html="renderMarkdown(task.content)"></h2>
        </div>

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
          <div class="mt-6 flex justify-between items-center">
            <a :href="task.url" target="_blank" rel="noopener noreferrer"
              class="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Open in Todoist
            </a>
            <button @click="confirmDelete"
              class="px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:underline">
              Delete Task
            </button>
          </div>
        </div>
      </DialogPanel>
    </div>
  </Dialog>

  <!-- Delete Confirmation Dialog -->
  <Dialog :open="showDeleteConfirm" @close="showDeleteConfirm = false" class="relative z-50">
    <div class="fixed inset-0 bg-black/50" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="mx-auto max-w-sm rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Delete Task?</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Are you sure you want to delete this task? This action cannot be undone.
        </p>
        <div class="flex justify-end gap-3">
          <button @click="showDeleteConfirm = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button @click="handleDelete"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            :class="{ 'opacity-50 cursor-not-allowed': isDeleting }">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
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

const isLoading = ref(false);
const showDeleteConfirm = ref(false);
const isDeleting = ref(false);

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

async function handleTaskComplete() {
  if (!props.task || isLoading.value) return;

  try {
    isLoading.value = true;
    await taskStore.completeTask(props.task.id);
    if (props.task) {
      props.task.is_completed = true;
    }
  } catch (error) {
    console.error('Failed to complete task:', error);
  } finally {
    isLoading.value = false;
  }
}

async function handleTaskReopen() {
  if (!props.task || isLoading.value) return;

  try {
    isLoading.value = true;
    await taskStore.reopenTask(props.task.id);
    if (props.task) {
      props.task.is_completed = false;
    }
  } catch (error) {
    console.error('Failed to reopen task:', error);
  } finally {
    isLoading.value = false;
  }
}

function confirmDelete() {
  showDeleteConfirm.value = true;
}

async function handleDelete() {
  if (!props.task || isDeleting.value) return;

  try {
    isDeleting.value = true;
    await taskStore.deleteTask(props.task.id);
    showDeleteConfirm.value = false;
    emit('close');
  } catch (error) {
    console.error('Failed to delete task:', error);
  } finally {
    isDeleting.value = false;
  }
}
</script>
