<template>
  <div class="space-y-6">
    <label for="token-input" class="block font-medium text-gray-700">{{
      label
    }}</label>
    <input
      id="token-input"
      v-model="token"
      type="password"
      class="block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      :placeholder="placeholder"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  label?: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const token = computed({
  get() {
    return props.modelValue;
  },
  set(value: string) {
    emit("update:modelValue", value);
  },
});
</script>
