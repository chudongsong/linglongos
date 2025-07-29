<template>
  <div
    :class="[
      'l-switch',
      modelValue ? 'l-switch--checked' : '',
      disabled ? 'l-switch--disabled' : '',
      `l-switch--${size}`
    ]"
    @click="handleClick"
  >
    <span class="l-switch__core">
      <span class="l-switch__button"></span>
    </span>
    <span v-if="activeText && modelValue" class="l-switch__label l-switch__label--active">
      {{ activeText }}
    </span>
    <span v-if="inactiveText && !modelValue" class="l-switch__label l-switch__label--inactive">
      {{ inactiveText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** 绑定值 */
  modelValue: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 打开时的文字 */
  activeText?: string
  /** 关闭时的文字 */
  inactiveText?: string
  /** 打开时的值 */
  activeValue?: boolean | string | number
  /** 关闭时的值 */
  inactiveValue?: boolean | string | number
  /** 尺寸 */
  size?: 'small' | 'default' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  activeValue: true,
  inactiveValue: false,
  size: 'default'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean | string | number]
  change: [value: boolean | string | number]
}>()

const handleClick = () => {
  if (props.disabled) return
  
  const value = props.modelValue ? props.inactiveValue : props.activeValue
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<script lang="ts">
export default {
  name: 'LSwitch'
}
</script>

<style scoped>
.l-switch {
  display: inline-flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  user-select: none;
}

.l-switch__core {
  display: inline-block;
  position: relative;
  width: 40px;
  height: 20px;
  border-radius: 10px;
  background-color: var(--l-switch-off-color, #dcdfe6);
  transition: background-color 0.3s;
}

.l-switch__button {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #fff;
  transition: transform 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.l-switch__label {
  margin-left: 8px;
  font-size: 14px;
  color: var(--l-text-color, #606266);
}

.l-switch--checked .l-switch__core {
  background-color: var(--l-primary-color, #409eff);
}

.l-switch--checked .l-switch__button {
  transform: translateX(20px);
}

.l-switch--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 尺寸 */
.l-switch--small .l-switch__core {
  width: 32px;
  height: 16px;
}

.l-switch--small .l-switch__button {
  width: 12px;
  height: 12px;
}

.l-switch--small.l-switch--checked .l-switch__button {
  transform: translateX(16px);
}

.l-switch--large .l-switch__core {
  width: 48px;
  height: 24px;
}

.l-switch--large .l-switch__button {
  width: 20px;
  height: 20px;
}

.l-switch--large.l-switch--checked .l-switch__button {
  transform: translateX(24px);
}
</style>