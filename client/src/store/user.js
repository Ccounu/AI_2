/**
 * store/user.js — 用户状态管理（Pinia，合并版）
 * - 支持用户名密码登录 + 微信 openid 登录
 * - userId 持久化到本地缓存，实现数据隔离
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/request'
import { mockUser, mockRadarData } from '@/mock/user'
import { USE_MOCK } from '@/api/config'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const radarData = ref({ hasData: false, labels: [], values: [] })

  const isLoggedIn = computed(() => !!user.value?.id)

  // ─── 用户名密码登录 ────────────────────────
  async function loginByPassword(username, password) {
    const data = await api.post('/user/login', { username, password })
    if (data) {
      user.value = data
      uni.setStorageSync('userInfo', data)
      uni.setStorageSync('userId', data.id)
    }
    return user.value
  }

  // ─── 注册 ──────────────────────────────────
  async function register(username, password, nickname) {
    const data = await api.post('/user/register', { username, password, nickname })
    if (data) {
      user.value = data
      uni.setStorageSync('userInfo', data)
      uni.setStorageSync('userId', data.id)
    }
    return user.value
  }

  // ─── 微信登录 ──────────────────────────────
  async function login(openid, nickname = '') {
    try {
      const data = await api.post('/user/login', { openid, nickname })
      if (data) {
        user.value = data
        uni.setStorageSync('userInfo', data)
        uni.setStorageSync('userId', data.id)
      }
    } catch {
      user.value = { id: 1, openid, nickname: nickname || '求职者', targetPosition: '' }
    }
    return user.value
  }

  // ─── 自动登录 ──────────────────────────────
  async function autoLogin() {
    if (USE_MOCK) {
      user.value = { ...mockUser }
      return user.value
    }
    // 优先从缓存恢复
    const saved = uni.getStorageSync('userInfo')
    if (saved) {
      user.value = saved
      return user.value
    }
    // 无缓存则用种子账号自动登录
    try {
      await loginByPassword('test', '123456')
    } catch {
      // 种子用户可能还没创建 → 静默
    }
    return user.value
  }

  // ─── 获取用户信息（从服务器刷新） ──────────
  async function fetchUser(userId) {
    try {
      if (USE_MOCK) {
        user.value = { ...mockUser }
        return user.value
      }
      const res = await api.get(`/user/${userId}`)
      if (res) {
        user.value = res
        uni.setStorageSync('userInfo', res)
      }
      return res
    } catch (e) {
      console.warn('获取用户信息失败', e)
      return null
    }
  }

  // ─── 更新求职偏好 ──────────────────────────
  async function updatePreference(pref) {
    if (!user.value?.id) return
    try {
      if (USE_MOCK) {
        user.value = { ...user.value, ...pref }
        return user.value
      }
      // 使用新的别名接口
      const data = await api.post('/user/profile/update', {
        userId: user.value.id,
        ...pref
      })
      if (data) {
        user.value = data
        uni.setStorageSync('userInfo', data)
      }
    } catch {
      Object.assign(user.value, pref)
    }
  }

  // ─── 获取雷达图 ────────────────────────────
  async function fetchRadar(userId) {
    try {
      if (USE_MOCK) {
        radarData.value = { ...mockRadarData }
        return radarData.value
      }
      const res = await api.get(`/user/${userId}/radar`)
      if (res) radarData.value = res
      return res
    } catch (e) {
      console.warn('获取雷达数据失败', e)
      return null
    }
  }

  // ─── 退出登录 ──────────────────────────────
  function logout() {
    user.value = null
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('userId')
  }

  return {
    user, radarData, isLoggedIn,
    login, loginByPassword, register,
    autoLogin, fetchUser, updatePreference, fetchRadar,
    logout
  }
})
