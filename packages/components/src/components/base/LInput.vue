<template>
  <div class="relative">
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>
    <div class="relative">
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="inputClass"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <LIcon
        v-if="icon"
        :name="icon"
        class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      />
    </div>
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-sm text-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import LIcon from './LIcon.vue'

interface Props {
  modelValue: string
  type?: 'text' | 'password' | 'email' | 'number'
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  hint?: string
  icon?: string
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'medium',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const inputId = ref(`input-${Math.random().toString(36).substr(2, 9)}`)
const isFocused = ref(false)

const inputClass = computed(() => {
  const baseClass = 'block w-full border rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const sizeClass = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-3 py-2 text-base',
    large: 'px-4 py-3 text-lg',
  }
  
  const iconPadding = props.icon ? 'pl-10' : ''
  
  let stateClass = ''
  if (props.error) {
    stateClass = 'border-red-300 focus:border-red-500 focus:ring-red-500'
  } else if (isFocused.value) {
    stateClass = 'border-blue-300 focus:border-blue-500 focus:ring-blue-500'
  } else {
    stateClass = 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
  }
  
  const disabledClass = props.disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'
  
  return [baseClass, sizeClass[props.size], iconPadding, stateClass, disabledClass].join(' ')
})

const handleInput = (event: Event): void => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleFocus = (event: FocusEvent): void => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent): void => {
  isFocused.value = false
  emit('blur', event)
}
</script>

<script lang="ts">
export default {
  name: 'LInput',
}
</script>