<!-- components/quick-entry/QuickEntry.vue -->
<!-- 快捷入口卡片组件 — 首页工作台四个功能入口 -->
<!-- 导航路径与成员A的 pages.json 完全对齐 -->
<template>
  <view class="quick-entry">
    <view
      v-for="item in entries"
      :key="item.id"
      class="entry-item"
      @tap="handleTap(item)"
    >
      <view class="entry-icon" :style="{ background: item.color + '15' }">
        <text class="entry-emoji">{{ item.icon }}</text>
      </view>
      <text class="entry-title">{{ item.title }}</text>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  /** 入口列表配置 — 路径与 pages.json 对齐 */
  entries: {
    type: Array,
    default: () => [
      { id: 1, title: 'AI模拟面试', icon: '🎤', url: '/pages/interview/index', color: '#409EFF', tab: false },
      { id: 2, title: '简历匹配', icon: '📝', url: '/pages/resume/index', color: '#67C23A', tab: false },
      { id: 3, title: '投递管理', icon: '📋', url: '/pages/kanban/index', color: '#E6A23C', tab: true },
      { id: 4, title: '备考中心', icon: '📚', url: '/pages/question/index', color: '#F56C6C', tab: true }
    ]
  }
})

const emit = defineEmits(['tap'])

const handleTap = (item) => {
  emit('tap', item)
  if (!item.url) return
  if (item.tab) {
    uni.switchTab({ url: item.url })
  } else {
    uni.navigateTo({ url: item.url })
  }
}
</script>

<style lang="scss" scoped>
.quick-entry {
  display: flex;
  justify-content: space-around;
  padding: 24rpx 16rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  margin: 0 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.entry-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.entry-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  .entry-emoji {
    font-size: 44rpx;
  }
}

.entry-title {
  font-size: 24rpx;
  color: #303133;
  font-weight: 500;
}
</style>
