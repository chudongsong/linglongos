<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
    <div class="max-w-md w-full space-y-8 p-8">
      <!-- 登录卡片 -->
      <LCard class="backdrop-blur-lg bg-white/10 border-white/20">
        <template #header>
          <div class="text-center">
            <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-white/20 mb-4">
              <LIcon name="home" size="large" class="text-white" />
            </div>
            <h2 class="text-3xl font-bold text-white">玲珑OS</h2>
            <p class="mt-2 text-sm text-white/80">统一前端操作环境</p>
          </div>
        </template>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 用户名输入 -->
          <LInput
            v-model="loginForm.username"
            label="用户名"
            placeholder="请输入用户名"
            icon="user"
            :error="errors.username"
            class="text-white"
          />

          <!-- 密码输入 -->
          <LInput
            v-model="loginForm.password"
            type="password"
            label="密码"
            placeholder="请输入密码"
            icon="lock"
            :error="errors.password"
            class="text-white"
          />

          <!-- 记住我 -->
          <div class="flex items-center justify-between">
            <label class="flex items-center text-white">
              <input
                v-model="loginForm.rememberMe"
                type="checkbox"
                class="rounded border-white/30 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2 text-sm">记住我</span>
            </label>
            <a href="#" class="text-sm text-white/80 hover:text-white">忘记密码？</a>
          </div>

          <!-- 登录按钮 -->
          <LButton
            type="primary"
            size="large"
            :loading="isLoading"
            :disabled="isLoading"
            class="w-full"
            @click="handleSubmit"
          >
            {{ isLoading ? '登录中...' : '登录' }}
          </LButton>
        </form>

        <!-- 2FA 验证 -->
        <div v-if="show2FA" class="mt-6 pt-6 border-t border-white/20">
          <h3 class="text-lg font-medium text-white mb-4">二次验证</h3>
          <LInput
            v-model="twoFactorCode"
            label="验证码"
            placeholder="请输入6位验证码"
            :error="errors.twoFactorCode"
            class="text-white mb-4"
          />
          <LButton
            type="primary"
            size="large"
            :loading="isVerifying"
            :disabled="isVerifying"
            class="w-full"
            @click="handleTwoFactorSubmit"
          >
            {{ isVerifying ? '验证中...' : '验证' }}
          </LButton>
        </div>
      </LCard>

      <!-- 版权信息 -->
      <div class="text-center text-white/60 text-sm">
        © 2025 玲珑OS团队. 保留所有权利.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { LCard, LInput, LButton, LIcon } from '@linglongos/ui'
import { useAuthStore } from '../stores/auth'

const emit = defineEmits<{
  login: []
}>()

const authStore = useAuthStore()

// 表单数据
const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false,
})

// 2FA相关
const show2FA = ref(false)
const twoFactorCode = ref('')

// 加载状态
const isLoading = ref(false)
const isVerifying = ref(false)

// 错误信息
const errors = reactive({
  username: '',
  password: '',
  twoFactorCode: '',
})

/**
 * 验证表单
 */
const validateForm = (): boolean => {
  // 清空之前的错误
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })

  let isValid = true

  if (!loginForm.username.trim()) {
    errors.username = '请输入用户名'
    isValid = false
  }

  if (!loginForm.password.trim()) {
    errors.password = '请输入密码'
    isValid = false
  }

  return isValid
}

/**
 * 处理登录提交
 */
const handleSubmit = async (): Promise<void> => {
  if (!validateForm()) {
    return
  }

  isLoading.value = true

  try {
    const result = await authStore.login({
      username: loginForm.username,
      password: loginForm.password,
      rememberMe: loginForm.rememberMe,
    })

    if (result.requires2FA) {
      show2FA.value = true
    } else {
      emit('login')
    }
  } catch (error) {
    console.error('登录失败:', error)
    errors.password = '用户名或密码错误'
  } finally {
    isLoading.value = false
  }
}

/**
 * 处理2FA验证
 */
const handleTwoFactorSubmit = async (): Promise<void> => {
  if (!twoFactorCode.value.trim()) {
    errors.twoFactorCode = '请输入验证码'
    return
  }

  isVerifying.value = true

  try {
    await authStore.verify2FA(twoFactorCode.value)
    emit('login')
  } catch (error) {
    console.error('2FA验证失败:', error)
    errors.twoFactorCode = '验证码错误'
  } finally {
    isVerifying.value = false
  }
}
</script>

<style scoped>
/* 自定义输入框样式 */
:deep(.l-input input) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

:deep(.l-input input::placeholder) {
  color: rgba(255, 255, 255, 0.6);
}

:deep(.l-input label) {
  color: white;
}
</style>