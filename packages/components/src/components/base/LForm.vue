<template>
  <form class="l-form" @submit.prevent="handleSubmit">
    <slot></slot>
  </form>
</template>

<script setup lang="ts">
import { provide, reactive, toRefs } from 'vue'

interface Props {
  /** 表单数据对象 */
  model: Record<string, any>
  /** 表单验证规则 */
  rules?: Record<string, any>
  /** 标签宽度 */
  labelWidth?: string | number
  /** 标签位置 */
  labelPosition?: 'left' | 'right' | 'top'
  /** 是否行内表单 */
  inline?: boolean
  /** 是否禁用表单 */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  labelWidth: '80px',
  labelPosition: 'right',
  inline: false,
  disabled: false
})

const emit = defineEmits<{
  submit: [event: Event]
  validate: [valid: boolean, invalidFields: Record<string, any>]
}>()

// 表单项集合
const formItems: any[] = reactive([])

// 处理表单提交
const handleSubmit = (event: Event) => {
  validate().then(valid => {
    emit('submit', event)
  })
}

// 验证表单
const validate = async () => {
  const promises = formItems.map(item => item.validate())
  const results = await Promise.all(promises)
  const valid = results.every(result => result.valid)
  
  const invalidFields: Record<string, any> = {}
  results.forEach(result => {
    if (!result.valid) {
      invalidFields[result.field] = result.message
    }
  })
  
  emit('validate', valid, invalidFields)
  return { valid, invalidFields }
}

// 重置表单
const resetFields = () => {
  formItems.forEach(item => item.resetField())
}

// 清除验证
const clearValidate = (props?: string | string[]) => {
  const fields = props ? (Array.isArray(props) ? props : [props]) : []
  
  formItems.forEach(item => {
    if (!fields.length || fields.includes(item.prop)) {
      item.clearValidate()
    }
  })
}

// 添加表单项
const addFormItem = (item: any) => {
  formItems.push(item)
}

// 移除表单项
const removeFormItem = (item: any) => {
  const index = formItems.indexOf(item)
  if (index !== -1) {
    formItems.splice(index, 1)
  }
}

// 提供表单上下文
provide('form', {
  model: toRefs(props).model,
  rules: toRefs(props).rules,
  labelWidth: toRefs(props).labelWidth,
  labelPosition: toRefs(props).labelPosition,
  inline: toRefs(props).inline,
  disabled: toRefs(props).disabled,
  addFormItem,
  removeFormItem
})

// 暴露方法
defineExpose({
  validate,
  resetFields,
  clearValidate
})
</script>

<script lang="ts">
export default {
  name: 'LForm'
}
</script>

<style scoped>
.l-form {
  font-size: 14px;
}

.l-form.is-inline {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}
</style>