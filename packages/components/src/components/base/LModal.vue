<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="fixed inset-0 z-50 overflow-y-auto">
        <!-- 背景遮罩 -->
        <div
          class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          @click="handleMaskClick"
        />
        
        <!-- 模态框容器 -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            :class="modalClass"
            @click.stop
          >
            <!-- 头部 -->
            <div v-if="title || $slots.header" class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div class="flex items-center">
                <slot name="header">
                  <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
                </slot>
              </div>
              <button
                v-if="closable"
                class="text-gray-400 hover:text-gray-600 transition-colors"
                @click="handleClose"
              >
                <LIcon name="close" />
              </button>
            </div>
            
            <!-- 内容 -->
            <div class="px-6 py-4">
              <slot />
            </div>
            
            <!-- 底部 -->
            <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-200">
              <slot name="footer" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import LIcon from './LIcon.vue'

interface Props {
  visible: boolean
  title?: string
  width?: string | number
  closable?: boolean
  maskClosable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  closable: true,
  maskClosable: true,
  width: '500px',
})

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  close: []
}>()

const modalClass = computed(() => {
  const baseClass = 'relative bg-white rounded-lg shadow-xl transform transition-all'
  const widthClass = typeof props.width === 'number' ? `w-${props.width}` : ''
  
  return [baseClass, widthClass].join(' ')
})

const modalStyle = computed(() => {
  if (typeof props.width === 'string') {
    return { width: props.width }
  }
  return {}
})

const handleClose = (): void => {
  emit('update:visible', false)
  emit('close')
}

const handleMaskClick = (): void => {
  if (props.maskClosable) {
    handleClose()
  }
}

// 监听ESC键
watch(() => props.visible, (visible) => {
  if (visible) {
    document.addEventListener('keydown', handleEscKey)
  } else {
    document.removeEventListener('keydown', handleEscKey)
  }
})

const handleEscKey = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && props.closable) {
    handleClose()
  }
}
</script>

<script lang="ts">
export default {
  name: 'LModal',
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.9) translateY(-20px);
}
</style>