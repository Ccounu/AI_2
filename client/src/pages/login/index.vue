<!-- pages/login/index.vue -->
<!-- 登录 / 注册页 — v-if/v-else 隔离两个视图 -->
<template>
  <view class="login-container">
    <view class="logo-area">
      <text class="logo-icon">🎯</text>
      <text class="logo-title">OfferGo</text>
      <text class="logo-sub">智能求职助手</text>
    </view>

    <view class="form-card">
      <!-- 用户名（登录 & 注册共用） -->
      <view class="input-item">
        <text class="input-label">用户名</text>
        <input class="input-field" v-model="formData.username" placeholder="请输入用户名" />
      </view>

      <!-- 密码（登录 & 注册共用） -->
      <view class="input-item">
        <text class="input-label">密码</text>
        <input class="input-field" password v-model="formData.password" placeholder="请输入密码" />
      </view>

      <!-- ========== 注册模式 ========== -->
      <view v-if="isRegister" class="mode-section">
        <!-- 昵称 — 紧跟在密码下方 -->
        <view class="input-item">
          <text class="input-label">昵称</text>
          <input class="input-field" v-model="formData.nickname" placeholder="给自己起个名字" />
        </view>

        <button class="btn-submit btn-register" :loading="loading" @tap="handleRegister">注 册</button>

        <view class="switch-row" @tap="isRegister = false">
          <text class="switch-text">已有账号？去登录</text>
        </view>
      </view>

      <!-- ========== 登录模式 ========== -->
      <view v-else class="mode-section">
        <button class="btn-submit btn-login" :loading="loading" @tap="handleLogin">登 录</button>

        <view class="switch-row" @tap="isRegister = true">
          <text class="switch-text">没有账号？去注册</text>
        </view>
      </view>
    </view>

    <view class="test-account">
      <text>测试账号：test / 123456</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const isRegister = ref(false)
const loading = ref(false)

const formData = reactive({
  username: '',
  password: '',
  nickname: ''
})

async function handleLogin() {
  if (!formData.username.trim() || !formData.password.trim()) {
    return uni.showToast({ title: '请填写用户名和密码', icon: 'none' })
  }
  loading.value = true
  try {
    await userStore.loginByPassword(formData.username.trim(), formData.password)
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 500)
  } catch (e) {
    uni.showToast({ title: '用户名或密码错误', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  if (!formData.username.trim() || !formData.password.trim()) {
    return uni.showToast({ title: '请填写用户名和密码', icon: 'none' })
  }
  loading.value = true
  try {
    await userStore.register(
      formData.username.trim(),
      formData.password,
      formData.nickname.trim() || formData.username.trim()
    )
    uni.showToast({ title: '注册成功', icon: 'success' })
    setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 500)
  } catch (e) {
    uni.showToast({ title: '注册失败，用户名可能已存在', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  padding-top: var(--status-bar-height);
  box-sizing: border-box;
}

.logo-area {
  text-align: center;
  margin-bottom: 48rpx;
}

.logo-icon {
  font-size: 80rpx;
  display: block;
}

.logo-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #FFFFFF;
  display: block;
  margin-top: 12rpx;
}

.logo-sub {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.75);
  display: block;
  margin-top: 8rpx;
}

.form-card {
  width: 100%;
  max-width: 600rpx;
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 48rpx 40rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.12);
}

.input-item {
  margin-bottom: 28rpx;
}

.input-label {
  font-size: 26rpx;
  color: #909399;
  display: block;
  margin-bottom: 10rpx;
}

.input-field {
  width: 100%;
  height: 88rpx;
  border: 2rpx solid #E4E7ED;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  box-sizing: border-box;
  background: #F5F7FA;
}

.mode-section {
  margin-top: 8rpx;
}

.btn-submit {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  border: none;
  border-radius: 999rpx;
  font-size: 32rpx;
  font-weight: 600;
  margin-top: 16rpx;

  &::after { border: none; }
  &:active { opacity: 0.85; }
}

.btn-login {
  background: linear-gradient(135deg, #409EFF, #66B1FF);
  color: #FFFFFF;
}

.btn-register {
  background: linear-gradient(135deg, #67C23A, #85CE61);
  color: #FFFFFF;
}

.switch-row {
  text-align: center;
  margin-top: 28rpx;
  padding: 12rpx 0;
}

.switch-text {
  font-size: 26rpx;
  color: #409EFF;
}

.test-account {
  margin-top: 40rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}
</style>
