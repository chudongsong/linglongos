<template>
  <div class="l-code" :class="{ 'l-code--dark': theme === 'dark' }">
    <div v-if="showHeader" class="l-code__header">
      <div class="l-code__title">{{ title }}</div>
      <div class="l-code__actions">
        <button v-if="copyable" class="l-code__action" @click="copyCode">
          <LIcon :name="copied ? 'check' : 'copy'" />
          {{ copied ? '已复制' : '复制' }}
        </button>
      </div>
    </div>
    <pre class="l-code__pre"><code :class="['l-code__content', language ? `language-${language}` : '']"><slot></slot></code></pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LIcon from '../base/LIcon.vue'

interface Props {
  /** 代码语言 */
  language?: string
  /** 主题 */
  theme?: 'light' | 'dark'
  /** 标题 */
  title?: string
  /** 是否显示头部 */
  showHeader?: boolean
  /** 是否可复制 */
  copyable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  language: '',
  theme: 'light',
  title: '代码示例',
  showHeader: true,
  copyable: true
})

const emit = defineEmits<{
  copy: [text: string]
}>()

const copied = ref(false)

// 复制代码
const copyCode = () => {
  const codeElement = document.querySelector('.l-code__content')
  if (!codeElement) return
  
  const text = codeElement.textContent || ''
  
  // 使用 Clipboard API
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
      .then(() => {
        copied.value = true
        emit('copy', text)
        setTimeout(() => {
          copied.value = false
        }, 2000)
      })
      .catch(err => {
        console.error('复制失败:', err)
      })
  } else {
    // 兼容方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    
    try {
      document.execCommand('copy')
      copied.value = true
      emit('copy', text)
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch (err) {
      console.error('复制失败:', err)
    } finally {
      document.body.removeChild(textarea)
    }
  }
}
</script>

<script lang="ts">
export default {
  name: 'LCode'
}
</script>

<style scoped>
.l-code {
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--l-code-bg, #f8f8f8);
  color: var(--l-code-color, #333);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  margin: 16px 0;
}

.l-code--dark {
  background-color: var(--l-code-dark-bg, #282c34);
  color: var(--l-code-dark-color, #abb2bf);
}

.l-code__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: var(--l-code-header-bg, #e8e8e8);
  border-bottom: 1px solid var(--l-border-color, #ddd);
}

.l-code--dark .l-code__header {
  background-color: var(--l-code-dark-header-bg, #21252b);
  border-color: var(--l-code-dark-border-color, #181a1f);
}

.l-code__title {
  font-size: 14px;
  font-weight: 500;
}

.l-code__actions {
  display: flex;
  gap: 8px;
}

.l-code__action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--l-text-color-secondary, #909399);
  transition: color 0.2s;
}

.l-code__action:hover {
  color: var(--l-primary-color, #409eff);
}

.l-code__pre {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.5;
}

.l-code__content {
  font-family: inherit;
  white-space: pre;
}

/* 基础语法高亮 - 实际项目中可以集成 highlight.js 或 prism.js */
.language-javascript .keyword { color: #c678dd; }
.language-javascript .string { color: #98c379; }
.language-javascript .number { color: #d19a66; }
.language-javascript .comment { color: #5c6370; font-style: italic; }

.language-html .tag { color: #e06c75; }
.language-html .attr-name { color: #d19a66; }
.language-html .attr-value { color: #98c379; }

.language-css .selector { color: #e06c75; }
.language-css .property { color: #56b6c2; }
.language-css .value { color: #d19a66; }
</style>