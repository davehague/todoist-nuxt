import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User } from "@/types/interfaces";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const user = ref<User | null>(null);
    const expirationTime = ref<number | null>(null);
    const todoistToken = ref<string | null>(null);

    const isAuthenticated = computed(() => !!user.value && !isTokenExpired());
    const userId = computed(() => user.value?.id || '');

    function setUser(newUser: User, exp: number) {
      console.log("Setting user:", newUser);
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

    function logout() {
      user.value = null;
      expirationTime.value = null;
      todoistToken.value = null;
    }

    return {
      user,
      todoistToken,
      isAuthenticated,
      userId,
      setUser,
      setTodoistToken,
      isTokenExpired,
      logout,
    };
  },
  {
    persist: true,
  } as any
);
