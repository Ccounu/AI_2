// api/config.js
// Mock/真实接口切换配置 — 联调时将 USE_MOCK 改为 false 即可

const USE_MOCK = false  // 后端已启动，使用真实接口

/**
 * 根据当前模式返回 mock 或真实接口函数
 * @param {Function} mockFn - mock 数据函数
 * @param {Function} realFn - 真实接口函数
 * @returns {*} 当前模式对应的函数执行结果
 */
export const getApi = (mockFn, realFn) => {
  return USE_MOCK ? mockFn() : realFn()
}

export { USE_MOCK }
