<!-- components/profile-form/ProfileForm.vue -->
<!-- 个人信息表单组件 — 支持展示/编辑模式，含基础表单验证 -->
<!-- 字段与后端 User 模型对齐：nickname, avatar, targetPosition, targetCity, expectedSalary, techStack -->
<template>
  <view class="profile-form">
    <!-- 头像 -->
    <view class="form-item avatar-item" @tap="handleAvatarChange">
      <text class="form-label">头像</text>
      <view class="avatar-wrapper">
        <view class="avatar">
          <text class="pf-avatar-text">{{ (formData.nickname || '用')[0] }}</text>
        </view>
        <text class="avatar-tip">点击更换</text>
      </view>
    </view>

    <view class="divider"></view>

    <!-- 昵称 -->
    <view class="form-item">
      <text class="form-label">昵称</text>
      <input
        class="form-input"
        v-model="formData.nickname"
        placeholder="请输入昵称"
        :maxlength="20"
        @blur="validateField('nickname')"
      />
    </view>

    <view class="divider"></view>

    <!-- 目标岗位 -->
    <view class="form-item">
      <text class="form-label">目标岗位</text>
      <input
        class="form-input"
        v-model="formData.targetPosition"
        placeholder="如：前端开发工程师"
        @blur="validateField('targetPosition')"
      />
    </view>

    <view class="divider"></view>

    <!-- 目标城市 -->
    <view class="form-item">
      <text class="form-label">目标城市</text>
      <picker :range="cityOptions" @change="onCityChange">
        <view class="form-picker">
          <text :class="['picker-text', formData.targetCity ? '' : 'placeholder']">
            {{ formData.targetCity || '请选择城市' }}
          </text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>
    </view>

    <view class="divider"></view>

    <!-- 期望薪资 — 对齐后端 expectedSalary 字段 -->
    <view class="form-item">
      <text class="form-label">期望薪资</text>
      <picker :range="salaryOptions" @change="onSalaryChange">
        <view class="form-picker">
          <text :class="['picker-text', formData.expectedSalary ? '' : 'placeholder']">
            {{ formData.expectedSalary || '请选择薪资范围' }}
          </text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>
    </view>

    <view class="divider"></view>

    <!-- 技术栈 — 对齐后端 techStack 字段（数组） -->
    <view class="form-item">
      <text class="form-label">技术栈</text>
      <input
        class="form-input"
        v-model="techStackText"
        placeholder="如：Vue3, React, Node.js（逗号分隔）"
        @blur="onTechStackBlur"
      />
    </view>

    <!-- 保存按钮 -->
    <view class="form-actions">
      <button class="btn-save" @tap="handleSave">保存修改</button>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'

const props = defineProps({
  /** 初始表单数据 — 与后端 User 模型字段对齐 */
  modelValue: {
    type: Object,
    default: () => ({
      avatar: '',
      nickname: '',
      targetPosition: '',
      targetCity: '',
      expectedSalary: '',
      techStack: []
    })
  }
})

const emit = defineEmits(['save', 'update:modelValue'])

/** 表单数据 */
const formData = reactive({ ...props.modelValue })

/** 技术栈文本（数组转逗号分隔字符串便于编辑） */
const techStackText = ref((formData.techStack || []).join(', '))

/** 监听外部数据变化 */
watch(() => props.modelValue, (newVal) => {
  Object.assign(formData, newVal)
  techStackText.value = (newVal.techStack || []).join(', ')
}, { deep: true })

/** 城市选项 */
const cityOptions = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '苏州', '其他']

/** 薪资选项 — 与后端种子数据格式一致 */
const salaryOptions = ['10k以下', '10k-15k', '15k-25k', '25k-35k', '35k-50k', '50k以上']

/** 验证规则 */
const validators = {
  nickname: (val) => val.trim() ? '' : '昵称不能为空',
  targetPosition: (val) => val.trim() ? '' : '请填写目标岗位'
}

/** 单字段验证 */
const validateField = (field) => {
  const validator = validators[field]
  if (!validator) return true
  const error = validator(formData[field])
  if (error) {
    uni.showToast({ title: error, icon: 'none' })
    return false
  }
  return true
}

/** 全表单验证 */
const validateAll = () => {
  for (const field of Object.keys(validators)) {
    if (!validateField(field)) return false
  }
  return true
}

/** 城市选择 */
const onCityChange = (e) => {
  formData.targetCity = cityOptions[e.detail.value]
}

/** 薪资选择 */
const onSalaryChange = (e) => {
  formData.expectedSalary = salaryOptions[e.detail.value]
}

/** 技术栈失焦时将文本转数组 */
const onTechStackBlur = () => {
  formData.techStack = techStackText.value.split(/[,，]/).map(s => s.trim()).filter(Boolean)
}

/** 头像更换 */
const handleAvatarChange = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      formData.avatar = res.tempFilePaths[0]
    }
  })
}

/** 保存 */
const handleSave = () => {
  // 先同步技术栈
  onTechStackBlur()
  if (!validateAll()) return
  emit('update:modelValue', { ...formData })
  emit('save', { ...formData })
}

/** 暴露验证方法供父组件调用 */
defineExpose({ validateAll })
</script>

<style lang="scss" scoped>
.profile-form {
  background: #FFFFFF;
  border-radius: 24rpx;
  margin: 24rpx 32rpx;
  padding: 8rpx 32rpx 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 96rpx;
}

.avatar-item {
  padding: 24rpx 0;
}

.form-label {
  font-size: 28rpx;
  color: #303133;
  font-weight: 500;
  flex-shrink: 0;
  width: 160rpx;
}

.form-input {
  flex: 1;
  text-align: right;
  font-size: 28rpx;
  color: #303133;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #409EFF, #66B1FF);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pf-avatar-text {
  font-size: 40rpx;
  font-weight: 700;
  color: #FFFFFF;
}

.avatar-tip {
  font-size: 24rpx;
  color: #909399;
}

.form-picker {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.picker-text {
  font-size: 28rpx;
  color: #303133;

  &.placeholder {
    color: #C0C4CC;
  }
}

.picker-arrow {
  font-size: 32rpx;
  color: #C0C4CC;
}

.divider {
  height: 1rpx;
  background: #F2F6FC;
}

.form-actions {
  margin-top: 48rpx;
  padding-bottom: 16rpx;
}

.btn-save {
  background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
  color: #FFFFFF;
  border-radius: 999rpx;
  font-size: 30rpx;
  font-weight: 600;
  height: 88rpx;
  line-height: 88rpx;
  border: none;

  &::after { border: none; }

  &:active {
    opacity: 0.85;
  }
}
</style>
