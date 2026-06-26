import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    {
      path: '/home',
      name: 'Home',
      component: () => import('../views/Home.vue'),
      meta: { title: '食物识别', icon: '📸' }
    },
    {
      path: '/diet',
      name: 'DietRecords',
      component: () => import('../views/DietRecords.vue'),
      meta: { title: '饮食记录', icon: '📋' }
    },
    {
      path: '/weight',
      name: 'WeightTrack',
      component: () => import('../views/WeightTrack.vue'),
      meta: { title: '体重追踪', icon: '📈' }
    },
    {
      path: '/favorites',
      name: 'Favorites',
      component: () => import('../views/Favorites.vue'),
      meta: { title: '收藏食物', icon: '⭐' }
    },
    {
      path: '/goals',
      name: 'Goals',
      component: () => import('../views/Goals.vue'),
      meta: { title: '目标设置', icon: '🎯' }
    }
  ]
})

export default router
