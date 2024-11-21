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
import { encryptToken, generateNewEncryptionKey } from "@/utils/encryption";
import PersistentDataService from "@/services/PersistentDataService";
import TokenInput from "@/components/TokenInput.vue";

const token = ref("");
const authStore = useAuthStore();

async function saveToken() {
  try {
    if (!authStore.user) {
      throw new Error("User is not authenticated");
    }

    // Generate a new encryption key
    const encryptionKey = await generateNewEncryptionKey();
    
    // Encrypt the token with the new key
    const encryptedTokenData = await encryptToken(token.value, encryptionKey);
    
    // Save both the encrypted token and the encryption key
    await PersistentDataService.saveUserToken(
      authStore.user.id,
      {
        ...encryptedTokenData,
        encryption_key: encryptionKey
      }
    );

    authStore.setTodoistToken(token.value);
    await useRouter().push('/');
  } catch (error) {
    console.error("Error saving token:", error);
    alert("Failed to save token. Please try again.");
  }
}

onMounted(async () => {
  console.log("Profile mounted");
  console.log("AuthStore state:", {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated
  });
});
</script>
