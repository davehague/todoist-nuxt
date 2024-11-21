<template>
  <ClientOnly>
    <div class="flex justify-center items-center h-screen bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 class="text-2xl font-bold mb-4 text-center">
          Welcome to Todoist Task Manager
        </h1>
        <p class="mb-6 text-center text-gray-600">
          Sign in to access your account
        </p>
        <GoogleLogin
          :callback="handleLoginSuccess"
          :error="handleLoginError"
          :client-id="config.public.googleClientId"
          prompt
          auto-login
        />
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

const config = useRuntimeConfig();

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

const handleLoginSuccess = async (
  response: CallbackTypes.CredentialPopupResponse
) => {
  try {
    if (!response.credential) {
      throw new Error("No credential found in response");
    }

    const credential = response.credential;
    const payload = decodeJWT(credential);

    console.log("Login success, payload:", payload);
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
      const decryptedToken = await decryptToken({
        encrypted_token: userToken.encrypted_token,
        token_iv: userToken.token_iv,
      });
      authStore.setTodoistToken(decryptedToken);
      await router.push("/");
    }
  } catch (error) {
    console.error("Login failed:", error);
    handleLoginError(error);
  }
};

const handleLoginError = (error: unknown) => {
  // Here you could integrate with your preferred notification system
  console.error("Google login error:", error);
  // Example: useToast().error('Failed to log in. Please try again.')
};

// Handle cleanup when user logs out
const handleLogout = () => {
  try {
    const { googleLogout } = require("vue3-google-login");
    googleLogout();
  } catch (error) {
    console.error("Logout error:", error);
  }
};

// Expose logout handler for other components
defineExpose({
  handleLogout,
});
</script>
