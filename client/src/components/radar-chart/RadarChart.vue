<!-- components/radar-chart/RadarChart.vue -->
<!-- 个人能力雷达图组件 — 使用标准 Canvas 2D API 手绘（兼容小程序 & H5） -->
<template>
  <view class="radar-chart-container">
    <!-- #ifdef MP-WEIXIN -->
    <canvas
      type="2d"
      id="radarCanvas"
      class="radar-canvas"
      :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
    />
    <!-- #endif -->
    <!-- #ifndef MP-WEIXIN -->
    <canvas
      canvas-id="radarChart"
      id="radarChart"
      class="radar-canvas-h5"
    />
    <!-- #endif -->
  </view>
</template>

<script setup>
import { ref, watch, onMounted, getCurrentInstance, nextTick } from 'vue'

const props = defineProps({
  values: {
    type: Array,
    default: () => [0, 0, 0, 0, 0]
  },
  labels: {
    type: Array,
    default: () => ['技术深度', '沟通表达', '项目经验', '逻辑思维', '行业认知']
  }
})

const instance = getCurrentInstance()
const canvasWidth = ref(320)
const canvasHeight = ref(260)

/** 绘制雷达图（标准 Canvas 2D API） */
function drawRadar(ctx, w, h, labels, values) {
  const cx = w / 2
  const cy = h / 2 - 10
  const radius = 90
  const count = labels.length
  const angleStep = (Math.PI * 2) / count

  ctx.clearRect(0, 0, w, h)

  // 网格
  for (let level = 1; level <= 4; level++) {
    const r = (radius / 4) * level
    ctx.beginPath()
    for (let i = 0; i <= count; i++) {
      const idx = i % count
      const a = -Math.PI / 2 + idx * angleStep
      const x = cx + r * Math.cos(a)
      const y = cy + r * Math.sin(a)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // 轴线 + 标签
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + i * angleStep
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + radius * Math.cos(a), cy + radius * Math.sin(a))
    ctx.strokeStyle = '#e0e0e0'
    ctx.stroke()

    ctx.font = '11px sans-serif'
    ctx.fillStyle = '#666'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(labels[i], cx + (radius + 22) * Math.cos(a), cy + (radius + 22) * Math.sin(a))
  }

  // 数据区域
  ctx.beginPath()
  for (let i = 0; i <= count; i++) {
    const idx = i % count
    const a = -Math.PI / 2 + idx * angleStep
    const r = (values[idx] / 100) * radius
    const x = cx + r * Math.cos(a)
    const y = cy + r * Math.sin(a)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.fillStyle = 'rgba(74,144,217,0.2)'
  ctx.fill()
  ctx.strokeStyle = '#4A90D9'
  ctx.lineWidth = 2
  ctx.stroke()
}

// #ifdef MP-WEIXIN
let mpCtx = null

function initMp() {
  nextTick(() => {
    const query = uni.createSelectorQuery().in(instance)
    query.select('#radarCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          console.warn('[RadarChart] 无法获取 canvas 节点')
          return
        }
        const canvas = res[0].node
        canvasWidth.value = res[0].width || 320
        canvasHeight.value = res[0].height || 260
        const dpr = uni.getSystemInfoSync().pixelRatio || 2
        canvas.width = canvasWidth.value * dpr
        canvas.height = canvasHeight.value * dpr
        mpCtx = canvas.getContext('2d')
        mpCtx.scale(dpr, dpr)
        drawRadar(mpCtx, canvasWidth.value, canvasHeight.value, props.labels, props.values)
      })
  })
}

function redrawMp() {
  if (mpCtx) {
    drawRadar(mpCtx, canvasWidth.value, canvasHeight.value, props.labels, props.values)
  } else {
    initMp()
  }
}
// #endif

// #ifndef MP-WEIXIN
let h5Ctx = null

function initH5() {
  nextTick(() => {
    h5Ctx = uni.createCanvasContext('radarChart', instance)
    setTimeout(() => {
      drawRadar(h5Ctx, 320, 260, props.labels, props.values)
      h5Ctx.draw()
    }, 300)
  })
}

function redrawH5() {
  if (h5Ctx) {
    drawRadar(h5Ctx, 320, 260, props.labels, props.values)
    h5Ctx.draw()
  } else {
    initH5()
  }
}
// #endif

watch([() => props.values, () => props.labels], () => {
  // #ifdef MP-WEIXIN
  redrawMp()
  // #endif
  // #ifndef MP-WEIXIN
  redrawH5()
  // #endif
}, { deep: true })

onMounted(() => {
  // #ifdef MP-WEIXIN
  initMp()
  // #endif
  // #ifndef MP-WEIXIN
  initH5()
  // #endif
})
</script>

<style lang="scss" scoped>
.radar-chart-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.radar-canvas {
  display: block;
}

.radar-canvas-h5 {
  width: 100%;
  height: 500rpx;
}
</style>
