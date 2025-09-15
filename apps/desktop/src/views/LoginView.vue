<template>
  <div class="login-container">
    <!-- 动态粒子背景 -->
    <div class="particles-bg">
      <canvas ref="particlesCanvas" class="particles-canvas"></canvas>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="login-content">
      <div class="login-card">
        <!-- 头部 -->
        <div class="login-header">
          <div class="logo-container">
            <div class="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1 class="logo-text">玲珑OS</h1>
          </div>
          <p class="welcome-text">
            欢迎回来
          </p>
        </div>

        <!-- 登录表单 -->
        <form @submit.prevent="handleSubmit" class="login-form">
          <!-- 邮箱输入 -->
          <div class="input-group">
            <div class="input-wrapper">
              <UserIcon class="input-icon" />
              <input
                id="email"
                v-model="formData.email"
                type="email"
                required
                autocomplete="email"
                :disabled="isLoading"
                class="form-input"
                placeholder="邮箱地址"
                @focus="handleInputFocus"
                @blur="handleInputBlur"
              />
              <label for="email" class="input-label">邮箱地址</label>
            </div>
          </div>

          <!-- 密码输入 -->
          <div class="input-group">
            <div class="input-wrapper">
              <LockIcon class="input-icon" />
              <input
                id="password"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                :disabled="isLoading"
                class="form-input"
                placeholder="密码"
                @focus="handleInputFocus"
                @blur="handleInputBlur"
              />
              <label for="password" class="input-label">密码</label>
              <button
                type="button"
                @click="togglePasswordVisibility"
                class="password-toggle"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              >
                <EyeIcon v-if="!showPassword" class="w-5 h-5" />
                <EyeOffIcon v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- 记住我和忘记密码 -->
          <div class="form-options">
            <label class="remember-me">
              <input
                id="remember-me"
                v-model="formData.rememberMe"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-custom"></span>
              <span class="checkbox-label">记住我</span>
            </label>
            <button type="button" class="forgot-password">
              忘记密码？
            </button>
          </div>

          <!-- 错误提示 -->
          <Transition name="error" appear>
            <div v-if="loginError" class="error-message">
              <AlertCircleIcon class="error-icon" />
              <p class="error-text">{{ loginError }}</p>
            </div>
          </Transition>

          <!-- 登录按钮 -->
          <button
            type="submit"
            :disabled="isLoading || !isFormValid"
            class="login-button"
            :class="{ 'loading': isLoading }"
          >
            <span class="button-content">
              <LoaderIcon v-if="isLoading" class="loading-icon" />
              <span>{{ isLoading ? '登录中...' : '登录' }}</span>
            </span>
            <div class="button-glow"></div>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { ILoginRequest } from '@/types/auth'
import { EyeIcon, EyeOffIcon, AlertCircleIcon, LoaderIcon, InfoIcon, UserIcon, LockIcon } from 'lucide-vue-next'

/**
 * 粒子接口定义
 */
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string
}

/**
 * 登录页面组件
 * @description 用户登录界面，包含表单验证和错误处理
 */

// 路由和状态管理
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 响应式数据
const formData = ref<ILoginRequest>({
  email: '',
  password: '',
  rememberMe: false
})

const showPassword = ref(false)
const focusedField = ref('')

// 粒子系统相关
const particlesCanvas = ref<HTMLCanvasElement | null>(null)
const particles = ref<Particle[]>([])
let animationId: number | null = null
let ctx: CanvasRenderingContext2D | null = null

// 计算属性
const isLoading = computed(() => authStore.isLoading)
const loginError = computed(() => authStore.loginError)

const isFormValid = computed(() => {
  return formData.value.email.trim() !== '' && 
         formData.value.password.trim() !== '' &&
         formData.value.email.includes('@')
})

// 方法
/**
 * 切换密码可见性
 */
const togglePasswordVisibility = (): void => {
  showPassword.value = !showPassword.value
}

/**
 * 处理输入框焦点
 */
const handleInputFocus = (): void => {
  authStore.clearError()
}

/**
 * 处理输入框失焦
 */
const handleInputBlur = (): void => {
  // 可以在这里添加失焦时的逻辑
}

