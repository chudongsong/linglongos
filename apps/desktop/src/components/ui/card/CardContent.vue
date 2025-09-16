<template>
  <div :class="cn('p-6 pt-0', props.class)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn'

interface CardContentProps {
  class?: string
}

const props = withDefaults(defineProps<CardContentProps>(), {})
</script>