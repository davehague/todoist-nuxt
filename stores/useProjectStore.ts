// stores/useProjectStore.ts
import { defineStore } from 'pinia';
import { useAuthStore } from './useAuthStore';
import type { Project } from '~/types/interfaces';

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
}

export const useProjectStore = defineStore('projects', {
  state: (): ProjectState => ({
    projects: [],
    isLoading: false,
  }),

  getters: {
    getProjectName: (state) => (id: string) => {
      return state.projects.find(p => p.id === id)?.name || 'No Project';
    },
  },

  actions: {
    async fetchProjects() {
      const authStore = useAuthStore();
      if (!authStore.apiToken) return;

      this.isLoading = true;
      try {
        this.projects = await $fetch<Project[]>('https://api.todoist.com/rest/v2/projects', {
          headers: { Authorization: `Bearer ${authStore.apiToken}` },
        });
      } catch (error) {
        console.error('Error fetching projects:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    }
  }
});