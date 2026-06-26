<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tabs = [
  { path: '/home', icon: '📸', label: '识别' },
  { path: '/diet', icon: '📋', label: '饮食' },
  { path: '/weight', icon: '📈', label: '体重' },
  { path: '/favorites', icon: '⭐', label: '收藏' },
  { path: '/goals', icon: '🎯', label: '目标' }
]

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <div class="app-container">
    <!-- 主内容区 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 底部导航 -->
    <nav class="bottom-nav">
      <button
        v-for="tab in tabs"
        :key="tab.path"
        class="nav-item"
        :class="{ active: isActive(tab.path) }"
        @click="router.push(tab.path)"
      >
        <span class="nav-icon">{{ tab.icon }}</span>
        <span class="nav-label">{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 70px; /* 给底部导航留空间 */
}

.main-content {
  flex: 1;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 800px;
  background: #fff;
  display: flex;
  border-top: 1px solid var(--color-border);
  z-index: 100;
  padding: 6px 0 env(safe-area-inset-bottom, 6px);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color 0.2s;
  font-family: inherit;
}

.nav-item.active {
  color: var(--color-primary);
}

.nav-icon {
  font-size: 20px;
  line-height: 1;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
}

@media (min-width: 768px) {
  .bottom-nav {
    padding: 8px 0;
  }
  .nav-icon {
    font-size: 22px;
  }
  .nav-label {
    font-size: 12px;
  }
}
</style>
