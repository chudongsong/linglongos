<template>
  <div class="l-iframe-container relative w-full h-full">
    <!-- 加载状态 -->
    <div
      v-if="state.loading"
      class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10"
    >
      <div class="flex flex-col items-center space-y-2">
        <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm text-gray-600 dark:text-gray-400">加载中...</span>
      </div>
    </div>

    <!-- 错误状态 -->
    <div
      v-if="state.error"
      class="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20 z-10"
    >
      <div class="text-center p-6">
        <div class="text-red-500 mb-2">
          <svg class="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-red-800 dark:text-red-200 mb-2">加载失败</h3>
        <p class="text-sm text-red-600 dark:text-red-300 mb-4">{{ state.errorMessage || '无法加载页面' }}</p>
        <button
          @click="reload"
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          重新加载
        </button>
      </div>
    </div>

    <!-- 工具栏 -->
    <div
      v-if="showToolbar"
      class="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
    >
      <!-- 导航按钮 -->
      <div class="flex items-center space-x-1">
        <button
          :disabled="!state.canGoBack"
          @click="goBack"
          class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="后退"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          :disabled="!state.canGoForward"
          @click="goForward"
          class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="前进"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          @click="reload"
          class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="刷新"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- URL显示 -->
      <div class="flex-1 mx-4">
        <input
          v-model="urlInput"
          @keyup.enter="navigate(urlInput)"
          class="w-full px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="输入网址..."
        />
      </div>

      <!-- 功能按钮 -->
      <div class="flex items-center space-x-1">
        <button
          v-if="config.allowFullscreen"
          @click="toggleFullscreen"
          class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          :title="isFullscreen ? '退出全屏' : '全屏'"
        >
          <svg v-if="isFullscreen" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>

    <!-- iframe -->
    <iframe
      ref="iframeRef"
      :src="currentUrl"
      :sandbox="sandboxValue"
      :allow="allowValue"
      class="w-full h-full border-0"
      :class="{ 'h-[calc(100%-48px)]': showToolbar }"
      @load="handleLoad"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useIframeCommunication } from '../composables/useIframeCommunication'
import type { IframeAppConfig, IframeState, IframeEvents, IframeAPI } from '../types'

interface Props {
  /** iframe应用配置 */
  config: IframeAppConfig
  /** 是否显示工具栏 */
  showToolbar?: boolean
  /** 初始URL */
  initialUrl?: string
}

interface Emits extends IframeEvents {
  /** 状态更新 */
  stateUpdate: [state: IframeState]
}

const props = withDefaults(defineProps<Props>(), {
  showToolbar: true
})

const emit = defineEmits<Emits>()

// 引用
const iframeRef = ref<HTMLIFrameElement>()

// 状态
const state = reactive<IframeState>({
  loaded: false,
  loading: false,
  error: false,
  errorMessage: undefined,
  currentUrl: undefined,
  canGoBack: false,
  canGoForward: false
})

const isFullscreen = ref(false)
const urlInput = ref('')
const currentUrl = ref(props.initialUrl || props.config.url)

// 通信管理
const communication = useIframeCommunication(
  iframeRef,
  props.config.communication
)

// 计算属性
const sandboxValue = computed(() => {
  const sandbox = []
  
  if (props.config.allowScripts) {
    sandbox.push('allow-scripts')
  }
  if (props.config.allowForms) {
    sandbox.push('allow-forms')
  }
  if (props.config.allowPopups) {
    sandbox.push('allow-popups')
  }
  if (props.config.allowDownloads) {
    sandbox.push('allow-downloads')
  }
  
  // 添加自定义沙箱权限
  if (props.config.sandbox) {
    sandbox.push(...props.config.sandbox)
  }
  
  // 默认权限
  sandbox.push('allow-same-origin')
  
  return sandbox.join(' ')
})

const allowValue = computed(() => {
  const allow = []
  
  if (props.config.allowFullscreen) {
    allow.push('fullscreen')
  }
  
  return allow.join('; ')
})

// 监听URL变化
watch(currentUrl, (newUrl) => {
  urlInput.value = newUrl
  state.currentUrl = newUrl
  emit('urlChange', newUrl)
})

// 监听状态变化
watch(state, (newState) => {
  emit('stateUpdate', { ...newState })
}, { deep: true })

onMounted(() => {
  urlInput.value = currentUrl.value
  
  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  
  // 设置通信监听器
  setupCommunication()
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  communication.destroy()
})

/**
 * 设置通信
 */
const setupCommunication = (): void => {
  // 监听iframe消息
  communication.onMessage('*', (data, message) => {
    emit('message', message)
  })
}

/**
 * 处理加载完成
 */
const handleLoad = (): void => {
  state.loading = false
  state.loaded = true
  state.error = false
  state.errorMessage = undefined
  
  emit('load')
  
  // 更新导航状态（这里简化处理，实际需要通过postMessage获取）
  nextTick(() => {
    updateNavigationState()
  })
}

/**
 * 处理加载错误
 */
const handleError = (event: Event): void => {
  state.loading = false
  state.loaded = false
  state.error = true
  state.errorMessage = '页面加载失败'
  
  emit('error', new Error('iframe load error'))
}

/**
 * 更新导航状态
 */
const updateNavigationState = (): void => {
  // 这里简化处理，实际应该通过与iframe通信获取历史状态
  state.canGoBack = false
  state.canGoForward = false
}

/**
 * 导航到指定URL
 */
const navigate = (url: string): void => {
  if (!url) return
  
  state.loading = true
  state.error = false
  emit('loadStart')
  
  currentUrl.value = url
}

/**
 * 后退
 */
const goBack = (): void => {
  if (iframeRef.value && state.canGoBack) {
    // 通过postMessage通知iframe后退
    communication.postMessage('navigate', { action: 'back' })
  }
}

/**
 * 前进
 */
const goForward = (): void => {
  if (iframeRef.value && state.canGoForward) {
    // 通过postMessage通知iframe前进
    communication.postMessage('navigate', { action: 'forward' })
  }
}

/**
 * 刷新
 */
const reload = (): void => {
  if (iframeRef.value) {
    state.loading = true
    state.error = false
    emit('loadStart')
    
    iframeRef.value.src = iframeRef.value.src
  }
}

/**
 * 切换全屏
 */
const toggleFullscreen = (): void => {
  if (isFullscreen.value) {
    exitFullscreen()
  } else {
    enterFullscreen()
  }
}

/**
 * 进入全屏
 */
const enterFullscreen = (): void => {
  if (iframeRef.value && iframeRef.value.requestFullscreen) {
    iframeRef.value.requestFullscreen()
  }
}

/**
 * 退出全屏
 */
const exitFullscreen = (): void => {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  }
}

/**
 * 处理全屏状态变化
 */
const handleFullscreenChange = (): void => {
  isFullscreen.value = !!document.fullscreenElement
  emit('fullscreenChange', isFullscreen.value)
}

// 暴露API
const api: IframeAPI = {
  postMessage: communication.postMessage,
  onMessage: communication.onMessage,
  navigate,
  goBack,
  goForward,
  reload,
  enterFullscreen,
  exitFullscreen,
  getState: () => ({ ...state })
}

defineExpose({
  api,
  iframe: iframeRef
})
</script>