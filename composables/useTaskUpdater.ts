// composables/useTaskUpdater.ts
import { ref } from "vue";
import type { Task } from "../types/interfaces";
import type { TodoistTaskUpdate } from "../types/todoist";

import { useTaskStore } from "../stores/useTaskStore";

export function useTaskUpdater(initialTask: Task) {
  const taskStore = useTaskStore();
  const isUpdating = ref(false);
  const pendingUpdates = ref<TodoistTaskUpdate>({});

  // Apply updates to both API and local state
  const applyUpdates = async (updates: TodoistTaskUpdate) => {
    try {
      isUpdating.value = true;
      await taskStore.updateTask(initialTask.id, updates);
      pendingUpdates.value = {}; // Clear pending updates after successful update
    } catch (error) {
      console.error("Failed to update task:", error);
      throw error; // Let the component handle the error
    } finally {
      isUpdating.value = false;
    }
  };

  // Queue multiple updates and apply them together
  const queueUpdates = (updates: TodoistTaskUpdate) => {
    pendingUpdates.value = {
      ...pendingUpdates.value,
      ...updates,
    };
  };

  // Commit all queued updates
  const commitUpdates = async () => {
    if (Object.keys(pendingUpdates.value).length === 0) return;

    await applyUpdates(pendingUpdates.value);
  };

  // Handle individual field updates
  const updateContent = async (content: string) => {
    if (content === initialTask.content) return;
    await applyUpdates({ content });
  };

  const updateDueDate = async (date: string | null) => {
    if (date === null) {
      // User explicitly wants to clear the date
      await applyUpdates({ due_string: "no date" });
    } else {
      // User wants to set a specific date
      await applyUpdates({ due_date: date });
    }
  };

  const updatePriority = async (priority: number) => {
    if (priority === initialTask.priority) return;
    await applyUpdates({ priority });
  };

  return {
    isUpdating,
    pendingUpdates,
    queueUpdates,
    commitUpdates,
    updateContent,
    updateDueDate,
    updatePriority,
  };
}
