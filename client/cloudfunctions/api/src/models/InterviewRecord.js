const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const InterviewRecord = sequelize.define('InterviewRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  sessionId: {
    type: DataTypes.STRING(36),
    unique: true,
    comment: '会话 UUID'
  },
  interviewType: {
    type: DataTypes.ENUM('tech', 'hr', 'pressure'),
    defaultValue: 'tech',
    comment: '面试类型：技术/HR/压力'
  },
  targetPosition: {
    type: DataTypes.STRING(50),
    defaultValue: '',
    comment: '应聘岗位'
  },
  status: {
    type: DataTypes.ENUM('in_progress', 'completed'),
    defaultValue: 'in_progress'
  },
  // 对话记录（完整 JSON）
  messages: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    get() {
      const raw = this.getDataValue('messages');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('messages', JSON.stringify(val));
    }
  },
  // AI 评价
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '面试评分 0-100'
  },
  evaluation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI 综合评价报告'
  },
  suggestions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '改进建议'
  }
}, {
  tableName: 'interview_records',
  timestamps: true
});

User.hasMany(InterviewRecord, { foreignKey: 'userId' });
InterviewRecord.belongsTo(User, { foreignKey: 'userId' });

module.exports = InterviewRecord;
