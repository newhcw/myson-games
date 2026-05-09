import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/game',
    name: 'Game',
    component: () => import('@/views/FPSGame.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
  },
  {
    path: '/goodbye',
    name: 'Goodbye',
    component: () => import('@/views/Goodbye.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router