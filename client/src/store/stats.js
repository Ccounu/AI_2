/**
 * store/stats.js — 统计数据状态管理（Pinia，合并版）
 * - 主项目的丰富字段：total, submitted, interviews, offers, rejected
 * - 成员C的 mock 支持和接口适配
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/request'
import { mockStats } from '@/mock/user'
import { USE_MOCK } from '@/api/config'

export const useStatsStore = defineStore('stats', () => {
  // ---- State ----
  const stats = ref({ total: 0, submitted: 0, interviews: 0, offers: 0, rejected: 0 })

  // ---- Actions ----

  /** 获取投递统计数据 */
  async function fetchStats(userId) {
    try {
      if (USE_MOCK) {
        stats.value = { total: 12, submitted: 8, interviews: 5, offers: 2, rejected: 3 }
        return stats.value
      }
      const data = await api.get(`/application/stats/${userId}`)
      if (data) stats.value = data
    } catch {
      // 无数据时保持默认值
    }
    return stats.value
  }

  return { stats, fetchStats }
})
