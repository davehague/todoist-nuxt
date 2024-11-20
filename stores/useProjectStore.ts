// stores/useProjectStore.ts
import { defineStore } from 'pinia';
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
      this.isLoading = true;
      try {
        this.projects = await $fetch<Project[]>('/api/todoist/projects');
      } catch (error) {
        console.error('Error fetching projects:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    }
  }
});