/**
 * 处理表单提交
 */
const handleSubmit = async (): Promise<void> => {
  if (!isFormValid.value) return

  // 清除之前的错误
  authStore.clearError()

  // 保存登录信息
  saveCredentials()

  // 执行登录
  const result = await authStore.login(formData.value)
  
  if (result.success) {
    // 登录成功，重定向到目标页面或桌面
    const redirectPath = (route.query.redirect as string) || '/desktop'
    router.push(redirectPath)
  }
  // 错误处理由 store 管理，组件只需要显示错误信息
}

/**
 * 自动填充登录信息
 */
const autoFillCredentials = (): void => {
  // 从localStorage获取记住的登录信息
  const savedEmail = localStorage.getItem('remembered_email')
  const savedRememberMe = localStorage.getItem('remember_me') === 'true'
  
  if (savedEmail && savedRememberMe) {
    formData.value.email = savedEmail
    formData.value.rememberMe = savedRememberMe
  }
}

/**
 * 保存登录信息
 */
const saveCredentials = (): void => {
  if (formData.value.rememberMe) {
    localStorage.setItem('remembered_email', formData.value.email)
    localStorage.setItem('remember_me', 'true')
  } else {
    localStorage.removeItem('remembered_email')
    localStorage.removeItem('remember_me')
  }
}

/**
 * 初始化粒子系统
 */
const initParticles = (): void => {
  if (!particlesCanvas.value) return
  
  const canvas = particlesCanvas.value
  ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 设置画布尺寸
  const resizeCanvas = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  
  // 创建粒子
  const particleCount = 80
  particles.value = []
  
  for (let i = 0; i < particleCount; i++) {
    particles.value.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      color: `hsl(${220 + Math.random() * 60}, 70%, 60%)`
    })
  }
  
  // 开始动画
  animate()
}

/**
 * 动画循环
 */
const animate = (): void => {
  if (!ctx || !particlesCanvas.value) return
  
  const canvas = particlesCanvas.value
  
  // 清除画布
  ctx.fillStyle = 'rgba(15, 15, 35, 0.1)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 更新和绘制粒子
  particles.value.forEach((particle, index) => {
    // 更新位置
    particle.x += particle.vx
    particle.y += particle.vy
    
    // 边界检测
    if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
    if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1
    
    // 绘制粒子
    ctx!.beginPath()
    ctx!.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    ctx!.fillStyle = particle.color.replace('60%)', `${particle.opacity * 60}%)`)
    ctx!.fill()
    
    // 绘制连线
    particles.value.slice(index + 1).forEach(otherParticle => {
      const dx = particle.x - otherParticle.x
      const dy = particle.y - otherParticle.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 120) {
        ctx!.beginPath()
        ctx!.moveTo(particle.x, particle.y)
        ctx!.lineTo(otherParticle.x, otherParticle.y)
        ctx!.strokeStyle = `rgba(99, 102, 241, ${(1 - distance / 120) * 0.3})`
        ctx!.lineWidth = 1
        ctx!.stroke()
      }
    })
  })
  
  animationId = requestAnimationFrame(animate)
}

/**
 * 停止粒子动画
 */
const stopParticles = (): void => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

/**
 * 组件挂载时的初始化
 */
onMounted(() => {
  // 如果已经登录，直接跳转到桌面
  if (authStore.isAuthenticated) {
    router.push('/desktop')
  }
  
  // 清除之前的登录错误
  authStore.clearError()
  
  // 自动填充登录信息
  autoFillCredentials()
  
  // 初始化粒子系统
  setTimeout(() => {
    initParticles()
  }, 100)
})

/**
 * 组件卸载时清理
 */
onUnmounted(() => {
  stopParticles()
  window.removeEventListener('resize', () => {})
})
</script>

<style scoped lang="scss">
// 粒子背景动画
@keyframes particleGlow {
  0%, 100% {
    filter: brightness(1) blur(0px);
  }
  50% {
    filter: brightness(1.2) blur(1px);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(99, 102, 241, 0.6);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// 错误提示动画
.error-enter-active,
.error-leave-active {
  transition: all 0.3s ease;
}

.error-enter-from,
.error-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// 主容器
.login-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
}

// 粒子背景
.particles-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 1;

  .particles-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    animation: particleGlow 4s ease-in-out infinite;
  }
}

