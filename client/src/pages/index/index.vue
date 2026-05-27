<!-- pages/index/index.vue -->
<!-- 首页工作台 — 雷达图 + 倒计时 + 快捷入口 + 待办/动态（成员C版本） -->
<template>
  <view class="page-index">
    <!-- 顶部问候 -->
    <view class="greeting">
      <view class="greeting-text">
        <text class="greeting-hi">Hi，{{ userStore.user?.nickname || '同学' }} 👋</text>
        <text class="greeting-sub">{{ greetingSub }}</text>
      </view>
      <view class="greeting-avatar" @tap="goProfile">
        <text class="avatar-text">{{ (userStore.user?.nickname || '同')[0] }}</text>
      </view>
    </view>

    <!-- 秋招倒计时 -->
    <Countdown targetDate="2026-09-01" />

    <!-- 快捷入口 -->
    <QuickEntry />

    <!-- 能力雷达图 -->
    <view class="section-card">
      <view class="section-header">
        <text class="section-title">📊 能力画像</text>
        <text class="section-more" @tap="goProfile">查看详情 ›</text>
      </view>
      <RadarChart v-if="radarData.hasData" :values="radarData.values" :labels="radarData.labels" />
      <view v-else class="empty-radar">
        <text class="empty-radar-text">完成面试后即可生成能力画像</text>
      </view>
    </view>

    <!-- 今日待办 -->
    <view class="section-card">
      <view class="section-header">
        <text class="section-title">📝 今日待办</text>
        <text class="section-count">{{ todoDone }}/{{ todoList.length }}</text>
      </view>
      <view class="todo-list" v-if="todoList.length">
        <view
          v-for="item in todoList"
          :key="item.id"
          class="todo-item"
          @tap="toggleTodo(item)"
        >
          <view :class="['todo-check', item.done ? 'checked' : '']">
            <text v-if="item.done" class="check-icon">✓</text>
          </view>
          <text :class="['todo-text', item.done ? 'done' : '']">{{ item.content }}</text>
        </view>
      </view>
      <view class="empty-tip" v-else>
        <text>暂无待办，享受轻松时刻 ✨</text>
      </view>
    </view>

    <!-- 投递动态 -->
    <view class="section-card">
      <view class="section-header">
        <text class="section-title">📬 投递动态</text>
        <text class="section-more" @tap="goKanban">全部 ›</text>
      </view>
      <view class="dynamic-list" v-if="deliveryList.length">
        <view
          v-for="item in deliveryList"
          :key="item.id"
          class="dynamic-item"
        >
          <view class="dynamic-info">
            <text class="dynamic-company">{{ item.companyName }}</text>
            <text class="dynamic-status" :style="{ color: getStatusColor(item.stage) }">{{ stageLabel(item.stage) }}</text>
          </view>
          <text class="dynamic-time">{{ formatTime(item.appliedAt) }}</text>
        </view>
      </view>
      <view class="empty-tip" v-else>
        <text>暂无投递动态</text>
      </view>
    </view>

    <!-- 底部安全区 -->
    <view class="safe-bottom"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useStatsStore } from '@/store/stats'
import RadarChart from '@/components/radar-chart/RadarChart.vue'
import Countdown from '@/components/countdown/Countdown.vue'
import QuickEntry from '@/components/quick-entry/QuickEntry.vue'
import { getAbilityRadar } from '@/api/user'
import api from '@/api/request'

const userStore = useUserStore()
const statsStore = useStatsStore()

const radarData = ref({ hasData: false, labels: [], values: [] })
const todoList = ref([
  { id: 1, content: '完善简历信息', done: false },
  { id: 2, content: '刷3道八股文', done: false },
  { id: 3, content: '投递2个岗位', done: false }
])
const deliveryList = ref([])

const todoDone = computed(() => todoList.value.filter(t => t.done).length)

