// components/AppHeader.vue
<template>
  <header class="border-b dark:border-gray-700">
    <div class="max-w-6xl mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Todoist Task Viewer
        </h1>
        
        <nav>
          <ul class="flex space-x-6">
            <li>
              <RouterLink 
                to="/" 
                class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                :class="{ 'font-semibold': $route.path === '/' }"
              >
                Active Tasks
              </RouterLink>
            </li>
            <li>
              <RouterLink 
                to="/completed" 
                class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                :class="{ 'font-semibold': $route.path === '/completed' }"
              >
                Completed Tasks
              </RouterLink>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>