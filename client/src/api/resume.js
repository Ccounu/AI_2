// api/resume.js
// 简历管理相关接口 — 与成员B的后端路由完全对齐
// 后端路由前缀: /api/resume
// 接口列表:
//   POST /api/resume/save       保存/更新简历
//   GET  /api/resume/:userId    获取用户简历

import api from './request'
import { getApi } from './config'
import { mockResume } from '@/mock/resume'

/** 获取用户简历 — 与后端 GET /resume/:userId 对齐 */
export const getResume = (userId) => {
  return getApi(
    () => ({ ...mockResume }),
    () => api.get(`/resume/${userId}`)
  )
}

/** 保存/更新简历 — 与后端 POST /resume/save 对齐 */
export const saveResume = (data) => {
  return getApi(
    () => ({ ...mockResume, ...data }),
    () => api.post('/resume/save', data)
  )
}
