<template>
  <div class="h-full flex bg-white">
    <!-- 侧边栏 -->
    <div class="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <h2 class="text-lg font-semibold mb-4">设置</h2>
      <nav class="space-y-1">
        <button
          v-for="category in categories"
          :key="category.id"
          :class="[
            'w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors',
            activeCategory === category.id 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-100'
          ]"
          @click="activeCategory = category.id"
        >
          <LIcon :name="category.icon" size="small" />
          <span>{{ category.name }}</span>
        </button>
      </nav>
    </div>
    
    <!-- 主内容区 -->
    <div class="flex-1 p-6 overflow-auto">
      <!-- 通用设置 -->
      <div v-if="activeCategory === 'general'">
        <h3 class="text-xl font-semibold mb-6">通用设置</h3>
        
        <div class="space-y-6">
          <!-- 主题设置 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">主题</label>
            <select 
              v-model="settings.theme"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="auto">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </div>
          
          <!-- 语言设置 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">语言</label>
            <select 
              v-model="settings.language"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
          
          <!-- 启动设置 -->
          <div>
            <label class="flex items-center">
              <input 
                v-model="settings.autoStart"
                type="checkbox" 
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span class="ml-2 text-sm text-gray-700">开机自动启动</span>
            </label>
          </div>
        </div>
      </div>
      
      <!-- 面板连接 -->
      <div v-else-if="activeCategory === 'panels'">
        <h3 class="text-xl font-semibold mb-6">面板连接</h3>
        
        <div class="mb-6">
          <LButton type="primary" @click="showAddPanel = true">
            <LIcon name="plus" size="small" />
            添加面板
          </LButton>
        </div>
        
        <div class="space-y-4">
          <div
            v-for="panel in panels"
            :key="panel.id"
            class="border border-gray-200 rounded-lg p-4"
          >
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">{{ panel.name }}</h4>
                <p class="text-sm text-gray-500">{{ panel.host }}:{{ panel.port }}</p>
                <span 
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    panel.isConnected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ panel.isConnected ? '已连接' : '未连接' }}
                </span>
              </div>
              <div class="flex space-x-2">
                <LButton size="small" @click="testConnection(panel)">测试连接</LButton>
                <LButton size="small" type="danger" @click="removePanel(panel.id)">删除</LButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 关于 -->
      <div v-else-if="activeCategory === 'about'">
        <h3 class="text-xl font-semibold mb-6">关于玲珑OS</h3>
        
        <div class="text-center py-8">
          <div class="w-24 h-24 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <LIcon name="home" size="large" class="text-blue-600" />
          </div>
          <h4 class="text-2xl font-bold mb-2">玲珑OS</h4>
          <p class="text-gray-600 mb-4">版本 2.2.0</p>
          <p class="text-gray-500 max-w-md mx-auto mb-6">
            面向多面板API的统一前端操作环境，为开发者和运维团队提供一致、流畅的操作体验。
          </p>
          <p class="text-sm text-gray-400">
            © 2025 玲珑OS团队. 保留所有权利.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { LButton, LIcon } from '@linglongos/ui'
import type { PanelInstance } from '@linglongos/shared-types'

// 状态
const activeCategory = ref('general')
const showAddPanel = ref(false)

const settings = ref({
  theme: 'auto',
  language: 'zh-CN',
  autoStart: false,
})

const categories = [
  { id: 'general', name: '通用', icon: 'settings' },
  { id: 'panels', name: '面板连接', icon: 'server' },
  { id: 'security', name: '安全', icon: 'shield' },
  { id: 'about', name: '关于', icon: 'info' },
]

const panels = ref<PanelInstance[]>([
  {
    id: '1',
    name: '生产服务器',
    type: 'baota',
    host: '192.168.1.100',
    port: 8888,
    apiKey: '***',
    isConnected: true,
    lastConnectedAt: new Date(),
    version: '7.9.0',
  },
  {
    id: '2',
    name: '测试服务器',
    type: '1panel',
    host: '192.168.1.101',
    port: 10086,
    apiKey: '***',
    isConnected: false,
    version: '1.8.0',
  },
])

/**
 * 测试连接
 */
const testConnection = (panel: PanelInstance): void => {
  console.log('测试连接:', panel.name)
  // 这里应该调用API测试连接
}

/**
 * 删除面板
 */
const removePanel = (panelId: string): void => {
  const index = panels.value.findIndex(p => p.id === panelId)
  if (index !== -1) {
    panels.value.splice(index, 1)
  }
}
</script>