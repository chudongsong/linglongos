<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-black p-4">
    <Card class="w-full max-w-md bg-gray-900 border-gray-700">
      <CardHeader class="text-center">
        <div class="mx-auto w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0h-2m-1-5a4 4 0 118 0v1a2 2 0 01-2 2H8a2 2 0 01-2-2v-1z"></path>
          </svg>
        </div>
        <CardTitle class="text-2xl font-bold text-white">系统已锁定</CardTitle>
        <CardDescription class="text-gray-300">请输入密码解锁</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <Input
          v-model="password"
          type="password"
          placeholder="请输入密码"
          class="bg-gray-800 border-gray-600 text-white"
          @keyup.enter="unlock"
        />
        <Button @click="unlock" class="w-full">解锁</Button>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const router = useRouter()
const authStore = useAuthStore()
const password = ref('')

function unlock() {
  // 简单验证，实际应该验证用户密码
  if (password.value === 'admin') {
    router.push('/')
  }
}
</script>