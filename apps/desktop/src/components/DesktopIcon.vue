<template>
  <div
    :class="[
      'flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all duration-200',
      'hover:bg-white/20 hover:backdrop-blur-sm',
      selected ? 'bg-blue-500/30 backdrop-blur-sm' : ''
    ]"
    @click="$emit('click')"
    @dblclick="$emit('dblclick')"
  >
    <!-- 图标 -->
    <div class="w-12 h-12 flex items-center justify-center mb-1">
      <LIcon :name="appIcon" size="large" class="text-white drop-shadow-lg" />
    </div>
    
    <!-- 标签 -->
    <span class="text-xs text-white text-center drop-shadow-lg max-w-16 truncate">
      {{ appName }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LIcon } from '@linglongos/ui'
import { useWindowStore } from '../stores/window'

interface Props {
  appId: string
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
})

defineEmits<{
  click: []
  dblclick: []
}>()

const windowStore = useWindowStore()

// 计算属性
const appInfo = computed(() => windowStore.getAppInfo(props.appId))
const appName = computed(() => appInfo.value.name)
const appIcon = computed(() => appInfo.value.icon)
</script>