const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const JobCollection = sequelize.define('JobCollection', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title:         { type: DataTypes.STRING(100), allowNull: false, comment: '岗位名称' },
  company:       { type: DataTypes.STRING(100), defaultValue: '', comment: '公司名' },
  jdText:        { type: DataTypes.TEXT, allowNull: true, comment: 'JD 原文' },
  keywords:      { type: DataTypes.TEXT, allowNull: true, comment: '关键词 JSON 数组', get() { const r=this.getDataValue('keywords');return r?JSON.parse(r):[]; }, set(v) { this.setDataValue('keywords',JSON.stringify(v)); } },
  category:      { type: DataTypes.STRING(50), defaultValue: '前端', comment: '分类：前端/后端/算法/产品' }
}, { tableName: 'job_collections', timestamps: true });

module.exports = JobCollection;
