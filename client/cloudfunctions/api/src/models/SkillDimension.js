const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const SkillDimension = sequelize.define('SkillDimension', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  // 五个核心维度
  techDepth:       { type: DataTypes.INTEGER, defaultValue: 0, comment: '技术深度 0-100' },
  communication:   { type: DataTypes.INTEGER, defaultValue: 0, comment: '沟通表达 0-100' },
  projectExp:      { type: DataTypes.INTEGER, defaultValue: 0, comment: '项目经验 0-100' },
  logicThinking:   { type: DataTypes.INTEGER, defaultValue: 0, comment: '逻辑思维 0-100' },
  industryKnowledge:{ type: DataTypes.INTEGER, defaultValue: 0, comment: '行业认知 0-100' }
}, { tableName: 'skill_dimensions', timestamps: true });

User.hasOne(SkillDimension, { foreignKey: 'userId' });
SkillDimension.belongsTo(User, { foreignKey: 'userId' });

module.exports = SkillDimension;
