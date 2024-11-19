// stores/useAuthStore.ts
import { defineStore } from "pinia";
import { useSecureStorage } from "@/utils/encryption";

interface AuthState {
  apiToken: string;
  isLoading: boolean;
  showTokenInput: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    apiToken: "",
    isLoading: false,
    showTokenInput: false,
  }),

  actions: {
    async setToken(token: string) {
      console.log("Setting token...", token);
      const { setSecureItem } = useSecureStorage("todoist");
      this.apiToken = token;
      try {
        await setSecureItem("api_token", token);
        this.showTokenInput = false;
      } catch (error) {
        console.error("Error saving token:", error);
        // Reset state if storage fails
        this.apiToken = "";
        this.showTokenInput = true;
      }
    },

    async loadToken() {
      console.log("Loading token...");
      const { getSecureItem } = useSecureStorage("todoist");
      try {
        const token = await getSecureItem("api_token");
        console.log("Token loaded:", token);
        if (token) {
          this.apiToken = token;
          this.showTokenInput = false;
        } else {
          this.showTokenInput = true;
        }
      } catch (error) {
        console.error("Error loading token:", error);
        this.showTokenInput = true;
      }
    },

    async clearToken() {
      const { removeSecureItem } = useSecureStorage("todoist");
      this.apiToken = "";
      this.showTokenInput = true;
      try {
        await removeSecureItem("api_token");
      } catch (error) {
        console.error("Error clearing token:", error);
      }
    },

    async handleChangeToken() {
      if (
        confirm(
          "Are you sure you want to change the API token? This will clear your current view."
        )
      ) {
        await this.clearToken();
      }
    },
  },
});
