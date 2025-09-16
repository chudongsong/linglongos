<template>
  <div class="file-manager">
    <div class="toolbar">
      <Button @click="goBack" :disabled="!canGoBack" size="sm">
        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
        </svg>
        返回
      </Button>
      <Button @click="goForward" :disabled="!canGoForward" size="sm">
        前进
        <svg class="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z"/>
        </svg>
      </Button>
      <Input 
        v-model="currentPath" 
        class="flex-1 mx-2" 
        placeholder="文件路径"
        @keyup.enter="navigateToPath"
      />
      <Button @click="refresh" size="sm">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
        </svg>
      </Button>
    </div>
    
    <div class="file-list">
      <div class="file-item" v-for="file in files" :key="file.name" @dblclick="openFile(file)">
        <div class="file-icon">
          <svg v-if="file.type === 'directory'" class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
          </svg>
          <svg v-else class="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        </div>
        <div class="file-info">
          <div class="file-name">{{ file.name }}</div>
          <div class="file-meta">{{ formatSize(file.size) }} • {{ formatDate(file.modifiedAt) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
  size: number
  modifiedAt: Date
}

const currentPath = ref('/')
const files = ref<FileItem[]>([])
const history = ref<string[]>(['/'])
const historyIndex = ref(0)

const canGoBack = computed(() => historyIndex.value > 0)
const canGoForward = computed(() => historyIndex.value < history.value.length - 1)

onMounted(() => {
  loadFiles(currentPath.value)
})

function loadFiles(path: string) {
  // 模拟文件列表
  files.value = [
    {
      name: '文档',
      path: '/文档',
      type: 'directory',
      size: 0,
      modifiedAt: new Date('2024-01-15')
    },
    {
      name: '下载',
      path: '/下载',
      type: 'directory',
      size: 0,
      modifiedAt: new Date('2024-01-14')
    },
    {
      name: '图片',
      path: '/图片',
      type: 'directory',
      size: 0,
      modifiedAt: new Date('2024-01-13')
    },
    {
      name: 'README.md',
      path: '/README.md',
      type: 'file',
      size: 1024,
      modifiedAt: new Date('2024-01-12')
    }
  ]
}

function openFile(file: FileItem) {
  if (file.type === 'directory') {
    navigateTo(file.path)
  } else {
    // 打开文件
    console.log('Opening file:', file.name)
  }
}

function navigateTo(path: string) {
  currentPath.value = path
  loadFiles(path)
  
  // 更新历史记录
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }
  history.value.push(path)
  historyIndex.value = history.value.length - 1
}

function navigateToPath() {
  navigateTo(currentPath.value)
}

function goBack() {
  if (canGoBack.value) {
    historyIndex.value--
    currentPath.value = history.value[historyIndex.value]
    loadFiles(currentPath.value)
  }
}

function goForward() {
  if (canGoForward.value) {
    historyIndex.value++
    currentPath.value = history.value[historyIndex.value]
    loadFiles(currentPath.value)
  }
}

function refresh() {
  loadFiles(currentPath.value)
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.file-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.toolbar {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
  gap: 8px;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.file-item:hover {
  background-color: #f3f4f6;
}

.file-icon {
  margin-right: 12px;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: #374151;
}

.file-meta {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}
</style>