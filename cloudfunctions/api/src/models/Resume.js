const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Resume = sequelize.define('Resume', {
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
  // 结构化简历字段
  education: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '教育背景 JSON',
    get() { return this._getJSON('education'); },
    set(val) { this._setJSON('education', val); }
  },
  projects: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '项目经历 JSON',
    get() { return this._getJSON('projects'); },
    set(val) { this._setJSON('projects', val); }
  },
  skills: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '专业技能 JSON',
    get() { return this._getJSON('skills'); },
    set(val) { this._setJSON('skills', val); }
  },
  rawText: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '原始简历文本（粘贴）'
  },
  // 最近一次匹配结果缓存
  lastMatchScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '最近匹配分数 0-100'
  },
  lastJdText: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '最近匹配的 JD 文本'
  }
}, {
  tableName: 'resumes',
  timestamps: true,
  instanceMethods: {},
  getterMethods: {}
});

// 辅助方法：JSON getter/setter
Resume.prototype._getJSON = function (field) {
  const raw = this.getDataValue(field);
  return raw ? JSON.parse(raw) : [];
};
Resume.prototype._setJSON = function (field, val) {
  this.setDataValue(field, JSON.stringify(val));
};

User.hasOne(Resume, { foreignKey: 'userId' });
Resume.belongsTo(User, { foreignKey: 'userId' });

module.exports = Resume;
