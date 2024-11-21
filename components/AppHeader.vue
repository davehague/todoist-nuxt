// components/AppHeader.vue
<template>
  <header class="border-b dark:border-gray-700">
    <div class="max-w-6xl mx-auto py-4">
      <div class="flex items-center justify-between">
        <h1
          class="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white px-4 md:py-4 md:pl-0"
        >
          Todoist Task Viewer
        </h1>
        <button
          @click="toggleMenu"
          class="md:hidden text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      </div>
      <div
        :class="{ hidden: !menuOpen, flex: menuOpen }"
        class="flex-col md:hidden items-start justify-between mt-4 p-2 rounded-md bg-gray-100 dark:bg-gray-800"
      >
        <nav v-if="authStore.isAuthenticated" class="flex-1 mb-4 md:mb-0">
          <ul
            class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6"
          >
            <template v-if="authStore.todoistToken">
              <li>
                <RouterLink
                  to="/"
                  @click="closeMenu"
                  class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  :class="{ 'font-semibold': $route.path === '/' }"
                >
                  Active Tasks
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  to="/completed"
                  @click="closeMenu"
                  class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  :class="{ 'font-semibold': $route.path === '/completed' }"
                >
                  Completed Tasks
                </RouterLink>
              </li>
            </template>
            <li>
              <RouterLink
                to="/profile"
                @click="closeMenu"
                class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                :class="{ 'font-semibold': $route.path === '/profile' }"
              >
                Profile
              </RouterLink>
            </li>
            <li>
              <button
                @click="handleLogoutMobile"
                class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>

        <div v-else class="flex items-center space-x-4">
          <RouterLink
            to="/login"
            class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            Login
          </RouterLink>
        </div>
      </div>
      <div class="hidden md:flex items-center justify-between mt-6">
        <div class="flex-1">
          <nav v-if="authStore.isAuthenticated && authStore.todoistToken">
            <ul class="flex space-x-2">
              <li>
                <RouterLink
                  to="/"
                  class="px-4 py-2 rounded-lg transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700"
                  :class="{
                    'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium':
                      $route.path === '/',
                    'text-gray-700 dark:text-gray-300': $route.path !== '/',
                  }"
                >
                  Active Tasks
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  to="/completed"
                  class="px-4 py-2 rounded-lg transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700"
                  :class="{
                    'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium':
                      $route.path === '/completed',
                    'text-gray-700 dark:text-gray-300':
                      $route.path !== '/completed',
                  }"
                >
                  Completed Tasks
                </RouterLink>
              </li>
            </ul>
          </nav>
        </div>

        <div class="flex items-center space-x-4">
          <RouterLink to="/profile" class="flex items-center space-x-2">
            <img
              :src="authStore.user.picture || '/profile.png'"
              :key="authStore.user.picture"
              alt="User Picture"
              class="w-8 h-8 rounded-full"
            />
            <span
              class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              {{ authStore.user.name }}
            </span>
          </RouterLink>
          <button
            v-if="authStore.isAuthenticated"
            @click="handleLogout"
            class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            Logout
          </button>
          <RouterLink
            v-else
            to="/login"
            class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            Login
          </RouterLink>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();
const menuOpen = ref(false);

const closeMenu = () => {
  menuOpen.value = false;
};

const handleLogoutMobile = () => {
  closeMenu();
  handleLogout();
};

const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

onMounted(() => {
  menuOpen.value = false;
});
</script>
