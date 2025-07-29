<template>
  <div class="h-full flex flex-col bg-black">
    <!-- 视频播放区域 -->
    <div class="flex-1 flex items-center justify-center overflow-hidden">
      <div v-if="currentVideo" class="w-full h-full flex items-center justify-center">
        <LVideoPlayer 
          :src="currentVideo.url" 
          :poster="currentVideo.thumbnail"
          :autoplay="autoplay"
          @ended="handleVideoEnded"
          class="max-h-full max-w-full"
        />
      </div>
      
      <div v-else class="text-gray-400 text-center">
        <LIcon name="video" size="large" class="mb-2" />
        <div>没有视频可播放</div>
      </div>
    </div>
    
    <!-- 控制栏 -->
    <div class="h-16 bg-gray-900 flex items-center justify-between px-4">
      <div class="flex items-center space-x-4">
        <div class="text-white text-sm">
          {{ currentVideoIndex + 1 }} / {{ videos.length }} - {{ currentVideo?.name }}
        </div>
        
        <div class="flex items-center space-x-2">
          <LButton size="small" @click="toggleAutoplay">
            <LIcon :name="autoplay ? 'pause' : 'play'" size="small" />
            {{ autoplay ? '关闭自动播放' : '开启自动播放' }}
          </LButton>
          
          <LButton size="small" @click="toggleRepeat">
            <LIcon :name="repeat ? 'repeat' : 'skip-forward'" size="small" />
            {{ repeat ? '关闭循环' : '开启循环' }}
          </LButton>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <LButton size="small" @click="prevVideo" :disabled="currentVideoIndex <= 0">
          <LIcon name="skip-back" size="small" />
          上一个
        </LButton>
        <LButton size="small" @click="nextVideo" :disabled="currentVideoIndex >= videos.length - 1">
          <LIcon name="skip-forward" size="small" />
          下一个
        </LButton>
      </div>
    </div>
    
    <!-- 播放列表 -->
    <div class="h-32 bg-gray-800 overflow-y-auto">
      <div class="p-2 space-y-2">
        <div
          v-for="(video, index) in videos"
          :key="video.id"
          :class="[
            'flex items-center p-2 rounded cursor-pointer',
            currentVideoIndex === index ? 'bg-blue-900' : 'hover:bg-gray-700'
          ]"
          @click="selectVideo(index)"
        >
          <div class="w-16 h-9 bg-gray-900 flex-shrink-0 mr-3 overflow-hidden">
            <img 
              v-if="video.thumbnail" 
              :src="video.thumbnail" 
              :alt="video.name" 
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-600">
              <LIcon name="video" size="small" />
            </div>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-white truncate">{{ video.name }}</div>
            <div class="text-xs text-gray-400">{{ formatDuration(video.duration) }} · {{ formatFileSize(video.size) }}</div>
          </div>
          
          <LButton size="small" @click.stop="removeVideo(index)">
            <LIcon name="x" size="small" />
          </LButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { LButton, LIcon } from '@linglongos/ui'
import { LVideoPlayer } from '@linglongos/media'

interface VideoItem {
  id: string
  name: string
  url: string
  thumbnail?: string
  duration: number
  size: number
  type: string
}

// 状态
const currentVideoIndex = ref(0)
const autoplay = ref(true)
const repeat = ref(false)

// 模拟视频数据
const videos = ref<VideoItem[]>([
  {
    id: '1',
    name: '示例视频1.mp4',
    url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    thumbnail: 'https://picsum.photos/id/20/320/180',
    duration: 10,
    size: 1024 * 1024,
    type: 'video/mp4',
  },
  {
    id: '2',
    name: '示例视频2.mp4',
    url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4',
    thumbnail: 'https://picsum.photos/id/21/320/180',
    duration: 20,
    size: 2 * 1024 * 1024,
    type: 'video/mp4',
  },
  {
    id: '3',
    name: '示例视频3.mp4',
    url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_5mb.mp4',
    thumbnail: 'https://picsum.photos/id/22/320/180',
    duration: 30,
    size: 5 * 1024 * 1024,
    type: 'video/mp4',
  },
])

// 计算属性
const currentVideo = computed(() => {
  return videos.value[currentVideoIndex.value]
})

/**
 * 选择视频
 */
const selectVideo = (index: number): void => {
  currentVideoIndex.value = index
}

/**
 * 下一个视频
 */
const nextVideo = (): void => {
  if (currentVideoIndex.value < videos.value.length - 1) {
    currentVideoIndex.value++
  }
}

/**
 * 上一个视频
 */
const prevVideo = (): void => {
  if (currentVideoIndex.value > 0) {
    currentVideoIndex.value--
  }
}

/**
 * 切换自动播放
 */
const toggleAutoplay = (): void => {
  autoplay.value = !autoplay.value
}

/**
 * 切换循环播放
 */
const toggleRepeat = (): void => {
  repeat.value = !repeat.value
}

/**
 * 移除视频
 */
const removeVideo = (index: number): void => {
  videos.value.splice(index, 1)
  
  if (videos.value.length === 0) {
    return
  }
  
  if (index <= currentVideoIndex.value) {
    if (currentVideoIndex.value > 0) {
      currentVideoIndex.value--
    }
  }
}

/**
 * 处理视频结束
 */
const handleVideoEnded = (): void => {
  if (repeat.value) {
    // 循环播放当前视频
    return
  }
  
  if (currentVideoIndex.value < videos.value.length - 1) {
    // 播放下一个视频
    nextVideo()
  } else if (repeat.value) {
    // 从头开始播放
    currentVideoIndex.value = 0
  }
}

/**
 * 格式化时长
 */
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
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
</script>