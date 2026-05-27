const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const ApplicationTracker = sequelize.define('ApplicationTracker', {
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
  companyName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '公司名称'
  },
  position: {
    type: DataTypes.STRING(100),
    defaultValue: '',
    comment: '应聘岗位'
  },
  // 看板状态列
  stage: {
    type: DataTypes.ENUM(
      'submitted',        // 已投递
      'written_test',     // 笔试/测评
      'interview_1',      // 一面
      'interview_2',      // 二面
      'hr_interview',     // HR面
      'offer_pool',       // Offer/池子
      'rejected'          // 已感谢/已拒
    ),
    defaultValue: 'submitted',
    comment: '当前阶段'
  },
  stageOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '阶段排序权重'
  },
  appliedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '投递时间'
  },
  interviewTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '面试时间（用于提醒）'
  },
  remark: {
    type: DataTypes.TEXT,
    defaultValue: '',
    comment: '备注'
  }
}, {
  tableName: 'application_trackers',
  timestamps: true
});

User.hasMany(ApplicationTracker, { foreignKey: 'userId' });
ApplicationTracker.belongsTo(User, { foreignKey: 'userId' });

module.exports = ApplicationTracker;
