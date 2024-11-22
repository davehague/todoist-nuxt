// login.vue
<template>
  <ClientOnly>
    <div
      class="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200"
    >
      <div
        class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md transition-colors duration-200"
      >
        <h1
          class="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white"
        >
          Welcome to Todoist Task Manager
        </h1>
        <p class="mb-6 text-center text-gray-600 dark:text-gray-300">
          Sign in to access your account
        </p>
        <div
          v-if="errorMessage"
          class="mb-4 p-3 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-100 rounded"
        >
          {{ errorMessage }}
        </div>
        <div class="flex justify-center">
          <GoogleLogin
            :callback="handleLoginSuccess"
            :error="handleLoginError"
            :client-id="config.public.googleClientId"
            prompt
            auto-login
          />
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { GoogleLogin } from "vue3-google-login";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "#app";
import PersistentDataService from "@/services/PersistentDataService";
import { type CallbackTypes } from "vue3-google-login";
import { decryptToken } from "@/utils/encryption";
import { ref } from "vue";

const config = useRuntimeConfig();
const { $supabaseAuth } = useNuxtApp();

type GoogleJWTPayload = {
  email: string;
  name: string;
  picture: string;
  exp: number;
  [key: string]: unknown;
};

const authStore = useAuthStore();
const router = useRouter();

const decodeJWT = (token: string): GoogleJWTPayload => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (error) {
    throw new Error("Failed to decode JWT token");
  }
};

const errorMessage = ref("");

const handleLoginSuccess = async (
  response: CallbackTypes.CredentialPopupResponse
) => {
  try {
    if (!response.credential) {
      throw new Error("No credential found in response");
    }

    // Sign in to Supabase with Google token
    const supabaseAuth = await $supabaseAuth.exchangeGoogleToken(
      response.credential
    );

    const credential = response.credential;
    const payload = decodeJWT(credential);

    const existingUser = await PersistentDataService.fetchUserByEmail(
      payload.email
    );

    let user;
    if (existingUser) {
      user = existingUser;
    } else {
      const newUser = await PersistentDataService.createUser({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        supabase_id: supabaseAuth.user.id,
        email_verified: payload.email_verified as boolean,
        last_login: new Date(),
      });

      if (!newUser) {
        throw new Error("Failed to create user");
      }
      user = newUser;
    }

    authStore.setUser(user, payload.exp);
    const userToken = await PersistentDataService.getUserToken(user.id);
    if (!userToken) {
      await router.push("/profile");
    } else {
      const decryptedToken = await decryptToken(
        {
          encrypted_token: userToken.encrypted_token,
          token_iv: userToken.token_iv,
        },
        userToken.encryption_key
      );
      authStore.setTodoistToken(decryptedToken);
      await router.push("/");
    }
  } catch (error) {
    console.error("Login failed:", error);
    handleLoginError(error);
  }
};

const handleLoginError = (error: unknown) => {
  console.error("Google login error:", error);
  errorMessage.value = "Failed to log in. Please try again.";
  setTimeout(() => {
    errorMessage.value = "";
  }, 5000);
};

const handleLogout = () => {
  authStore.logout();
};

defineExpose({
  handleLogout,
});
</script>
