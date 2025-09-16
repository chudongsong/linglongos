<template>
  <div 
    :class="cn('rounded-xl border bg-card text-card-foreground shadow', props.class)"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn'

interface CardProps {
  class?: string
}

const props = withDefaults(defineProps<CardProps>(), {})
</script>