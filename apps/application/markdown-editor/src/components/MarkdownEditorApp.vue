<template>
  <div class="h-full flex flex-col bg-white">
    <!-- 工具栏 -->
    <div class="h-12 border-b border-gray-200 flex items-center px-4 space-x-2">
      <LButton size="small" @click="newFile">
        <LIcon name="file-plus" size="small" />
        新建
      </LButton>
      <LButton size="small" @click="openFile">
        <LIcon name="folder-open" size="small" />
        打开
      </LButton>
      <LButton size="small" @click="saveFile" :disabled="!currentFile">
        <LIcon name="save" size="small" />
        保存
      </LButton>
      
      <div class="h-6 border-l border-gray-300 mx-2"></div>
      
      <LButton size="small" @click="togglePreview">
        <LIcon :name="showPreview ? 'edit' : 'eye'" size="small" />
        {{ showPreview ? '编辑' : '预览' }}
      </LButton>
      
      <div class="flex-1"></div>
      
      <div v-if="currentFile" class="text-sm text-gray-500">
        {{ currentFile.name }} {{ isDirty ? '*' : '' }}
      </div>
    </div>
    
    <!-- 编辑区域 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Markdown编辑器 -->
      <div 
        :class="[
          'transition-all duration-300 overflow-hidden',
          showPreview ? 'w-0' : 'w-full'
        ]"
      >
        <LMarkdownEditor
          v-model="content"
          @change="handleContentChange"
          class="h-full"
        />
      </div>
      
      <!-- 预览区域 -->
      <div 
        :class="[
          'transition-all duration-300 overflow-auto p-4',
          showPreview ? 'w-full' : 'w-0'
        ]"
        v-html="renderedContent"
      ></div>
    </div>
    
    <!-- 状态栏 -->
    <div class="h-6 border-t border-gray-200 flex items-center justify-between px-4 text-xs text-gray-500">
      <div>{{ wordCount }} 字 | {{ lineCount }} 行</div>
      <div>Markdown</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { LButton, LIcon } from '@linglongos/ui'
import { LMarkdownEditor } from '@linglongos/editors'

interface MarkdownFile {
  id: string
  name: string
  path: string
  content: string
  lastModified: Date
}

// 状态
const content = ref('# 欢迎使用玲珑OS Markdown编辑器\n\n这是一个简单的Markdown编辑器示例。\n\n## 功能\n\n- 实时预览\n- 语法高亮\n- 文件保存\n\n> 开始编辑吧！')
const showPreview = ref(false)
const currentFile = ref<MarkdownFile | null>(null)
const isDirty = ref(false)

// 计算属性
const renderedContent = computed(() => {
  // 这里应该使用实际的Markdown渲染库
  // 简单模拟一下渲染效果
  return content.value
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    .replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n/g, '<br>')
})

const wordCount = computed(() => {
  return content.value.trim().split(/\s+/).length
})

const lineCount = computed(() => {
  return content.value.split('\n').length
})

// 监听内容变化
watch(content, () => {
  if (currentFile.value) {
    isDirty.value = true
  }
})

/**
 * 切换预览模式
 */
const togglePreview = (): void => {
  showPreview.value = !showPreview.value
}

/**
 * 新建文件
 */
const newFile = (): void => {
  if (isDirty.value) {
    // 应该提示用户保存
    if (!confirm('当前文件未保存，是否继续？')) {
      return
    }
  }
  
  content.value = '# 新文档\n\n'
  currentFile.value = null
  isDirty.value = false
}

/**
 * 打开文件
 */
const openFile = (): void => {
  // 模拟打开文件
  const mockFile: MarkdownFile = {
    id: 'file-' + Date.now(),
    name: '示例文档.md',
    path: '/documents/示例文档.md',
    content: '# 示例文档\n\n这是一个从"文件系统"打开的示例文档。\n\n## 章节1\n\n内容...\n\n## 章节2\n\n更多内容...',
    lastModified: new Date(),
  }
  
  content.value = mockFile.content
  currentFile.value = mockFile
  isDirty.value = false
}

/**
 * 保存文件
 */
const saveFile = (): void => {
  if (!currentFile.value) return
  
  // 模拟保存文件
  console.log('保存文件:', currentFile.value.name)
  currentFile.value.content = content.value
  currentFile.value.lastModified = new Date()
  isDirty.value = false
}

/**
 * 处理内容变化
 */
const handleContentChange = (): void => {
  // 可以在这里添加自动保存逻辑
}
</script>

<style>
/* 预览样式 */
h1 {
  font-size: 2em;
  margin-bottom: 0.5em;
}

h2 {
  font-size: 1.5em;
  margin-bottom: 0.5em;
  margin-top: 1em;
}

h3 {
  font-size: 1.2em;
  margin-bottom: 0.5em;
  margin-top: 1em;
}

blockquote {
  border-left: 4px solid #ddd;
  padding-left: 1em;
  color: #666;
}

code {
  background-color: #f5f5f5;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

li {
  margin-left: 1em;
}
</style>