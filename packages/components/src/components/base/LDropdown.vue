<template>
  <div
    class="l-dropdown"
    @mouseenter="trigger === 'hover' && showDropdown()"
    @mouseleave="trigger === 'hover' && hideDropdown()"
    ref="dropdownRef"
  >
    <!-- 触发元素 -->
    <div
      class="l-dropdown__trigger"
      @click="trigger === 'click' && toggleDropdown()"
    >
      <slot></slot>
    </div>
    
    <!-- 下拉菜单 -->
    <transition name="l-dropdown">
      <div
        v-show="visible"
        :class="[
          'l-dropdown__menu',
          `l-dropdown__menu--${placement}`
        ]"
      >
        <slot name="dropdown"></slot>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Props {
  /** 触发方式 */
  trigger?: 'hover' | 'click'
  /** 菜单位置 */
  placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end'
  /** 隐藏延迟，毫秒 */
  hideTimeout?: number
  /** 显示延迟，毫秒 */
  showTimeout?: number
}

const props = withDefaults(defineProps<Props>(), {
  trigger: 'hover',
  placement: 'bottom',
  hideTimeout: 150,
  showTimeout: 0
})

const emit = defineEmits<{
  'visible-change': [visible: boolean]
}>()

const visible = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
let showTimer: number | null = null
let hideTimer: number | null = null

// 显示下拉菜单
const showDropdown = () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  
  if (visible.value) return
  
  showTimer = window.setTimeout(() => {
    visible.value = true
    emit('visible-change', true)
  }, props.showTimeout)
}

// 隐藏下拉菜单
const hideDropdown = () => {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  
  if (!visible.value) return
  
  hideTimer = window.setTimeout(() => {
    visible.value = false
    emit('visible-change', false)
  }, props.hideTimeout)
}

// 切换下拉菜单
const toggleDropdown = () => {
  if (visible.value) {
    hideDropdown()
  } else {
    showDropdown()
  }
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  if (props.trigger === 'click' && 
      dropdownRef.value && 
      !dropdownRef.value.contains(event.target as Node)) {
    hideDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  if (showTimer) clearTimeout(showTimer)
  if (hideTimer) clearTimeout(hideTimer)
})

// 暴露方法
defineExpose({
  show: showDropdown,
  hide: hideDropdown
})
</script>

<script lang="ts">
export default {
  name: 'LDropdown'
}
</script>

<style scoped>
.l-dropdown {
  position: relative;
  display: inline-block;
}

.l-dropdown__trigger {
  cursor: pointer;
}

.l-dropdown__menu {
  position: absolute;
  min-width: 120px;
  background-color: #fff;
  border: 1px solid var(--l-border-color, #e4e7ed);
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 8px 0;
  z-index: 100;
}

.l-dropdown__menu--top {
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}

.l-dropdown__menu--top-start {
  bottom: calc(100% + 8px);
  left: 0;
}

.l-dropdown__menu--top-end {
  bottom: calc(100% + 8px);
  right: 0;
}

.l-dropdown__menu--bottom {
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}

.l-dropdown__menu--bottom-start {
  top: calc(100% + 8px);
  left: 0;
}

.l-dropdown__menu--bottom-end {
  top: calc(100% + 8px);
  right: 0;
}

/* 过渡动画 */
.l-dropdown-enter-active,
.l-dropdown-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.l-dropdown-enter-from,
.l-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>