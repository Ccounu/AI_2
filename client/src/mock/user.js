/**
 * mock/user.js — 用户相关模拟数据
 * 对齐后端 User 模型字段：nickname, targetPosition, targetCity, expectedSalary, techStack
 * 对齐后端 GET /user/:id/radar 返回格式
 */

/** 模拟用户信息 — 与后端 User 实体对齐 */
export const mockUser = {
  id: 1,
  openid: 'mock_openid_001',
  nickname: '张同学',
  avatar: '/static/images/avatar-default.png',
  targetPosition: '前端开发工程师',
  targetCity: '杭州',
  expectedSalary: '15k-25k',
  techStack: ['Vue3', 'React', 'TypeScript', 'Node.js'],
  phone: '13800138000',
  email: 'zhang@example.com',
  createdAt: '2026-03-15T10:00:00Z'
}

/** 模拟雷达图数据 — 与后端 GET /user/:id/radar 返回格式对齐 */
export const mockRadarData = {
  hasData: true,
  labels: ['技术深度', '沟通表达', '项目经验', '逻辑思维', '行业认知'],
  values: [85, 72, 90, 78, 65]
}

/** 模拟用户偏好 — 与后端 PUT /user/:id/preference 对齐 */
export const mockPreference = {
  targetPosition: '前端开发工程师',
  targetCity: '杭州',
  expectedSalary: '15k-25k',
  techStack: ['Vue3', 'React', 'TypeScript', 'Node.js']
}

/** 模拟统计数据 — 与后端 GET /user/:id/stats 对齐 */
export const mockStats = {
  total: 12,
  interviews: 5,
  offers: 2
}
