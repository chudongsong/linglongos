<template>
  <div class="h-full bg-black text-green-400 font-mono text-sm overflow-hidden">
    <!-- 终端头部 -->
    <div class="h-8 bg-gray-800 flex items-center px-4 text-white text-xs">
      <span>终端 - root@server</span>
    </div>
    
    <!-- 终端内容 -->
    <div class="flex-1 p-4 overflow-auto">
      <div v-for="(line, index) in terminalLines" :key="index" class="mb-1">
        <span v-if="line.type === 'command'" class="text-yellow-400">$ </span>
        <span :class="getLineClass(line.type)">{{ line.content }}</span>
      </div>
      
      <!-- 当前输入行 -->
      <div class="flex items-center">
        <span class="text-yellow-400">$ </span>
        <input
          v-model="currentCommand"
          class="flex-1 bg-transparent outline-none text-green-400 ml-1"
          @keyup.enter="executeCommand"
          @keyup.up="previousCommand"
          @keyup.down="nextCommand"
          placeholder="输入命令..."
        />
        <span class="animate-pulse">|</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

interface TerminalLine {
  type: 'command' | 'output' | 'error'
  content: string
}

// 状态
const terminalLines = ref<TerminalLine[]>([
  { type: 'output', content: '欢迎使用玲珑OS终端' },
  { type: 'output', content: '输入 help 查看可用命令' },
  { type: 'output', content: '' },
])

const currentCommand = ref('')
const commandHistory = ref<string[]>([])
const historyIndex = ref(-1)

onMounted(() => {
  // 模拟一些初始输出
  addLine('output', 'Linux server 5.4.0-74-generic #83-Ubuntu SMP Sat May 8 02:35:39 UTC 2021 x86_64')
  addLine('output', '')
})

/**
 * 添加终端行
 */
const addLine = (type: TerminalLine['type'], content: string): void => {
  terminalLines.value.push({ type, content })
  nextTick(() => {
    // 滚动到底部
    const container = document.querySelector('.overflow-auto')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

/**
 * 执行命令
 */
const executeCommand = (): void => {
  const command = currentCommand.value.trim()
  if (!command) return

  // 添加命令到历史
  commandHistory.value.push(command)
  historyIndex.value = -1

  // 显示命令
  addLine('command', command)

  // 执行命令
  executeSystemCommand(command)

  // 清空输入
  currentCommand.value = ''
}

/**
 * 执行系统命令
 */
const executeSystemCommand = (command: string): void => {
  const parts = command.split(' ')
  const cmd = parts[0].toLowerCase()

  switch (cmd) {
    case 'help':
      addLine('output', '可用命令:')
      addLine('output', '  ls      - 列出文件和目录')
      addLine('output', '  pwd     - 显示当前目录')
      addLine('output', '  whoami  - 显示当前用户')
      addLine('output', '  date    - 显示当前时间')
      addLine('output', '  clear   - 清空终端')
      addLine('output', '  help    - 显示帮助信息')
      break

    case 'ls':
      addLine('output', 'drwxr-xr-x  2 root root 4096 Jan 15 10:30 documents')
      addLine('output', 'drwxr-xr-x  2 root root 4096 Jan 14 09:15 downloads')
      addLine('output', '-rw-r--r--  1 root root 1024 Jan 13 14:20 config.json')
      addLine('output', '-rw-r--r--  1 root root 2048 Jan 12 16:45 readme.txt')
      break

    case 'pwd':
      addLine('output', '/home/root')
      break

    case 'whoami':
      addLine('output', 'root')
      break

    case 'date':
      addLine('output', new Date().toString())
      break

    case 'clear':
      terminalLines.value = []
      break

    default:
      addLine('error', `bash: ${cmd}: command not found`)
      break
  }

  addLine('output', '')
}

/**
 * 上一个命令
 */
const previousCommand = (): void => {
  if (commandHistory.value.length === 0) return

  if (historyIndex.value === -1) {
    historyIndex.value = commandHistory.value.length - 1
  } else if (historyIndex.value > 0) {
    historyIndex.value--
  }

  currentCommand.value = commandHistory.value[historyIndex.value] || ''
}

/**
 * 下一个命令
 */
const nextCommand = (): void => {
  if (historyIndex.value === -1) return

  if (historyIndex.value < commandHistory.value.length - 1) {
    historyIndex.value++
    currentCommand.value = commandHistory.value[historyIndex.value]
  } else {
    historyIndex.value = -1
    currentCommand.value = ''
  }
}

/**
 * 获取行样式类
 */
const getLineClass = (type: TerminalLine['type']): string => {
  switch (type) {
    case 'command':
      return 'text-white'
    case 'error':
      return 'text-red-400'
    case 'output':
    default:
      return 'text-green-400'
  }
}
</script>