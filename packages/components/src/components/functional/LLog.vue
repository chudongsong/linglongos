<template>
  <div
    class="l-log"
    :class="[
      `l-log--${theme}`,
      `l-log--${size}`,
      { 'l-log--bordered': bordered }
    ]"
  >
    <div v-if="showHeader" class="l-log__header">
      <div class="l-log__title">{{ title }}</div>
      <div class="l-log__actions">
        <button v-if="clearable" class="l-log__action" @click="clearLog">
          <LIcon name="delete" />
          清空
        </button>
        <button v-if="copyable" class="l-log__action" @click="copyLog">
          <LIcon :name="copied ? 'check' : 'copy'" />
          {{ copied ? '已复制' : '复制' }}
        </button>
      </div>
    </div>
    <div
      ref="logContainer"
      class="l-log__container"
      :style="{ height: height ? `${height}px` : 'auto' }"
    >
      <div v-if="logs.length === 0" class="l-log__empty">
        {{ emptyText }}
      </div>
      <div v-else class="l-log__content">
        <div
          v-for="(log, index) in logs"
          :key="index"
          :class="[
            'l-log__item',
            `l-log__item--${log.type || 'info'}`
          ]"
        >
          <span v-if="showTime" class="l-log__time">{{ formatTime(log.time) }}</span>
          <span class="l-log__message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import LIcon from '../base/LIcon.vue'

interface LogItem {
  message: string
  type?: 'info' | 'success' | 'warning' | 'error' | 'debug'
  time?: Date
}

interface Props {
  /** 日志数据 */
  logs: LogItem[]
  /** 主题 */
  theme?: 'light' | 'dark'
  /** 尺寸 */
  size?: 'small' | 'medium' | 'large'
  /** 标题 */
  title?: string
  /** 是否显示头部 */
  showHeader?: boolean
  /** 是否显示时间 */
  showTime?: boolean
  /** 是否可清空 */
  clearable?: boolean
  /** 是否可复制 */
  copyable?: boolean
  /** 是否带边框 */
  bordered?: boolean
  /** 高度 */
  height?: number
  /** 空日志文本 */
  emptyText?: string
  /** 是否自动滚动到底部 */
  autoScroll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  logs: () => [],
  theme: 'light',
  size: 'medium',
  title: '日志',
  showHeader: true,
  showTime: true,
  clearable: true,
  copyable: true,
  bordered: true,
  emptyText: '暂无日志',
  autoScroll: true
})

const emit = defineEmits<{
  clear: []
  copy: [text: string]
}>()

const logContainer = ref<HTMLElement | null>(null)
const copied = ref(false)

// 格式化时间
const formatTime = (time?: Date): string => {
  if (!time) return ''
  
  const hours = time.getHours().toString().padStart(2, '0')
  const minutes = time.getMinutes().toString().padStart(2, '0')
  const seconds = time.getSeconds().toString().padStart(2, '0')
  const milliseconds = time.getMilliseconds().toString().padStart(3, '0')
  
  return `${hours}:${minutes}:${seconds}.${milliseconds}`
}

// 清空日志
const clearLog = () => {
  emit('clear')
}

// 复制日志
const copyLog = () => {
  const text = props.logs
    .map(log => {
      const time = props.showTime && log.time ? `[${formatTime(log.time)}] ` : ''
      return `${time}${log.message}`
    })
    .join('\n')
  
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

// 滚动到底部
const scrollToBottom = () => {
  if (logContainer.value && props.autoScroll) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
}

// 监听日志变化，自动滚动
watch(() => props.logs.length, () => {
  if (props.autoScroll) {
    // 使用 nextTick 确保 DOM 已更新
    setTimeout(scrollToBottom, 0)
  }
})

onMounted(() => {
  scrollToBottom()
})
</script>

<script lang="ts">
export default {
  name: 'LLog'
}
</script>

<style scoped>
.l-log {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
  color: var(--l-text-color, #333);
  background-color: var(--l-log-bg, #f8f8f8);
}

.l-log--bordered {
  border: 1px solid var(--l-border-color, #dcdfe6);
  border-radius: 4px;
  overflow: hidden;
}

.l-log--dark {
  color: var(--l-log-dark-color, #eee);
  background-color: var(--l-log-dark-bg, #1e1e1e);
}

.l-log--dark.l-log--bordered {
  border-color: var(--l-log-dark-border-color, #333);
}

.l-log__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--l-border-color, #dcdfe6);
}

.l-log--dark .l-log__header {
  border-color: var(--l-log-dark-border-color, #333);
}

.l-log__title {
  font-weight: 500;
}

.l-log__actions {
  display: flex;
  gap: 8px;
}

.l-log__action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  font-size: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--l-text-color-secondary, #909399);
  transition: color 0.2s;
}

.l-log__action:hover {
  color: var(--l-primary-color, #409eff);
}

.l-log__container {
  overflow-y: auto;
  max-height: 400px;
}

.l-log__empty {
  padding: 12px;
  text-align: center;
  color: var(--l-text-color-secondary, #909399);
}

.l-log__content {
  padding: 0;
}

.l-log__item {
  padding: 4px 12px;
  border-bottom: 1px solid var(--l-border-color-light, #f0f0f0);
  white-space: pre-wrap;
  word-break: break-all;
}

.l-log--dark .l-log__item {
  border-color: var(--l-log-dark-border-color-light, #2a2a2a);
}

.l-log__item:last-child {
  border-bottom: none;
}

.l-log__time {
  color: var(--l-text-color-secondary, #909399);
  margin-right: 8px;
  font-size: 0.9em;
}

.l-log__item--info {
  color: var(--l-log-info-color, inherit);
}

.l-log__item--success {
  color: var(--l-success-color, #67c23a);
}

.l-log__item--warning {
  color: var(--l-warning-color, #e6a23c);
}

.l-log__item--error {
  color: var(--l-danger-color, #f56c6c);
}

.l-log__item--debug {
  color: var(--l-info-color, #909399);
}

/* 尺寸 */
.l-log--small {
  font-size: 12px;
}

.l-log--small .l-log__header {
  padding: 6px 10px;
}

.l-log--small .l-log__item {
  padding: 2px 10px;
}

.l-log--large {
  font-size: 16px;
}

.l-log--large .l-log__header {
  padding: 10px 16px;
}

.l-log--large .l-log__item {
  padding: 6px 16px;
}
</style>