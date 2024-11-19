// stores/useSectionStore.ts
import { defineStore } from 'pinia';
import { useAuthStore } from './useAuthStore';
import type { Section } from '~/types/interfaces';

interface SectionState {
  sections: Section[];
  isLoading: boolean;
}

export const useSectionStore = defineStore('sections', {
  state: (): SectionState => ({
    sections: [],
    isLoading: false,
  }),

  getters: {
    getSectionName: (state) => (id: string) => {
      return state.sections.find(s => s.id === id)?.name || 'No Section';
    },
  },

  actions: {
    async fetchSections() {
      const authStore = useAuthStore();
      if (!authStore.apiToken) return;

      this.isLoading = true;
      try {
        this.sections = await $fetch<Section[]>('https://api.todoist.com/rest/v2/sections', {
          headers: { Authorization: `Bearer ${authStore.apiToken}` },
        });
      } catch (error) {
        console.error('Error fetching sections:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    }
  }
});