export default defineNuxtRouteMiddleware((to) => {
    const authStore = useAuthStore();
  
    // Allow access to login and profile pages
    if (to.path === '/login' || to.path === '/profile') {
      return;
    }
  
    // Redirect to login if not authenticated
    if (!authStore.isAuthenticated) {
      return navigateTo('/login');
    }

    // Redirect to profile if user exists but no todoist token
    if (!authStore.todoistToken) {
      return navigateTo('/profile');
    }
})