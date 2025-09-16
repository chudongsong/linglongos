<template>
  <div class="placeholder-app">
    <div class="app-icon">
      <svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
      </svg>
    </div>
    <h3 class="app-title">文本编辑器</h3>
    <p class="app-description">功能开发中...</p>
  </div>
</template>

<script setup lang="ts">
// 占位应用组件
</script>

<style scoped>
.placeholder-app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 40px;
}

.app-title {
  font-size: 24px;
  font-weight: 600;
  margin: 16px 0 8px;
  color: #374151;
}

.app-description {
  color: #6b7280;
  font-size: 16px;
}
</style>