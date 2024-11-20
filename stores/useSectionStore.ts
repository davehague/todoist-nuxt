// stores/useSectionStore.ts
import { defineStore } from 'pinia';
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
      this.isLoading = true;
      try {
        this.sections = await $fetch<Section[]>('/api/todoist/sections');
      } catch (error) {
        console.error('Error fetching sections:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    }
  }
});