<template>
  <div class="h-full flex flex-col bg-white">
    <!-- 工具栏 -->
    <div class="h-12 border-b border-gray-200 flex items-center px-4 space-x-2">
      <LButton size="small" @click="goBack" :disabled="!canGoBack">
        <LIcon name="arrow-left" size="small" />
      </LButton>
      <LButton size="small" @click="goForward" :disabled="!canGoForward">
        <LIcon name="arrow-right" size="small" />
      </LButton>
      <LButton size="small" @click="goUp" :disabled="currentPath === '/'">
        <LIcon name="arrow-up" size="small" />
      </LButton>
      <LButton size="small" @click="refresh">
        <LIcon name="refresh" size="small" />
      </LButton>
      
      <!-- 地址栏 -->
      <div class="flex-1 mx-4">
        <LInput
          v-model="currentPath"
          placeholder="输入路径..."
          size="small"
          @keyup.enter="navigateToPath"
        />
      </div>
      
      <LButton size="small" @click="createFolder">
        <LIcon name="folder-plus" size="small" />
        新建文件夹
      </LButton>
    </div>
    
    <!-- 文件列表 -->
    <div class="flex-1 overflow-auto">
      <div v-if="loading" class="p-8 text-center text-gray-500">
        <LIcon name="loading" size="large" class="animate-spin mb-2" />
        <div>加载中...</div>
      </div>
      
      <div v-else-if="files.length === 0" class="p-8 text-center text-gray-500">
        <LIcon name="folder-open" size="large" class="mb-2" />
        <div>此文件夹为空</div>
      </div>
      
      <div v-else class="p-4">
        <div class="grid grid-cols-1 gap-1">
          <div
            v-for="file in files"
            :key="file.path"
            :class="[
              'flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer',
              selectedFiles.includes(file.path) ? 'bg-blue-100' : ''
            ]"
            @click="selectFile(file)"
            @dblclick="openFile(file)"
          >
            <LIcon
              :name="file.type === 'directory' ? 'folder' : 'file'"
              :class="file.type === 'directory' ? 'text-yellow-500' : 'text-gray-500'"
              class="mr-3"
            />
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">{{ file.name }}</div>
              <div class="text-sm text-gray-500">
                {{ file.type === 'directory' ? '文件夹' : formatFileSize(file.size) }}
                · {{ formatDate(file.modifiedAt) }}
              </div>
            </div>
            <div class="text-sm text-gray-400">
              {{ file.permissions }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 状态栏 -->
    <div class="h-8 border-t border-gray-200 flex items-center justify-between px-4 text-sm text-gray-600">
      <span>{{ files.length }} 个项目</span>
      <span>{{ selectedFiles.length }} 个已选择</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { LButton, LIcon, LInput } from '@linglongos/ui'
import type { FileItem } from '@linglongos/shared-types'

// 状态
const currentPath = ref('/home')
const files = ref<FileItem[]>([])
const selectedFiles = ref<string[]>([])
const loading = ref(false)
const canGoBack = ref(false)
const canGoForward = ref(false)

onMounted(() => {
  loadFiles()
})

/**
 * 加载文件列表
 */
const loadFiles = async (): Promise<void> => {
  loading.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟文件数据
    files.value = [
      {
        name: 'documents',
        path: '/home/documents',
        type: 'directory',
        size: 0,
        modifiedAt: new Date('2024-01-15'),
        permissions: 'drwxr-xr-x',
        owner: 'user',
        group: 'user',
      },
      {
        name: 'downloads',
        path: '/home/downloads',
        type: 'directory',
        size: 0,
        modifiedAt: new Date('2024-01-14'),
        permissions: 'drwxr-xr-x',
        owner: 'user',
        group: 'user',
      },
      {
        name: 'config.json',
        path: '/home/config.json',
        type: 'file',
        size: 1024,
        modifiedAt: new Date('2024-01-13'),
        permissions: '-rw-r--r--',
        owner: 'user',
        group: 'user',
      },
      {
        name: 'readme.txt',
        path: '/home/readme.txt',
        type: 'file',
        size: 2048,
        modifiedAt: new Date('2024-01-12'),
        permissions: '-rw-r--r--',
        owner: 'user',
        group: 'user',
      },
    ]
  } catch (error) {
    console.error('加载文件失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 选择文件
 */
const selectFile = (file: FileItem): void => {
  const index = selectedFiles.value.indexOf(file.path)
  if (index === -1) {
    selectedFiles.value.push(file.path)
  } else {
    selectedFiles.value.splice(index, 1)
  }
}

/**
 * 打开文件
 */
const openFile = (file: FileItem): void => {
  if (file.type === 'directory') {
    currentPath.value = file.path
    loadFiles()
  } else {
    console.log('打开文件:', file.name)
  }
}

/**
 * 导航到路径
 */
const navigateToPath = (): void => {
  loadFiles()
}

/**
 * 返回
 */
const goBack = (): void => {
  console.log('返回')
}

/**
 * 前进
 */
const goForward = (): void => {
  console.log('前进')
}

/**
 * 向上
 */
const goUp = (): void => {
  const parts = currentPath.value.split('/').filter(Boolean)
  if (parts.length > 0) {
    parts.pop()
    currentPath.value = '/' + parts.join('/')
    loadFiles()
  }
}

/**
 * 刷新
 */
const refresh = (): void => {
  loadFiles()
}

/**
 * 创建文件夹
 */
const createFolder = (): void => {
  console.log('创建文件夹')
}

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化日期
 */
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN')
}
</script>