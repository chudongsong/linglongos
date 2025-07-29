<template>
  <div :class="cardClass">
    <div v-if="$slots.header" class="px-6 py-4 border-b border-gray-200">
      <slot name="header" />
    </div>
    <div class="px-6 py-4">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-200">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  shadow?: 'none' | 'small' | 'medium' | 'large'
  rounded?: boolean
  bordered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  shadow: 'medium',
  rounded: true,
  bordered: true,
})

const cardClass = computed(() => {
  const baseClass = 'bg-white overflow-hidden'
  
  const shadowClass = {
    none: '',
    small: 'shadow-sm',
    medium: 'shadow-md',
    large: 'shadow-lg',
  }
  
  const roundedClass = props.rounded ? 'rounded-lg' : ''
  const borderedClass = props.bordered ? 'border border-gray-200' : ''
  
  return [baseClass, shadowClass[props.shadow], roundedClass, borderedClass].join(' ')
})
</script>

<script lang="ts">
export default {
  name: 'LCard',
}
</script>