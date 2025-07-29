<template>
  <div
    :class="[
      'l-checkbox',
      modelValue ? 'l-checkbox--checked' : '',
      disabled ? 'l-checkbox--disabled' : ''
    ]"
  >
    <input
      type="checkbox"
      :id="inputId"
      :checked="modelValue"
      :disabled="disabled"
      class="l-checkbox__input"
      @change="handleChange"
    />
    <label :for="inputId" class="l-checkbox__label">
      <span class="l-checkbox__inner"></span>
      <span v-if="$slots.default || label" class="l-checkbox__text">
        <slot>{{ label }}</slot>
      </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  /** 绑定值 */
  modelValue: boolean
  /** 标签文本 */
  label?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 名称 */
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [value: boolean]
}>()

const inputId = ref(`checkbox-${Math.random().toString(36).substring(2, 9)}`)

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.checked
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<script lang="ts">
export default {
  name: 'LCheckbox'
}
</script>

<style scoped>
.l-checkbox {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin-right: 16px;
  font-size: 14px;
  user-select: none;
}

.l-checkbox__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.l-checkbox__label {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.l-checkbox__inner {
  position: relative;
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 1px solid var(--l-border-color, #dcdfe6);
  border-radius: 2px;
  background-color: #fff;
  transition: all 0.2s;
}

.l-checkbox__inner::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 5px;
  width: 3px;
  height: 7px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) scale(0);
  transition: transform 0.2s;
}

.l-checkbox__text {
  margin-left: 8px;
  color: var(--l-text-color, #606266);
}

.l-checkbox--checked .l-checkbox__inner {
  background-color: var(--l-primary-color, #409eff);
  border-color: var(--l-primary-color, #409eff);
}

.l-checkbox--checked .l-checkbox__inner::after {
  transform: rotate(45deg) scale(1);
}

.l-checkbox--disabled {
  cursor: not-allowed;
}

.l-checkbox--disabled .l-checkbox__label {
  cursor: not-allowed;
}

.l-checkbox--disabled .l-checkbox__inner {
  background-color: var(--l-disabled-bg-color, #f5f7fa);
  border-color: var(--l-disabled-border-color, #e4e7ed);
}

.l-checkbox--disabled .l-checkbox__text {
  color: var(--l-disabled-text-color, #c0c4cc);
}

.l-checkbox--disabled.l-checkbox--checked .l-checkbox__inner {
  background-color: var(--l-disabled-checked-bg-color, #c0c4cc);
  border-color: var(--l-disabled-checked-border-color, #c0c4cc);
}
</style>