import { useAuthStore } from '@/stores/useAuthStore'

export const useApiHeaders = () => {
  const authStore = useAuthStore()
  
  const headers = {
    'x-user-id': authStore.userId || '',
    'Content-Type': 'application/json',
  }

  return {
    headers,
  }
}