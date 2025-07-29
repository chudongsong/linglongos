<template>
  <div
    :class="[
      'l-form-item',
      error ? 'l-form-item--error' : '',
      formContext?.inline ? 'l-form-item--inline' : ''
    ]"
  >
    <label
      v-if="label || $slots.label"
      :class="['l-form-item__label', required ? 'l-form-item__label--required' : '']"
      :style="labelStyle"
    >
      <slot name="label">{{ label }}</slot>
    </label>
    <div class="l-form-item__content">
      <slot></slot>
      <div v-if="error" class="l-form-item__error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, onBeforeUnmount, computed } from 'vue'

interface Props {
  /** 标签文本 */
  label?: string
  /** 表单域字段名 */
  prop?: string
  /** 是否必填 */
  required?: boolean
  /** 验证规则 */
  rules?: any[] | object
  /** 验证错误信息 */
  error?: string
  /** 标签宽度 */
  labelWidth?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  required: false
})

// 注入表单上下文
const formContext = inject('form', null)

// 错误信息
const error = ref('')

// 标签样式
const labelStyle = computed(() => {
  if (!formContext) return {}
  
  const width = props.labelWidth || formContext.labelWidth
  const position = formContext.labelPosition
  
  const style: Record<string, any> = {}
  
  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width
  }
  
  if (position === 'top') {
    style.display = 'block'
    style.marginBottom = '8px'
  } else {
    style.textAlign = position
  }
  
  return style
})

// 验证表单项
const validate = async () => {
  if (!props.prop || !formContext?.rules || !formContext?.model) {
    return { valid: true, field: props.prop, message: '' }
  }
  
  const rules = props.rules || formContext.rules[props.prop]
  if (!rules) {
    return { valid: true, field: props.prop, message: '' }
  }
  
  const value = formContext.model[props.prop]
  const ruleList = Array.isArray(rules) ? rules : [rules]
  
  // 简单验证逻辑，实际项目中可以使用 async-validator 等库
  for (const rule of ruleList) {
    if (rule.required && (value === undefined || value === null || value === '')) {
      error.value = rule.message || `${props.label || props.prop} 是必填项`
      return { valid: false, field: props.prop, message: error.value }
    }
    
    if (rule.validator && typeof rule.validator === 'function') {
      try {
        await rule.validator(rule, value, () => {})
      } catch (err: any) {
        error.value = err.message || `${props.label || props.prop} 验证失败`
        return { valid: false, field: props.prop, message: error.value }
      }
    }
  }
  
  error.value = ''
  return { valid: true, field: props.prop, message: '' }
}

// 重置表单项
const resetField = () => {
  if (!props.prop || !formContext?.model) return
  
  // 重置值
  const model = formContext.model
  const value = model[props.prop]
  
  if (Array.isArray(value)) {
    model[props.prop] = []
  } else if (typeof value === 'object' && value !== null) {
    model[props.prop] = {}
  } else {
    model[props.prop] = undefined
  }
  
  // 清除验证状态
  clearValidate()
}

// 清除验证
const clearValidate = () => {
  error.value = ''
}

// 注册和注销表单项
onMounted(() => {
  if (formContext && formContext.addFormItem) {
    formContext.addFormItem({
      prop: props.prop,
      validate,
      resetField,
      clearValidate
    })
  }
})

onBeforeUnmount(() => {
  if (formContext && formContext.removeFormItem) {
    formContext.removeFormItem({
      prop: props.prop
    })
  }
})

// 暴露方法
defineExpose({
  validate,
  resetField,
  clearValidate
})
</script>

<script lang="ts">
export default {
  name: 'LFormItem'
}
</script>

<style scoped>
.l-form-item {
  margin-bottom: 20px;
}

.l-form-item--inline {
  display: inline-flex;
  margin-right: 20px;
}

.l-form-item__label {
  display: inline-block;
  padding-right: 12px;
  line-height: 36px;
  font-size: 14px;
  color: var(--l-text-color, #606266);
}

.l-form-item__label--required::before {
  content: '*';
  color: var(--l-danger-color, #f56c6c);
  margin-right: 4px;
}

.l-form-item__content {
  position: relative;
  flex: 1;
  line-height: 36px;
}

.l-form-item__error {
  position: absolute;
  top: 100%;
  left: 0;
  padding-top: 2px;
  font-size: 12px;
  color: var(--l-danger-color, #f56c6c);
  line-height: 1;
}

.l-form-item--error .l-form-item__content input,
.l-form-item--error .l-form-item__content textarea,
.l-form-item--error .l-form-item__content .l-select__wrapper {
  border-color: var(--l-danger-color, #f56c6c);
}
</style>