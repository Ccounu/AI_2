<!-- pages/profile/index.vue -->
<!-- 个人中心 — 用户信息 + 求职偏好 + 简历管理 + 系统设置（成员C版本） -->
<template>
  <view class="page-profile">
    <!-- 用户信息头部 -->
    <view class="profile-header">
      <view class="header-avatar">
        <text class="header-avatar-text">{{ (userStore.user?.nickname || '未')[0] }}</text>
      </view>
      <view class="header-info">
        <text class="header-name">{{ userStore.user?.nickname || '未登录' }}</text>
        <text class="header-target">{{ userStore.user?.targetPosition || '设置目标岗位' }} · {{ userStore.user?.targetCity || '' }}</text>
      </view>
      <text class="header-edit" @tap="showEditProfile = true">编辑</text>
    </view>

    <!-- 数据概览 -->
    <view class="stats-bar">
      <view class="stat-item">
        <text class="stat-num">{{ statsStore.stats.total || 0 }}</text>
        <text class="stat-label">投递</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{ statsStore.stats.interviews || 0 }}</text>
        <text class="stat-label">面试</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{ statsStore.stats.offers || 0 }}</text>
        <text class="stat-label">Offer</text>
      </view>
    </view>

    <!-- 求职偏好 -->
    <view class="section-card">
      <view class="section-header" @tap="showPreference = !showPreference">
        <text class="section-title">🎯 求职偏好</text>
        <text :class="['section-arrow', showPreference ? 'up' : '']">›</text>
      </view>
      <view v-show="showPreference" class="preference-list">
        <view class="pref-item">
          <text class="pref-label">目标岗位</text>
          <text class="pref-value">{{ userStore.user?.targetPosition || '未设置' }}</text>
        </view>
        <view class="pref-item">
          <text class="pref-label">目标城市</text>
          <text class="pref-value">{{ userStore.user?.targetCity || '未设置' }}</text>
        </view>
        <view class="pref-item">
          <text class="pref-label">期望薪资</text>
          <text class="pref-value">{{ userStore.user?.expectedSalary || '未设置' }}</text>
        </view>
        <view class="pref-item">
          <text class="pref-label">技术栈</text>
          <text class="pref-value">{{ (userStore.user?.techStack || []).join('、') || '未设置' }}</text>
        </view>
        <button class="btn-edit-pref" @tap="editPreference">修改偏好</button>
      </view>
    </view>

    <!-- 简历管理 -->
    <view class="section-card">
      <view class="section-header">
        <text class="section-title">📋 简历管理</text>
        <text class="section-add" @tap="goResumeEdit">+ 编辑</text>
      </view>
      <view v-if="resumeData" class="resume-info-card">
        <view class="resume-row">
          <text class="resume-label">教育背景</text>
          <text class="resume-val">{{ educationText }}</text>
        </view>
        <view class="resume-row">
          <text class="resume-label">专业技能</text>
          <text class="resume-val">{{ (resumeData.skills || []).join('、') || '未填写' }}</text>
        </view>
        <view class="resume-row">
          <text class="resume-label">项目经历</text>
          <text class="resume-val">{{ (resumeData.projects || []).length }} 个项目</text>
        </view>
        <view class="resume-row" v-if="resumeData.lastMatchScore">
          <text class="resume-label">最近匹配分</text>
          <text class="resume-val" :style="{ color: getScoreColor(resumeData.lastMatchScore) }">{{ resumeData.lastMatchScore }}%</text>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无简历</text>
        <text class="empty-sub" @tap="goResumeEdit">点击编辑简历</text>
      </view>
    </view>

    <!-- 系统设置 -->
    <view class="section-card">
      <view class="section-header">
        <text class="section-title">⚙️ 系统设置</text>
      </view>
      <view class="setting-list">
        <view class="setting-item" @tap="toggleNotification">
          <text class="setting-label">消息通知</text>
          <switch :checked="notificationOn" @change="onNotificationChange" color="#409EFF" />
        </view>
        <view class="setting-item" @tap="goAbout">
          <text class="setting-label">关于我们</text>
          <text class="setting-arrow">›</text>
        </view>
        <view class="setting-item" @tap="clearCache">
          <text class="setting-label">清除缓存</text>
          <text class="setting-value">{{ cacheSize }}</text>
        </view>
        <view class="setting-item" @tap="handleLogout">
          <text class="setting-label danger">退出登录</text>
        </view>
      </view>
    </view>

    <!-- 安全区 -->
    <view class="safe-bottom"></view>

    <!-- 编辑个人信息弹窗 -->
    <view v-if="showEditProfile" class="modal-mask" @tap="showEditProfile = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">编辑个人信息</text>
          <text class="modal-close" @tap="showEditProfile = false">✕</text>
        </view>
        <ProfileForm
          :modelValue="editForm"
          @save="onProfileSave"
        />
      </view>
    </view>

    <!-- 编辑求职偏好弹窗 -->
    <view v-if="showPrefModal" class="modal-mask" @tap="showPrefModal = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">修改求职偏好</text>
          <text class="modal-close" @tap="showPrefModal = false">✕</text>
        </view>
        <view class="pref-form">
          <view class="pref-form-item">
            <text class="pref-form-label">目标岗位</text>
            <input class="pref-form-input" v-model="prefForm.targetPosition" placeholder="如：前端开发工程师" />
          </view>
          <view class="pref-form-item">
            <text class="pref-form-label">目标城市</text>
            <picker :range="cityOptions" @change="(e) => prefForm.targetCity = cityOptions[e.detail.value]">
              <view class="form-picker">
                <text :class="['picker-text', prefForm.targetCity ? '' : 'placeholder']">
                  {{ prefForm.targetCity || '请选择城市' }}
                </text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>
          </view>
          <view class="pref-form-item">
            <text class="pref-form-label">期望薪资</text>
            <picker :range="salaryOptions" @change="(e) => prefForm.expectedSalary = salaryOptions[e.detail.value]">
              <view class="form-picker">
                <text :class="['picker-text', prefForm.expectedSalary ? '' : 'placeholder']">
                  {{ prefForm.expectedSalary || '请选择薪资范围' }}
                </text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>
          </view>
          <view class="pref-form-item">
            <text class="pref-form-label">技术栈</text>
            <input class="pref-form-input" v-model="prefForm.techStackText" placeholder="如：Vue3, React（逗号分隔）" />
          </view>
          <button class="btn-save-pref" @tap="savePreference">保存偏好</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { useStatsStore } from '@/store/stats'
