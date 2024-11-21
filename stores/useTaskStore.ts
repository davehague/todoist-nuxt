// stores/useTaskStore.ts
import { defineStore } from "pinia";
import { useProjectStore } from "./useProjectStore";
import { useSectionStore } from "./useSectionStore";
import type { Task, RawTask, CompletedTask } from "~/types/interfaces";
import { useApiHeaders } from '@/composables/useApiHeaders'

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

      if (state.filterSettings.projectSection) {
        const [project, section] = state.filterSettings.projectSection.split(" > ");
        filtered = filtered.filter((task) => {
          if (section) {
            return task.project_name === project && task.section_name === section;
          }
          return task.project_name === project;
        });
      }

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

      if (state.filterSettings.label) {
        filtered = filtered.filter((task) =>
          task.labels?.includes(state.filterSettings.label)
        );
      }

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
      const { headers } = useApiHeaders()
      try {
        this.isLoading = true
        const response = await fetch('/api/todoist/tasks', {
          method: 'GET',
          headers: headers as HeadersInit
        })
        if (!response.ok) throw new Error('Failed to fetch tasks')
        this.tasks = await response.json()
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        this.isLoading = false
      }
    },

    async fetchCompletedTasks() {
      const { headers } = useApiHeaders()
      try {
        this.isLoading = true
        const response = await fetch('/api/todoist/completed', {
          method: 'GET',
          headers: headers as HeadersInit
        })
        if (!response.ok) throw new Error('Failed to fetch completed tasks')
        const data = await response.json()
        this.completedTasks = data.items || []
      } catch (error) {
        console.error('Error fetching completed tasks:', error)
      } finally {
        this.isLoading = false
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