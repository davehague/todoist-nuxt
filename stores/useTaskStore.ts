// stores/useTaskStore.ts
import { defineStore } from "pinia";
import { useAuthStore } from "./useAuthStore";
import { useProjectStore } from "./useProjectStore";
import { useSectionStore } from "./useSectionStore";
import type { Task, RawTask, CompletedTask } from "~/types/interfaces";

interface TaskState {
  tasks: Task[];
  completedTasks: CompletedTask[];
  filteredTasks: Task[];
  isLoading: boolean;
  searchQuery: string;
  filterSettings: {
    dueFilter: string;
    label: string;
    sort: string;
    projectSection: string;
  };
}

export const useTaskStore = defineStore("tasks", {
  state: (): TaskState => ({
    tasks: [],
    completedTasks: [],
    filteredTasks: [],
    isLoading: false,
    searchQuery: "",
    filterSettings: {
      dueFilter: "all",
      label: "",
      sort: "created_desc",
      projectSection: "",
    },
  }),

  getters: {
    sortedTasks: (state) => {
      let filtered = state.filteredTasks;

      // Apply project and section filter
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

      // Apply sorting
      return [...filtered].sort((a, b) => {
        switch (state.filterSettings.sort) {
          case "due_asc":
            return (a.due?.date || "9999") > (b.due?.date || "9999") ? 1 : -1;
          case "due_desc":
            return (a.due?.date || "9999") < (b.due?.date || "9999") ? 1 : -1;
          case "created_asc":
            return a.created_at > b.created_at ? 1 : -1;
          case "created_desc":
            return a.created_at < b.created_at ? 1 : -1;
          case "project":
            return a.project_name.localeCompare(b.project_name);
          case "content":
            return a.content.localeCompare(b.content);
          default:
            return 0;
        }
      });
    },
  },

  actions: {
    async fetchTasks() {
      const authStore = useAuthStore();
      const projectStore = useProjectStore();
      const sectionStore = useSectionStore();

      if (!authStore.apiToken) return;

      this.isLoading = true;
      try {
        // Fetch all necessary data in parallel
        await Promise.all([
          projectStore.fetchProjects(),
          sectionStore.fetchSections(),
        ]);

        const rawTasks = await $fetch<RawTask[]>(
          "https://api.todoist.com/rest/v2/tasks",
          {
            headers: { Authorization: `Bearer ${authStore.apiToken}` },
          }
        );

        this.tasks = rawTasks.map(
          (task): Task => ({
            ...task,
            project_name: projectStore.getProjectName(task.project_id),
            section_name: sectionStore.getSectionName(task.section_id),
          })
        );

        this.filteredTasks = this.tasks;
      } catch (error) {
        console.error("Error fetching tasks:", error);
        authStore.clearToken();
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchCompletedTasks() {
      const authStore = useAuthStore();
      if (!authStore.apiToken) return;

      this.isLoading = true;
      try {
        const response = await fetch(
          "https://api.todoist.com/sync/v9/completed/get_all",
          {
            headers: {
              Authorization: `Bearer ${authStore.apiToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.completedTasks = data.items;
      } catch (error) {
        console.error("Error fetching completed tasks:", error);
        authStore.clearToken();
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    updateFilters(filters: TaskState["filterSettings"]) {
      this.filterSettings = filters;
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
  },
});