import ProfileForm from '@/components/profile-form/ProfileForm.vue'
import { getResume } from '@/api/resume'

const userStore = useUserStore()
const statsStore = useStatsStore()

const resumeData = ref(null)
const notificationOn = ref(true)
const cacheSize = ref('2.3MB')
const showEditProfile = ref(false)
const showPreference = ref(true)
const showPrefModal = ref(false)

const editForm = computed(() => ({
  avatar: userStore.user?.avatar || '',
  nickname: userStore.user?.nickname || '',
  targetPosition: userStore.user?.targetPosition || '',
  targetCity: userStore.user?.targetCity || '',
  expectedSalary: userStore.user?.expectedSalary || '',
  techStack: userStore.user?.techStack || []
}))

const prefForm = ref({
  targetPosition: '',
  targetCity: '',
  expectedSalary: '',
  techStackText: ''
})

const cityOptions = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '苏州', '其他']
const salaryOptions = ['10k以下', '10k-15k', '15k-25k', '25k-35k', '35k-50k', '50k以上']

const educationText = computed(() => {
  const edu = resumeData.value?.education || []
  if (!edu.length) return '未填写'
  return edu.map(e => `${e.school || ''} ${e.major || ''}`).join('；')
})

const getScoreColor = (score) => {
  if (score >= 80) return '#67C23A'
  if (score >= 60) return '#E6A23C'
  return '#F56C6C'
}

const editPreference = () => {
  prefForm.value = {
    targetPosition: userStore.user?.targetPosition || '',
    targetCity: userStore.user?.targetCity || '',
    expectedSalary: userStore.user?.expectedSalary || '',
    techStackText: (userStore.user?.techStack || []).join(', ')
  }
  showPrefModal.value = true
}

const savePreference = async () => {
  const userId = userStore.user?.id
  if (!userId) return
  const techStack = prefForm.value.techStackText.split(/[,，]/).map(s => s.trim()).filter(Boolean)
  try {
    await userStore.updatePreference({
      targetPosition: prefForm.value.targetPosition,
      targetCity: prefForm.value.targetCity,
      expectedSalary: prefForm.value.expectedSalary,
      techStack
    })
    showPrefModal.value = false
    uni.showToast({ title: '偏好已更新', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '更新失败', icon: 'none' })
  }
}

const goResumeEdit = () => {
  uni.navigateTo({ url: '/pages/resume/index' })
}

const onProfileSave = async (data) => {
  try {
    await userStore.updatePreference(data)
    showEditProfile.value = false
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

const toggleNotification = () => {
  notificationOn.value = !notificationOn.value
}

const onNotificationChange = (e) => {
  notificationOn.value = e.detail.value
}

const goAbout = () => {
  uni.showToast({ title: 'OfferGo 秋招求职助手 v1.0.0', icon: 'none' })
}

const clearCache = () => {
  uni.showModal({
    title: '清除缓存',
    content: '确定要清除所有缓存数据吗？',
    success: (res) => {
      if (res.confirm) {
        cacheSize.value = '0MB'
        uni.showToast({ title: '缓存已清除', icon: 'success' })
      }
    }
  })
}

const handleLogout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.reLaunch({ url: '/pages/login/index' })
      }
    }
  })
}

