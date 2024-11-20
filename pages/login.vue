<template>
  <ClientOnly>
    <div class="flex justify-center items-center h-screen bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 class="text-2xl font-bold mb-4 text-center">
          Welcome to Adulting.DIY
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
import { GoogleLogin } from 'vue3-google-login'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter } from '#app'
import PersistentDataService from '@/services/PersistentDataService'
// Fix the CredentialResponse import
import { type CallbackTypes } from 'vue3-google-login'

const config = useRuntimeConfig()


// Type for decoded JWT payload
type GoogleJWTPayload = {
  email: string
  name: string
  picture: string
  [key: string]: unknown
}

const authStore = useAuthStore()
const router = useRouter()

// Decode JWT token from Google
const decodeJWT = (token: string): GoogleJWTPayload => {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch (error) {
    throw new Error('Failed to decode JWT token')
  }
}

const handleLoginSuccess = async (response: CallbackTypes.CredentialPopupResponse) => {
  try {
    if (!response.credential) {
      throw new Error('No credential found in response')
    }

    const credential = response.credential
    const payload = decodeJWT(credential)

    console.log('Login success:', payload)
    // Fetch or create user
    const existingUser = await PersistentDataService.fetchUserByEmail(payload.email)

    console.log('Existing user:', existingUser)
    if (existingUser) {
      authStore.setUser(existingUser)
      authStore.setAccessToken(credential)
    } else {
      const newUser = await PersistentDataService.createUser({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      })

      if (!newUser) {
        throw new Error('Failed to create user')
      }

      authStore.setUser(newUser)
      authStore.setAccessToken(credential)
    }

    // Navigate to home page
    await router.push('/')
  } catch (error) {
    console.error('Login failed:', error)
    handleLoginError(error)
  }
}

const handleLoginError = (error: unknown) => {
  // Here you could integrate with your preferred notification system
  console.error('Google login error:', error)
  // Example: useToast().error('Failed to log in. Please try again.')
}

// Handle cleanup when user logs out
const handleLogout = () => {
  try {
    const { googleLogout } = require('vue3-google-login')
    googleLogout()
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Expose logout handler for other components
defineExpose({
  handleLogout
})
</script>