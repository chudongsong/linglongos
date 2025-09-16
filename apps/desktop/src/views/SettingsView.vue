<template>
  <div class="settings-view">
    <Card class="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>系统设置</CardTitle>
        <CardDescription>配置您的桌面环境和系统选项</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 主题设置 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">主题设置</h3>
            <div class="space-y-2">
              <label class="text-sm font-medium">主题模式</label>
              <select 
                v-model="themeSettings.mode"
                class="w-full p-2 border rounded-md"
                @change="updateTheme"
              >
                <option value="light">浅色</option>
                <option value="dark">深色</option>
                <option value="auto">自动</option>
              </select>
            </div>
          </div>
          
          <!-- 壁纸设置 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">壁纸设置</h3>
            <div class="space-y-2">
              <label class="text-sm font-medium">壁纸类型</label>
              <select 
                v-model="wallpaperSettings.type"
                class="w-full p-2 border rounded-md"
                @change="updateWallpaper"
              >
                <option value="color">纯色</option>
                <option value="gradient">渐变</option>
                <option value="image">图片</option>
              </select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDesktopStore } from '@/stores/desktop'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import type { ThemeConfig, WallpaperConfig } from '@/types'

const desktopStore = useDesktopStore()

const themeSettings = ref<ThemeConfig>({
  mode: 'light',
  primaryColor: '#3b82f6',
  accentColor: '#8b5cf6',
  fontFamily: 'Inter',
  fontSize: 14,
  borderRadius: 8,
  animations: true
})

const wallpaperSettings = ref<WallpaperConfig>({
  type: 'gradient',
  value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  opacity: 1
})

onMounted(() => {
  themeSettings.value = { ...desktopStore.theme }
  wallpaperSettings.value = { ...desktopStore.wallpaper }
})

function updateTheme() {
  desktopStore.setTheme(themeSettings.value)
}

function updateWallpaper() {
  desktopStore.setWallpaper(wallpaperSettings.value)
}
</script>