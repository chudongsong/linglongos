<template>
  <button
    :class="buttonClass"
    :disabled="disabled"
    @click="handleClick"
  >
    <LIcon v-if="icon" :name="icon" class="mr-2" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LIcon from './LIcon.vue'

interface Props {
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  icon?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'medium',
  disabled: false,
  loading: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClass = computed(() => {
  const baseClass = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const typeClass = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  }
  
  const sizeClass = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  }
  
  const disabledClass = props.disabled ? 'opacity-50 cursor-not-allowed' : ''
  
  return [baseClass, typeClass[props.type], sizeClass[props.size], disabledClass].join(' ')
})

const handleClick = (event: MouseEvent): void => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<script lang="ts">
export default {
  name: 'LButton',
}
</script>