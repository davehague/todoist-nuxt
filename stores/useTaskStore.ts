// stores/useTaskStore.ts
import { defineStore } from "pinia";
import { useProjectStore } from "./useProjectStore";
import { useSectionStore } from "./useSectionStore";
import type { Task, RawTask, CompletedTask } from "~/types/interfaces";
import type { TodoistTaskUpdate } from "~/types/todoist";
import { useApiHeaders } from "@/composables/useApiHeaders";

interface TaskState {
  tasks: Task[];
  completedTasks: CompletedTask[];
  filteredTasks: Task[];
  isLoading: boolean;
  isLoaded: boolean;
  searchQuery: string;
  filterSettings: {
    dueFilter: string;
    label: string;
    sort: string;
    projectSection: string;
    priority: string;
  };
  filterFn: ((task: Task) => boolean) | null;
}

export const useTaskStore = defineStore("tasks", {
  state: (): TaskState => ({
    tasks: [],
    completedTasks: [],
    filteredTasks: [],
    isLoading: false,
    isLoaded: false,
    searchQuery: "",
    filterSettings: {
      dueFilter: "all",
      label: "",
      sort: "created_desc",
      projectSection: "",
      priority: "",
    },
    filterFn: null,
  }),

  getters: {
    sortedTasks: (state) => {
      let filtered = state.filteredTasks;

      // Apply priority filter
      if (state.filterSettings.priority) {
        filtered = filtered.filter(
          (task) => task.priority === parseInt(state.filterSettings.priority)
        );
      }

      // Apply project/section filter
      if (state.filterSettings.projectSection) {
        const [project, section] =
          state.filterSettings.projectSection.split(" > ");
        filtered = filtered.filter((task) => {
          if (section) {
            return (
              task.project_name === project && task.section_name === section
            );
          }
          return task.project_name === project;
        });
      }

      // Apply due date filter
      if (state.filterSettings.dueFilter !== "all") {
        const today = new Date().toISOString().split("T")[0];
        filtered = filtered.filter((task) => {
          switch (state.filterSettings.dueFilter) {
            case "today":
              return task.due?.date && task.due.date <= today;
            case "has_due":
              return !!task.due;
            case "no_due":
              return !task.due;
            default:
              return true;
          }
        });
      }

      // Apply label filter
      if (state.filterSettings.label) {
        filtered = filtered.filter((task) =>
          task.labels?.includes(state.filterSettings.label)
        );
      }

      // Apply custom filter function if exists
      if (state.filterFn) {
        filtered = filtered.filter(state.filterFn);
      }

      // Sort tasks by priority, due date, and overdue status
      return [...filtered].sort((a, b) => {
        // Sort by priority (higher priority first)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }

        // Sort by overdue status
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const aDate = a.due?.date ? new Date(a.due.date) : null;
        const bDate = b.due?.date ? new Date(b.due.date) : null;

        const aOverdue = aDate && aDate < today;
        const bOverdue = bDate && bDate < today;

        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        // Sort by due date if both tasks have one
        if (aDate && bDate) {
          return aDate.getTime() - bDate.getTime();
        }

        // Tasks with due dates come before tasks without
        if (aDate && !bDate) return -1;
        if (!aDate && bDate) return 1;

        // Finally, sort by creation date
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    },
  },

  actions: {
    async fetchTasks() {
      const { headers } = useApiHeaders();
      const projectStore = useProjectStore();
      const sectionStore = useSectionStore();

      // Ensure projects and sections are loaded
      if (!projectStore.isLoaded) {
        await projectStore.fetchProjects();
      }
      if (!sectionStore.isLoaded) {
        await sectionStore.fetchSections();
      }

      try {
        this.isLoading = true;
        const response = await fetch("/api/todoist/tasks", {
          method: "GET",
          headers: headers as HeadersInit,
        });

        if (!response.ok) throw new Error("Failed to fetch tasks");

        const rawTasks = (await response.json()) as RawTask[];

        // Transform raw tasks with project and section names
        this.tasks = rawTasks.map((task) => ({
          ...task,
          project_name: projectStore.getProjectName(task.project_id),
          section_name: sectionStore.getSectionName(task.section_id),
        }));

        this.filteredTasks = this.tasks;
        this.searchQuery = "";
        this.isLoaded = true;
      } catch (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateTask(taskId: string, updates: TodoistTaskUpdate) {
      const { headers } = useApiHeaders();
      try {
        console.log("Updating task:", taskId);
        console.log("Updates:", updates);
        console.log("Request headers:", headers);

        const response = await fetch("/api/todoist/tasks", {
          method: "PUT",
          headers: headers as HeadersInit,
          body: JSON.stringify({
            id: taskId,
            updates,
          }),
        });

        console.log("Response status:", response.status);
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error("Update task error:", errorData);
          throw new Error(errorData?.message || "Failed to update task");
        }

        // Update local state
        const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex !== -1) {
          const updatedTask = { ...this.tasks[taskIndex] };

          // Handle each field update individually
          if (updates.content !== undefined) {
            updatedTask.content = updates.content;
          }

          if (updates.priority !== undefined) {
            updatedTask.priority = updates.priority;
          }

          // Handle due date changes
          if (updates.due_string === "no date") {
            updatedTask.due = undefined;
          } else if (updates.due_date) {
            updatedTask.due = {
              date: updates.due_date,
              is_recurring: false,
              string: updates.due_date,
            };
          }

          this.tasks[taskIndex] = updatedTask;

          const filteredIndex = this.filteredTasks.findIndex(
            (t) => t.id === taskId
          );
          if (filteredIndex !== -1) {
            this.filteredTasks[filteredIndex] = updatedTask;
          }
        }

        return true;
      } catch (error) {
        console.error("Error updating task:", error);
        throw error;
      }
    },

    async completeTask(taskId: string) {
      const { headers } = useApiHeaders();
      try {
        const response = await fetch(`/api/todoist/tasks/${taskId}/close`, {
          method: "POST",
          headers: headers as HeadersInit,
        });

        if (!response.ok) {
          throw new Error("Failed to complete task");
        }

        // Remove task from local state
        this.tasks = this.tasks.filter((t) => t.id !== taskId);
        this.filteredTasks = this.filteredTasks.filter((t) => t.id !== taskId);

        // Fetch updated completed tasks
        await this.fetchCompletedTasks();

        return true;
      } catch (error) {
        console.error("Error completing task:", error);
        throw error;
      }
    },

    async reopenTask(taskId: string) {
      const { headers } = useApiHeaders();
      try {
        const response = await fetch(`/api/todoist/tasks/${taskId}/reopen`, {
          method: "POST",
          headers: headers as HeadersInit,
        });

        if (!response.ok) {
          throw new Error("Failed to reopen task");
        }

        // Refresh tasks to get the reopened task
        await this.fetchTasks();
        await this.fetchCompletedTasks();

        return true;
      } catch (error) {
        console.error("Error reopening task:", error);
        throw error;
      }
    },

    async deleteTask(taskId: string) {
      const { headers } = useApiHeaders();
      try {
        const response = await fetch(`/api/todoist/tasks/${taskId}/delete`, {
          method: "DELETE",
          headers: headers as HeadersInit,
        });

        if (!response.ok) {
          throw new Error("Failed to delete task");
        }

        // Remove task from local state
        this.tasks = this.tasks.filter((t) => t.id !== taskId);
        this.filteredTasks = this.filteredTasks.filter((t) => t.id !== taskId);

        return true;
      } catch (error) {
        console.error("Error deleting task:", error);
        throw error;
      }
    },

    async fetchCompletedTasks() {
      const { headers } = useApiHeaders();
      try {
        this.isLoading = true;
        const response = await fetch("/api/todoist/completed", {
          method: "GET",
          headers: headers as HeadersInit,
        });

        if (!response.ok) throw new Error("Failed to fetch completed tasks");

        const data = await response.json();
        this.completedTasks = data.items || [];
      } catch (error) {
        console.error("Error fetching completed tasks:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    updateFilters(filters: TaskState["filterSettings"]) {
      this.filterSettings = filters;
      this.filteredTasks = this.tasks;
      this.handleSearch();
    },

    handleSearch() {
      const query = this.searchQuery.toLowerCase();
      this.filteredTasks = this.tasks.filter(
        (task) =>
          task.content.toLowerCase().includes(query) ||
          task.project_name.toLowerCase().includes(query) ||
          (task.section_name?.toLowerCase().includes(query) ?? false) ||
          (task.due?.date || "").includes(query)
      );
    },

    clearSearch() {
      this.searchQuery = "";
      this.filteredTasks = this.tasks;
    },

    setFilter(filterFn: (task: Task) => boolean) {
      this.filterFn = filterFn;
    },

    clearFilter() {
      this.filterFn = null;
    },

    async rescheduleOverdueTasks() {
      const { headers } = useApiHeaders();
      const today = new Date().toISOString().split("T")[0];

      const overdueTasks = this.tasks.filter(
        (task) =>
          task.due?.date &&
          new Date(task.due.date).getTime() < new Date().setHours(0, 0, 0, 0)
      );

      try {
        // Update local state immediately
        overdueTasks.forEach((task) => {
          const taskIndex = this.tasks.findIndex((t) => t.id === task.id);
          if (taskIndex !== -1) {
            this.tasks[taskIndex] = {
              ...this.tasks[taskIndex],
              due: {
                date: today,
                is_recurring: false,
                string: today,
              },
            };
          }
        });

        this.filteredTasks = [...this.tasks];

        // Update tasks on the server
        const updatePromises = overdueTasks.map((task) =>
          this.updateTask(task.id, { due_date: today })
        );

        await Promise.all(updatePromises);
      } catch (error) {
        console.error("Error rescheduling tasks:", error);
        // Refresh from server in case of error
        await this.fetchTasks();
        throw error;
      }
    },
  },
});
