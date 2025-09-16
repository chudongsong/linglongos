<template>
  <h3 :class="cn('font-semibold leading-none tracking-tight', props.class)">
    <slot />
  </h3>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn'

interface CardTitleProps {
  class?: string
}

const props = withDefaults(defineProps<CardTitleProps>(), {})
</script>