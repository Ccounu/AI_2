// api/match.js
// 简历与JD匹配相关接口 — 与成员B的后端路由完全对齐
// 后端路由前缀: /api/resume
// 接口列表:
//   POST /api/resume/analyze    JD匹配分析（调用LLM）
//   GET  /api/resume/:userId    获取用户简历（与 resume.js 共享路由，此处仅做匹配分析）

import api from './request'
import { getApi } from './config'
import { mockMatchResult, mockHistoryList } from '@/mock/match'

/** JD匹配分析 — 与后端 POST /resume/analyze 对齐 */
export const analyzeMatch = (userId, jdText) => {
  return getApi(
    () => ({ ...mockMatchResult }),
    () => api.post('/resume/analyze', { userId, jdText })
  )
}

/** 获取历史匹配记录（本地缓存，后端无独立接口） */
export const getMatchHistory = () => {
  return getApi(
    () => [...mockHistoryList],
    () => api.get('/resume/history')
  )
}
