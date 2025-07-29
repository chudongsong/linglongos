<template>
  <div class="l-qrcode" :style="containerStyle">
    <canvas ref="qrcodeCanvas" class="l-qrcode__canvas"></canvas>
    <div v-if="logo" class="l-qrcode__logo">
      <img :src="logo" :alt="alt" class="l-qrcode__logo-img" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { generateQRCode } from '../../utils/qrcode'

interface Props {
  /** 二维码内容 */
  value: string
  /** 尺寸 */
  size?: number
  /** 颜色 */
  color?: string
  /** 背景色 */
  backgroundColor?: string
  /** 纠错级别 L/M/Q/H */
  errorLevel?: 'L' | 'M' | 'Q' | 'H'
  /** Logo图片地址 */
  logo?: string
  /** Logo图片alt属性 */
  alt?: string
  /** Logo尺寸 */
  logoSize?: number
  /** Logo边框宽度 */
  logoBorderWidth?: number
  /** Logo边框颜色 */
  logoBorderColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 200,
  color: '#000000',
  backgroundColor: '#FFFFFF',
  errorLevel: 'M',
  alt: 'QR Code Logo',
  logoSize: 40,
  logoBorderWidth: 2,
  logoBorderColor: '#FFFFFF'
})

const qrcodeCanvas = ref<HTMLCanvasElement | null>(null)

// 容器样式
const containerStyle = computed(() => {
  return {
    width: `${props.size}px`,
    height: `${props.size}px`
  }
})

// 生成二维码
const generateCode = () => {
  if (!qrcodeCanvas.value) return
  
  const canvas = qrcodeCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 设置canvas尺寸
  canvas.width = props.size
  canvas.height = props.size
  
  // 生成二维码
  generateQRCode({
    canvas,
    text: props.value,
    width: props.size,
    height: props.size,
    colorDark: props.color,
    colorLight: props.backgroundColor,
    correctLevel: props.errorLevel
  })
}

// 导出二维码为图片
const exportImage = (type: 'png' | 'jpeg' = 'png', quality = 0.92): string => {
  if (!qrcodeCanvas.value) return ''
  
  // 创建一个新的canvas，包含二维码和logo
  const canvas = document.createElement('canvas')
  canvas.width = props.size
  canvas.height = props.size
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  
  // 绘制二维码
  ctx.drawImage(qrcodeCanvas.value, 0, 0, props.size, props.size)
  
  // 如果有logo，绘制logo
  if (props.logo) {
    const logoImg = document.querySelector('.l-qrcode__logo-img') as HTMLImageElement
    if (logoImg && logoImg.complete) {
      const logoSize = props.logoSize
      const logoX = (props.size - logoSize) / 2
      const logoY = (props.size - logoSize) / 2
      
      // 绘制logo背景
      ctx.fillStyle = props.backgroundColor
      ctx.fillRect(logoX - props.logoBorderWidth, logoY - props.logoBorderWidth, 
                  logoSize + props.logoBorderWidth * 2, logoSize + props.logoBorderWidth * 2)
      
      // 绘制logo
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
    }
  }
  
  // 导出为图片
  return canvas.toDataURL(`image/${type}`, quality)
}

// 监听属性变化，重新生成二维码
watch(() => [props.value, props.size, props.color, props.backgroundColor, props.errorLevel], 
  () => {
    generateCode()
  },
  { immediate: false, deep: true }
)

onMounted(() => {
  generateCode()
})

// 暴露方法
defineExpose({
  exportImage
})
</script>

<script lang="ts">
export default {
  name: 'LQrcode'
}
</script>

<style scoped>
.l-qrcode {
  position: relative;
  display: inline-block;
}

.l-qrcode__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.l-qrcode__logo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: v-bind('props.backgroundColor');
  padding: v-bind('props.logoBorderWidth + "px"');
  border-radius: 4px;
}

.l-qrcode__logo-img {
  display: block;
  width: v-bind('props.logoSize + "px"');
  height: v-bind('props.logoSize + "px"');
  object-fit: contain;
}
</style>