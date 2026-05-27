<template>
  <view></view>
</template>

<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

onLaunch(async () => {
  console.log('[OfferGo] App 启动')

  // 初始化微信云开发
  if (wx.cloud) {
    wx.cloud.init({
      env: 'prod-d5gmjv8we42a1d0b5'
    })
    console.log('[OfferGo] 云开发初始化完成')
  }

  const userStore = useUserStore()

  // 尝试自动登录（从缓存恢复）
  await userStore.autoLogin()

  // 如果未登录，跳转到登录页
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' })
  }
})
</script>

<style lang="scss">
page {
  background-color: #f5f6fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #333;
  font-size: 14px;
  line-height: 1.5;
}
</style>
