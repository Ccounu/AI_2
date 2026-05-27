<!-- components/match-result/MatchResult.vue -->
<!-- 匹配结果展示组件 — 匹配分数 + 关键词高亮 + 差异建议 -->
<!-- 数据结构对齐后端 POST /resume/analyze 返回格式 -->
<!-- result: { matchScore, matchedKeywords, missingKeywords, strengths, suggestions: { keywordAdvice, starAdvice } } -->
<template>
  <view class="match-result" v-if="result">
    <!-- 匹配分数环 -->
    <view class="score-ring">
      <view class="score-circle" :style="scoreStyle">
        <text class="score-num">{{ result.matchScore }}</text>
        <text class="score-label">匹配度</text>
      </view>
    </view>

    <!-- 匹配关键词 -->
    <view class="keyword-section">
      <view class="section-title">
        <text class="title-icon" style="color: #67C23A;">✓</text>
        <text>匹配关键词</text>
      </view>
      <view class="keyword-list">
        <view
          v-for="(kw, idx) in result.matchedKeywords"
          :key="'m' + idx"
          class="keyword-tag tag-match"
        >
          {{ kw }}
        </view>
      </view>
    </view>

    <!-- 缺失关键词 -->
    <view class="keyword-section">
      <view class="section-title">
        <text class="title-icon" style="color: #F56C6C;">✗</text>
        <text>缺失关键词</text>
      </view>
      <view class="keyword-list">
        <view
          v-for="(kw, idx) in result.missingKeywords"
          :key="'s' + idx"
          class="keyword-tag tag-miss"
        >
          {{ kw }}
        </view>
      </view>
    </view>

    <!-- 优势亮点 -->
    <view class="keyword-section" v-if="result.strengths && result.strengths.length">
      <view class="section-title">
        <text class="title-icon" style="color: #409EFF;">★</text>
        <text>优势亮点</text>
      </view>
      <view class="suggestion-list">
        <view
          v-for="(s, idx) in result.strengths"
          :key="'str' + idx"
          class="suggestion-item strength-item"
        >
          <text class="sug-index strength-index">{{ idx + 1 }}</text>
          <text class="sug-text">{{ s }}</text>
        </view>
      </view>
    </view>

    <!-- 优化建议 — 适配后端 suggestions: { keywordAdvice, starAdvice } -->
    <view class="suggestion-section" v-if="suggestions.length">
      <view class="section-title">
        <text class="title-icon" style="color: #E6A23C;">💡</text>
        <text>优化建议</text>
      </view>
      <view class="suggestion-list">
        <view
          v-for="(sug, idx) in suggestions"
          :key="idx"
          class="suggestion-item"
        >
          <text class="sug-index">{{ idx + 1 }}</text>
          <text class="sug-text">{{ sug }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** 匹配结果数据 — 对齐后端 POST /resume/analyze 返回格式 */
  result: {
    type: Object,
    default: null
  }
})

/** 将后端 suggestions 对象转为数组展示 */
const suggestions = computed(() => {
  if (!props.result?.suggestions) return []
  const list = []
  if (props.result.suggestions.keywordAdvice) {
    list.push(props.result.suggestions.keywordAdvice)
  }
  if (props.result.suggestions.starAdvice) {
    list.push(props.result.suggestions.starAdvice)
  }
  return list
})

/** 根据匹配分数动态设置环颜色 */
const scoreStyle = computed(() => {
  const score = props.result?.matchScore || 0
  let color = '#F56C6C'
  if (score >= 80) color = '#67C23A'
  else if (score >= 60) color = '#E6A23C'
  return {
    background: `conic-gradient(${color} ${score * 3.6}deg, #EBEEF5 ${score * 3.6}deg)`,
    '--score-color': color
  }
})
</script>

<style lang="scss" scoped>
.match-result {
  padding: 32rpx;
}

/* 匹配分数环 */
.score-ring {
  display: flex;
  justify-content: center;
  margin-bottom: 40rpx;
}

.score-circle {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 12rpx;
    border-radius: 50%;
    background: #FFFFFF;
  }
}

.score-num {
  position: relative;
  z-index: 1;
  font-size: 56rpx;
  font-weight: 700;
  color: var(--score-color, #409EFF);
}

.score-label {
  position: relative;
  z-index: 1;
  font-size: 22rpx;
  color: #909399;
  margin-top: -4rpx;
}

/* 关键词区域 */
.keyword-section {
  margin-bottom: 32rpx;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16rpx;
}

.title-icon {
  font-size: 28rpx;
}

.keyword-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.keyword-tag {
  padding: 8rpx 24rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
}

.tag-match {
  background: rgba(103, 194, 58, 0.1);
  color: #67C23A;
}

.tag-miss {
  background: rgba(245, 108, 108, 0.1);
  color: #F56C6C;
}

/* 建议区域 */
.suggestion-section {
  margin-bottom: 16rpx;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: #F5F7FA;
  border-radius: 12rpx;
  padding: 20rpx;
}

.strength-item {
  background: rgba(64, 158, 255, 0.05);
}

.sug-index {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #E6A23C;
  color: #FFFFFF;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.strength-index {
  background: #409EFF;
}

.sug-text {
  font-size: 26rpx;
  color: #606266;
  line-height: 1.6;
}
</style>
