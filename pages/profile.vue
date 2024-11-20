<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8 text-center">Profile</h1>
      <form @submit.prevent="saveToken" class="space-y-6">
        <TokenInput 
          v-model="token" 
          label="Todoist Bearer Token"
          class="w-full" 
        />
        <button 
          type="submit"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Token
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/useAuthStore";
import { encryptToken } from "@/utils/encryption";
import PersistentDataService from "@/services/PersistentDataService";
import TokenInput from "@/components/TokenInput.vue";

const token = ref("");
const authStore = useAuthStore();

async function saveToken() {
  try {
    console.log("Saving token:", token.value);
    console.log("User:", authStore.user);
    if (!authStore.user) {
      throw new Error("User is not authenticated");
    }
    const encryptedToken = await encryptToken(token.value);
    await PersistentDataService.saveUserToken(
      authStore.user.id,
      encryptedToken
    );
    alert("Token saved successfully");
  } catch (error) {
    console.error("Error saving token:", error);
    alert("Failed to save token. Please try again.");
  }
}

onMounted(async () => {
  console.log("Profile mounted");
  console.log("AuthStore state:", {
    user: authStore.user,
    accessToken: authStore.accessToken,
    isAuthenticated: authStore.isAuthenticated
  });
});
</script>
