/**
 * api/request.js — 微信云托管原生请求
 * callContainer 直连容器，无需域名白名单
 */
const CLOUD_ENV = 'prod-d5gmjv8we42a1d0b5'
const SERVICE_NAME = 'offergo'

function request(method, path, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callContainer({
      config: { env: CLOUD_ENV },
      path: '/api' + path,
      method,
      header: {
        'X-WX-SERVICE': SERVICE_NAME,
        'content-type': 'application/json'
      },
      data: method === 'GET' ? undefined : data,
      success(res) {
        if (res.statusCode === 200 && res.data?.code === 0) {
          resolve(res.data.data)
        } else if (res.statusCode === 200 && res.data?.code === undefined) {
          resolve(res.data)
        } else {
          reject(new Error(res.data?.error || `请求失败(${res.statusCode})`))
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络异常'))
      }
    })
  })
}

export default {
  get: (url) => request('GET', url),
  post: (url, data) => request('POST', url, data),
  put: (url, data) => request('PUT', url, data),
  del: (url) => request('DELETE', url)
}
