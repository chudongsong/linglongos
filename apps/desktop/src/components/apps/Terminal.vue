<template>
  <div class="terminal">
    <div class="terminal-header">
      <div class="terminal-title">终端</div>
      <div class="terminal-controls">
        <Button @click="clearTerminal" size="sm" variant="ghost">清空</Button>
      </div>
    </div>
    
    <div ref="terminalRef" class="terminal-content">
      <div v-for="(line, index) in terminalLines" :key="index" class="terminal-line">
        <span v-if="line.type === 'prompt'" class="terminal-prompt">{{ line.prompt }}</span>
        <span :class="`terminal-${line.type}`" v-html="line.content"></span>
      </div>
      
      <!-- 输入行 -->
      <div class="terminal-input-line">
        <span class="terminal-prompt">{{ currentPrompt }}</span>
        <input 
          ref="inputRef"
          v-model="currentInput"
          class="terminal-input"
          @keydown="handleKeydown"
          @focus="isFocused = true"
          @blur="isFocused = false"
        />
        <span v-if="isFocused" class="terminal-cursor">_</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { Button } from '@/components/ui/button'

interface TerminalLine {
  type: 'prompt' | 'output' | 'error'
  content: string
  prompt?: string
}

const terminalRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const terminalLines = ref<TerminalLine[]>([
  {
    type: 'output',
    content: '欢迎使用玲珑OS终端！'
  },
  {
    type: 'output',
    content: '输入 "help" 查看可用命令'
  }
])

const currentInput = ref('')
const currentPrompt = ref('user@linglongos:~$ ')
const isFocused = ref(true)
const commandHistory = ref<string[]>([])
const historyIndex = ref(-1)

onMounted(() => {
  focusInput()
})

function focusInput() {
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function handleKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'Enter':
      executeCommand()
      break
    case 'ArrowUp':
      navigateHistory(-1)
      event.preventDefault()
      break
    case 'ArrowDown':
      navigateHistory(1)
      event.preventDefault()
      break
    case 'Tab':
      // 自动完成
      event.preventDefault()
      break
  }
}

function executeCommand() {
  const command = currentInput.value.trim()
  
  if (command) {
    // 添加命令到历史
    commandHistory.value.push(command)
    historyIndex.value = -1
    
    // 显示命令
    terminalLines.value.push({
      type: 'prompt',
      content: command,
      prompt: currentPrompt.value
    })
    
    // 执行命令
    const output = processCommand(command)
    if (output) {
      terminalLines.value.push(...output)
    }
  }
  
  currentInput.value = ''
  scrollToBottom()
}

function processCommand(command: string): TerminalLine[] {
  const parts = command.split(' ')
  const cmd = parts[0]
  const args = parts.slice(1)
  
  switch (cmd) {
    case 'help':
      return [
        { type: 'output', content: '可用命令:' },
        { type: 'output', content: '  help     - 显示帮助信息' },
        { type: 'output', content: '  clear    - 清空终端' },
        { type: 'output', content: '  ls       - 列出文件' },
        { type: 'output', content: '  pwd      - 显示当前目录' },
        { type: 'output', content: '  date     - 显示当前时间' },
        { type: 'output', content: '  echo     - 输出文本' },
        { type: 'output', content: '  whoami   - 显示当前用户' }
      ]
    
    case 'clear':
      terminalLines.value = []
      return []
    
    case 'ls':
      return [
        { type: 'output', content: 'Documents/  Downloads/  Pictures/  README.md' }
      ]
    
    case 'pwd':
      return [
        { type: 'output', content: '/home/user' }
      ]
    
    case 'date':
      return [
        { type: 'output', content: new Date().toString() }
      ]
    
    case 'echo':
      return [
        { type: 'output', content: args.join(' ') }
      ]
    
    case 'whoami':
      return [
        { type: 'output', content: 'user' }
      ]
    
    default:
      return [
        { type: 'error', content: `命令未找到: ${cmd}` }
      ]
  }
}

function navigateHistory(direction: number) {
  const newIndex = historyIndex.value + direction
  
  if (direction === -1 && commandHistory.value.length > 0) {
    // 向上
    if (historyIndex.value === -1) {
      historyIndex.value = commandHistory.value.length - 1
    } else if (historyIndex.value > 0) {
      historyIndex.value--
    }
    currentInput.value = commandHistory.value[historyIndex.value] || ''
  } else if (direction === 1) {
    // 向下
    if (historyIndex.value !== -1) {
      historyIndex.value++
      if (historyIndex.value >= commandHistory.value.length) {
        historyIndex.value = -1
        currentInput.value = ''
      } else {
        currentInput.value = commandHistory.value[historyIndex.value]
      }
    }
  }
}

function clearTerminal() {
  terminalLines.value = []
}

function scrollToBottom() {
  nextTick(() => {
    if (terminalRef.value) {
      terminalRef.value.scrollTop = terminalRef.value.scrollHeight
    }
  })
}
</script>

<style scoped>
.terminal {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  color: #00ff00;
  font-family: 'Courier New', monospace;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #2a2a2a;
  border-bottom: 1px solid #333;
}

.terminal-title {
  font-weight: 500;
  color: #fff;
}

.terminal-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.4;
}

.terminal-line {
  margin: 2px 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.terminal-prompt {
  color: #00aaff;
  margin-right: 8px;
}

.terminal-output {
  color: #00ff00;
}

.terminal-error {
  color: #ff4444;
}

.terminal-input-line {
  display: flex;
  align-items: center;
  margin: 2px 0;
}

.terminal-input {
  background: transparent;
  border: none;
  outline: none;
  color: #00ff00;
  font-family: inherit;
  font-size: inherit;
  flex: 1;
}

.terminal-cursor {
  color: #00ff00;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>