// stores/useTaskStore.ts
import { defineStore } from "pinia";
import { useProjectStore } from "./useProjectStore";
import { useSectionStore } from "./useSectionStore";
import type { Task, RawTask, CompletedTask } from "~/types/interfaces";
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
    priority: string; // Add priority to filter settings
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
      priority: "", // Add priority to initial state
    },
    filterFn: null,
  }),

  getters: {
    sortedTasks: (state) => {
      let filtered = state.filteredTasks;

      // Apply priority filter first
      if (state.filterSettings.priority) {
        console.log("Filtering by priority:", state.filterSettings.priority); // Add debugging
        filtered = filtered.filter(
          (task) => task.priority === parseInt(state.filterSettings.priority)
        );
      }

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

      // Add priority filter
      if (state.filterSettings.priority) {
        filtered = filtered.filter(
          (task) => task.priority === parseInt(state.filterSettings.priority)
        );
      }

      if (state.filterFn) {
        filtered = filtered.filter(state.filterFn);
      }

      return [...filtered].sort((a, b) => {
        // First sort by priority (priority 1 is highest, so we reverse the comparison)
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Changed from a.priority - b.priority
        }

        // Then sort by overdue status
        const aDate = a.due?.date ? new Date(a.due.date) : null;
        const bDate = b.due?.date ? new Date(b.due.date) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const aOverdue = aDate && aDate < today;
        const bOverdue = bDate && bDate < today;

        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        // Finally sort by due date
        if (aDate && bDate) {
          return aDate.getTime() - bDate.getTime();
        }
        return 0;
      });
    },
  },

  actions: {
    async fetchTasks() {
      const { headers } = useApiHeaders();
      const projectStore = useProjectStore();
      const sectionStore = useSectionStore();

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

        this.tasks = rawTasks.map((task) => ({
          ...task,
          project_name: projectStore.getProjectName(task.project_id),
          section_name: sectionStore.getSectionName(task.section_id),
        }));
        this.filteredTasks = this.tasks; // Initialize filtered tasks with all tasks
        this.searchQuery = ""; // Reset search query
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        this.isLoading = false;
        this.isLoaded = true;
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
      } finally {
        this.isLoading = false;
      }
    },

    updateFilters(filters: TaskState["filterSettings"]) {
      this.filterSettings = filters;
      // Reapply filters to filtered tasks
      this.filteredTasks = this.tasks;
      this.handleSearch(); // This ensures search is maintained
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
  },
});
