<template>
  <div
    :class="[
      'l-select',
      disabled ? 'l-select--disabled' : '',
      isOpen ? 'l-select--open' : ''
    ]"
    @click="toggleDropdown"
    @blur="closeDropdown"
    tabindex="0"
    ref="selectRef"
  >
    <!-- 选择框 -->
    <div class="l-select__wrapper">
      <div class="l-select__selected">
        <span v-if="selectedLabel">{{ selectedLabel }}</span>
        <span v-else-if="placeholder" class="l-select__placeholder">{{ placeholder }}</span>
      </div>
      <div class="l-select__suffix">
        <LIcon name="arrow-down" :class="{ 'is-reverse': isOpen }" />
      </div>
    </div>
    
    <!-- 下拉菜单 -->
    <transition name="l-select-dropdown">
      <div v-show="isOpen" class="l-select__dropdown">
        <ul class="l-select__options">
          <li
            v-for="option in options"
            :key="option.value"
            :class="[
              'l-select__option',
              modelValue === option.value ? 'l-select__option--selected' : ''
            ]"
            @click.stop="handleOptionSelect(option)"
          >
            {{ option.label }}
          </li>
          <li v-if="options.length === 0" class="l-select__empty">
            {{ emptyText }}
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import LIcon from './LIcon.vue'

interface SelectOption {
  label: string
  value: any
  disabled?: boolean
}

interface Props {
  /** 绑定值 */
  modelValue: any
  /** 选项数组 */
  options: SelectOption[]
  /** 占位文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 无数据时显示的文本 */
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择',
  disabled: false,
  emptyText: '无数据'
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any, option: SelectOption]
}>()

const selectRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

// 计算当前选中项的标签
const selectedLabel = computed(() => {
  const selected = props.options.find(option => option.value === props.modelValue)
  return selected ? selected.label : ''
})

// 切换下拉菜单
const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

// 关闭下拉菜单
const closeDropdown = () => {
  isOpen.value = false
}

// 选择选项
const handleOptionSelect = (option: SelectOption) => {
  if (option.disabled) return
  
  emit('update:modelValue', option.value)
  emit('change', option.value, option)
  closeDropdown()
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<script lang="ts">
export default {
  name: 'LSelect'
}
</script>

<style scoped>
.l-select {
  position: relative;
  display: inline-block;
  width: 100%;
  font-size: 14px;
  cursor: pointer;
}

.l-select__wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--l-border-color, #dcdfe6);
  border-radius: 4px;
  background-color: #fff;
  transition: border-color 0.2s;
}

.l-select:hover .l-select__wrapper {
  border-color: var(--l-border-hover-color, #c0c4cc);
}

.l-select--open .l-select__wrapper {
  border-color: var(--l-primary-color, #409eff);
}

.l-select__selected {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.l-select__placeholder {
  color: var(--l-placeholder-color, #c0c4cc);
}

.l-select__suffix {
  margin-left: 8px;
}

.l-select__suffix .is-reverse {
  transform: rotate(180deg);
}

.l-select__dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: #fff;
  border: 1px solid var(--l-border-color, #e4e7ed);
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.l-select__options {
  margin: 0;
  padding: 0;
  list-style: none;
}

.l-select__option {
  padding: 8px 12px;
  cursor: pointer;
}

.l-select__option:hover {
  background-color: var(--l-hover-bg-color, #f5f7fa);
}

.l-select__option--selected {
  color: var(--l-primary-color, #409eff);
  font-weight: bold;
  background-color: var(--l-selected-bg-color, #f0f7ff);
}

.l-select__empty {
  padding: 8px 12px;
  color: var(--l-text-color-secondary, #909399);
  text-align: center;
}

.l-select--disabled {
  cursor: not-allowed;
}

.l-select--disabled .l-select__wrapper {
  background-color: var(--l-disabled-bg-color, #f5f7fa);
  border-color: var(--l-disabled-border-color, #e4e7ed);
  color: var(--l-disabled-text-color, #c0c4cc);
}

/* 过渡动画 */
.l-select-dropdown-enter-active,
.l-select-dropdown-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.l-select-dropdown-enter-from,
.l-select-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>