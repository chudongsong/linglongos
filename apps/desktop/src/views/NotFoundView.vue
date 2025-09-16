<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600 p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <div class="mx-auto w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <CardTitle class="text-2xl font-bold text-gray-800">404</CardTitle>
        <CardDescription>页面未找到</CardDescription>
      </CardHeader>
      <CardContent class="text-center">
        <Button @click="goHome">回到首页</Button>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>