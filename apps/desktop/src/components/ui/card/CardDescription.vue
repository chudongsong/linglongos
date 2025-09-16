<template>
  <p :class="cn('text-sm text-muted-foreground', props.class)">
    <slot />
  </p>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn'

interface CardDescriptionProps {
  class?: string
}

const props = withDefaults(defineProps<CardDescriptionProps>(), {})
</script>