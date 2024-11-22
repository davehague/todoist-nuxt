// stores/useAuthStore.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User } from "@/types/interfaces";
import PersistentDataService from "@/services/PersistentDataService";
import { googleLogout } from "vue3-google-login";
import { supabase } from "@/utils/supabaseClient";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const user = ref<User | null>(null);
    const expirationTime = ref<number | null>(null);
    const todoistToken = ref<string | null>(null);

    const isAuthenticated = computed(() => !!user.value && !isTokenExpired());
    const userId = computed(() => user.value?.id || "");

    function setUser(newUser: User, exp: number) {
      user.value = newUser;
      expirationTime.value = exp;
      startSessionTimer();
    }

    function isTokenExpired() {
      const currentTime = Math.floor(Date.now() / 1000);
      return expirationTime.value && currentTime >= expirationTime.value;
    }

    function startSessionTimer() {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeLeft = (expirationTime.value ?? 0) - currentTime;
      if (timeLeft > 0) {
        setTimeout(() => {
          logout();
        }, timeLeft * 1000);
      } else {
        logout();
      }
    }

    function setTodoistToken(token: string) {
      todoistToken.value = token;
    }

    async function clearTodoistToken() {
      todoistToken.value = null;
      if (user.value?.id) {
        await PersistentDataService.deleteUserToken(user.value.id);
      }
    }

    async function logout() {
      try {
        // Sign out from services
        googleLogout();
        await supabase.auth.signOut();

        // Clear local state
        user.value = null;
        expirationTime.value = null;
        todoistToken.value = null;
      } catch (error) {
        console.error("Logout error:", error);
      }
    }

    return {
      user,
      todoistToken,
      isAuthenticated,
      userId,
      setUser,
      setTodoistToken,
      clearTodoistToken,
      isTokenExpired,
      logout,
    };
  },
  {
    persist: true,
  }
);
