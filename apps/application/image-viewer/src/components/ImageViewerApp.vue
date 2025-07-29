<template>
  <div class="h-full flex flex-col bg-black">
    <!-- 工具栏 -->
    <div class="h-12 bg-gray-800 flex items-center justify-between px-4">
      <div class="flex items-center space-x-2">
        <LButton size="small" @click="zoomIn">
          <LIcon name="zoom-in" size="small" />
        </LButton>
        <LButton size="small" @click="zoomOut">
          <LIcon name="zoom-out" size="small" />
        </LButton>
        <LButton size="small" @click="resetZoom">
          <LIcon name="refresh" size="small" />
          重置
        </LButton>
        <LButton size="small" @click="rotateLeft">
          <LIcon name="rotate-ccw" size="small" />
        </LButton>
        <LButton size="small" @click="rotateRight">
          <LIcon name="rotate-cw" size="small" />
        </LButton>
      </div>
      
      <div class="text-white text-sm">
        {{ currentImageIndex + 1 }} / {{ images.length }} - {{ currentImage?.name }}
      </div>
      
      <div class="flex items-center space-x-2">
        <LButton size="small" @click="prevImage" :disabled="currentImageIndex <= 0">
          <LIcon name="chevron-left" size="small" />
        </LButton>
        <LButton size="small" @click="nextImage" :disabled="currentImageIndex >= images.length - 1">
          <LIcon name="chevron-right" size="small" />
        </LButton>
      </div>
    </div>
    
    <!-- 图片显示区域 -->
    <div class="flex-1 flex items-center justify-center overflow-hidden">
      <div 
        v-if="currentImage"
        class="relative"
        :style="{
          transform: `scale(${zoom}) rotate(${rotation}deg)`,
          transition: 'transform 0.2s ease'
        }"
      >
        <LImageViewer 
          :src="currentImage.url" 
          :alt="currentImage.name"
          class="max-h-full max-w-full object-contain"
        />
      </div>
      
      <div v-else class="text-gray-400 text-center">
        <LIcon name="image" size="large" class="mb-2" />
        <div>没有图片可显示</div>
      </div>
    </div>
    
    <!-- 缩略图栏 -->
    <div class="h-20 bg-gray-800 flex items-center overflow-x-auto p-2 space-x-2">
      <div
        v-for="(image, index) in images"
        :key="image.id"
        :class="[
          'h-16 w-16 flex-shrink-0 cursor-pointer border-2 rounded overflow-hidden',
          currentImageIndex === index ? 'border-blue-500' : 'border-transparent'
        ]"
        @click="selectImage(index)"
      >
        <img :src="image.url" :alt="image.name" class="h-full w-full object-cover" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { LButton, LIcon } from '@linglongos/ui'
import { LImageViewer } from '@linglongos/media'

interface ImageItem {
  id: string
  name: string
  url: string
  type: string
  size: number
}

// 状态
const currentImageIndex = ref(0)
const zoom = ref(1)
const rotation = ref(0)

// 模拟图片数据
const images = ref<ImageItem[]>([
  {
    id: '1',
    name: '风景照片1.jpg',
    url: 'https://picsum.photos/id/10/800/600',
    type: 'image/jpeg',
    size: 1024 * 1024 * 2.5,
  },
  {
    id: '2',
    name: '风景照片2.jpg',
    url: 'https://picsum.photos/id/11/800/600',
    type: 'image/jpeg',
    size: 1024 * 1024 * 1.8,
  },
  {
    id: '3',
    name: '风景照片3.jpg',
    url: 'https://picsum.photos/id/12/800/600',
    type: 'image/jpeg',
    size: 1024 * 1024 * 3.2,
  },
  {
    id: '4',
    name: '风景照片4.jpg',
    url: 'https://picsum.photos/id/13/800/600',
    type: 'image/jpeg',
    size: 1024 * 1024 * 2.1,
  },
  {
    id: '5',
    name: '风景照片5.jpg',
    url: 'https://picsum.photos/id/14/800/600',
    type: 'image/jpeg',
    size: 1024 * 1024 * 1.5,
  },
])

// 计算属性
const currentImage = computed(() => {
  return images.value[currentImageIndex.value]
})

/**
 * 选择图片
 */
const selectImage = (index: number): void => {
  currentImageIndex.value = index
  resetZoom()
}

/**
 * 下一张图片
 */
const nextImage = (): void => {
  if (currentImageIndex.value < images.value.length - 1) {
    currentImageIndex.value++
    resetZoom()
  }
}

/**
 * 上一张图片
 */
const prevImage = (): void => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
    resetZoom()
  }
}

/**
 * 放大
 */
const zoomIn = (): void => {
  zoom.value = Math.min(zoom.value + 0.1, 3)
}

/**
 * 缩小
 */
const zoomOut = (): void => {
  zoom.value = Math.max(zoom.value - 0.1, 0.1)
}

/**
 * 重置缩放
 */
const resetZoom = (): void => {
  zoom.value = 1
  rotation.value = 0
}

/**
 * 向左旋转
 */
const rotateLeft = (): void => {
  rotation.value = (rotation.value - 90) % 360
}

/**
 * 向右旋转
 */
const rotateRight = (): void => {
  rotation.value = (rotation.value + 90) % 360
}
</script>