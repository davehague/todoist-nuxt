// stores/useProjectStore.ts
import { defineStore } from "pinia";
import type { Project } from "~/types/interfaces";
import { useApiHeaders } from "@/composables/useApiHeaders";

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  isLoaded: boolean;
}

export const useProjectStore = defineStore("projects", {
  state: (): ProjectState => ({
    projects: [],
    isLoading: false,
    isLoaded: false,
  }),

  getters: {
    getProjectName: (state) => (id: string) => {
      return state.projects.find((p) => p.id === id)?.name || "No Project";
    },
  },

  actions: {
    async fetchProjects() {
      const { headers } = useApiHeaders();
      this.isLoading = true;
      try {
        const response = await fetch("/api/todoist/projects", {
          method: "GET",
          headers: headers as HeadersInit,
        });
        if (!response.ok) throw new Error("Failed to fetch projects");
        this.projects = await response.json();
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        this.isLoading = false;
        this.isLoaded = true;
      }
    },
  },
});
