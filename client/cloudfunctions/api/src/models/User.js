const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: true,
    comment: '登录用户名'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '登录密码'
  },
  openid: {
    type: DataTypes.STRING(64),
    unique: true,
    allowNull: true,
    comment: '微信 openid'
  },
  nickname: {
    type: DataTypes.STRING(50),
    defaultValue: '求职者'
  },
  avatar: {
    type: DataTypes.STRING(255),
    defaultValue: ''
  },
  // ── 求职意向 ──
  targetCity: {
    type: DataTypes.STRING(50),
    defaultValue: '',
    comment: '目标城市'
  },
  expectedSalary: {
    type: DataTypes.STRING(50),
    defaultValue: '',
    comment: '期望薪资'
  },
  targetPosition: {
    type: DataTypes.STRING(50),
    defaultValue: '',
    comment: '目标岗位'
  },
  techStack: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '技术栈标签 JSON 数组',
    get() {
      const raw = this.getDataValue('techStack');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('techStack', JSON.stringify(val));
    }
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;
