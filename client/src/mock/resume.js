/**
 * mock/resume.js — 简历相关模拟数据
 * 对齐后端 GET /resume/:userId 返回格式
 */

/** 模拟简历数据 — 与后端 Resume 实体对齐 */
export const mockResume = {
  id: 1,
  userId: 1,
  fullText: '张同学 | 前端开发工程师\n\n教育背景：XX大学 计算机科学与技术 本科\n\n专业技能：Vue3, React, TypeScript, Node.js, Webpack\n\n项目经历：\n1. 电商平台前端重构 — 使用Vue3+Pinia重构，首屏加载优化40%\n2. 数据可视化大屏 — 基于ECharts实现实时数据展示\n3. 小程序开发 — uniapp+Vue3实现求职助手小程序',
  education: [
    { school: 'XX大学', major: '计算机科学与技术', degree: '本科' }
  ],
  skills: ['Vue3', 'React', 'TypeScript', 'Node.js', 'Webpack'],
  projects: [
    { name: '电商平台前端重构', role: '前端负责人', description: '使用Vue3+Pinia重构，首屏加载优化40%' },
    { name: '数据可视化大屏', role: '前端开发', description: '基于ECharts实现实时数据展示' },
    { name: '求职助手小程序', role: '前端开发', description: 'uniapp+Vue3实现求职助手小程序' }
  ],
  lastMatchScore: 72,
  createdAt: '2026-04-01T10:00:00Z',
  updatedAt: '2026-05-20T14:30:00Z'
}
