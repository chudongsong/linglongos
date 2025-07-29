<template>
  <div
    :class="[
      'l-radio',
      modelValue === value ? 'l-radio--checked' : '',
      disabled ? 'l-radio--disabled' : ''
    ]"
  >
    <input
      type="radio"
      :id="inputId"
      :name="name"
      :value="value"
      :checked="modelValue === value"
      :disabled="disabled"
      class="l-radio__input"
      @change="handleChange"
    />
    <label :for="inputId" class="l-radio__label">
      <span class="l-radio__inner"></span>
      <span v-if="$slots.default || label" class="l-radio__text">
        <slot>{{ label }}</slot>
      </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  /** 绑定值 */
  modelValue: any
  /** 单选框的值 */
  value: any
  /** 标签文本 */
  label?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 名称 */
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  name: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any]
}>()

const inputId = ref(`radio-${Math.random().toString(36).substring(2, 9)}`)

const handleChange = () => {
  emit('update:modelValue', props.value)
  emit('change', props.value)
}
</script>

<script lang="ts">
export default {
  name: 'LRadio'
}
</script>

<style scoped>
.l-radio {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin-right: 16px;
  font-size: 14px;
  user-select: none;
}

.l-radio__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.l-radio__label {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.l-radio__inner {
  position: relative;
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 1px solid var(--l-border-color, #dcdfe6);
  border-radius: 50%;
  background-color: #fff;
  transition: all 0.2s;
}

.l-radio__inner::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: white;
  transform: scale(0);
  transition: transform 0.2s;
}

.l-radio__text {
  margin-left: 8px;
  color: var(--l-text-color, #606266);
}

.l-radio--checked .l-radio__inner {
  background-color: var(--l-primary-color, #409eff);
  border-color: var(--l-primary-color, #409eff);
}

.l-radio--checked .l-radio__inner::after {
  transform: scale(1);
}

.l-radio--disabled {
  cursor: not-allowed;
}

.l-radio--disabled .l-radio__label {
  cursor: not-allowed;
}

.l-radio--disabled .l-radio__inner {
  background-color: var(--l-disabled-bg-color, #f5f7fa);
  border-color: var(--l-disabled-border-color, #e4e7ed);
}

.l-radio--disabled .l-radio__text {
  color: var(--l-disabled-text-color, #c0c4cc);
}

.l-radio--disabled.l-radio--checked .l-radio__inner {
  background-color: var(--l-disabled-checked-bg-color, #c0c4cc);
  border-color: var(--l-disabled-checked-border-color, #c0c4cc);
}
</style>