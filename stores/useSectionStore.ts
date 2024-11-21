// stores/useSectionStore.ts
import { defineStore } from 'pinia';
import type { Section } from '~/types/interfaces';
import { useApiHeaders } from '@/composables/useApiHeaders'

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
      const { headers } = useApiHeaders()
      this.isLoading = true;
      try {
        const response = await fetch('/api/todoist/sections', {
          method: 'GET',
          headers: headers as HeadersInit
        })
        if (!response.ok) throw new Error('Failed to fetch sections')
        this.sections = await response.json()
      } catch (error) {
        console.error('Error fetching sections:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }
});