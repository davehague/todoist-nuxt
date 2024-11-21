<template>
  <div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg p-8">
      <h1
        class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center"
      >
        Todoist Token
      </h1>
      <form @submit.prevent="saveToken" class="space-y-6">
        <TokenInput v-model="token" class="w-full" />
        <button
          type="submit"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Token
        </button>
        <button
          type="button"
          @click="clearToken"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Clear Token
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

    if (!token.value) {
      authStore.clearTodoistToken();
      return;
    }

    const encryptionKey = await generateNewEncryptionKey();
    const encryptedTokenData = await encryptToken(token.value, encryptionKey);
    await PersistentDataService.saveUserToken(authStore.user.id, {
      ...encryptedTokenData,
      encryption_key: encryptionKey,
    });

    authStore.setTodoistToken(token.value);
    await useRouter().push("/");
  } catch (error) {
    console.error("Error saving token:", error);
    alert("Failed to save token. Please try again.");
  }
}

function clearToken() {
  token.value = "";
  authStore.clearTodoistToken();
}

onMounted(async () => {
  if (authStore.user) {
    const userTokenData = await PersistentDataService.getUserToken(
      authStore.user.id
    );
    if (userTokenData) {
      const decryptedToken = await decryptToken(
        {
          encrypted_token: userTokenData.encrypted_token,
          token_iv: userTokenData.token_iv,
        },
        userTokenData.encryption_key
      );
      token.value = decryptedToken;
    }
  }
});
</script>
