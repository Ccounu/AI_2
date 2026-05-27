/**
 * mock/match.js — 匹配相关模拟数据
 * 对齐后端 POST /resume/analyze 返回格式
 * suggestions 为对象格式：{ keywordAdvice, starAdvice }
 */

/** 模拟匹配分析结果 — 与后端 POST /resume/analyze 返回格式对齐 */
export const mockMatchResult = {
  matchScore: 72,
  matchedKeywords: ['Vue3', 'React', 'TypeScript', '前端工程化', '组件开发'],
  missingKeywords: ['微前端', 'SSR', '性能优化', 'CI/CD'],
  suggestions: {
    keywordAdvice: '建议补充微前端和SSR相关项目经验，这些是当前JD中的高频要求',
    starAdvice: '在项目描述中使用STAR法则（情境-任务-行动-结果），突出量化成果，如"优化首屏加载时间从3s降至1.2s"'
  }
}

/** 模拟历史匹配记录 */
export const mockHistoryList = [
  {
    id: 1,
    position: '前端开发工程师',
    jdText: '负责公司核心产品的前端开发，要求熟练掌握Vue3/React...',
    matchScore: 72,
    createdAt: '2026-05-20T14:30:00Z'
  },
  {
    id: 2,
    position: '全栈开发工程师',
    jdText: '参与全栈开发，前后端均需涉及，Node.js + React技术栈...',
    matchScore: 58,
    createdAt: '2026-05-18T09:15:00Z'
  },
  {
    id: 3,
    position: '前端架构师',
    jdText: '负责前端架构设计，微前端方案落地，性能优化体系建设...',
    matchScore: 45,
    createdAt: '2026-05-15T16:45:00Z'
  }
]
