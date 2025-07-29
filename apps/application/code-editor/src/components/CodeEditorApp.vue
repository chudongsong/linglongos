<template>
  <div class="h-full flex flex-col bg-gray-900">
    <!-- 工具栏 -->
    <div class="h-12 bg-gray-800 flex items-center px-4 space-x-2">
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
      
      <div class="h-6 border-l border-gray-600 mx-2"></div>
      
      <!-- 语言选择 -->
      <select 
        v-model="language"
        class="bg-gray-700 text-white text-sm rounded px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500"
      >
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="html">HTML</option>
        <option value="css">CSS</option>
        <option value="json">JSON</option>
        <option value="python">Python</option>
      </select>
      
      <div class="flex-1"></div>
      
      <div v-if="currentFile" class="text-sm text-gray-300">
        {{ currentFile.name }} {{ isDirty ? '*' : '' }}
      </div>
    </div>
    
    <!-- 编辑区域 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 文件浏览器 -->
      <div class="w-64 bg-gray-800 border-r border-gray-700 overflow-auto">
        <div class="p-3">
          <h3 class="text-sm font-medium text-gray-300 mb-2">文件浏览器</h3>
          
          <div class="space-y-1">
            <div
              v-for="file in files"
              :key="file.id"
              :class="[
                'flex items-center p-2 rounded text-sm cursor-pointer',
                currentFile?.id === file.id ? 'bg-blue-800 text-white' : 'text-gray-300 hover:bg-gray-700'
              ]"
              @click="selectFile(file)"
            >
              <LIcon 
                :name="getFileIcon(file.name)" 
                size="small" 
                class="mr-2"
                :class="getFileIconColor(file.name)"
              />
              <span class="truncate">{{ file.name }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 代码编辑器 -->
      <div class="flex-1">
        <LCodeEditor
          v-model="content"
          :language="language"
          @change="handleContentChange"
          class="h-full"
        />
      </div>
    </div>
    
    <!-- 状态栏 -->
    <div class="h-6 bg-blue-600 flex items-center justify-between px-4 text-xs text-white">
      <div>{{ language }} | {{ lineCount }} 行 | {{ charCount }} 字符</div>
      <div>UTF-8</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { LButton, LIcon } from '@linglongos/ui'
import { LCodeEditor } from '@linglongos/editors'

interface CodeFile {
  id: string
  name: string
  path: string
  content: string
  language: string
  lastModified: Date
}

// 状态
const content = ref('// 欢迎使用玲珑OS代码编辑器\n\nfunction greet() {\n  console.log("Hello, World!");\n}\n\ngreet();')
const language = ref('javascript')
const currentFile = ref<CodeFile | null>(null)
const isDirty = ref(false)

// 模拟文件列表
const files = ref<CodeFile[]>([
  {
    id: 'file1',
    name: 'main.js',
    path: '/projects/demo/main.js',
    content: '// 欢迎使用玲珑OS代码编辑器\n\nfunction greet() {\n  console.log("Hello, World!");\n}\n\ngreet();',
    language: 'javascript',
    lastModified: new Date(),
  },
  {
    id: 'file2',
    name: 'styles.css',
    path: '/projects/demo/styles.css',
    content: 'body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n  background-color: #f5f5f5;\n}\n\n.container {\n  max-width: 800px;\n  margin: 0 auto;\n}',
    language: 'css',
    lastModified: new Date(),
  },
  {
    id: 'file3',
    name: 'index.html',
    path: '/projects/demo/index.html',
    content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Demo</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div class="container">\n    <h1>Hello World</h1>\n  </div>\n  <script src="main.js"></script>\n</body>\n</html>',
    language: 'html',
    lastModified: new Date(),
  },
  {
    id: 'file4',
    name: 'config.json',
    path: '/projects/demo/config.json',
    content: '{\n  "name": "demo-project",\n  "version": "1.0.0",\n  "description": "A demo project",\n  "author": "玲珑OS团队",\n  "license": "MIT"\n}',
    language: 'json',
    lastModified: new Date(),
  },
])

// 计算属性
const lineCount = computed(() => {
  return content.value.split('\n').length
})

const charCount = computed(() => {
  return content.value.length
})

// 监听内容变化
watch(content, () => {
  if (currentFile.value) {
    isDirty.value = true
  }
})

// 监听语言变化
watch(language, (newLanguage) => {
  if (currentFile.value) {
    currentFile.value.language = newLanguage
  }
})

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
  
  const fileName = prompt('请输入文件名', 'untitled.js')
  if (!fileName) return
  
  const fileExt = fileName.split('.').pop() || 'js'
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'py': 'python',
  }
  
  const newLang = langMap[fileExt] || 'javascript'
  
  const newFile: CodeFile = {
    id: 'file' + Date.now(),
    name: fileName,
    path: '/projects/demo/' + fileName,
    content: '',
    language: newLang,
    lastModified: new Date(),
  }
  
  files.value.push(newFile)
  selectFile(newFile)
}

/**
 * 打开文件
 */
const openFile = (): void => {
  // 在实际应用中，这里应该打开文件选择器
  alert('在实际应用中，这里会打开文件选择器')
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
 * 选择文件
 */
const selectFile = (file: CodeFile): void => {
  if (isDirty.value && currentFile.value) {
    // 应该提示用户保存
    if (!confirm('当前文件未保存，是否切换？')) {
      return
    }
  }
  
  currentFile.value = file
  content.value = file.content
  language.value = file.language
  isDirty.value = false
}

/**
 * 处理内容变化
 */
const handleContentChange = (): void => {
  // 可以在这里添加自动保存逻辑
}

/**
 * 获取文件图标
 */
const getFileIcon = (fileName: string): string => {
  const ext = fileName.split('.').pop()
  
  switch (ext) {
    case 'js':
      return 'code'
    case 'ts':
      return 'code'
    case 'html':
      return 'code'
    case 'css':
      return 'code'
    case 'json':
      return 'code'
    case 'py':
      return 'code'
    default:
      return 'file'
  }
}

/**
 * 获取文件图标颜色
 */
const getFileIconColor = (fileName: string): string => {
  const ext = fileName.split('.').pop()
  
  switch (ext) {
    case 'js':
      return 'text-yellow-400'
    case 'ts':
      return 'text-blue-400'
    case 'html':
      return 'text-orange-400'
    case 'css':
      return 'text-purple-400'
    case 'json':
      return 'text-green-400'
    case 'py':
      return 'text-blue-500'
    default:
      return 'text-gray-400'
  }
}
</script>