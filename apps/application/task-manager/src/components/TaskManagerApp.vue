<template>
  <div class="h-full flex flex-col bg-white">
    <!-- 标签页 -->
    <div class="border-b border-gray-200">
      <nav class="flex space-x-8 px-6">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </nav>
    </div>
    
    <!-- 进程列表 -->
    <div v-if="activeTab === 'processes'" class="flex-1 overflow-hidden">
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <LInput
            v-model="processFilter"
            placeholder="搜索进程..."
            size="small"
            class="w-64"
          />
          <LButton size="small" @click="refreshProcesses">
            <LIcon name="refresh" size="small" />
            刷新
          </LButton>
        </div>
      </div>
      
      <div class="flex-1 overflow-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                进程名称
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PID
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CPU
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                内存
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="process in filteredProcesses"
              :key="process.pid"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ process.name }}</div>
                <div class="text-sm text-gray-500">{{ process.command }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ process.pid }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="text-sm text-gray-900">{{ process.cpu }}%</div>
                  <div class="ml-2 w-16 bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-blue-600 h-2 rounded-full"
                      :style="{ width: `${Math.min(process.cpu, 100)}%` }"
                    />
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="text-sm text-gray-900">{{ process.memory }}%</div>
                  <div class="ml-2 w-16 bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-green-600 h-2 rounded-full"
                      :style="{ width: `${Math.min(process.memory, 100)}%` }"
                    />
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                    process.status === 'running'
                      ? 'bg-green-100 text-green-800'
                      : process.status === 'sleeping'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ getStatusText(process.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <LButton
                  size="small"
                  type="danger"
                  @click="killProcess(process.pid)"
                >
                  结束进程
                </LButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- 服务列表 -->
    <div v-else-if="activeTab === 'services'" class="flex-1 overflow-hidden">
      <div class="p-4 border-b border-gray-200">
        <LButton size="small" @click="refreshServices">
          <LIcon name="refresh" size="small" />
          刷新
        </LButton>
      </div>
      
      <div class="flex-1 overflow-auto">
        <div class="p-4 space-y-4">
          <div
            v-for="service in services"
            :key="service.name"
            class="border border-gray-200 rounded-lg p-4"
          >
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">{{ service.name }}</h4>
                <p class="text-sm text-gray-500">{{ service.description }}</p>
              </div>
              <div class="flex items-center space-x-4">
                <span
                  :class="[
                    'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                    service.status === 'running'
                      ? 'bg-green-100 text-green-800'
                      : service.status === 'stopped'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ getServiceStatusText(service.status) }}
                </span>
                <div class="flex space-x-2">
                  <LButton
                    v-if="service.status === 'stopped'"
                    size="small"
                    type="success"
                    @click="startService(service.name)"
                  >
                    启动
                  </LButton>
                  <LButton
                    v-else
                    size="small"
                    type="warning"
                    @click="stopService(service.name)"
                  >
                    停止
                  </LButton>
                  <LButton
                    size="small"
                    @click="restartService(service.name)"
                  >
                    重启
                  </LButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { LButton, LIcon, LInput } from '@linglongos/ui'
import type { ProcessInfo, ServiceInfo } from '@linglongos/shared-types'

// 状态
const activeTab = ref('processes')
const processFilter = ref('')

const tabs = [
  { id: 'processes', name: '进程' },
  { id: 'services', name: '服务' },
]

const processes = ref<ProcessInfo[]>([])
const services = ref<ServiceInfo[]>([])

// 计算属性
const filteredProcesses = computed(() => {
  if (!processFilter.value) return processes.value
  
  const filter = processFilter.value.toLowerCase()
  return processes.value.filter(p => 
    p.name.toLowerCase().includes(filter) ||
    p.command.toLowerCase().includes(filter)
  )
})

onMounted(() => {
  loadProcesses()
  loadServices()
})

/**
 * 加载进程列表
 */
const loadProcesses = (): void => {
  // 模拟进程数据
  processes.value = [
    {
      pid: 1,
      name: 'systemd',
      cpu: 0.1,
      memory: 0.5,
      status: 'running',
      user: 'root',
      command: '/sbin/init',
    },
    {
      pid: 1234,
      name: 'nginx',
      cpu: 2.3,
      memory: 1.2,
      status: 'running',
      user: 'www-data',
      command: 'nginx: master process /usr/sbin/nginx',
    },
    {
      pid: 5678,
      name: 'mysql',
      cpu: 15.6,
      memory: 8.9,
      status: 'running',
      user: 'mysql',
      command: '/usr/sbin/mysqld',
    },
    {
      pid: 9012,
      name: 'node',
      cpu: 5.2,
      memory: 12.3,
      status: 'running',
      user: 'app',
      command: 'node /app/server.js',
    },
  ]
}

/**
 * 加载服务列表
 */
const loadServices = (): void => {
  // 模拟服务数据
  services.value = [
    {
      name: 'nginx',
      status: 'running',
      enabled: true,
      description: 'A high performance web server and a reverse proxy server',
    },
    {
      name: 'mysql',
      status: 'running',
      enabled: true,
      description: 'MySQL Community Server database server',
    },
    {
      name: 'redis',
      status: 'stopped',
      enabled: false,
      description: 'Advanced key-value store',
    },
    {
      name: 'docker',
      status: 'running',
      enabled: true,
      description: 'Application container engine',
    },
  ]
}

/**
 * 刷新进程列表
 */
const refreshProcesses = (): void => {
  loadProcesses()
}

/**
 * 刷新服务列表
 */
const refreshServices = (): void => {
  loadServices()
}

/**
 * 结束进程
 */
const killProcess = (pid: number): void => {
  console.log('结束进程:', pid)
  // 这里应该调用API结束进程
}

/**
 * 启动服务
 */
const startService = (serviceName: string): void => {
  console.log('启动服务:', serviceName)
  // 这里应该调用API启动服务
}

/**
 * 停止服务
 */
const stopService = (serviceName: string): void => {
  console.log('停止服务:', serviceName)
  // 这里应该调用API停止服务
}

/**
 * 重启服务
 */
const restartService = (serviceName: string): void => {
  console.log('重启服务:', serviceName)
  // 这里应该调用API重启服务
}

/**
 * 获取状态文本
 */
const getStatusText = (status: ProcessInfo['status']): string => {
  const statusMap = {
    running: '运行中',
    sleeping: '休眠',
    stopped: '已停止',
  }
  return statusMap[status] || status
}

/**
 * 获取服务状态文本
 */
const getServiceStatusText = (status: ServiceInfo['status']): string => {
  const statusMap = {
    running: '运行中',
    stopped: '已停止',
    failed: '失败',
  }
  return statusMap[status] || status
}
</script>