// 主要内容区域
.login-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 420px;
  animation: float 6s ease-in-out infinite;
}

// 登录卡片
.login-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 
      0 35px 60px -12px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1);
  }
}

// 头部样式
.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

// Logo容器
.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;

  .logo-icon {
    width: 48px;
    height: 48px;
    margin-right: 12px;
    color: #6366f1;
    filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.5));
  }

  .logo-text {
    font-size: 1.75rem;
    font-weight: 700;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }
}

// 欢迎文本
.welcome-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.125rem;
  font-weight: 500;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

// 表单样式
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

// 输入组
.input-group {
  position: relative;

  .input-label {
    position: absolute;
    top: -8px;
    left: 16px;
    background: rgba(15, 15, 35, 0.9);
    padding: 0 8px;
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    z-index: 1;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;

    .input-icon {
      position: absolute;
      left: 16px;
      width: 20px;
      height: 20px;
      color: rgba(255, 255, 255, 0.5);
      z-index: 1;
      transition: color 0.3s ease;
    }

    .form-input {
      width: 100%;
      padding: 16px 16px 16px 48px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: #ffffff;
      font-size: 1rem;
      transition: all 0.3s ease;
      outline: none;

      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      &:focus {
        background: rgba(255, 255, 255, 0.08);
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);

        ~ .input-icon {
          color: #6366f1;
        }
      }

      &:hover {
        background: rgba(255, 255, 255, 0.07);
        border-color: rgba(255, 255, 255, 0.2);
      }
    }

    .password-toggle {
      position: absolute;
      right: 16px;
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.3s ease;
      z-index: 1;

      &:hover {
        color: #6366f1;
        background: rgba(99, 102, 241, 0.1);
      }

      svg {
        width: 20px;
        height: 20px;
      }
    }
  }
}

// 表单选项
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .remember-me {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;

    .checkbox-input {
      display: none;
    }

    .checkbox-custom {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      margin-right: 8px;
      position: relative;
      transition: all 0.3s ease;

      &::after {
        content: '';
        position: absolute;
        top: 1px;
        left: 5px;
        width: 6px;
        height: 10px;
        border: solid #ffffff;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
    }

    .checkbox-input:checked + .checkbox-custom {
      background: #6366f1;
      border-color: #6366f1;

      &::after {
        opacity: 1;
      }
    }

    .checkbox-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.875rem;
    }

    &:hover .checkbox-custom {
      border-color: #6366f1;
    }
  }

  .forgot-password {
    background: none;
    border: none;
    color: #6366f1;
    font-size: 0.875rem;
    cursor: pointer;
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: #8b5cf6;
      text-decoration: underline;
    }
  }
}

// 错误提示
.error-message {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  backdrop-filter: blur(10px);

  .error-icon {
    width: 20px;
    height: 20px;
    color: #ef4444;
    margin-right: 8px;
    flex-shrink: 0;
  }

  .error-text {
    color: #fca5a5;
    font-size: 0.875rem;
    margin: 0;
  }
}

// 登录按钮
.login-button {
  position: relative;
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  outline: none;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .button-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .loading-icon {
    width: 20px;
    height: 20px;
    animation: spin 1s linear infinite;
  }

  .button-glow {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover .button-glow {
    left: 100%;
  }

  &.loading {
    animation: glow 2s ease-in-out infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 640px) {
  .login-container {
    padding: 1rem 0.5rem;
  }

  .login-card {
    padding: 2rem 1.5rem;
    border-radius: 20px;
  }

  .logo-container {
    .logo-icon {
      width: 40px;
      height: 40px;
    }

    .logo-text {
      font-size: 1.5rem;
    }
  }

  .welcome-text {
    font-size: 1rem;
  }

  .form-options {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem 1rem;
  }

  .input-group .input-wrapper .form-input {
    padding: 14px 14px 14px 44px;
  }

  .login-button {
    padding: 14px;
  }
}
</style>