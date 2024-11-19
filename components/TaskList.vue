<template>
  <div class="flex-1 overflow-y-auto overflow-x-hidden">
    <div class="space-y-2 pt-4 w-full mx-auto">
      <TaskItem
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        @click="$emit('select', task)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from "../types/interfaces";
import TaskItem from "./TaskItem.vue";

defineProps<{
  tasks: Task[];
}>();

defineEmits<{
  (e: "select", task: Task): void;
}>();
</script>
