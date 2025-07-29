<template>
  <div
    class="absolute border-2 border-blue-400 bg-blue-400/20 pointer-events-none"
    :style="boxStyle"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Position } from '@linglongos/shared-types'

interface Props {
  start: Position
  end: Position
}

const props = defineProps<Props>()

const boxStyle = computed(() => {
  const left = Math.min(props.start.x, props.end.x)
  const top = Math.min(props.start.y, props.end.y)
  const width = Math.abs(props.end.x - props.start.x)
  const height = Math.abs(props.end.y - props.start.y)
  
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  }
})
</script>