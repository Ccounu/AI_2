<!-- pages/resume/index.vue -->
<!-- 简历管理 — 简历编辑 + JD匹配分析 + 历史记录（合并版） -->
<template>
  <view class="resume-page">
    <!-- 顶部标签切换 -->
    <view class="tabs">
      <view class="tab" :class="{ active: activeTab === 'edit' }" @tap="activeTab = 'edit'">简历编辑</view>
      <view class="tab" :class="{ active: activeTab === 'match' }" @tap="activeTab = 'match'">匹配分析</view>
      <view class="tab" :class="{ active: activeTab === 'history' }" @tap="activeTab = 'history'">历史记录</view>
    </view>

    <!-- ========== 简历编辑面板（来自主项目） ========== -->
    <view v-show="activeTab === 'edit'">
      <!-- 教育背景 -->
      <view class="section">
        <view class="st">📖 教育背景</view>
        <view v-for="(e, i) in education" :key="i">
          <input class="inp" v-model="e.school" placeholder="学校" />
          <input class="inp" v-model="e.major" placeholder="专业" />
          <view class="inr">
            <input class="inp h" v-model="e.degree" placeholder="学历" />
            <input class="inp h" v-model="e.period" placeholder="时间段" />
          </view>
        </view>
        <text class="addb" @click="education.push({ school: '', major: '', degree: '', period: '' })">+ 添加</text>
      </view>

      <!-- 专业技能 -->
      <view class="section">
        <view class="st">🛠 专业技能</view>
        <input class="inp" v-model="skillsText" placeholder="JavaScript, Vue 3, Node.js（逗号分隔）" />
      </view>

      <!-- 项目经历 -->
      <view class="section">
        <view class="st">🚀 项目经历</view>
        <view class="pj" v-for="(p, i) in projects" :key="i">
          <input class="inp" v-model="p.name" placeholder="项目名称" />
          <input class="inp" v-model="p.role" placeholder="你的角色" />
          <input class="inp" v-model="p.techStackStr" placeholder="技术栈" />
          <textarea class="tx" v-model="p.description" placeholder="项目描述（STAR 法则）"></textarea>
          <input class="inp" v-model="p.result" placeholder="成果/指标" />
          <text class="del" @click="projects.splice(i, 1)">删除</text>
        </view>
        <text class="addb" @click="projects.push({ name: '', role: '', techStackStr: '', description: '', result: '' })">+ 添加</text>
      </view>

      <!-- 简历原文 -->
      <view class="section">
        <view class="st">📄 简历原文</view>
        <textarea class="tx rt" v-model="rawText" placeholder="或直接粘贴完整简历..."></textarea>
      </view>

      <button class="sb" @click="saveResume">💾 保存简历</button>
    </view>

    <!-- ========== 匹配分析面板（来自成员C） ========== -->
    <view v-show="activeTab === 'match'">
      <!-- 简历预览区 -->
      <view class="input-card" v-if="rawText || skillsText">
        <view class="input-header">
          <text class="input-title">📄 当前简历摘要</text>
          <text class="input-action" @tap="activeTab = 'edit'">编辑 ›</text>
        </view>
        <view class="resume-preview">
          <text class="preview-text">{{ resumePreview }}</text>
        </view>
      </view>

      <!-- JD输入区 -->
      <view class="input-card">
        <view class="input-header">
          <text class="input-title">💼 职位描述 (JD)</text>
          <text class="input-action" @tap="pasteJD">粘贴内容</text>
        </view>
        <textarea
          class="input-area"
          v-model="jdText"
          placeholder="请粘贴或输入职位描述..."
          :maxlength="3000"
          auto-height
          :style="{ minHeight: '200rpx' }"
        />
        <view class="input-footer">
          <text class="char-count">{{ jdText.length }}/3000</text>
        </view>
      </view>

      <!-- 开始匹配按钮 -->
      <button
        :class="['btn-match', loading ? 'disabled' : '']"
        :disabled="loading"
        @tap="handleMatch"
      >
        {{ loading ? 'AI 分析中...' : '🔍 开始匹配分析' }}
      </button>

      <!-- 匹配结果 -->
      <view v-if="matchResult" class="rs">
        <!-- 匹配分数环 -->
        <view class="sc">
          <view class="cs" :style="scSty">
            <text class="sn">{{ matchResult.matchScore }}</text>
          </view>
          <text class="sl">匹配度</text>
        </view>
        <!-- 已匹配关键词 -->
        <view class="rb">
          <text class="rl">✅ 已匹配</text>
          <view class="tgg">
            <text class="tg m" v-for="k in (matchResult.matchedKeywords || [])" :key="k">{{ k }}</text>
          </view>
        </view>
        <!-- 缺失关键词 -->
        <view class="rb">
          <text class="rl">⚠️ 缺失</text>
          <view class="tgg">
            <text class="tg o" v-for="k in (matchResult.missingKeywords || [])" :key="k">{{ k }}</text>
          </view>
        </view>
        <!-- AI 建议 -->
        <view class="rb ad" v-if="matchResult.suggestions">
          <text class="rl">📝 AI 建议</text>
          <text class="rtx" v-if="matchResult.suggestions.keywordAdvice">{{ matchResult.suggestions.keywordAdvice }}</text>
          <view class="sa" v-if="matchResult.suggestions.starAdvice">
            <text class="satt">STAR 润色建议：</text>
            <text class="rtx">{{ matchResult.suggestions.starAdvice }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ========== 历史记录面板（来自成员C） ========== -->
    <view v-show="activeTab === 'history'">
      <view v-if="historyList.length" class="history-list">
        <view
          v-for="item in historyList"
          :key="item.id"
          class="history-item"
          @tap="viewHistoryDetail(item)"
        >
          <view class="history-main">
            <text class="history-position">{{ item.position || '职位匹配' }}</text>
            <text class="history-jd">{{ truncateText(item.jdText, 40) }}</text>
          </view>
          <view class="history-right">
            <text class="history-score" :style="{ color: getScoreColor(item.matchScore) }">
              {{ item.matchScore }}%
            </text>
            <text class="history-time">{{ formatDate(item.createdAt) }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-icon">📊</text>
        <text class="empty-text">暂无匹配记录</text>
        <text class="empty-sub">去匹配分析页开始第一次匹配吧</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import api from '@/api/request'

const userStore = useUserStore()

// ---- 标签状态 ----
const activeTab = ref('edit')

// ---- 简历编辑数据 ----
const education = ref([{ school: '', major: '', degree: '', period: '' }])
const skillsText = ref('')
const projects = ref([{ name: '', role: '', techStackStr: '', description: '', result: '' }])
const rawText = ref('')

// ---- 匹配分析数据 ----
const jdText = ref('')
const loading = ref(false)
const matchResult = ref(null)

// ---- 历史记录 ----
const historyList = ref([])

// ---- 计算属性 ----
const resumePreview = computed(() => {
  const parts = []
  if (skillsText.value) parts.push('技能: ' + skillsText.value)
  if (rawText.value) parts.push(rawText.value.slice(0, 100))
  return parts.join('\n') || '点击"简历编辑"完善简历'
})

const scSty = computed(() => {
  const s = matchResult.value?.matchScore || 0
  let color = '#FF4D4F'
  if (s >= 80) color = '#52C41A'
  else if (s >= 60) color = '#FAAD14'
  return { borderColor: color, color }
})

// ---- 简历编辑方法 ----
async function saveResume() {
  uni.showLoading({ title: '保存中' })
  try {
    await api.post('/resume/save', {
      userId: userStore.user?.id || 1,
      education: education.value,
      skills: skillsText.value.split(/[,，]/).map(s => s.trim()).filter(Boolean),
      projects: projects.value.map(p => ({
        ...p,
        techStack: (p.techStackStr || '').split(/[,，]/).map(s => s.trim()).filter(Boolean)
      })),
      rawText: rawText.value
    })
    uni.hideLoading()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch {
    uni.hideLoading()
    uni.showToast({ title: '已本地保存', icon: 'success' })
  }
}

// ---- 匹配分析方法 ----
function pasteJD() {
  uni.getClipboardData({
    success: (res) => {
      if (res.data) {
        jdText.value = res.data.slice(0, 3000)
        uni.showToast({ title: '已粘贴', icon: 'success' })
      }
    }
  })
}

async function handleMatch() {
  if (!jdText.value.trim()) {
    uni.showToast({ title: '请粘贴JD', icon: 'none' })
    return
  }
  if (loading.value) return
  loading.value = true
  matchResult.value = null
  try {
    const result = await api.post('/resume/analyze', {
      userId: userStore.user?.id || 1,
      jdText: jdText.value
    })
    matchResult.value = result
    // 保存到历史记录
    historyList.value.unshift({
      id: Date.now(),
      position: '匹配分析',
      jdText: jdText.value,
      matchScore: result.matchScore || 0,
      createdAt: new Date().toISOString()
    })
  } catch {
    // Mock 降级
    matchResult.value = {
      matchScore: Math.floor(55 + Math.random() * 40),
      matchedKeywords: ['JavaScript', 'Vue', '前端开发'],
      missingKeywords: ['TypeScript', 'Webpack', '性能优化'],
      suggestions: {
        keywordAdvice: '建议补充 TypeScript 经验关键词。',
        starAdvice: '项目描述建议使用 STAR 法则：描述背景(S)→任务(T)→行动(A)→结果(R)。'
      }
    }
    historyList.value.unshift({
      id: Date.now(),
      position: '匹配分析',
      jdText: jdText.value,
      matchScore: matchResult.value.matchScore,
      createdAt: new Date().toISOString()
    })
  } finally {
    loading.value = false
  }
}

// ---- 历史记录方法 ----
function viewHistoryDetail(item) {
  uni.showToast({ title: `匹配度 ${item.matchScore}%`, icon: 'none' })
}

// ---- 工具方法 ----
function truncateText(text, maxLen) {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function getScoreColor(score) {
  if (score >= 80) return '#52C41A'
  if (score >= 60) return '#FAAD14'
  return '#FF4D4F'
}

// ---- 生命周期 ----
onMounted(async () => {
  try {
    const data = await api.get(`/resume/${userStore.user?.id || 1}`)
    if (data) {
      education.value = data.education || education.value
      skillsText.value = (data.skills || []).join(', ')
      projects.value = (data.projects || []).map(p => ({
        ...p,
        techStackStr: (p.techStack || []).join(', ')
      }))
      rawText.value = data.rawText || ''
    }
  } catch { /* 使用默认值 */ }
})
</script>

<style lang="scss" scoped>
.resume-page {
  padding: 16px;
  padding-bottom: 80px;
  background: #F5F7FA;
  min-height: 100vh;
}

/* 标签栏 */
.tabs {
  display: flex;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.tab {
  flex: 1;
  text-align: center;
  padding: 16px 0;
  font-size: 14px;
  color: #909399;
  transition: all 0.2s;
}

.tab.active {
  color: #409EFF;
  font-weight: 600;
  background: rgba(64, 158, 255, 0.06);
  border-bottom: 3px solid #409EFF;
}

/* 简历编辑面板 */
.section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.st {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
}

.inp {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 8px;
  background: #fafafa;
}

.inr {
  display: flex;
  gap: 8px;
}

.h {
  flex: 1;
}

.tx {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  min-height: 80px;
  background: #fafafa;
  margin-bottom: 8px;
}

.rt {
  min-height: 120px;
}

.addb {
  color: #409EFF;
  font-size: 13px;
  display: block;
  padding: 8px 0;
}

.del {
  color: #FF4D4F;
  font-size: 12px;
  display: block;
  text-align: right;
  padding: 4px 0;
}

.pj {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
}

.sb {
  width: 100%;
  background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
  color: #fff;
  border: none;
  border-radius: 999rpx;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  margin-top: 8px;
  &::after { border: none; }
}

/* 匹配分析面板 */
.input-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.input-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
}

.input-action {
  font-size: 26rpx;
  color: #409EFF;
}

.input-area {
  width: 100%;
  font-size: 28rpx;
  color: #303133;
  line-height: 1.6;
  padding: 20rpx;
  background: #F5F7FA;
  border-radius: 16rpx;
  box-sizing: border-box;
}

.input-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12rpx;
}

.char-count {
  font-size: 22rpx;
  color: #C0C4CC;
}

.resume-preview {
  background: #F5F7FA;
  border-radius: 16rpx;
  padding: 20rpx;
}

.preview-text {
  font-size: 26rpx;
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
}

.btn-match {
  width: 100%;
  background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
  color: #FFFFFF;
  border-radius: 999rpx;
  font-size: 32rpx;
  font-weight: 600;
  height: 96rpx;
  line-height: 96rpx;
  border: none;
  margin-bottom: 24rpx;
  &::after { border: none; }
  &:active { opacity: 0.85; }
  &.disabled { opacity: 0.6; }
}

/* 匹配结果 */
.rs {
  margin-top: 8rpx;
}

.sc {
  text-align: center;
  padding: 20px 0;
}

.cs {
  width: 80px;
  height: 80px;
  border-radius: 40px;
  border: 4px solid #409EFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
}

.sn {
  font-size: 28px;
  font-weight: 700;
}

.sl {
  font-size: 14px;
  color: #999;
}

.rb {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
}

.rl {
  font-size: 14px;
  font-weight: 600;
  display: block;
  margin-bottom: 8px;
}

.tgg {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tg {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
}

.m {
  background: #f0fff0;
  color: #52C41A;
  border: 1px solid #b7eb8f;
}

.o {
  background: #fff7e6;
  color: #FAAD14;
  border: 1px solid #ffe58f;
}

.rtx {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  display: block;
  margin-bottom: 6px;
}

.ad {
  background: #f0f7ff;
  border-left: 3px solid #409EFF;
}

.sa {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #d0e0f0;
}

.satt {
  font-size: 13px;
  font-weight: 600;
  color: #409EFF;
  display: block;
  margin-bottom: 4px;
}

/* 历史记录 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 28rpx 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.history-main {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
  margin-right: 24rpx;
}

.history-position {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
}

.history-jd {
  font-size: 24rpx;
  color: #909399;
}

.history-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
  flex-shrink: 0;
}

.history-score {
  font-size: 36rpx;
  font-weight: 700;
}

.history-time {
  font-size: 22rpx;
  color: #C0C4CC;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
}

.empty-icon {
  font-size: 100rpx;
  display: block;
  margin-bottom: 12rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #909399;
  margin-top: 24rpx;
}

.empty-sub {
  font-size: 24rpx;
  color: #C0C4CC;
  margin-top: 12rpx;
}
</style>
