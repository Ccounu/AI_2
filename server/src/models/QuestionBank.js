const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const QuestionBank = sequelize.define('QuestionBank', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  category:  { type: DataTypes.STRING(50), allowNull: false, comment: '分类：前端/后端/计网/HR综合' },
  title:     { type: DataTypes.STRING(200), allowNull: false, comment: '题目名称' },
  content:   { type: DataTypes.TEXT, allowNull: true, comment: '题目解析/答案' },
  difficulty:{ type: DataTypes.ENUM('easy','medium','hard'), defaultValue: 'medium', comment: '难度' }
}, { tableName: 'question_bank', timestamps: true });

module.exports = QuestionBank;
