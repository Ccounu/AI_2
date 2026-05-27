<!-- components/countdown/Countdown.vue -->
<!-- 秋招倒计时组件 — 目标日期可配置 -->
<template>
  <view class="countdown-card">
    <view class="countdown-header">
      <text class="countdown-label">🎯 秋招倒计时</text>
      <text class="countdown-target">{{ targetDate }}</text>
    </view>
    <view class="countdown-body">
      <view class="countdown-item">
        <text class="countdown-num">{{ days }}</text>
        <text class="countdown-unit">天</text>
      </view>
      <text class="countdown-sep">:</text>
      <view class="countdown-item">
        <text class="countdown-num">{{ hours }}</text>
        <text class="countdown-unit">时</text>
      </view>
      <text class="countdown-sep">:</text>
      <view class="countdown-item">
        <text class="countdown-num">{{ minutes }}</text>
        <text class="countdown-unit">分</text>
      </view>
      <text class="countdown-sep">:</text>
      <view class="countdown-item">
        <text class="countdown-num">{{ seconds }}</text>
        <text class="countdown-unit">秒</text>
      </view>
    </view>
    <view class="countdown-tip">
      <text>{{ tipText }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

const props = defineProps({
  /** 倒计时目标日期，格式 YYYY-MM-DD */
  targetDate: {
    type: String,
    default: '2026-09-01'
  }
})

const days = ref(0)
const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)
let timer = null

/** 根据剩余天数返回提示语 */
const tipText = computed(() => {
  const d = days.value
  if (d <= 0) return '秋招已开始，加油冲刺！'
  if (d <= 7) return '最后冲刺，全力以赴！'
  if (d <= 30) return '黄金备战期，抓紧时间！'
  if (d <= 90) return '稳步推进，厚积薄发！'
  return '提前准备，赢在起跑线！'
})

/** 计算倒计时 */
const calcCountdown = () => {
  const now = new Date().getTime()
  const target = new Date(props.targetDate).getTime()
  let diff = target - now
  if (diff <= 0) diff = 0

  days.value = Math.floor(diff / (1000 * 60 * 60 * 24))
  hours.value = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  minutes.value = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  seconds.value = Math.floor((diff % (1000 * 60)) / 1000)
}

onMounted(() => {
  calcCountdown()
  timer = setInterval(calcCountdown, 1000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style lang="scss" scoped>
.countdown-card {
  background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  margin: 24rpx 32rpx;
  color: #FFFFFF;
}

.countdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.countdown-label {
  font-size: 32rpx;
  font-weight: 700;
}

.countdown-target {
  font-size: 24rpx;
  opacity: 0.8;
}

.countdown-body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.countdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  min-width: 100rpx;
}

.countdown-num {
  font-size: 48rpx;
  font-weight: 700;
  line-height: 1.2;
}

.countdown-unit {
  font-size: 22rpx;
  opacity: 0.8;
  margin-top: 4rpx;
}

.countdown-sep {
  font-size: 40rpx;
  font-weight: 700;
  opacity: 0.6;
}

.countdown-tip {
  text-align: center;
  margin-top: 20rpx;
  font-size: 24rpx;
  opacity: 0.9;
}
</style>
