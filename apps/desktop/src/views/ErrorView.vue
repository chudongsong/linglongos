<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-400 to-red-600 p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <div class="mx-auto w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <CardTitle class="text-2xl font-bold text-gray-800">出错了</CardTitle>
        <CardDescription>{{ errorMessage }}</CardDescription>
      </CardHeader>
      <CardContent class="text-center">
        <Button @click="goBack" class="mr-2">返回</Button>
        <Button @click="goHome" variant="outline">回到首页</Button>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()

const errorMessage = computed(() => {
  const code = route.query.code as string
  const message = route.query.message as string
  
  if (code === '403') {
    return message || '您没有权限访问此页面'
  } else if (code === '404') {
    return message || '页面未找到'
  } else {
    return message || '系统发生了未知错误'
  }
})

function goBack() {
  router.back()
}

function goHome() {
  router.push('/')
}
</script>