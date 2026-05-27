// api/user.js
// 用户相关接口 — 与成员B的后端路由完全对齐
// 后端路由前缀: /api/user
// 接口列表:
//   POST /api/user/login          微信登录/注册
//   GET  /api/user/:id            获取用户信息
//   PUT  /api/user/:id/preference 更新求职意向
//   GET  /api/user/:id/radar      获取能力雷达图数据

import api from './request'
import { getApi } from './config'
import { mockUser, mockRadarData, mockPreference } from '@/mock/user'

/** 微信登录/注册 */
export const login = (code, nickname = '') => {
  return getApi(
    () => ({ token: 'mock_token_001', user: { ...mockUser } }),
    () => api.post('/user/login', { code, nickname })
  )
}

/** 获取用户信息 */
export const getUserInfo = (userId) => {
  return getApi(
    () => ({ ...mockUser }),
    () => api.get(`/user/${userId}`)
  )
}

/** 更新求职意向 — 与后端 PUT /user/:id/preference 对齐 */
export const updatePreference = (userId, data) => {
  return getApi(
    () => ({ ...mockUser, ...data }),
    () => api.put(`/user/${userId}/preference`, data)
  )
}

/** 获取能力雷达图数据 — 与后端 GET /user/:id/radar 对齐 */
export const getAbilityRadar = (userId) => {
  return getApi(
    () => ({ ...mockRadarData }),
    () => api.get(`/user/${userId}/radar`)
  )
}
