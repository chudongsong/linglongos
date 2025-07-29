<template>
  <i :class="iconClass" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name: string
  size?: 'small' | 'medium' | 'large'
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
})

const iconClass = computed(() => {
  const baseClass = 'inline-block'
  
  const sizeClass = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  }
  
  // 这里使用简单的图标类名，实际项目中可以集成 Heroicons 或其他图标库
  const iconName = `icon-${props.name}`
  
  return [baseClass, sizeClass[props.size], iconName].join(' ')
})
</script>

<script lang="ts">
export default {
  name: 'LIcon',
}
</script>

<style scoped>
/* 基础图标样式 - 实际项目中应该使用图标字体或SVG */
.icon-home::before { content: '🏠'; }
.icon-folder::before { content: '📁'; }
.icon-file::before { content: '📄'; }
.icon-settings::before { content: '⚙️'; }
.icon-user::before { content: '👤'; }
.icon-close::before { content: '✕'; }
.icon-minimize::before { content: '−'; }
.icon-maximize::before { content: '□'; }
.icon-search::before { content: '🔍'; }
.icon-refresh::before { content: '🔄'; }
</style>