const greetingSub = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，注意休息'
  if (h < 12) return '早安，新的一天加油'
  if (h < 14) return '午安，适当休息一下'
  if (h < 18) return '下午好，继续冲刺'
  return '晚上好，今天收获如何？'
})

const stageLabel = (stage) => {
  const map = {
    submitted: '已投递',
    written_test: '笔试邀请',
    interview_1: '一面',
    interview_2: '二面',
    hr_interview: 'HR面',
    offer_pool: 'Offer池',
    rejected: '已拒绝'
  }
  return map[stage] || stage
}

const getStatusColor = (stage) => {
  const map = {
    submitted: '#409EFF',
    written_test: '#E6A23C',
    interview_1: '#67C23A',
    interview_2: '#67C23A',
    hr_interview: '#67C23A',
    offer_pool: '#409EFF',
    rejected: '#F56C6C'
  }
  return map[stage] || '#909399'
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const toggleTodo = (item) => {
  item.done = !item.done
}

const goProfile = () => uni.switchTab({ url: '/pages/profile/index' })
const goKanban = () => uni.switchTab({ url: '/pages/kanban/index' })

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    await userStore.autoLogin()
  }

  const userId = userStore.user?.id
  if (!userId) return

  try {
    const [radarRes] = await Promise.all([
      getAbilityRadar(userId),
      statsStore.fetchStats(userId)
    ])
    if (radarRes && radarRes.hasData) {
      radarData.value = radarRes
    }
  } catch (e) {
    console.warn('首页数据加载失败，使用默认值', e)
  }

  // 加载投递动态 — 从看板数据中取最近记录
  try {
    const kanban = await api.get(`/application/kanban/${userId}`)
    if (kanban && typeof kanban === 'object') {
      // 将所有阶段的记录合并，按时间倒序，取前5条
      const all = Object.values(kanban).flat()
      all.sort((a, b) => new Date(b.appliedAt || b.createdAt || 0) - new Date(a.appliedAt || a.createdAt || 0))
      deliveryList.value = all.slice(0, 5)
    }
  } catch (e) {
    console.debug('投递动态加载失败（后端未启动？）')
  }
})
</script>

<style lang="scss" scoped>
.page-index {
  min-height: 100vh;
  background: #F5F7FA;
  padding-top: var(--status-bar-height);
  padding-bottom: 32rpx;
}

.greeting {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 48rpx 32rpx 16rpx;
}

.greeting-hi {
  font-size: 40rpx;
  font-weight: 700;
  color: #303133;
  display: block;
}

.greeting-sub {
  font-size: 26rpx;
  color: #909399;
  margin-top: 8rpx;
  display: block;
}

.greeting-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #409EFF, #66B1FF);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  font-size: 36rpx;
  font-weight: 700;
  color: #FFFFFF;
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
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
}

.section-more {
  font-size: 24rpx;
  color: #409EFF;
}

.section-count {
  font-size: 24rpx;
  color: #909399;
}

.empty-radar {
  text-align: center;
  padding: 48rpx 0;
}

.empty-radar-text {
  font-size: 26rpx;
  color: #C0C4CC;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.todo-check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #DCDFE6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;

  &.checked {
    background: #409EFF;
    border-color: #409EFF;
  }
}

.check-icon {
  color: #FFFFFF;
  font-size: 24rpx;
  font-weight: 700;
}

.todo-text {
  font-size: 28rpx;
  color: #303133;

  &.done {
    color: #C0C4CC;
    text-decoration: line-through;
  }
}

.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.dynamic-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dynamic-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.dynamic-company {
  font-size: 28rpx;
  color: #303133;
  font-weight: 500;
}

.dynamic-status {
  font-size: 24rpx;
  font-weight: 500;
}

.dynamic-time {
  font-size: 24rpx;
  color: #C0C4CC;
}

.empty-tip {
  text-align: center;
  padding: 32rpx 0;
  font-size: 26rpx;
  color: #C0C4CC;
}

.safe-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