/** 加载简历数据 */
async function loadResumeData() {
  const userId = userStore.user?.id
  if (!userId) return
  try {
    const [resume] = await Promise.all([
      getResume(userId),
      statsStore.fetchStats(userId)
    ])
    if (resume) {
      resumeData.value = resume
    }
  } catch (e) {
    console.warn('个人中心数据加载失败', e)
  }
}

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    await userStore.autoLogin()
  }
  await loadResumeData()
})

// 每次回到此 Tab 页面时刷新简历数据
onShow(async () => {
  await loadResumeData()
})
</script>

<style lang="scss" scoped>
.page-profile {
  min-height: 100vh;
  background: #F5F7FA;
  padding-top: var(--status-bar-height);
}

.profile-header {
  display: flex;
  align-items: center;
  padding: 48rpx 32rpx 32rpx;
  background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
  color: #FFFFFF;
}

.header-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-avatar-text {
  font-size: 52rpx;
  font-weight: 700;
  color: #FFFFFF;
}

.header-info {
  flex: 1;
  margin-left: 24rpx;
}

.header-name {
  font-size: 36rpx;
  font-weight: 700;
  display: block;
}

.header-target {
  font-size: 24rpx;
  opacity: 0.85;
  margin-top: 8rpx;
  display: block;
}

.header-edit {
  font-size: 26rpx;
  padding: 12rpx 28rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.6);
  border-radius: 999rpx;
}

.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #FFFFFF;
  margin: -24rpx 32rpx 0;
  border-radius: 20rpx;
  padding: 32rpx 0;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-num {
  font-size: 40rpx;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 24rpx;
  color: #909399;
}

.stat-divider {
  width: 1rpx;
  height: 48rpx;
  background: #E4E7ED;
}

.section-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  margin: 24rpx 32rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
}

.section-arrow {
  font-size: 32rpx;
  color: #C0C4CC;
  transition: transform 0.2s;
  &.up { transform: rotate(90deg); }
}

.section-add {
  font-size: 26rpx;
  color: #409EFF;
}

.preference-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.pref-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
}

.pref-label {
  font-size: 28rpx;
  color: #909399;
}

.pref-value {
  font-size: 28rpx;
  color: #303133;
  max-width: 400rpx;
  text-align: right;
}

.btn-edit-pref {
  margin-top: 16rpx;
  background: transparent;
  color: #409EFF;
  border: 2rpx solid #409EFF;
  border-radius: 999rpx;
  font-size: 28rpx;
  height: 72rpx;
  line-height: 72rpx;
  &::after { border: none; }
}

.resume-info-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.resume-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
}

.resume-label {
  font-size: 28rpx;
  color: #909399;
  flex-shrink: 0;
}

.resume-val {
  font-size: 28rpx;
  color: #303133;
  max-width: 400rpx;
  text-align: right;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 8rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #909399;
  margin-top: 16rpx;
}

.empty-sub {
  font-size: 24rpx;
  color: #409EFF;
  margin-top: 8rpx;
}

.setting-list {
  display: flex;
  flex-direction: column;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #F2F6FC;
  &:last-child { border-bottom: none; }
}

.setting-label {
  font-size: 28rpx;
  color: #303133;
  &.danger { color: #F56C6C; }
}

.setting-arrow {
  font-size: 32rpx;
  color: #C0C4CC;
}

.setting-value {
  font-size: 26rpx;
  color: #909399;
}

.safe-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.modal-content {
  width: 100%;
  max-height: 85vh;
  background: #F5F7FA;
  border-radius: 32rpx 32rpx 0 0;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  background: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.modal-close {
  font-size: 36rpx;
  color: #909399;
  padding: 8rpx;
}

.pref-form {
  padding: 32rpx;
}

.pref-form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88rpx;
  border-bottom: 1rpx solid #F2F6FC;
}

.pref-form-label {
  font-size: 28rpx;
  color: #303133;
  font-weight: 500;
  width: 160rpx;
  flex-shrink: 0;
}

.pref-form-input {
  flex: 1;
  text-align: right;
  font-size: 28rpx;
  color: #303133;
}

.form-picker {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.picker-text {
  font-size: 28rpx;
  color: #303133;
  &.placeholder { color: #C0C4CC; }
}

.picker-arrow {
  font-size: 32rpx;
  color: #C0C4CC;
}

.btn-save-pref {
  margin-top: 48rpx;
  background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
  color: #FFFFFF;
  border-radius: 999rpx;
  font-size: 30rpx;
  font-weight: 600;
  height: 88rpx;
  line-height: 88rpx;
  border: none;
  &::after { border: none; }
  &:active { opacity: 0.85; }
}
</style>
